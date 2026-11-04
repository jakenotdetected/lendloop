const encoder = new TextEncoder();

export const SIGNATURE_HEADER = "x-lendloop-signature";
export const SIGNATURE_TOLERANCE_SECONDS = 300;

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signBody(secret: string, body: string, timestamp = Math.floor(Date.now() / 1000)) {
  return `t=${timestamp},v1=${await hmacHex(secret, `${timestamp}.${body}`)}`;
}

export async function verifyBody(
  secret: string,
  header: string | null,
  body: string,
  now = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const index = part.indexOf("=");
      return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
    }),
  );
  const timestamp = Number(parts.t);
  if (!Number.isInteger(timestamp) || !parts.v1) return false;
  if (Math.abs(now - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;
  return constantTimeEqual(parts.v1, await hmacHex(secret, `${timestamp}.${body}`));
}
