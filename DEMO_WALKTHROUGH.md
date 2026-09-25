# UI Demo Recording Walkthrough — ai-job-matching-engine

**Document**: Guided Script & Recording Instructions for Video/GIF Demo  
**Location**: `/Users/chung/sandbox/matcha.fm/full-stack-engineer/ai-job-matching-engine/DEMO_WALKTHROUGH.md`  

---

## 🎬 1. Quick Launch Command

Run the demo helper script to start the Fastify API (port 4000), Next.js frontend (port 3000), and open the browser:

```bash
cd ai-job-matching-engine
./scripts/record_demo.sh
```

---

## 🎥 2. Recording on macOS

- **Native macOS Screen Recorder**: Press `Cmd + Shift + 5`
  - Choose **Record Selected Portion** and frame the browser window.
  - Click **Record**.
  - When finished, click the **Stop** icon in the macOS menu bar (or press `Cmd + Ctrl + Esc`).
- **Convert MOV to GIF / MP4** (using Homebrew ffmpeg):
  ```bash
  # Convert recorded screen capture to an optimized 60fps MP4
  ffmpeg -i ~/Desktop/Screen\ Recording*.mov -vcodec h264 -acodec aac demo_recording.mp4

  # Or convert to an optimized GIF for GitHub README
  ffmpeg -i demo_recording.mp4 -vf "fps=15,scale=1080:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 demo.gif
  ```

---

## 📋 3. Step-by-Step Demo Walkthrough (60 – 90 Seconds)

### Step 1: Prompt Landing Page (`http://localhost:3000`)
1. Click the natural language query box.
2. Type or paste:
   > *"I am a Founding Full Stack Engineer with strong TypeScript, Next.js, and Fastify backend experience looking for a remote role."*
3. **Highlight**: Observe the **Live Skill & Attribute Detection** pills (`TypeScript`, `Next.js`, `Fastify`, `Remote`, `Founding`) dynamically highlighting in emerald green in real-time as you type (powered by Jotai atomic state).
4. Enter an email in the alert box and click **Get Daily Matches**.

### Step 2: Candidate Matches Feed (`http://localhost:3000/matches`)
1. View the ranked match cards scored with the **Hybrid 50% Vector + 50% Recursive CTE Graph** algorithm.
2. Toggle the Candidate dropdown:
   - **Alex Chen** (Full Stack Lead $\rightarrow$ 94% match on Founding Full Stack).
   - **Maya Lin** (AI/ML Engineer $\rightarrow$ 96% match on Founding AI Engineer).
   - **David Kim** (Backend Engineer $\rightarrow$ 92% match on Founding Backend Engineer).
3. **Highlight**: Open the **AI Match Rationale** breakdown showing the exact cosine vector similarity and knowledge graph transferable skill scores (e.g. `Express` $\rightarrow$ `Fastify` ontology credit).
4. Click **Quick Apply** or **Save** to demonstrate reactive status mutations.

### Step 3: Daily Ingestion Dashboard (`http://localhost:3000/ingestion`)
1. Click the **Ingestion Pipeline** tab.
2. Click **Trigger Batch Ingest**.
3. **Highlight**: Observe the status badge switch to **"In Progress"** with live 2-second TanStack Query polling while the local Ollama LLM and vector embedding generator parse unparsed job descriptions.
4. Watch the table update automatically with the newly generated batch ID, duration, and OpenTelemetry trace ID.

### Step 4: Distributed Observability & Telemetry (`http://localhost:3000/telemetry`)
1. Click the **OTel Telemetry** tab.
2. **Highlight**: Review the live list of instrumented request spans with duration in milliseconds, HTTP status codes, and `X-Trace-Id` headers.
3. Click the **Swagger API** link in the top right to show the live interactive OpenAPI documentation at `http://localhost:4000/docs`.
