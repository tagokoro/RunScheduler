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

  return fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.cookieHeader ? { Cookie: options.cookieHeader } : {}),
      ...options.headers,
    },
    body: options.body,
    cache: options.cache ?? "no-store",
    credentials: options.credentials,
  });
}
