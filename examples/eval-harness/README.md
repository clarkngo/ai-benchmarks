# Eval Harness Example

A minimal rubric-based eval harness in plain Node. Zero dependencies, no
framework lock-in — clone this folder and it runs.

## Run it

```bash
node harness.js
```

No install step, no API key required. Exits `0` if the average weighted
score is at or above the threshold (default `0.8`), `1` otherwise — wire
that exit code into CI to gate merges on eval regressions.

```bash
node harness.js --threshold=0.9
node harness.js --cases=./my-cases.json
```

## How it's structured

- **`test-cases.json`** — each case has an `output` (what your pipeline
  produced) and a `rubric`: a list of weighted checks. In real use you'd
  generate `output` by calling your own pipeline before scoring it; here
  it's pre-filled so the harness runs standalone.
- **`harness.js`** — loads the cases, runs each rubric item through a
  checker, and prints a weighted pass/fail report.

## Checker types

| type | what it checks |
|---|---|
| `contains` / `not_contains` | case-insensitive substring match |
| `regex` | matches a regular expression (`value` + optional `flags`) |
| `max_sentences` | output stays within N sentences |
| `max_length` | output stays within N characters |
| `valid_json` | output parses as JSON |
| `llm_judge` | delegates to a real model call — see below |

## Wiring up a real LLM-as-judge

The `llm_judge` checker in `harness.js` is gated behind `ANTHROPIC_API_KEY`
so the harness is runnable with zero setup. Set the env var to exercise the
real path, or swap in your own provider:

```bash
ANTHROPIC_API_KEY=sk-... node harness.js
```

Without a key, `llm_judge` checks are skipped and logged as passed with a
warning — that's intentional so a missing credential fails loud in the
report, not silently in CI. Don't ship that default to a real gate; either
set the key or replace the checker with your own.

## Adding a test case

Add an entry to `test-cases.json` with an `id`, `description`, `output`,
and a `rubric` array. Each rubric item needs a `criterion` (human-readable),
a `type` (one of the checkers above), a `weight`, and whatever value that
checker needs (`value`, `flags`, etc).
