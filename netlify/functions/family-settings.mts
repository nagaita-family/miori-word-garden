import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";

const defaults = {
  word: true,
  kanji: true,
  spell: true,
  letter: true,
};

const allowedOrigins = new Set([
  "https://family.nagaita.jp",
  "http://family.nagaita.jp",
]);

function response(body: unknown, status: number, origin: string | null) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  });
  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export default async (req: Request, _context: Context) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    const headers = new Headers({
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    });
    if (origin && allowedOrigins.has(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
    }
    return new Response(null, { status: 204, headers });
  }

  if (origin && !allowedOrigins.has(origin)) {
    return response({ error: "Origin not allowed" }, 403, origin);
  }

  const store = getStore("nagaita-family-settings", { consistency: "strong" });

  if (req.method === "GET") {
    const saved = await store.get("visible-games", { type: "json" });
    return response({ ...defaults, ...(saved ?? {}) }, 200, origin);
  }

  if (req.method === "POST") {
    let incoming: Record<string, unknown>;
    try {
      incoming = await req.json();
    } catch {
      return response({ error: "Invalid JSON" }, 400, origin);
    }

    const next = { ...defaults };
    for (const key of Object.keys(defaults) as Array<keyof typeof defaults>) {
      if (typeof incoming[key] === "boolean") next[key] = incoming[key] as boolean;
    }

    await store.setJSON("visible-games", next);
    return response(next, 200, origin);
  }

  return response({ error: "Method not allowed" }, 405, origin);
};

export const config: Config = {
  path: "/api/family-settings",
};
