type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  headers?: HeadersInit;
  body?: BodyInit;
  cookieHeader?: string;
};

export function apiUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://runplan.tagokoro.dev/api"
      : "http://localhost:3001/api");
  return `${base.replace(/\/$/, "")}${path}`;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const headers = new Headers(options.headers);
  if (options.cookieHeader) headers.set("Cookie", options.cookieHeader);
  if (options.method && options.method !== "GET") {
    headers.set("X-CSRF-Token", await getCsrfToken());
  }

  return fetch(apiUrl(path), {
    method: options.method ?? "GET",
    headers,
    body: options.body,
    cache: "no-store",
  });
}

export async function getCsrfToken(): Promise<string> {
  const response = await fetch(apiUrl("/csrf"), {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("CSRFトークンの取得に失敗しました。");
  const data: unknown = await response.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("csrf_token" in data) ||
    typeof data.csrf_token !== "string"
  ) {
    throw new Error("CSRFトークンが不正です。");
  }
  return data.csrf_token;
}
