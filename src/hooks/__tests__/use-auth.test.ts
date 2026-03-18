import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const anonWork = {
  messages: [{ role: "user", content: "hello" }],
  fileSystemData: { "/": { type: "directory" } },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAnonWorkData).mockReturnValue(null);
  vi.mocked(getProjects).mockResolvedValue([]);
  vi.mocked(createProject).mockResolvedValue({ id: "new-project-123" } as any);
});

describe("useAuth", () => {
  describe("initial state", () => {
    test("isLoading starts as false", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("exposes signIn, signUp and isLoading", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("signIn", () => {
    test("calls the signIn server action with credentials", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true } as any);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(signInAction).toHaveBeenCalledWith("user@example.com", "password123");
    });

    test("returns the result from the server action", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true } as any);
      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "password");
      });

      expect(returnValue).toEqual({ success: true });
    });

    test("returns failure result without redirecting", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: false, error: "Invalid credentials" } as any);
      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "wrongpass");
      });

      expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("sets isLoading to true during sign-in and false after", async () => {
      let resolveSignIn!: (v: any) => void;
      vi.mocked(signInAction).mockReturnValue(
        new Promise((res) => { resolveSignIn = res; }) as any
      );

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signIn("user@example.com", "password");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn({ success: false });
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("resets isLoading to false even when the action throws", async () => {
      vi.mocked(signInAction).mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn("user@example.com", "password");
        } catch {
          // expected
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("calls the signUp server action with credentials", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: true } as any);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "securepass");
      });

      expect(signUpAction).toHaveBeenCalledWith("new@example.com", "securepass");
    });

    test("returns failure result without redirecting", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: false, error: "Email taken" } as any);
      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("taken@example.com", "pass");
      });

      expect(returnValue).toEqual({ success: false, error: "Email taken" });
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("sets isLoading to true during sign-up and false after", async () => {
      let resolveSignUp!: (v: any) => void;
      vi.mocked(signUpAction).mockReturnValue(
        new Promise((res) => { resolveSignUp = res; }) as any
      );

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signUp("user@example.com", "password");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp({ success: false });
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("resets isLoading to false even when the action throws", async () => {
      vi.mocked(signUpAction).mockRejectedValue(new Error("Server error"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signUp("user@example.com", "password");
        } catch {
          // expected
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("post sign-in redirect: anonymous work", () => {
    test("creates a project from anon work and redirects to it", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true } as any);
      vi.mocked(getAnonWorkData).mockReturnValue(anonWork);
      vi.mocked(createProject).mockResolvedValue({ id: "anon-project-1" } as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-project-1");
      expect(getProjects).not.toHaveBeenCalled();
    });

    test("skips anon work path when messages array is empty", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true } as any);
      vi.mocked(getAnonWorkData).mockReturnValue({ messages: [], fileSystemData: {} });
      vi.mocked(getProjects).mockResolvedValue([{ id: "existing-1" }] as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(createProject).not.toHaveBeenCalled();
      expect(clearAnonWork).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-1");
    });

    test("skips anon work path when getAnonWorkData returns null", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true } as any);
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([{ id: "existing-2" }] as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(createProject).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-2");
    });
  });

  describe("post sign-in redirect: existing projects", () => {
    test("redirects to the most recent project when no anon work exists", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true } as any);
      vi.mocked(getProjects).mockResolvedValue([
        { id: "recent-project" },
        { id: "older-project" },
      ] as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/recent-project");
      expect(createProject).not.toHaveBeenCalled();
    });

    test("uses signUp flow to redirect to the most recent project", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: true } as any);
      vi.mocked(getProjects).mockResolvedValue([{ id: "first-project" }] as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@example.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/first-project");
    });
  });

  describe("post sign-in redirect: no projects", () => {
    test("creates a new project and redirects to it when no projects exist", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true } as any);
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({ id: "brand-new" } as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/brand-new");
    });

    test("creates a new project via signUp when no projects exist", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: true } as any);
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({ id: "signup-new" } as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@example.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/signup-new");
    });
  });
});
