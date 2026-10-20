type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  headers?: HeadersInit;
  body?: BodyInit;
  cache?: RequestCache;
  cookieHeader?: string;
  credentials?: RequestCredentials;
};

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const headers = new Headers(options.headers);
  if (options.cookieHeader) headers.set("Cookie", options.cookieHeader);
  if (options.method && options.method !== "GET") {
    headers.set("X-CSRF-Token", await getCsrfToken());
  }

  return fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
    cache: options.cache ?? "no-store",
    credentials: options.credentials,
  });
}

export async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/csrf`, {
    credentials: "include",
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
