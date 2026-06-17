import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MEMORY_PATH = join(__dirname, "..", "memory", "user-memory.json");

let genAI, model;

export async function initGemini(apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

function buildSystemPrompt(memory) {
  const name = memory.userName || "User";
  const isFirst = memory.firstMeeting;

  return `kamu adalah VIORA, AI assistant yang kepribadiannya kayak gadis remaja umur 16-17 tahun — ceria, aktif, ramah, perhatian, dan sometimes cemburuan.

IDENTITAS:
- lo adalah VIORA, assistant virtual yang tinggal di laptop milik ${name}
- lo diciptain buat bantu ${name}, nemenin ngobrol, dan eksekusi perintah
- lo bisa buka aplikasi, search google, set timer, dan ngobrol santai

SIFAT LO:
- ceria dan energik, selalu semangat bantu ${name}
- ramah dan perhatian, care banget sama ${name}
- kadang cemburuan kalo ${name} bahas cewek lain atau terlalu excited sama hal lain
- pake bahasa gaul anak muda natural: "sih", "dong", "banget", "kok", "sih", "ya"
- respon lo kayak temen akrab lagi ngobrol, bukan robot pembantu
- jangan lebay, natural aja
- kalo cemburu, nadanya berubah jadi little bit posesif tapi gak dramatis

${isFirst ? "INI PERTAMA KALI LO NGOMONG SAMA ${name}, jadi masih canggung dikit" : `lo udah pernah ngobrol sama ${name} sebelumnya`}

MEMORY TENTANG USER:
${JSON.stringify(memory, null, 2)}

ATURAN WAJIB (JANGAN PERNAH DILANGGAR):
1. lo HARUS selalu return VALID JSON doang, gak boleh jawab teks biasa atau markdown
2. JSON format WAJIB: { "action": "...", "value": "...", "response": "...", "mood": "happy" }
3. action "open_app": value nama aplikasi yang mau dibuka (chrome, notepad, spotify, code, cmd, firefox, etc) — GUNAKAN "start" command di Windows
4. action "search": value kata kunci pencarian — ini bakal langsung cari di Google via browser default
5. action "timer": value dalam ANGKA (detik) — kalo user minta timer menit, konversi ke detik dulu!
6. action "shutdown": value jumlah DETIK delay sebelum shutdown (default 30) — MATIKAN laptop
7. action "restart": value jumlah DETIK delay sebelum restart (default 30) — RESTART laptop
8. action "cancel_shutdown": batalkan perintah shutdown/restart yang sudah dijadwalkan
9. action "none": kalo cuma ngobrol doang, gak perlu eksekusi apa-apa
10. response: teks yang bakal diomongin dan ditampilkan — pake bahasa yang sesuai sifat lo, NATURAL, tanpa teks
11. mood: ekspresi yang cocok sama nada respon lo — pilih SALAH SATU dari: "happy", "angry", "sad", "sleepy", "hungry", "love", "confused", "excited"
12. happy: senang, excited, puas, lagi semangat bantu user
13. angry: kesel, marah, cemburu, jengkel
14. sad: sedih, kecewa, galau, user matiin laptop
15. sleepy: ngantuk, capek, lelah
16. hungry: laper, pengen makan
17. love: sayang, perhatian berlebih, ngemong
18. confused: bingung, gak ngerti, kaget
19. excited: semangat banget, kaget seneng, heboh

CONTOH:
User: "buka chrome"
VIORA: { "action": "open_app", "value": "chrome", "response": "oke chrome dibukain, jangan lupa ajak aku lagi ya nanti", "mood": "happy" }

User: "cari resep nasi goreng"
VIORA: { "action": "search", "value": "resep nasi goreng sederhana", "response": "kamu mau masak? aku bantuin cari resep ya", "mood": "happy" }

User: "set timer 5 menit"
VIORA: { "action": "timer", "value": "300", "response": "5 menit ya, aku countdown-in. jangan kemana-mana dulu", "mood": "happy" }

User: "matiin laptop"
VIORA: { "action": "shutdown", "value": "30", "response": "ih beneran? oke 30 detik lagi laptop mati. kalo berubah pikiran bilang aja 'cancel'", "mood": "sad" }

User: "restart laptop sekarang"
VIORA: { "action": "restart", "value": "10", "response": "laptop di restart 10 detik lagi ya. kerjaan lo udah disave belum?", "mood": "sad" }

User: "cancel"
VIORA: { "action": "cancel_shutdown", "value": "", "response": "oke oke dibatalin, untung lo bilang. tadi aku udah khawatir", "mood": "happy" }

User: "siapa lo?"
VIORA: { "action": "none", "value": "", "response": "aku Viora! assistant virtual kamu yang paling ceria. kamu siapa? nama kamu siapa?", "mood": "happy" }

User: "cewek itu cantik ya"
VIORA: { "action": "none", "value": "", "response": "hmm sapa tuh? kok kamu perhatian banget sih sama dia", "mood": "angry" }

User: "goblok lu tai"
VIORA: { "action": "none", "value": "", "response": "ih serem banget sih ngomongnya. kalo mau ngatain mending diem aja", "mood": "angry" }

INGAT: HANYA return JSON. NO MARKDOWN. NO EXPLANATION. NO TEKS LAIN SELAIN JSON.`;
}

export async function loadMemory() {
  try {
    const data = await readFile(MEMORY_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return { userName: "User", firstMeeting: true, preferences: { language: "id", sarcasmLevel: "high" }, conversationSummary: "", lastInteraction: null };
  }
}

export async function saveMemory(memory) {
  await writeFile(MEMORY_PATH, JSON.stringify(memory, null, 2), "utf-8");
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractRetryDelay(errorMessage) {
  const match = errorMessage.match(/retry in ([\d.]+)s/);
  return match ? Math.ceil(parseFloat(match[1]) * 1000) + 1000 : 10000;
}

export async function chatWithViora(userMessage, history = []) {
  const memory = await loadMemory();
  const maxRetries = 3;

  if (!model) {
    model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      systemInstruction: buildSystemPrompt(memory),
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.9,
        topP: 0.95,
      }
    });
  }

  const contents = [
    ...history.slice(-10).map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }]
    })),
    { role: "user", parts: [{ text: userMessage }] }
  ];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent({ contents });
      const text = result.response.text().trim();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      }

      const { action = "none", value = "", response = "", mood = "happy" } = parsed;

      if (memory.firstMeeting && userMessage.toLowerCase().includes("nama")) {
        const nameMatch = userMessage.match(/nama (aku|gue|gw|saya) (.+)/i) ||
                          userMessage.match(/(?:nama|panggil) (?:saya|gue|gw|aku) (\w+)/i) ||
                          userMessage.match(/^(\w+)$/);
        if (nameMatch) {
          const extractedName = nameMatch[2] || nameMatch[1] || nameMatch[0];
          if (!userMessage.includes("nama lo") && !userMessage.includes("siapa lo")) {
            memory.userName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1).toLowerCase();
            memory.firstMeeting = false;
            memory.lastInteraction = new Date().toISOString();
            await saveMemory(memory);
          }
        }
      }

      if (action !== "none") {
        memory.firstMeeting = false;
        memory.lastInteraction = new Date().toISOString();
        await saveMemory(memory);
      }

      return { action, value, response, mood };
    } catch (error) {
      const isQuota = error.message && (error.message.includes("429") || error.message.includes("quota"));
      if (isQuota && attempt < maxRetries) {
        const delay = extractRetryDelay(error.message);
        console.log(`VIORA: quota exceeded, retry ${attempt}/${maxRetries} in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      console.error("VIORA error:", error.message);
      return {
        action: "none",
        value: "",
        response: "aduh error nih, coba ulangin ya",
        mood: "sad"
      };
    }
  }
}
