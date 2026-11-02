import { describe, expect, it } from "vitest";

import {
  MIN_PASSWORD_LENGTH,
  createSessionSecret,
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from "@/lib/admin-auth";

describe("admin-auth", () => {
  it("hashes the password and never keeps it in plain text", async () => {
    const stored = await hashPassword("super-secret-123");

    expect(stored).not.toContain("super-secret-123");
    expect(stored.startsWith("pbkdf2$")).toBe(true);
    expect(await verifyPassword("super-secret-123", stored)).toBe(true);
    expect(await verifyPassword("wrong-password", stored)).toBe(false);
  });

  it("uses a fresh salt per hash", async () => {
    const first = await hashPassword("same-password-here");
    const second = await hashPassword("same-password-here");

    expect(first).not.toBe(second);
    expect(await verifyPassword("same-password-here", first)).toBe(true);
    expect(await verifyPassword("same-password-here", second)).toBe(true);
  });

  it("rejects malformed stored hashes instead of throwing", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(await verifyPassword("anything", "pbkdf2$5$bad$bad")).toBe(false);
    expect(await verifyPassword("anything", "pbkdf2$120000$!!!$!!!")).toBe(false);
  });

  it("signs session tokens with the stored secret and honours expiry", async () => {
    const secret = createSessionSecret();
    const token = await createSessionToken(secret);

    expect(await verifySessionToken(secret, token)).toBe(true);
    expect(await verifySessionToken(createSessionSecret(), token)).toBe(false);
    expect(await verifySessionToken(secret, "garbage")).toBe(false);
    expect(await verifySessionToken(secret, null)).toBe(false);

    const expired = await createSessionToken(secret, Date.now() - 9 * 60 * 60 * 1000);
    expect(await verifySessionToken(secret, expired)).toBe(false);
  });

  it("requires at least 8 characters for the admin password", () => {
    expect(MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(8);
  });
});
