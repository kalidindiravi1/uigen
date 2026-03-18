# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users chat with Claude (Haiku model) to generate React components, which are displayed in a live preview alongside a Monaco code editor.

## Commands

```bash
# Initial setup (install deps + Prisma client generation + DB migration)
npm run setup

# Development server (Turbopack, http://localhost:3000)
npm run dev

# Run tests
npm run test

# Lint
npm run lint

# Reset database
npm run db:reset

# Production build & start
npm run build && npm run start
```

**Run a single test file:**
```bash
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx
```

## Architecture

### Virtual File System
The core abstraction is an in-memory file system (`src/lib/file-system.ts`). No generated files are written to disk — all code exists in browser memory, serialized to JSON for database persistence. Both the Monaco editor and AI tools read/write through this abstraction.

### AI Chat Pipeline
`src/app/api/chat/route.ts` is the streaming chat endpoint. It uses Vercel AI SDK with two AI tools:
- `str_replace_editor` (`src/lib/tools/str-replace.ts`) — create/edit files via string replacement
- `file_manager` (`src/lib/tools/file-manager.ts`) — file/directory CRUD operations

The provider (`src/lib/provider.ts`) supports either a real Anthropic API (claude-haiku-4-5) or a mock fallback when `ANTHROPIC_API_KEY` is not set. The system prompt lives in `src/lib/prompts/generation.tsx`.

### State Management
- `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`) — manages virtual FS state
- `ChatProvider` (`src/lib/contexts/chat-context.tsx`) — manages chat messages and triggers project persistence after each AI response

### Authentication
JWT-based sessions via HTTP-only cookies (`src/lib/auth.ts`). Anonymous users are supported — they can use the app but cannot save projects. `src/middleware.ts` handles route protection.

### Database
Prisma with SQLite (`prisma/dev.db`). Two models: `User` (email/password) and `Project` (stores serialized virtual FS + chat history as JSON). Prisma client is generated to `src/generated/prisma`.

### Key Directories
- `src/app/` — Next.js App Router pages and API routes
- `src/components/chat/` — Chat UI (ChatInterface, MessageList, MessageInput)
- `src/components/editor/` — Monaco editor and file tree
- `src/components/preview/` — Live component preview renderer
- `src/actions/` — Next.js Server Actions for project CRUD
- `src/lib/tools/` — AI tool implementations

## Code Style

Use comments sparingly. Only comment complex code.

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY` for real AI responses; omit it to use the mock provider (returns static component templates).

Node 25+ compatibility is handled by `node-compat.cjs` (Web Storage polyfill), automatically applied via `NODE_OPTIONS` in all npm scripts.
