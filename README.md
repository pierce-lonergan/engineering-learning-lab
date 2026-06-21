# Engineering Learning Lab

An interactive, single-file study system for **software-engineering concepts** — a career-spanning review across distributed systems, streaming, big data, databases, software architecture, the JVM, applied ML & retrieval, cloud, and CS fundamentals. Grounded in real systems (NexusPay, NexusMatcher, NexusPiercer, Entropy Engine, MAMMAL).

Forked from the engine behind the [Series 65 Learning Lab](https://github.com/pierce-lonergan/series-65-learning-lab), adapted for engineering: syntax-highlighted code, architecture diagrams, "Gotcha" callouts, interactive concept widgets, and spaced-repetition review.

### ▶️ Live: https://pierce-lonergan.github.io/engineering-learning-lab/

## Modes

- **Study** — flashcards across every deck; click any underlined term to drill into it.
- **Explore** — a hyperlinked glossary written for clarity, with infinite drill-down (back-stack + breadcrumbs).
- **Quiz** — recall + "gotcha" questions whose explanations link back into the glossary.
- **Exam** — a section-weighted, timed mock per deck (or a cross-deck interview mock).
- **Review** *(in progress)* — spaced-repetition scheduler that resurfaces what you miss.

Each concept can carry a plain-English definition, a 🧠 memory hook, a ⚠ Gotcha, worked examples, LaTeX for the math, and dependency-free interactive diagrams.

## How it's built

The deck is authored as modular content files and compiled into one self-contained, offline `index.html`:

```
src/engine.html     # the engine (CSS + JS) with a <!-- @CONTENT@ --> injection point
content/*.js        # per-deck/topic card + glossary modules (plain JS)
build.js            # concatenates content into index.html and validates every cross-link
index.html          # the built, deployable single file (what GitHub Pages serves)
```

Build it:

```bash
node build.js     # writes index.html, reports card/glossary counts, fails on dead links
```

Run locally:

```bash
python -m http.server 8100   # then open http://localhost:8100
```

## Decks (target ~2,600 cards, v1)

Foundations (CS & System Design) · Distributed Systems & Streaming · Software Architecture & Design · Databases, Transactions & NoSQL · Java & the JVM · Apache Spark & Big Data · Observability, Security & Reliability · Applied ML & Information Retrieval · Lakehouse & Data Warehousing · Cloud & Infrastructure (AWS) · Languages (Python & Scala) · Data Governance & Quality.

---

*Built by Pierce Lonergan. A personal study tool; content reflects concepts from a data/platform engineering career.*
