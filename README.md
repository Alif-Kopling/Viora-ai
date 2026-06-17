<p align="center">
  <img src="https://media.tenor.com/wBumfyondqsAAAAM/anime-girl-waves-anime-girl.gif" width="180" alt="Viora">
  <h1 align="center">🌺 Viora AI</h1>
  <p align="center">
    <b>Oneesan AI Assistant — nemenin lo di laptop</b>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white">
    <img src="https://img.shields.io/badge/Gemini-3.01-8E75B2?logo=googlegemini&logoColor=white">
    <img src="https://img.shields.io/badge/TTS-Edge-0078D7?logo=windows&logoColor=white">
    <img src="https://img.shields.io/badge/license-MIT-blue">
  </p>
</p>

---

## ✨ Fitur

| Fitur | Deskripsi |
|-------|-----------|
| 🤖 **AI Chat** | Dipikirin Gemini 2.0 — kepribadian oneesan yang kalem & penyayang |
| 🎙️ **Voice TTS** | Ngomong pake suara Indow — natural, bukan robot |
| 🖥️ **Buka Aplikasi** | "buka chrome", "buka notepad", "buka spotify", dll |
| 🔍 **Search** | "cari resep nasi goreng" — langsung Google |
| ⏰ **Timer** | "set timer 10 menit" — countdown + notifikasi |
| ⚡ **Power Control** | "matiin laptop" / "restart" — delay + cancel support |
| 🧠 **Memory** | Inget lo — dari nama sampe mood, progres, kebiasaan |
| 😊 **Mood System** | Ekspresi wajah + animasi sesuai respon |
| 💬 **Chat History** | Auto-save — obrolan gak ilang |
| 🌙 **Dark Mode** | Mata lo gak sakit |

---

## 🚀 Instalasi

```bash
# 1. Clone repo
git clone https://github.com/yourusername/viora-ai.git
cd viora-ai

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env — isi GEMINI_API_KEY
# (dapetin key di https://aistudio.google.com/app/apikey)

# 4. Jalanin
npm start
```

Buka `http://localhost:3000` di browser.

---

## 🛠️ Tech Stack

```
Backend   → Node.js + Express
AI Brain  → Google Gemini 2.0
TTS       → Microsoft Edge TTS
Frontend  → HTML + CSS + Vanilla JS
Memory    → JSON file-based
```

---

## 🧪 Contoh Interaksi

| Lo bilang | Viora bakal |
|-----------|-------------|
| "hai sayang" | Nyapa balik pake nada oneesan |
| "buka chrome" | Buka Chrome + bilang "hati-hati ya" |
| "cari resep nasi goreng" | Search Google + ngingetin biar gak kena minyak |
| "set timer 5 menit" | Countdown 5 menit |
| "matiin laptop" | Shutdown + sedih |
| "siapa lo?" | "aku Viora sayang" |

---

## 📁 Project Structure

```
viora-ai/
├── brain/          # Gemini prompt & logic
│   └── gemini.js
├── executor/       # Action handler
│   ├── index.js
│   ├── open.js     # Buka aplikasi
│   ├── search.js   # Google search
│   ├── power.js    # Shutdown/restart
│   └── timer.js    # Timer + SSE
├── tts/            # Text-to-speech
│   └── index.js
├── memory/         # User memory storage
├── public/         # Frontend
│   ├── index.html
│   ├── css/
│   └── js/
├── temp_audio/     # Audio cache
├── server.js       # Express server
└── package.json
```

---

## 🧠 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
| `PORT` | ❌ No | Port server (default: 3000) |

---

## 📜 Lisensi

MIT — bebas lu pake, modif, distribusi.

---

<p align="center">
  <img src="https://media.tenor.com/8nt2OOrR9_gAAAAM/anime-girl.gif" width="100">
  <br>
  <b>Dibikin pake 🧠 + ☕ + 🎀</b>
  <br>
  <i>"oneesan lo yang tinggal di laptop"</i>
</p>
