import "dotenv/config";
import express from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { initGemini, chatWithViora } from "./brain/gemini.js";
import { executeAction } from "./executor/index.js";
import { addSSEClient } from "./executor/timer.js";
import { generateAudio, listVoices } from "./tts/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY not found in .env file!");
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

app.get("/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  res.write("event: connected\ndata: {}\n\n");
  addSSEClient(res);
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const result = await chatWithViora(message, history);

    if (result.action && result.action !== "none") {
      try {
        await executeAction(result.action, result.value);
      } catch (execError) {
        console.error("Action execution failed:", execError.message);
      }
    }

    res.json(result);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      action: "none",
      value: "",
      response: "ada error di otak gue, coba lagi nanti."
    });
  }
});

app.post("/api/execute", async (req, res) => {
  try {
    const { action, value } = req.body;
    const result = await executeAction(action, value);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/memory", (req, res) => {
  import("./brain/gemini.js").then(({ loadMemory }) => {
    loadMemory().then(memory => res.json(memory));
  });
});

app.post("/api/memory", async (req, res) => {
  const { saveMemory } = await import("./brain/gemini.js");
  const { loadMemory } = await import("./brain/gemini.js");
  const current = await loadMemory();
  const updated = { ...current, ...req.body, lastInteraction: new Date().toISOString() };
  await saveMemory(updated);
  res.json({ saved: true });
});

app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = "id-ID-GadisNeural" } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    console.log(`TTS: generating for "${text.slice(0, 50)}..."`);
    const startTime = Date.now();
    const audioBuffer = await generateAudio(text, voice);
    console.log(`TTS: done in ${Date.now() - startTime}ms (${audioBuffer.length} bytes)`);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length.toString(),
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error("TTS error:", error.message);
    res.status(500).json({ error: "TTS generation failed" });
  }
});

app.get("/api/voices", async (req, res) => {
  try {
    const voices = await listVoices();
    res.json(voices);
  } catch (error) {
    res.status(500).json({ error: "Failed to list voices" });
  }
});

async function start() {
  await initGemini(API_KEY);
  console.log("🧠 VIORA AI - Brain initialized");

  app.listen(PORT, () => {
    console.log(`🚀 VIORA AI running at http://localhost:${PORT}`);
    console.log(`💬 Buka browser lo di http://localhost:${PORT}`);
  });
}

start().catch(console.error);
