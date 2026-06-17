const chat = new ChatUI('chatArea');
const voice = new VoiceManager();
const viz = new Visualizer('visualizer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const scSpeaker = document.getElementById('scSpeaker');
const vioraTag = document.getElementById('vioraTag');
const vizText = document.getElementById('vizText');
const chatToggle = document.getElementById('chatToggle');
const chatDrawer = document.getElementById('chatDrawer');
const chatToggleCount = document.getElementById('chatToggleCount');

let conversationHistory = [];
let isProcessing = false;
let msgCount = 0;

function showTimerNotification(text) {
  const el = document.getElementById('timerNotification');
  document.getElementById('timerText').textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

chatToggle.addEventListener('click', () => {
  chatDrawer.classList.toggle('open');
});

voice.onStatus = (status) => {
  scSpeaker.className = 'sc sc-speaker';

  if (status === 'speaking') {
    scSpeaker.classList.add('speaking');
    viz.start();
    vizText.style.opacity = '0';
    vioraTag.textContent = 'lagi ngomong...';
  } else if (status === 'testing' || status === 'idle') {
    viz.stop();
    vizText.style.opacity = '1';
    vioraTag.textContent = 'nemenin kamu';
  } else if (status === 'blocked') {
    scSpeaker.classList.add('blocked');
    vizText.textContent = 'Klik halaman dulu buat aktifin suara';
    setTimeout(() => {
      vizText.textContent = 'Ketik pesan atau tekan mic...';
    }, 3000);
  } else if (status === 'error') {
    scSpeaker.classList.add('error');
  }
};

scSpeaker.addEventListener('click', async () => {
  const err = await voice.playTest();
  if (err) {
    chat.addSystemMessage('Suara diblokir browser. Klik halaman dulu, lalu coba lagi.');
  } else {
    chat.addSystemMessage('Test suara berhasil!');
  }
});

const eventSource = new EventSource('/events');
eventSource.addEventListener('timer_done', (e) => {
  const data = JSON.parse(e.data);
  showTimerNotification(`Waktu habis! Timer ${data.seconds} detik selesai.`);
  chat.addSystemMessage(`Timer ${data.seconds} detik selesai!`);
});

eventSource.addEventListener('connected', () => {
  console.log('SSE connected');
});

async function sendMessage(message) {
  if (isProcessing || !message.trim()) return;

  isProcessing = true;
  msgCount++;
  chatToggleCount.textContent = msgCount;
  chat.addUserMessage(message);
  chat.showTyping();
  messageInput.value = '';
  vioraTag.textContent = 'lagi mikir...';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message.trim(),
        history: conversationHistory
      })
    });

    const data = await res.json();

    chat.hideTyping();
    chat.typeResponse(data.response || '...');

    voice.speak(data.response || '');

    conversationHistory.push(
      { role: 'user', text: message.trim() },
      { role: 'assistant', text: data.response || '' }
    );

    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    if (data.action === 'timer' && data.value) {
      chat.addSystemMessage(`Timer ${data.value} detik dimulai...`);
    }
  } catch (error) {
    chat.hideTyping();
    chat.addErrorMessage('Gagal konek ke server. Coba lagi.');
  }

  isProcessing = false;
}

sendBtn.addEventListener('click', () => {
  sendMessage(messageInput.value);
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage(messageInput.value);
  }
});

voice.onResult = (transcript) => {
  chat.addSystemMessage(`Mendengar: "${transcript}"`);
  sendMessage(transcript);
};

voice.onEnd = () => {
  micBtn.classList.remove('listening');
};

micBtn.addEventListener('click', () => {
  if (voice.isListening) {
    voice.stopListening();
    micBtn.classList.remove('listening');
    return;
  }

  if (!voice.isSupported()) {
    chat.addErrorMessage('Voice input tidak didukung di browser ini.');
    return;
  }

  micBtn.classList.add('listening');
  voice.startListening();
  chat.addSystemMessage('Mikrofon aktif, silakan bicara...');
});

messageInput.focus();
