# Plumb

Plumb is a desktop-style prototype for an agentic GRC (governance, risk, compliance) platform. A plumb line is how builders check that something is true; Plumb does that for a compliance program. It covers two workflows in one app:

- **Compliance**: an overview of framework health, a controls library, per-framework drill-downs, and agent runs that collect evidence and test controls.
- **Third-party risk**: a vendor list and a per-vendor assessment workspace (Twilio) focused on the evidence collection step, where evidence is grouped by collection stage and long vendor threads are compressed into a layered drawer.

Built with React 18, TypeScript and Vite. The compliance views use inline styles driven by CSS-variable tokens; the vendor workspace uses Tailwind and Radix (shadcn/ui), pointed at the same palette.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5181`. Press `⌘K` (or `Ctrl+K`) anywhere to search.

## Layout

| Path | Role |
|---|---|
| `src/main.tsx` | Mounts the app. |
| `src/dashboard/ComplianceDashboard.tsx` | App shell (window, title bar, grouped sidebar), view routing, overview, controls, frameworks. |
| `src/dashboard/DashboardLib.tsx` | Design tokens, global styles (glass, backdrop, motion), icons, and shared primitives (buttons, `Accordion`, `Modal`, `DropdownMenu`). |
| `src/dashboard/DashboardData.tsx` | Seed data: frameworks, controls, agent activity and scripts. |
| `src/dashboard/AppViews.tsx` | Evidence, Policies, Risk register and Agents pages, the shortcut sheet and the signed-out screen. |
| `src/dashboard/CommandPalette.tsx` | `⌘K` search across actions, pages, frameworks, controls and vendors. |
| `src/dashboard/*Modal.tsx`, `ControlDetailPanel.tsx`, `AgentChat.tsx` | Layered panels opened from the shell. |
| `src/vendors/VendorsView.tsx` | Vendor list; opens the vendor workspace. |
| `src/vendors/evidence/` | Evidence collection workspace and its data. |
| `src/components/ui/` | shadcn/ui primitives used by the vendor workspace. |
| `src/lib/celebrate.ts` | Success feedback for primary actions (`celebrate()`, `useWinOnFinish`). |
| `src/index.css` | Tailwind entry, vendor-workspace tokens, scoped reset, win animations. |

## Design system

- **Themes.** Dark (neutral graphite glass) is the default; light is frosted paper. Both sit over the same desert wallpaper. Both use a warm orange accent for interaction and a single filled CTA per view (white in dark, orange in light); warnings are yellow so they never read as the accent. Toggle from the title bar or the `⌘K` palette.
- **Tokens.** `C` in `DashboardLib.tsx` maps roles to CSS variables generated from `THEME`. Use roles (`primary`, `accentLine`, `surfaceSunken`, `scrim`...) rather than raw colors. Orange marks interaction and focus only; selection fills and borders (`accentBg`, `accentLine`) are neutral, and status always uses success / warning / danger. Status pills appear by exception, when something needs attention.
- **Glass.** The app is a frosted window over a desktop wallpaper, and only the window blurs: a backdrop-filter nested inside it can't see the wallpaper and paints a dark slab instead. Panels (`C.surface`) are a light tint over the window's frost. Raised layers (`C.surfaceHi`: menus, modals, drawers, the palette) are solid so nothing reads through them.
- **Type.** Newsreader for page titles, Inter for UI, JetBrains Mono for control IDs only. Labels are sentence case.
- **Hierarchy.** Screens read in order of operations: metrics, then what needs attention, then reference material. Secondary detail goes in an `Accordion` with a one-line summary.
- **Wins.** Primary actions that complete something call `celebrate()` on success. Reduced-motion preferences are respected.

## Conventions

- No em dashes in UI copy or comments. Use a middle dot (`·`) as a separator.
- Icons are Tabler stroke glyphs (24×24). Add new ones to the `I` map in `DashboardLib.tsx`.
- No toasts. Every action shows its result where it happened (a row appears, a status changes, a button reads "Copied"). Background agent work surfaces in the Agent activity feed and the notification bell.
- Changes persist. Control status, added controls, policy approvals, risk scores, evidence refresh requests, paused agents, theme and workspace are kept in `localStorage`, so a reload picks up where you left off.
- No placeholder controls. If a button can't do its job in the prototype, it isn't there. Export writes a real CSV or JSON file from the controls in scope.

## Credits

Desktop wallpaper: [Rolling sand dunes in desert landscape](https://unsplash.com/photos/rolling-sand-dunes-in-desert-landscape-pVr6wvUneMk) by Wolfgang Hasselmann, used under the [Unsplash License](https://unsplash.com/license).
