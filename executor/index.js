import { openApp } from "./open.js";
import { searchGoogle } from "./search.js";
import { setTimer } from "./timer.js";
import { shutdown, restart, cancelShutdown } from "./power.js";

export async function executeAction(action, value) {
  switch (action) {
    case "open_app":
      await openApp(value);
      return { executed: true, result: `membuka ${value}` };

    case "search":
      await searchGoogle(value);
      return { executed: true, result: `mencari ${value} di Google` };

    case "timer":
      await setTimer(value);
      return { executed: true, result: `timer ${value} detik dimulai` };

    case "shutdown":
      await shutdown(parseInt(value) || 30);
      return { executed: true, result: `shutdown dalam ${value || 30} detik` };

    case "restart":
      await restart(parseInt(value) || 30);
      return { executed: true, result: `restart dalam ${value || 30} detik` };

    case "cancel_shutdown":
      await cancelShutdown();
      return { executed: true, result: "shutdown/restart dibatalkan" };

    case "none":
      return { executed: false, result: "no action needed" };

    default:
      console.warn(`Unknown action: ${action}`);
      return { executed: false, result: `unknown action: ${action}` };
  }
}
