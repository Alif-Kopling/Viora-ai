class VoiceManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
    this.onEnd = null;
    this.onStatus = null;
    this.onSilence = null;
    this.language = "id-ID";
    this.playing = false;
    this.queue = [];
    this.silenceTimer = null;
    this.lastFinal = "";
    this.paused = false;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;

      this.recognition.onresult = (event) => {
        let final = "";
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          if (r.isFinal) {
            final += r[0].transcript;
          } else {
            interim += r[0].transcript;
          }
        }

        if (final) {
          if (this.onResult) this.onResult(final, false);
          this.lastFinal = "";
        }

        if (interim) {
          if (this.onResult) this.onResult(interim, true);
        }

        this._resetSilenceTimer();
      };

      this.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        this.isListening = false;
        if (event.error !== "aborted" && !this.paused) {
          setTimeout(() => this.startListening(), 1000);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (!this.paused) {
          setTimeout(() => this.startListening(), 500);
        }
      };
    }
  }

  _resetSilenceTimer() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => {
      if (this.lastFinal && this.onSilence) {
        this.onSilence(this.lastFinal);
        this.lastFinal = "";
      }
    }, 3000);
  }

  setStatus(s) {
    if (this.onStatus) this.onStatus(s);
  }

  isSupported() {
    return this.recognition !== null;
  }

  startListening() {
    if (!this.recognition || this.isListening) return;
    try {
      this.recognition.start();
      this.isListening = true;
      this.paused = false;
    } catch (e) {}
  }

  stopListening() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {}
    this.isListening = false;
  }

  pause() {
    this.paused = true;
    this.stopListening();
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
  }

  resume() {
    this.paused = false;
    this.startListening();
  }

  async speak(text) {
    if (!text) return;

    this.pause();

    if (this.playing) {
      this.queue.push(text);
      return;
    }

    this.playing = true;
    this.setStatus("speaking");

    try {
      await this._play(text);
    } catch (e) {}

    while (this.queue.length > 0) {
      const next = this.queue.shift();
      try {
        await this._play(next);
      } catch (e) {}
    }

    this.playing = false;
    this.setStatus("idle");
    this.resume();
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
      return e;
    }
  }
}
