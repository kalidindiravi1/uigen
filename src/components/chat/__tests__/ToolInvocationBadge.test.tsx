import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeCall(toolName: string, args: Record<string, unknown>): ToolInvocation {
  return { state: "call", toolCallId: "test-id", toolName, args };
}

function makeResult(toolName: string, args: Record<string, unknown>): ToolInvocation {
  return { state: "result", toolCallId: "test-id", toolName, args, result: "Success" };
}

// str_replace_editor commands
test("shows 'Creating' label for str_replace_editor create command", () => {
  render(<ToolInvocationBadge toolInvocation={makeResult("str_replace_editor", { command: "create", path: "src/App.jsx" })} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Editing' label for str_replace_editor str_replace command", () => {
  render(<ToolInvocationBadge toolInvocation={makeResult("str_replace_editor", { command: "str_replace", path: "src/components/Card.jsx" })} />);
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("shows 'Editing' label for str_replace_editor insert command", () => {
  render(<ToolInvocationBadge toolInvocation={makeResult("str_replace_editor", { command: "insert", path: "src/utils.js" })} />);
  expect(screen.getByText("Editing utils.js")).toBeDefined();
});

test("shows 'Viewing' label for str_replace_editor view command", () => {
  render(<ToolInvocationBadge toolInvocation={makeResult("str_replace_editor", { command: "view", path: "src/index.js" })} />);
  expect(screen.getByText("Viewing index.js")).toBeDefined();
});

test("shows 'Undoing edit' label for str_replace_editor undo_edit command", () => {
  render(<ToolInvocationBadge toolInvocation={makeResult("str_replace_editor", { command: "undo_edit", path: "src/App.jsx" })} />);
  expect(screen.getByText("Undoing edit in App.jsx")).toBeDefined();
});

// file_manager commands
test("shows 'Renaming' label for file_manager rename command", () => {
  render(<ToolInvocationBadge toolInvocation={makeResult("file_manager", { command: "rename", path: "src/old.jsx", new_path: "src/new.jsx" })} />);
  expect(screen.getByText("Renaming old.jsx")).toBeDefined();
});

test("shows 'Deleting' label for file_manager delete command", () => {
  render(<ToolInvocationBadge toolInvocation={makeResult("file_manager", { command: "delete", path: "src/temp.js" })} />);
  expect(screen.getByText("Deleting temp.js")).toBeDefined();
});

// Fallback
test("falls back to tool name for unknown tools", () => {
  render(<ToolInvocationBadge toolInvocation={makeResult("some_other_tool", {})} />);
  expect(screen.getByText("some_other_tool")).toBeDefined();
});

// State: loading vs done
test("shows green dot when state is result", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeResult("str_replace_editor", { command: "create", path: "App.jsx" })} />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is call (pending)", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeCall("str_replace_editor", { command: "create", path: "App.jsx" })} />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

// Nested paths: only filename shown
test("shows only the filename, not the full path", () => {
  render(<ToolInvocationBadge toolInvocation={makeResult("str_replace_editor", { command: "create", path: "src/components/ui/Button.tsx" })} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});
