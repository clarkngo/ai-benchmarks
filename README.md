# AI Benchmarks

A practical toolkit for evaluating LLM-based systems — prompts, agents, and
pipelines. For teams that already ship with LLMs and need a repeatable way
to catch regressions, not an intro to what an LLM is.

Live at **[clarkngo.github.io/ai-benchmarks](https://clarkngo.github.io/ai-benchmarks/)**.

## What's here

- **Why evals** — why a single mega-prompt and slow manual human review both
  fail to catch regressions at any real velocity.
- **Eval Pattern Catalog** — six patterns for catching different failure
  modes (exact-match checks, LLM-as-judge, rubric-based human rating,
  statistical significance, latency/cost benchmarking, safety and
  refusal-rate testing), each with the failure mode it catches, the tools it
  pairs with, and tags.
- **Tool landscape** — an honest comparison of promptfoo, OpenAI Evals,
  LangSmith, and Braintrust.
- **[Runnable example](examples/eval-harness/)** — a minimal rubric-scoring
  eval harness in plain Node, zero dependencies, no framework lock-in. Fork
  it and swap in your own pipeline's output.

## Stack

Static HTML/CSS/vanilla JS, no build step or framework. `patterns.json`
drives the rendered catalog cards; light/dark theme is CSS custom
properties with a manual toggle; deploys to GitHub Pages on push to `main`
via [`.github/workflows/static.yml`](.github/workflows/static.yml).
