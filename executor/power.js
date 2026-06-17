import { exec } from "child_process";

export function shutdown(delay = 30) {
  return new Promise((resolve, reject) => {
    exec(`shutdown /s /t ${delay} /c "VIORA: shutdown by user request"`, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

export function restart(delay = 30) {
  return new Promise((resolve, reject) => {
    exec(`shutdown /r /t ${delay} /c "VIORA: restart by user request"`, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

export function cancelShutdown() {
  return new Promise((resolve, reject) => {
    exec(`shutdown /a`, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}
