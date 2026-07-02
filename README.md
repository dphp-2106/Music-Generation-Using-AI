# MelodyMind AI - Neural Music Composer

MelodyMind AI is a state-of-the-art AI-powered music generation application. Built with **React 19**, **Vite**, **Express**, **Tailwind CSS v4**, and **Tone.js**, it leverages the power of the **Google GenAI SDK (Gemini 1.5 Flash)** to compose original musical melodies based on customizable parameters, render them in real-time in the browser, visualize their waveforms, and export them as MIDI files.

<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

---

## 🚀 Key Features

*   **Neural Music Generator**: Define genres (Classical, Jazz, Electronic, Lo-Fi, Ambient, Cinematic), moods (Happy, Sad, Epic, Relaxing, etc.), and tempo.
*   **AI Creativity Slider**: Fine-tune the AI temperature to go from structured, classical arrangements to experimental, progressive melodies.
*   **Real-time Synthesis**: High-quality browser audio synthesis using **Tone.js** polyphonic synthesizers tailored to your selected instrument (Piano, Synth Pad, Strings, Kalimba, Marimba).
*   **Interactive Audio Waveform**: A dynamic, canvas-based audio visualizer that animates based on real-time synthesizer level output.
*   **MIDI File Export**: Instantly download your generated melodies as standard `.mid` files using `midi-writer-js` for use in DAWs (Logic, Ableton, FL Studio).
*   **Immersive Sci-Fi UI**: A futuristic dark theme with fluid micro-interactions and animations powered by **Motion**.

---

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion
*   **Audio Engine**: Tone.js, midi-writer-js
*   **Backend Server**: Express.js, TypeScript (running via tsx)
*   **AI Orchestrator**: `@google/genai` (Google Gemini 1.5 Flash)

---

## 🏃 Getting Started

### Prerequisites

Ensure you have **Node.js** installed on your system.

### 1. Installation

Clone this repository and install the project dependencies:

```bash
npm install
```

### 2. Configure Environment Variables

Create a file named `.env.local` in the root directory (this file is configured in `.gitignore` and will never be committed to Git) and add your Gemini API Key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

> [!TIP]
> You can acquire a free Gemini API Key from [Google AI Studio](https://aistudio.google.com/).

### 3. Run the App

Start the development server (which spins up both the frontend client and backend API):

```bash
npm run dev
```

The application will be running locally at: `http://localhost:3000`

---

## ⚙️ How It Works Under the Hood

1.  **Request Composition**: The React frontend sends the desired parameters (genre, mood, instrument, creativity, length) to the `/api/generate` endpoint on the Express server.
2.  **Structured Output Schema**: The server queries the Gemini API using the new `@google/genai` SDK, passing a strict JSON Schema. Gemini returns a fully structured JSON response containing:
    *   `note`: MIDI pitch string (e.g. `C4`, `Eb5`, `rest`)
    *   `time`: Tone.js transport time in `"measures:beats:sixteenths"` format (e.g., `"0:2:0"`)
    *   `duration`: Subdivision duration (e.g. `"4n"`, `"8n"`)
    *   `velocity`: Dynamic velocity (intensity value between `0` and `1`)
3.  **Synthesis**: Tone.js parses the note sequence, schedules them in its virtual transport timeline, and triggers polyphonic synths.
4.  **Visualizations**: A high-performance canvas loop measures decibel levels from the master output and draws a real-time responsive sound wave.
