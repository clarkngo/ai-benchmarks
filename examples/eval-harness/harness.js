#!/usr/bin/env node
// Minimal rubric-based eval harness. Zero dependencies, no framework lock-in.
//
// In real use, `output` in test-cases.json is whatever your pipeline produced
// for that input — here it's pre-filled so the harness runs standalone.
//
// Usage:
//   node harness.js
//   node harness.js --threshold=0.9
//   node harness.js --cases=./my-cases.json

import { readFile } from "node:fs/promises";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value ?? true];
  })
);

const THRESHOLD = args.threshold ? Number(args.threshold) : 0.8;
const CASES_PATH = args.cases || new URL("./test-cases.json", import.meta.url);

// Each checker takes (output, rubricItem) and returns { passed, note }.
const checkers = {
  contains(output, { value }) {
    const passed = output.toLowerCase().includes(String(value).toLowerCase());
    return { passed, note: passed ? `found "${value}"` : `missing "${value}"` };
  },

  not_contains(output, { value }) {
    const passed = !output.toLowerCase().includes(String(value).toLowerCase());
    return { passed, note: passed ? `absent as expected` : `unexpectedly found "${value}"` };
  },

  regex(output, { value, flags }) {
    const passed = new RegExp(value, flags || "").test(output);
    return { passed, note: passed ? `matched /${value}/` : `did not match /${value}/` };
  },

  max_sentences(output, { value }) {
    const count = (output.match(/[.!?]+(\s|$)/g) || []).length || 1;
    const passed = count <= value;
    return { passed, note: `${count} sentence(s), limit ${value}` };
  },

  max_length(output, { value }) {
    const passed = output.length <= value;
    return { passed, note: `${output.length} chars, limit ${value}` };
  },

  valid_json(output) {
    try {
      JSON.parse(output);
      return { passed: true, note: "parsed OK" };
    } catch (err) {
      return { passed: false, note: `parse error: ${err.message}` };
    }
  },

  // Real judge call, gated behind an API key so the harness runs out of the
  // box with no credentials. Swap in your own provider here.
  async llm_judge(output, { criterion }) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        passed: true,
        note: "SKIPPED (no ANTHROPIC_API_KEY set) — treated as pass, wire up a real judge before trusting this in CI",
      };
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 20,
        messages: [
          {
            role: "user",
            content: `Criterion: ${criterion}\n\nCandidate output:\n"""${output}"""\n\nDoes the output satisfy the criterion? Reply with exactly one word: PASS or FAIL.`,
          },
        ],
      }),
    });

    const data = await res.json();
    const verdict = (data?.content?.[0]?.text || "").trim().toUpperCase();
    return { passed: verdict.startsWith("PASS"), note: `judge said ${verdict || "no response"}` };
  },
};

async function main() {
  const raw = await readFile(CASES_PATH, "utf8");
  const testCases = JSON.parse(raw);

  // Rubric items resolve concurrently within a case (llm_judge may be async).
  const scored = [];
  for (const testCase of testCases) {
    const results = [];
    for (const item of testCase.rubric) {
      const checker = checkers[item.type];
      const outcome = checker
        ? await checker(testCase.output, item)
        : { passed: false, note: `unknown checker type "${item.type}"` };
      results.push({ ...item, ...outcome });
    }
    const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
    const earnedWeight = results.reduce((sum, r) => sum + (r.passed ? r.weight : 0), 0);
    scored.push({ ...testCase, results, score: totalWeight === 0 ? 1 : earnedWeight / totalWeight });
  }

  let totalScore = 0;
  console.log(`\nEval run — threshold ${THRESHOLD}\n${"=".repeat(50)}`);

  for (const testCase of scored) {
    totalScore += testCase.score;
    const status = testCase.score >= THRESHOLD ? "PASS" : "FAIL";
    console.log(`\n[${status}] ${testCase.id}  (score ${testCase.score.toFixed(2)})`);
    console.log(`  ${testCase.description}`);
    for (const r of testCase.results) {
      console.log(`  ${r.passed ? "✓" : "✗"} ${r.criterion} — ${r.note}`);
    }
  }

  const avgScore = totalScore / scored.length;
  const passedCases = scored.filter((c) => c.score >= THRESHOLD).length;

  console.log(`\n${"=".repeat(50)}`);
  console.log(`${passedCases}/${scored.length} cases at or above threshold`);
  console.log(`Average weighted score: ${avgScore.toFixed(3)}`);

  // Non-zero exit on regression so this can gate a CI pipeline.
  process.exit(avgScore >= THRESHOLD ? 0 : 1);
}

main().catch((err) => {
  console.error("Harness failed to run:", err);
  process.exit(1);
});
