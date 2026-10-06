import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("api client", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it("sends JSON and auth headers", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, data: { ok: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    globalThis.fetch = fetchMock as typeof fetch;
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test/api/v1");

    const { api } = await import("./api");
    const result = await api<{ success: boolean; data: { ok: boolean } }>(
      "/health",
      { method: "POST", body: JSON.stringify({ ping: 1 }) },
      "token-123",
    );

    expect(result.data.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://api.test/api/v1/health");
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-123");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("throws ApiError on failure", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ message: "Credits finished" }), { status: 402 }),
    ) as typeof fetch;
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test/api/v1");

    const { api, ApiError } = await import("./api");
    await expect(api("/assets")).rejects.toMatchObject({
      status: 402,
      message: "Credits finished",
    });
    await expect(api("/assets")).rejects.toBeInstanceOf(ApiError);
  });
});
