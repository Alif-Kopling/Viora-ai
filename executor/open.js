import { exec } from "child_process";

const APP_MAP = {
  chrome: "chrome",
  notepad: "notepad",
  cmd: "cmd",
  terminal: "cmd",
  powershell: "powershell",
  code: "code",
  spotify: "spotify",
  discord: "discord",
  firefox: "firefox",
  edge: "msedge",
  browser: "chrome",
  calculator: "calc",
  calc: "calc",
  paint: "mspaint",
  word: "winword",
  excel: "excel",
  outlook: "outlook",
  setting: "ms-settings:",
  settings: "ms-settings:",
};

export function openApp(appName) {
  return new Promise((resolve, reject) => {
    const normalized = appName.toLowerCase().trim();
    const mapped = APP_MAP[normalized] || normalized;

    exec(`start ${mapped}`, (error) => {
      if (error) {
        console.error(`Failed to open ${mapped}:`, error.message);
        reject(error);
      } else {
        console.log(`Opened: ${mapped}`);
        resolve(true);
      }
    });
  });
}
