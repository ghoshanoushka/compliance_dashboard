# Zania AI · Compliance Dashboard

A Framer-hosted React dashboard prototype for an agentic GRC platform. Built as a series of Framer Code Components that import each other via Framer's `https://framer.com/m/...` URL scheme, with a local Vite sandbox for fast iteration outside the Framer canvas.

## What's in here

| File | Role |
|---|---|
| `ComplianceDashboard.tsx` | Entry component. Top-level state, routing between tabs, modal hosts. |
| `DashboardLib_1.tsx` | Shared primitives · color tokens, fonts, Tabler icon set, `relTime`, theme styles. |
| `DashboardData.tsx` | Static seed data · controls, frameworks, evidence, activities, agents. |
| `AddControlModal.tsx` | "Add control" modal flow. |
| `ExportModal.tsx` | CSV export modal with format/scope options. |
| `SettingsModal.tsx` | User settings · notifications, theme toggle, risk model. |
| `TrustCenterModal.tsx` | Public trust-page configuration modal. |
| `ControlDetailPanel.tsx` | Right-slide detail panel for an individual control row. |
| `AgentChat.tsx` | Conversational sub-view inside the agent run panel. |
| `Icon.tsx` | Legacy icon sheet (Tabler set lives in `DashboardLib_1.tsx`). |

## Local preview

```bash
cd .preview
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5181`).

The preview works by URL rewriting · `.preview/vite.config.ts` has a plugin that text-replaces every `https://framer.com/m/...` import in the source with the matching local file path before Vite parses it, so the same code that ships to Framer runs unmodified in the sandbox.

## Adding a new code component

1. Create the new `Foo.tsx` next to the others.
2. In `.preview/vite.config.ts`, add an entry to `FRAMER_URL_MAP`:
   ```ts
   "https://framer.com/m/Foo-PLACEHOLDER.js":
       path.resolve(__dirname, "../Foo.tsx"),
   ```
3. Import from the URL in any consumer:
   ```ts
   import { Foo } from "https://framer.com/m/Foo-PLACEHOLDER.js"
   ```
4. When you push to Framer, replace the PLACEHOLDER URL with the real Framer module URL.

## Conventions

- No em-dashes anywhere. Use a middle dot (`·`) or hyphen as a separator.
- All icons are Tabler stroke icons (24×24, `strokeWidth={2}`). Add new ones to the `PATHS` map inside `DashboardLib_1.tsx`.
- Theme tokens are CSS variables (`var(--c-text)` etc.) emitted by `GlobalStyles` based on the `.theme-dark` / `.theme-light` class on the root.
- Toasts and live activity are mocked in `ComplianceDashboard.tsx`. The bell icon in the header mutes background live-update toasts without muting user-action toasts.
