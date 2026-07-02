
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint for music generation
app.post("/api/generate", async (req, res) => {
  try {
    const { genre, mood, tempo, instrument, creativity, length } = req.body;

    const systemInstruction = `You are a professional music composer AI. 
    Your task is to generate original musical compositions in JSON format.
    The music should be represented as a sequence of notes.
    
    Each note object must have:
    - note: The pitch (e.g., "C4", "Eb5", "G3", "rest"). Use standard MIDI notation.
    - time: The starting time in "meas:beat:sixteenth" format (e.g., "0:0:0", "1:2:0").
    - duration: The duration in subdivision format (e.g., "4n", "8n", "2n").
    - velocity: A number between 0 and 1 representing the intensity.
    
    Composition details:
    - Genre: ${genre}
    - Mood: ${mood}
    - Tempo: ${tempo} BPM
    - Instrument: ${instrument}
    - Creativity: ${creativity}/10 (higher means more complex and unusual patterns)
    - Length: ${length} measures
    
    Important: Return ONLY a valid JSON object. Do not include markdown code blocks.
    The JSON structure should be:
    {
      "notes": [ ... ],
      "tempo": number,
      "metadata": { "genre": string, "mood": string, "analysis": "A brief explanation of how the AI composed this melody" }
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Compose a ${length}-measure ${genre} melody that is ${mood}. Tempo is ${tempo} BPM. Creativity level is ${creativity}.`,
      config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  notes: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              note: { type: Type.STRING },
                              time: { type: Type.STRING },
                              duration: { type: Type.STRING },
                              velocity: { type: Type.NUMBER }
                          },
                          required: ["note", "time", "duration"]
                      }
                  },
                  tempo: { type: Type.NUMBER },
                  metadata: {
                      type: Type.OBJECT,
                      properties: {
                          genre: { type: Type.STRING },
                          mood: { type: Type.STRING },
                          analysis: { type: Type.STRING }
                      }
                  }
              },
              required: ["notes", "tempo", "metadata"]
          }
      },
    });

    const text = typeof response.text === 'function' ? response.text() : response.text;
    const musicData = JSON.parse(text);
    res.json(musicData);
  } catch (error: any) {
    console.error("Error generating music:", error?.message || error);
    res.status(500).json({ error: error?.message || "Failed to generate music" });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
