import { test, expect, vi, beforeEach } from "vitest";

const { mockCookieStore, mockJwtVerify } = vi.hoisted(() => ({
  mockCookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
  mockJwtVerify: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn(() => mockCookieStore) }));
vi.mock("jose", () => ({ jwtVerify: mockJwtVerify, SignJWT: vi.fn() }));

import { getSession } from "@/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

test("getSession returns null when no cookie is present", async () => {
  mockCookieStore.get.mockReturnValue(undefined);
  expect(await getSession()).toBeNull();
});

test("getSession returns null when jwtVerify throws (invalid token)", async () => {
  mockCookieStore.get.mockReturnValue({ value: "bad-token" });
  mockJwtVerify.mockRejectedValue(new Error("invalid signature"));
  expect(await getSession()).toBeNull();
});

test("getSession returns null when jwtVerify throws (expired token)", async () => {
  mockCookieStore.get.mockReturnValue({ value: "expired-token" });
  mockJwtVerify.mockRejectedValue(new Error("JWT expired"));
  expect(await getSession()).toBeNull();
});

test("getSession returns userId and email from a valid token", async () => {
  mockCookieStore.get.mockReturnValue({ value: "valid-token" });
  mockJwtVerify.mockResolvedValue({
    payload: { userId: "user-1", email: "user@example.com" },
  });

  const session = await getSession();

  expect(session?.userId).toBe("user-1");
  expect(session?.email).toBe("user@example.com");
});
