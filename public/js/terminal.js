class ChatUI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  addBubble(type, text) {
    const div = document.createElement('div');
    div.className = `message ${type}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    div.appendChild(bubble);
    this.container.appendChild(div);
    this.scrollToBottom();
    return div;
  }

  addUserMessage(text) {
    return this.addBubble('user', text);
  }

  addAssistantMessage(text) {
    return this.addBubble('assistant', text);
  }

  addSystemMessage(text) {
    return this.addBubble('system', text);
  }

  addErrorMessage(text) {
    return this.addBubble('error', text);
  }

  showTyping() {
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = 'typingIndicator';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.style.cssText = 'background: transparent; border: none; box-shadow: none; padding: 8px 4px;';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      indicator.appendChild(dot);
    }

    bubble.appendChild(indicator);
    div.appendChild(bubble);
    this.container.appendChild(div);
    this.scrollToBottom();
  }

  hideTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  typeResponse(text, label) {
    this.hideTyping();
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = 'typingResponse';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.id = 'responseBubble';

    const textSpan = document.createElement('span');
    textSpan.id = 'responseText';
    bubble.appendChild(textSpan);
    div.appendChild(bubble);
    this.container.appendChild(div);

    let index = 0;
    const chars = text.split('');

    const type = () => {
      if (index < chars.length) {
        textSpan.textContent += chars[index];
        index++;
        setTimeout(type, 20);
      } else {
        div.id = '';
      }
    };

    type();
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  }

  clear() {
    this.container.innerHTML = '';
  }

  setAvatarMood(mood) {
    const mouth = document.querySelector('.avatar-mouth');
    if (!mouth) return;

    mouth.className = 'avatar-mouth';
    if (mood === 'smile') mouth.classList.add('smile');
    else if (mood === 'flat') mouth.classList.add('flat');
    else if (mood === 'sad') {
      mouth.style.cssText = 'width:10px;height:5px;border-bottom:none;border-top:2px solid white;border-radius:50% 50% 0 0;';
    }
  }
}
