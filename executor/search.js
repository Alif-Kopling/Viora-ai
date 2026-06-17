import { exec } from "child_process";

export function searchGoogle(query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query);
    exec(`start https://google.com/search?q=${encoded}`, (error) => {
      if (error) {
        console.error("Search failed:", error.message);
        reject(error);
      } else {
        console.log(`Searched: ${query}`);
        resolve(true);
      }
    });
  });
}
