import { spawn, exec } from "child_process";
import { readFile, unlink, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = join(__dirname, "..", "temp_audio");

async function ensureTempDir() {
  try {
    await mkdir(TEMP_DIR, { recursive: true });
  } catch {}
}

export async function listVoices() {
  return new Promise((resolve, reject) => {
    exec("python -m edge_tts --list-voices", { timeout: 10000 }, (error, stdout) => {
      if (error) return reject(error);

      const voices = stdout
        .split("\n")
        .filter(line => line.trim())
        .slice(1)
        .map(line => {
          const parts = line.split(/\s{2,}/);
          if (parts.length >= 2) {
            return { name: parts[0].trim(), gender: parts[1]?.trim() || "Unknown" };
          }
          return null;
        })
        .filter(v => v);
      resolve(voices);
    });
  });
}

export async function generateAudio(text, voice = "id-ID-GadisNeural") {
  await ensureTempDir();

  const filename = `${randomUUID()}.mp3`;
  const filepath = join(TEMP_DIR, filename);

  return new Promise((resolve, reject) => {
    const proc = spawn("python", [
      "-m", "edge_tts",
      "--text", text,
      "--voice", voice,
      "--write-media", filepath,
    ], { timeout: 30000 });

    let stderr = "";
    proc.stderr.on("data", (data) => { stderr += data.toString(); });

    proc.on("error", (err) => {
      reject(err);
    });

    proc.on("close", async (code) => {
      if (code !== 0) {
        return reject(new Error(`edge_tts exited (${code}): ${stderr.slice(0, 200)}`));
      }

      try {
        const audioBuffer = await readFile(filepath);
        await unlink(filepath).catch(() => {});
        resolve(audioBuffer);
      } catch (readError) {
        reject(readError);
      }
    });
  });
}
