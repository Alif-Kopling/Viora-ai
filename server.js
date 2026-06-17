import "dotenv/config";
import express from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { initGemini, chatWithViora, generateIdleMessage, generateGreeting, loadMemory } from "./brain/gemini.js";
import { executeAction } from "./executor/index.js";
import { addSSEClient, broadcastSSE } from "./executor/timer.js";
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

let lastActivity = Date.now();
const IDLE_TIMEOUT = 5 * 60 * 1000;

function resetIdleTimer() {
  lastActivity = Date.now();
}

async function checkIdle() {
  if (Date.now() - lastActivity < IDLE_TIMEOUT) return;

  lastActivity = Date.now();
  console.log("VIORA: user idle 5 menit, kirim pesan kangen...");

  try {
    const memory = await loadMemory();
    const msg = await generateIdleMessage(memory);
    broadcastSSE("idle_message", msg);
  } catch (error) {
    console.error("Idle check error:", error.message);
  }
}

app.get("/events", async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  res.write("event: connected\ndata: {}\n\n");
  addSSEClient(res);

  try {
    const memory = await loadMemory();
    const isNew = memory.firstMeeting;
    const stale = memory.lastInteraction
      ? Date.now() - new Date(memory.lastInteraction).getTime() > 30 * 60 * 1000
      : true;

    if (isNew || stale) {
      console.log("VIORA: ngirim greeting ke user...");
      const msg = await generateGreeting(memory);
      res.write(`event: greeting\ndata: ${JSON.stringify(msg)}\n\n`);
    }
  } catch (error) {
    console.error("Greeting error:", error.message);
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const result = await chatWithViora(message, history);
    resetIdleTimer();

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
      response: "ada error di otak gue, coba lagi nanti.",
      mood: "confused"
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

  setInterval(checkIdle, 30 * 1000);
  console.log("⏰ Idle checker aktif — tiap 30 detik");

  app.listen(PORT, () => {
    console.log(`🚀 VIORA AI running at http://localhost:${PORT}`);
    console.log(`💬 Buka browser lo di http://localhost:${PORT}`);
  });
}

start().catch(console.error);
