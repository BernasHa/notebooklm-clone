# NotebookLM Clone

A source-grounded research assistant: upload your documents, then chat with an AI that answers only from those sources, with inline citations that jump to the exact passage. Built as a take-home project.

Demo video: https://www.loom.com/share/ac9b636ecc924cbbbf3f8c1471377981

## What it does

- Create a notebook and add multiple sources (PDF upload + pasted text)
- Ask questions answered strictly from your sources — no outside knowledge
- Inline citations: click a citation to jump to the exact source passage
- Studio panel: one-click Summary, Study Guide, FAQ
- Audio Overview: generate a two-host podcast from your sources and play it back

## How it works (architecture)

Ingestion: source → text extraction → chunking → embeddings → vector store.
Query: question is embedded, top-k relevant chunks are retrieved, then passed to the chat model with instructions to answer only from those chunks and cite them.

- **Frontend/Backend:** Next.js (TypeScript, App Router)
- **Models:** OpenAI — `text-embedding-3-small` (embeddings), `gpt-4o-mini` (chat + Studio + audio script), `gpt-4o-mini-tts` (Audio Overview voices)
- **Vector store:** SQLite + `sqlite-vec` (demo). Production: pgvector/Supabase.
- **PDF parsing:** `pdf-parse`

Flow:

```
Upload PDF/text ─► parse ─► sentence-aware chunk (keep char offsets) ─► embed ─► store (sqlite-vec)
Ask question    ─► embed query ─► top-k vector search ─► grounded prompt ─► answer + [n] citations
Each citation   ─► model returns a verbatim quote + source id (structured output)
Click citation  ─► locate quote in the source's full text ─► highlight the exact supporting sentence
Studio          ─► Summary / Study Guide / FAQ generated from the whole notebook
Audio Overview  ─► grounded 2-host script ─► per-line TTS (2 voices, parallel) ─► base64 clips ─► browser playlist
```

**Key decisions worth calling out:**

- **Quote-accurate citations, not chunk-accurate.** The model returns a verbatim quote per claim; the app locates that quote in the source text (whitespace-tolerant, with a fuzzy word-run fallback that snaps to sentence bounds) and highlights the exact sentence. This survives bad chunk boundaries and the model citing a neighbouring chunk.
- **Sentence-aware chunking, no overlap.** Chunks break on real sentence/paragraph ends (single PDF line-wraps are treated as in-sentence whitespace), so highlights never cut mid-sentence. Zero overlap means each sentence lives in exactly one chunk → unambiguous citation mapping.

## Scope decisions

Built deliberately around the core that defines NotebookLM — grounded answers with click-to-source citations — rather than chasing feature count. Intentionally left out (and why):

- **Auth / multi-user** — prototype scope; adds no value to the demo and would cost time better spent on the grounding core.
- **Multiple notebooks** — MVP uses one default notebook; the schema already supports many, only the UI is single-notebook.
- **Video overviews, infographics, mind maps** — peripheral to the source-grounding thesis; high build cost, low signal for this evaluation.
- **Mobile layout** — desktop-first product; the 3-panel layout is the intended experience and responsive polish is out of scope.

## With more time

- pgvector/Supabase instead of SQLite for real persistence + scaling (and a stable Vercel write path — the demo's local SQLite isn't durable on serverless).
- URL / YouTube sources (fetch + transcript ingestion) beyond PDF and pasted text.
- Re-ranking retrieved chunks, hybrid (keyword + vector) search, and tests around the chunker / quote-locator.
- An interactive audio mode: interrupt the two hosts mid-podcast to ask follow-up questions.

## Run locally

Requires Node 18+ and an OpenAI API key.

```bash
npm install
cp .env.example .env.local   # then paste your OpenAI key into OPENAI_API_KEY
npm run dev
```

Open http://localhost:3000. The SQLite database is created automatically on first
use under `data/` (gitignored). Add a source, then ask a question.
