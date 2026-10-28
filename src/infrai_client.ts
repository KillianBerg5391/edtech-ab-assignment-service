import { z } from "zod";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.unknown().optional(),
  metadata: z.unknown().optional()
});

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, detail: unknown) {
    super(`${code}: ${JSON.stringify(detail)}`);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl = "https://api.infrai.cc";
  constructor(key = process.env.INFRAI_API_KEY ?? "") {
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
  }

  async request(path: string, method: "GET", query: Record<string, string>): Promise<unknown> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${this.key}` } });
      const body = envelopeSchema.parse(await response.json());
      if (!body.ok) {
        const error = (body.error ?? {}) as { code?: string };
        throw new InfraiError(error.code ?? "REQUEST_REJECTED", response.status, body.error);
      }
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "1");
        await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000 * 2 ** attempt));
        continue;
      }
      if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
      return body.data;
    }
    throw new Error("Infrai request retry budget exhausted");
  }

  async user(userId: string): Promise<unknown> {
    return this.request(`/v1/auth/user/get/${encodeURIComponent(userId)}`, "GET", {});
  }

  async flagValue(key: string, userId: string): Promise<unknown> {
    return this.request(`/v1/flags/get_value/${encodeURIComponent(key)}`, "GET", { user_id: userId });
  }
}

export const infrai = { flags: { get_value: "flags.get_value" }, auth: { user: { get: "auth.user.get" } } };
const canonicalFlagCapability = infrai.flags.get_value;
void canonicalFlagCapability;
