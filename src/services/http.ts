import { appConfig } from "@/config/app";
import { decryptText, encryptText, hashPath, makeSalt } from "@/services/crypto";

type HttpMethod = "GET" | "POST";

interface RequestOptions {
  method?: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean;
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

function withQuery(path: string, query?: RequestOptions["query"]) {
  if (!query) return path;
  const search = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) search.set(key, String(value));
  });

  const suffix = search.toString();
  return suffix ? `${path}?${suffix}` : path;
}

function getErrorMessage(payload: unknown, fallback = "请求失败"): string {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload || fallback;
  if (typeof payload !== "object") return fallback;

  const record = payload as Record<string, unknown>;
  const message = record.message ?? record.error ?? record.msg;
  if (typeof message === "string" && message.trim()) return message;

  const data = record.data;
  if (data && typeof data === "object") {
    const nested: string = getErrorMessage(data, "");
    if (nested) return nested;
  }

  return fallback;
}

async function requestViaProxy<T>({ method = "GET", path, body, query, auth = true }: RequestOptions) {
  const password = appConfig.encryptPassword;

  if (!password) {
    throw new Error("已启用加密代理，但缺少 VITE_SECURITY_PASSWORD 配置。");
  }

  const salt = makeSalt();
  const proxyPath = await hashPath(`${appConfig.securityPathPrefix}${path}`, password);
  const headers = new Headers({
    "x-salt": salt.base64,
    "x-encrypt-response": appConfig.encryptResponse ? "1" : "0",
  });

  if (auth) {
    const authData = localStorage.getItem("auth_data");
    if (authData) headers.set("Authorization", authData);
  }

  const url = new URL(proxyPath, appConfig.securityBaseUrl);
  let payload: string | undefined;

  if (method === "GET" && query && Object.keys(query).length) {
    url.searchParams.set("q", await encryptText(JSON.stringify(query), password, salt.bytes));
  }

  if (method !== "GET" && body) {
    headers.set("Content-Type", "text/plain");
    headers.set("x-origin-content-type", "application/json");
    payload = await encryptText(JSON.stringify(body), password, salt.bytes);
  }

  const response = await fetch(url, { method, headers, body: payload });
  const text = await response.text();
  const responseSalt = response.headers.get("x-salt") ?? salt.base64;

  let decrypted = text;
  if (response.headers.get("x-encrypt-response") === "1" && text) {
    try {
      decrypted = await decryptText(text, password, responseSalt);
    } catch {
      decrypted = text;
    }
  }

  let parsed: unknown = {};
  try {
    parsed = decrypted ? JSON.parse(decrypted) : {};
  } catch {
    parsed = decrypted;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(parsed, decrypted || "请求失败"));
  }

  return unwrap<T>(parsed);
}

async function requestPlain<T>({ method = "GET", path, body, query, auth = true }: RequestOptions) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (auth) {
    const authData = localStorage.getItem("auth_data");
    if (authData) headers.set("Authorization", authData);
  }

  const response = await fetch(withQuery(`${appConfig.apiBaseUrl}${path}`, query), {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(getErrorMessage(payload));
  return unwrap<T>(payload);
}

export async function http<T>(options: RequestOptions) {
  return appConfig.securityEnabled
    ? requestViaProxy<T>(options)
    : requestPlain<T>(options);
}
