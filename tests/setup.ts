import { afterEach, beforeAll, vi } from "vitest";
import nextConfig from "../next.config.mjs";

process.env.ADMIN_EMAILS = "admin@example.com";

beforeAll(() => {
  vi.stubGlobal("nextConfig", nextConfig);
});

afterEach(() => {
  vi.clearAllMocks();
});

