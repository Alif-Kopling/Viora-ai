const activeTimers = new Map();
let timerIdCounter = 0;
let sseClients = [];

export function addSSEClient(res) {
  sseClients.push(res);
  res.on("close", () => {
    sseClients = sseClients.filter(c => c !== res);
  });
}

export function broadcastSSE(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(message);
  }
}

export function setTimer(seconds, label = "Timer") {
  return new Promise((resolve) => {
    const id = ++timerIdCounter;
    const ms = parseInt(seconds) * 1000;

    const timeout = setTimeout(() => {
      activeTimers.delete(id);
      broadcastSSE("timer_done", { id, label, seconds });
      resolve(true);
    }, ms);

    activeTimers.set(id, { timeout, label, seconds, remaining: ms });

    console.log(`Timer ${id} set for ${seconds}s`);
    resolve(id);
  });
}

export function listTimers() {
  return Array.from(activeTimers.entries()).map(([id, t]) => ({
    id,
    label: t.label,
    seconds: t.seconds
  }));
}
