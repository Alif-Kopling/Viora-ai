class VoiceManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
    this.onEnd = null;
    this.onStatus = null;
    this.language = "id-ID";
    this.playing = false;
    this.queue = [];

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = this.language;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (this.onResult) this.onResult(transcript);
      };

      this.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        this.isListening = false;
        if (this.onEnd) this.onEnd();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEnd) this.onEnd();
      };
    }
  }

  setStatus(s) {
    if (this.onStatus) this.onStatus(s);
  }

  isSupported() {
    return this.recognition !== null;
  }

  startListening() {
    if (!this.recognition) return;
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.error("Voice start error:", e);
    }
  }

  stopListening() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {}
    this.isListening = false;
  }

  async speak(text, callback) {
    if (!text) {
      if (callback) callback();
      return;
    }

    if (this.playing) {
      this.queue.push({ text, callback });
      return;
    }

    this.playing = true;
    this.setStatus("speaking");

    try {
      await this._play(text);
    } catch (e) {
      console.error("speak error:", e);
    }

    while (this.queue.length > 0) {
      const next = this.queue.shift();
      try {
        await this._play(next.text);
      } catch (e) {
        console.error("queue play error:", e);
      }
      if (next.callback) next.callback();
    }

    this.playing = false;
    this.setStatus("idle");
    if (callback) callback();
  }

  async _play(text) {
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "id-ID";
      u.rate = 1.1;
      u.pitch = 1.05;

      const voices = speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) => v.lang.startsWith("id") && v.name.includes("Microsoft")
      );
      if (idVoice) u.voice = idVoice;

      u.onend = resolve;
      u.onerror = resolve;
      speechSynthesis.speak(u);
    });
  }

  async playTest() {
    this.setStatus("testing");
    try {
      await this._play("Halo! Ini suara Viora, asisten virtual kamu.");
      this.setStatus("idle");
    } catch (e) {
      this.setStatus("error");
      console.error("test play error:", e);
      return e;
    }
  }
}
