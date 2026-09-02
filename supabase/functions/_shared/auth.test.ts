import { describe, expect, it } from "vitest";
import { isServiceRoleRequest } from "./auth";

describe("isServiceRoleRequest", () => {
  it("accepts only the configured service-role bearer token", () => {
    const serviceRoleKey = "service-secret";

    expect(isServiceRoleRequest(new Request("https://example.test", {
      headers: { authorization: `Bearer ${serviceRoleKey}` },
    }), serviceRoleKey)).toBe(true);

    expect(isServiceRoleRequest(new Request("https://example.test", {
      headers: { authorization: "Bearer public-anon-key" },
    }), serviceRoleKey)).toBe(false);
  });

  it("fails closed when the service-role key is missing", () => {
    expect(isServiceRoleRequest(new Request("https://example.test"), undefined)).toBe(false);
  });
});
