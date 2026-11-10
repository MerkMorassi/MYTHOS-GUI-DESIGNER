type Resolve = (v: SiaResult) => void;

export interface SiaResult { k: "sia"; ok: boolean; receipt: string; token?: string | null }

const PREFIX = "terminal:";
let peer: Window | null = null;
let peerOrigin: string | null = null;
let seq = 0;
const waiting = new Map<string, Resolve>();
let onReceipt: ((line: string) => void) | null = null;

function sendRaw(msg: unknown): boolean {
  if (!peer || peer.closed) return false;
  try { peer.postMessage(msg, peerOrigin || "*"); return true; }
  catch { return false; }
}

if (typeof window !== "undefined") {
  window.addEventListener("message", (e: MessageEvent) => {
    const d = e.data as Record<string, unknown> | null;
    if (!d || typeof d !== "object" || d["k"] !== "sia") return;
    if (peer && e.source !== peer) return;
    if (d["ready"] === 1) {
      if (d["receipts"] !== false && typeof d["surface"] !== "undefined")
        try { onReceipt && onReceipt("READY :: " + String(d["surface"])); } catch {}
      waiting.forEach((r) => { try { r({ k: "sia", ok: true, receipt: "READY" }); } catch {} });
      waiting.clear();
      return;
    }
    const token = d["token"] as string | null | undefined;
    if (token != null && waiting.has(token)) {
      const r = waiting.get(token)!;
      waiting.delete(token);
      try { r({ k: "sia", ok: !!d["ok"], receipt: String(d["receipt"] ?? ""), token }); } catch {}
      return;
    }
    if (d["receipt"] != null && onReceipt) {
      try { onReceipt(String(d["receipt"])); } catch {}
    }
  });
}

export function bindingOf(spec: unknown): string | null {
  const s = String(spec ?? "").trim();
  if (s.toLowerCase().indexOf(PREFIX) !== 0) return null;
  return s.slice(PREFIX.length).trim() || null;
}

export const SiaTerminal = {
  connect(url: string, name?: string): boolean {
    let w: Window | null = null;
    try { w = window.open(url, name || "sia_terminal"); } catch { w = null; }
    if (!w) return false;
    peer = w;
    try { peerOrigin = new URL(url).origin; } catch { peerOrigin = "*"; }
    sendRaw({ k: "sia", hello: 1 });
    return true;
  },
  attach(win: Window, origin: string): boolean {
    peer = win;
    peerOrigin = origin || "*";
    sendRaw({ k: "sia", hello: 1 });
    return true;
  },
  linked(): boolean { return !!peer && !peer.closed; },
  run(cmd: string): Promise<SiaResult> {
    return new Promise((resolve) => {
      if (!this.linked()) { resolve({ k: "sia", ok: false, receipt: "NOT LINKED" }); return; }
      const token = "t" + (++seq) + "-" + Date.now().toString(36);
      waiting.set(token, resolve);
      if (!sendRaw({ k: "sia", terminal: String(cmd), token })) {
        waiting.delete(token);
        resolve({ k: "sia", ok: false, receipt: "SEND FAILED" });
      }
      setTimeout(() => {
        if (waiting.has(token)) {
          waiting.delete(token);
          resolve({ k: "sia", ok: false, receipt: "NO ANSWER" });
        }
      }, 8000);
    });
  },
  receipts(fn: ((line: string) => void) | null) { onReceipt = fn; },
  fire(spec: unknown): Promise<SiaResult> {
    const cmd = bindingOf(spec);
    if (!cmd) return Promise.resolve({ k: "sia", ok: false, receipt: "UNBOUND" });
    return this.run(cmd);
  },
};

export default SiaTerminal;
