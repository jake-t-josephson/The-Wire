import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInAnonymously: vi.fn(),
}));

vi.mock("./supabase", () => ({ supabase: { auth } }));

import { getViewerId } from "./viewerSession";

describe("getViewerId", () => {
  beforeEach(() => {
    auth.getSession.mockReset();
    auth.signInAnonymously.mockReset();
  });

  it("reuses an existing authenticated viewer", async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "existing-viewer" } } },
      error: null,
    });

    await expect(getViewerId()).resolves.toBe("existing-viewer");
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it("creates an anonymous viewer when no session exists", async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    auth.signInAnonymously.mockResolvedValue({
      data: { user: { id: "anonymous-viewer" } },
      error: null,
    });

    await expect(getViewerId()).resolves.toBe("anonymous-viewer");
    expect(auth.signInAnonymously).toHaveBeenCalledOnce();
  });
});
