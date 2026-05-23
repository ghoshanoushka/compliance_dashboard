# Zania AI · Compliance Dashboard

A React + TypeScript dashboard prototype for an agentic GRC platform. Multiple modular components are composed into a single dashboard, with a local Vite sandbox for fast iteration.

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

## Local preview

```bash
cd .preview
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5181`).

The `.preview` directory is a thin Vite + React harness that mounts `ComplianceDashboard` full-screen. The source `.tsx` files live in the project root and are imported directly via relative paths.

## Adding a new component

1. Create `Foo.tsx` next to the others in the project root.
2. Import it from any consumer using a relative path:
   ```ts
   import { Foo } from "./Foo"
   ```
3. No build config changes required.

## Conventions

- No em-dashes anywhere. Use a middle dot (`·`) or hyphen as a separator.
- All icons are Tabler stroke icons (24×24, `strokeWidth={2}`). Add new ones to the `PATHS` map inside `DashboardLib_1.tsx`.
- Theme tokens are CSS variables (`var(--c-text)` etc.) emitted by `GlobalStyles` based on the `.theme-dark` / `.theme-light` class on the root.
- Toasts and live activity are mocked in `ComplianceDashboard.tsx`. The bell icon in the header mutes background live-update toasts without muting user-action toasts.
