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

## Running it locally

Any static file server works:

```bash
python3 -m http.server 8123
```

Then open `http://localhost:8123`. A `.claude/launch.json` is included for
previewing inside Claude Code's browser pane.

For the example harness itself:

```bash
cd examples/eval-harness
node harness.js
```

No install step, no API key required — see the
[example's own README](examples/eval-harness/README.md) for details.

## Deploying it

**GitHub Pages**

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a
   branch**.
3. Set **Branch** to `main` and the folder to `/` (root).
4. Save. The site publishes at
   `https://<your-username>.github.io/ai-benchmarks/`.

That's the whole setup — every path in the site is relative, so it works
unmodified from a repo subpath. Pushing to `main` also triggers
[`.github/workflows/static.yml`](.github/workflows/static.yml), which
deploys via the `actions/deploy-pages` action.

## License

MIT — see [LICENSE](LICENSE).
