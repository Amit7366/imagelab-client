const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as { message?: string; data?: T };

  if (!response.ok) {
    throw new ApiError(response.status, payload.message ?? "Request failed");
  }

  return payload as T;
}

export function uploadWithProgress<T>(
  path: string,
  body: FormData,
  token: string,
  onProgress: (loaded: number, total: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      onProgress(event.loaded, event.lengthComputable ? event.total : event.loaded);
    };
    xhr.onload = () => {
      const payload = (xhr.response ?? {}) as { message?: string; data?: T };
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as T);
        return;
      }
      reject(new ApiError(xhr.status, payload.message ?? "Upload failed"));
    };
    xhr.onerror = () => reject(new ApiError(0, "Upload failed"));
    xhr.send(body);
  });
}
