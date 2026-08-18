
export const API_BASE =
"https://naija-meal-planner-api-staging.ramonmufutau16.workers.dev";

type ApiOptions = RequestInit & {
  token?: string | null;
  timeout?: number;
};

export async function apiFetch<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, headers, timeout = 30000, ...rest } = options;

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  let res: Response;

  try {
    console.log("API request:", url);

    res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    });
  } catch (err: any) {
    clearTimeout(timeoutId);

    console.log("API network error:", {
      url,
      name: err?.name,
      message: err?.message,
    });

    if (err?.name === "AbortError") {
      throw new Error(
        "Request timed out. Please check your internet connection and try again."
      );
    }

    throw new Error(
      `Network request failed for ${url}. ${err?.message || ""}`
    );
  }

  clearTimeout(timeoutId);

  const text = await res.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    console.log("Invalid server response:", {
      url,
      status: res.status,
      text,
    });

    throw new Error("Server returned an invalid response. Please try again.");
  }

  if (!res.ok) {
    console.log("API error response:", {
      url,
      status: res.status,
      data,
    });

    throw new Error(
      data?.error ||
        data?.message ||
        `Request failed with status ${res.status}`
    );
  }

  return data as T;
}