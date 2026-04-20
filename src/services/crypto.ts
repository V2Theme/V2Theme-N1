const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getWebCrypto() {
  const webCrypto = globalThis.crypto;
  if (!webCrypto?.subtle) {
    throw new Error("当前环境不支持 Web Crypto，请通过 HTTPS 或 localhost 访问。");
  }
  return webCrypto;
}

async function deriveKey(password: string) {
  const webCrypto = getWebCrypto();
  const passwordBytes = encoder.encode(password);
  const imported = await webCrypto.subtle.importKey("raw", passwordBytes, "PBKDF2", false, ["deriveKey"]);

  return webCrypto.subtle.deriveKey(
    { name: "PBKDF2", salt: passwordBytes, iterations: 10000, hash: "SHA-256" },
    imported,
    { name: "AES-GCM", length: 128 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function hashPath(pathname: string, password: string) {
  const webCrypto = getWebCrypto();
  const hash = await webCrypto.subtle.digest("SHA-1", encoder.encode(`${pathname}#${password}`));
  return `/${[...new Uint8Array(hash)].map((item) => item.toString(16).padStart(2, "0")).join("")}`;
}

export function makeSalt() {
  const webCrypto = getWebCrypto();
  const salt = webCrypto.getRandomValues(new Uint8Array(12));
  return {
    bytes: salt,
    base64: btoa(String.fromCharCode(...salt)),
  };
}

export async function encryptText(text: string, password: string, salt: Uint8Array) {
  const webCrypto = getWebCrypto();
  const key = await deriveKey(password);
  const iv = new Uint8Array(salt);
  const encrypted = await webCrypto.subtle.encrypt(
    { name: "AES-GCM", length: 128, iv },
    key,
    encoder.encode(text),
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function decryptText(payload: string, password: string, saltBase64: string) {
  const webCrypto = getWebCrypto();
  const key = await deriveKey(password);
  const salt = Uint8Array.from(atob(saltBase64), (char) => char.charCodeAt(0));
  const encrypted = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
  const iv = new Uint8Array(salt);
  const decrypted = await webCrypto.subtle.decrypt(
    { name: "AES-GCM", length: 128, iv },
    key,
    encrypted,
  );

  return decoder.decode(decrypted);
}
