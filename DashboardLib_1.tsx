import * as React from "react"

// ============ DESIGN TOKENS ============
//
// Tokens resolve at render time via CSS variables defined in GlobalStyles.
// :root + .theme-dark holds the dark palette (default); .theme-light overrides
// it. Inline `style={{ background: C.bg }}` props pick up the cascaded value
// automatically. To compute a color in JS (rare), read from the raw palettes
// `THEME.dark` or `THEME.light` instead of `C`.
export const C = {
    bg: "var(--c-bg)",
    surface: "var(--c-surface)",
    surfaceHi: "var(--c-surface-hi)",
    surfaceHover: "var(--c-surface-hover)",
    border: "var(--c-border)",
    borderHi: "var(--c-border-hi)",
    text: "var(--c-text)",
    textMuted: "var(--c-text-muted)",
    textSubtle: "var(--c-text-subtle)",
    accent: "var(--c-accent)",
    accentSoft: "var(--c-accent-soft)",
    accentBg: "var(--c-accent-bg)",
    success: "var(--c-success)",
    successBg: "var(--c-success-bg)",
    warning: "var(--c-warning)",
    warningBg: "var(--c-warning-bg)",
    danger: "var(--c-danger)",
    dangerBg: "var(--c-danger-bg)",
    // CSS-var-only · used in places that need theme-aware neutrals beyond
    // the standard token set (hover overlays, track fills, ring shadows).
    hoverOverlay: "var(--c-hover-overlay)",
    trackFill: "var(--c-track-fill)",
}

export const THEME = {
    dark: {
        bg: "#0A0A0F",
        surface: "#14141E",
        surfaceHi: "#1A1A26",
        surfaceHover: "#1E1E2A",
        border: "rgba(255,255,255,0.08)",
        borderHi: "rgba(255,255,255,0.14)",
        text: "#FFFFFF",
        textMuted: "rgba(255,255,255,0.68)",
        textSubtle: "rgba(255,255,255,0.42)",
        accent: "#7C5CFF",
        accentSoft: "#A084FF",
        accentBg: "rgba(124,92,255,0.14)",
        success: "#00D084",
        successBg: "rgba(0,208,132,0.14)",
        warning: "#FFB800",
        warningBg: "rgba(255,184,0,0.14)",
        danger: "#FF5C5C",
        dangerBg: "rgba(255,92,92,0.14)",
        hoverOverlay: "rgba(255,255,255,0.06)",
        trackFill: "rgba(255,255,255,0.06)",
    },
    light: {
        bg: "#F6F6F8",
        surface: "#FFFFFF",
        surfaceHi: "#FFFFFF",
        surfaceHover: "#F0F0F4",
        border: "rgba(10,10,15,0.10)",
        borderHi: "rgba(10,10,15,0.18)",
        text: "#0A0A0F",
        textMuted: "rgba(10,10,15,0.68)",
        textSubtle: "rgba(10,10,15,0.46)",
        accent: "#6E45F0",
        accentSoft: "#7C5CFF",
        accentBg: "rgba(110,69,240,0.10)",
        success: "#0A9A66",
        successBg: "rgba(10,154,102,0.12)",
        warning: "#B27200",
        warningBg: "rgba(178,114,0,0.12)",
        danger: "#D43A3A",
        dangerBg: "rgba(212,58,58,0.10)",
        hoverOverlay: "rgba(10,10,15,0.05)",
        trackFill: "rgba(10,10,15,0.08)",
    },
}
export const FONT =
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
export const MONO =
    "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"

// ============ TYPES ============
export type CtlStatus = "passing" | "review" | "gap"
// Icon path data sourced from Tabler Icons (https://tabler.io/icons) ·
// MIT licensed. Every icon is a 24×24 stroke-only glyph. Multiple subpaths
// are concatenated with spaces; M commands start new subpaths cleanly.
export type IconDef = { d: string }

// ============ ICONS ============
export const I: Record<string, IconDef> = {
    check: { d: "M5 12l5 5l10 -10" },
    x: { d: "M18 6l-12 12 M6 6l12 12" },
    plus: { d: "M12 5l0 14 M5 12l14 0" },
    arrowRight: { d: "M5 12l14 0 M13 18l6 -6 M13 6l6 6" },
    arrowLeft: { d: "M5 12l14 0 M5 12l6 6 M5 12l6 -6" },
    caretDown: { d: "M6 9l6 6l6 -6" },
    caretRight: { d: "M9 6l6 6l-6 6" },
    caretUp: { d: "M6 15l6 -6l6 6" },
    caretSort: { d: "M8 9l4 -4l4 4 M16 15l-4 4l-4 -4" },
    search: {
        d: "M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M21 21l-6 -6",
    },
    bell: {
        d: "M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6 M9 17v1a3 3 0 0 0 6 0v-1",
    },
    bellSlash: {
        d: "M6.05 6.05a7 7 0 0 0 -.55 5.95v3a4 4 0 0 1 -2 3h14 M16.243 16.243a3 3 0 0 1 -.243 .757a3 3 0 0 1 -5.999 0 M9 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3 M3 3l18 18",
    },
    play: { d: "M7 4v16l13 -8z" },
    dotsH: {
        d: "M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
    },
    sparkle: {
        d: "M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zM10 8a4 4 0 0 1 4 4a4 4 0 0 1 4 -4a4 4 0 0 1 -4 -4a4 4 0 0 1 -4 4z",
    },
    house: {
        d: "M5 12l-2 0l9 -9l9 9l-2 0 M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7 M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6",
    },
    shield: {
        d: "M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3",
    },
    listChecks: {
        d: "M3.5 5.5l1.5 1.5l2.5 -2.5 M3.5 11.5l1.5 1.5l2.5 -2.5 M3.5 17.5l1.5 1.5l2.5 -2.5 M11 6l9 0 M11 12l9 0 M11 18l9 0",
    },
    fileText: {
        d: "M14 3v4a1 1 0 0 0 1 1h4 M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2 M9 9l1 0 M9 13l6 0 M9 17l6 0",
    },
    warning: {
        d: "M12 9v4 M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z M12 16l.01 0",
    },
    globe: {
        d: "M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0 M3.6 9l16.8 0 M3.6 15l16.8 0 M11.5 3a17 17 0 0 0 0 18 M12.5 3a17 17 0 0 1 0 18",
    },
    book: {
        d: "M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0 M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0 M3 6l0 13 M12 6l0 13 M21 6l0 13",
    },
    robot: {
        d: "M6 5h12a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-6a3 3 0 0 1 3 -3 M9 16v2 M15 16v2 M9 11v.01 M15 11v.01 M11 7h2 M12 5v2",
    },
    gear: {
        d: "M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0",
    },
    shieldCheck: {
        d: "M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3 M9 12l2 2l4 -4",
    },
    eye: {
        d: "M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0 M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6",
    },
    download: {
        d: "M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2 M7 11l5 5l5 -5 M12 4l0 12",
    },
    filter: {
        d: "M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z",
    },
    bolt: { d: "M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" },
    pause: {
        d: "M6 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z M14 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z",
    },
    user: {
        d: "M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0 M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2",
    },
    logout: {
        d: "M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2 M9 12h12l-3 -3 M15 15l3 -3",
    },
    refresh: {
        d: "M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4 M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4",
    },
    keyboard: {
        d: "M2 6m0 2a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2z M6 10l0 .01 M10 10l0 .01 M14 10l0 .01 M18 10l0 .01 M6 14l0 .01 M18 14l0 .01 M10 14l4 .01",
    },
    sun: {
        d: "M14.828 14.828a4 4 0 1 0 -5.656 -5.656a4 4 0 0 0 5.656 5.656z M6.343 17.657l-1.414 1.414 M6.343 6.343l-1.414 -1.414 M17.657 6.343l1.414 -1.414 M17.657 17.657l1.414 1.414 M4 12h-2 M12 4v-2 M20 12h2 M12 20v2",
    },
    moon: {
        d: "M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z",
    },
    message: {
        d: "M8 9h8 M8 13h6 M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3z",
    },
}

// Single uniform stroke renderer · all icons drawn with currentColor stroke
// at a Tabler-standard 2px stroke-width. `c` controls color; `s` controls
// the box size (px). The legacy `sw` prop is accepted for callsite compat
// but ignored · Tabler glyphs are tuned for stroke-width: 2.
export function Icon({
    n,
    s = 16,
    c = C.text,
    sw,
}: {
    n: keyof typeof I
    s?: number
    c?: string
    sw?: number
}) {
    const ic = I[n]
    if (!ic) return null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void sw
    return (
        <svg
            width={s}
            height={s}
            viewBox="0 0 24 24"
            fill="none"
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, display: "block" }}
        >
            <path d={ic.d} />
        </svg>
    )
}

// ============ HELPERS ============
export function relTime(createdAt: number): string {
    const seconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000))
    if (seconds < 5) return "just now"
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
}

export function formatElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
}

// ============ PRIMITIVES ============

export function StatusPill({
    s,
}: {
    s:
        | CtlStatus
        | "running"
        | "queued"
        | "complete"
        | "on_track"
        | "attention"
        | "paused"
}) {
    const map: Record<string, { bg: string; fg: string; label: string }> = {
        passing: { bg: C.successBg, fg: C.success, label: "Passing" },
        review: { bg: C.warningBg, fg: C.warning, label: "Review" },
        gap: { bg: C.dangerBg, fg: C.danger, label: "Gap" },
        complete: { bg: C.successBg, fg: C.success, label: "Complete" },
        running: { bg: C.accentBg, fg: C.accentSoft, label: "Running" },
        paused: { bg: C.warningBg, fg: C.warning, label: "Paused" },
        queued: {
            bg: C.trackFill,
            fg: C.textSubtle,
            label: "Queued",
        },
        on_track: { bg: C.successBg, fg: C.success, label: "On track" },
        attention: { bg: C.warningBg, fg: C.warning, label: "Needs attention" },
    }
    const m = map[s]
    if (!m) return null
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 9px",
                borderRadius: 999,
                background: m.bg,
                font: `500 11px/14px ${FONT}`,
                color: m.fg,
                letterSpacing: 0.2,
                transition: "all 200ms",
            }}
        >
            <div
                style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: m.fg,
                }}
            />
            {m.label}
        </div>
    )
}

export function Spinner({
    size = 14,
    color = C.accentSoft,
}: {
    size?: number
    color?: string
}) {
    return (
        <div
            style={{
                width: size,
                height: size,
                border: `2px solid ${color}`,
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "zspin 0.9s linear infinite",
            }}
        />
    )
}

export function ProgressBar({
    value,
    height = 6,
}: {
    value: number
    height?: number
}) {
    const pct = Math.max(0, Math.min(100, value))
    const color = pct >= 85 ? C.success : pct >= 70 ? C.accentSoft : C.warning
    return (
        <div
            style={{
                width: "100%",
                height,
                background: C.trackFill,
                borderRadius: 999,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: color,
                    borderRadius: 999,
                    transition: "width 600ms ease",
                }}
            />
        </div>
    )
}

export function Checkbox({
    checked,
    indeterminate,
    onChange,
    label,
}: {
    checked: boolean
    indeterminate?: boolean
    onChange: () => void
    label?: string
}) {
    const isOn = checked || indeterminate
    return (
        <button
            onClick={(e) => {
                e.stopPropagation()
                onChange()
            }}
            aria-label={label}
            aria-checked={
                indeterminate ? "mixed" : checked ? "true" : "false"
            }
            role="checkbox"
            className="zbtn"
            style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                padding: 0,
                background: isOn ? C.accent : "transparent",
                border: `1.5px solid ${isOn ? C.accent : C.borderHi}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 120ms",
            }}
        >
            {checked && <Icon n="check" s={10} c="#FFFFFF" />}
            {indeterminate && !checked && (
                <div
                    style={{
                        width: 8,
                        height: 2,
                        background: "#FFFFFF",
                        borderRadius: 1,
                    }}
                />
            )}
        </button>
    )
}

export function FilterChip({
    active,
    onClick,
    color,
    children,
}: {
    active: boolean
    onClick: () => void
    color?: string
    children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            className="zbtn"
            style={{
                padding: "5px 10px",
                borderRadius: 6,
                background: active
                    ? color
                        ? color + "33"
                        : C.accentBg
                    : "transparent",
                border: `1px solid ${active ? (color || C.accent) + "88" : C.border}`,
                cursor: "pointer",
                font: `${active ? 600 : 500} 12px/16px ${FONT}`,
                color: active ? color || C.accentSoft : C.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 120ms",
                boxShadow: active
                    ? `inset 0 0 0 1px ${(color || C.accent) + "33"}`
                    : "none",
            }}
        >
            {color && (
                <div
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: color,
                    }}
                />
            )}
            {children}
        </button>
    )
}

export function SortHeader({
    label,
    sortKey,
    sortBy,
    sortDir,
    onSort,
    align,
}: {
    label: string
    sortKey: string
    sortBy: string
    sortDir: "asc" | "desc"
    onSort: (k: any) => void
    align?: "right"
}) {
    const active = sortBy === sortKey
    return (
        <button
            onClick={() => onSort(sortKey)}
            className="zbtn"
            style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
                font: `${active ? 600 : 500} 11px/14px ${FONT}`,
                color: active ? C.accentSoft : C.textSubtle,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                justifyContent: align === "right" ? "flex-end" : "flex-start",
                width: "100%",
            }}
        >
            {label}
            <Icon
                n={
                    active
                        ? sortDir === "asc"
                            ? "caretUp"
                            : "caretDown"
                        : "caretSort"
                }
                s={10}
                c={active ? C.accentSoft : C.textSubtle}
            />
        </button>
    )
}

// Standard button styles
export const btnPrimary: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    background: C.text,
    color: C.bg,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    font: `600 13px/18px ${FONT}`,
}
export const btnSecondary: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    cursor: "pointer",
    font: `500 13px/18px ${FONT}`,
    color: C.text,
}
export const btnGhost: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    font: `500 12px/16px ${FONT}`,
    color: C.textMuted,
    borderRadius: 6,
}

export function navItemStyle(): React.CSSProperties {
    return {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 10px",
        borderRadius: 7,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        font: `500 13px/18px ${FONT}`,
        color: C.textMuted,
        textAlign: "left",
        width: "100%",
    }
}

// ============ MODAL PRIMITIVES ============

export function Modal({
    open,
    close,
    width = 520,
    children,
}: {
    open: boolean
    close: () => void
    width?: number
    children: React.ReactNode
}) {
    if (!open) return null
    return (
        <div
            onClick={close}
            style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                animation: "zfade 200ms ease",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width,
                    maxHeight: "84%",
                    background: C.surfaceHi,
                    border: `1px solid ${C.borderHi}`,
                    borderRadius: 16,
                    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                {children}
            </div>
        </div>
    )
}

export function ModalHeader({
    icon,
    iconBg,
    iconColor,
    title,
    subtitle,
    close,
}: {
    icon?: keyof typeof I
    iconBg?: string
    iconColor?: string
    title: string
    subtitle?: string
    close: () => void
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "20px 24px 18px 24px",
                borderBottom: `1px solid ${C.border}`,
                flexShrink: 0,
            }}
        >
            {icon && (
                <div
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background:
                            iconBg ??
                            `linear-gradient(135deg, ${C.accent}, ${C.accentSoft})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <Icon n={icon} s={18} c={iconColor ?? C.text} />
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        font: `600 16px/22px ${FONT}`,
                        color: C.text,
                        letterSpacing: "-0.005em",
                    }}
                >
                    {title}
                </div>
                {subtitle && (
                    <div
                        style={{
                            font: `400 12px/16px ${FONT}`,
                            color: C.textSubtle,
                            marginTop: 2,
                        }}
                    >
                        {subtitle}
                    </div>
                )}
            </div>
            <button
                onClick={close}
                className="zicon"
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <Icon n="x" s={14} c={C.textMuted} />
            </button>
        </div>
    )
}

export function ModalBody({
    children,
    scrollable,
}: {
    children: React.ReactNode
    scrollable?: boolean
}) {
    return (
        <div
            style={{
                padding: "20px 24px",
                overflowY: scrollable ? "auto" : "visible",
                flex: scrollable ? 1 : "0 0 auto",
            }}
        >
            {children}
        </div>
    )
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                padding: "14px 24px",
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                flexShrink: 0,
                background: "rgba(0,0,0,0.15)",
            }}
        >
            {children}
        </div>
    )
}

// ============ DROPDOWN PRIMITIVE ============

export type DropdownItem =
    | {
          label: string
          icon?: keyof typeof I
          onClick?: () => void
          danger?: boolean
          sub?: string
          check?: boolean
          right?: string
      }
    | "divider"

export function DropdownMenu({
    items,
    onClose,
    top = 0,
    right,
    left,
    width = 220,
}: {
    items: DropdownItem[]
    onClose: () => void
    top?: number
    right?: number
    left?: number
    width?: number
}) {
    return (
        <>
            <div
                onClick={onClose}
                style={{ position: "fixed", inset: 0, zIndex: 30 }}
            />
            <div
                style={{
                    position: "absolute",
                    top,
                    ...(left !== undefined ? { left } : { right: right ?? 0 }),
                    width,
                    background: C.surfaceHi,
                    border: `1px solid ${C.borderHi}`,
                    borderRadius: 10,
                    padding: 4,
                    zIndex: 31,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
                    animation: "zfade 140ms ease",
                }}
            >
                {items.map((item, i) => {
                    if (item === "divider")
                        return (
                            <div
                                key={i}
                                style={{
                                    height: 1,
                                    background: C.border,
                                    margin: "4px 0",
                                }}
                            />
                        )
                    return (
                        <button
                            key={i}
                            onClick={() => {
                                item.onClick?.()
                                onClose()
                            }}
                            disabled={!item.onClick}
                            className={item.onClick ? "znav" : undefined}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                width: "100%",
                                padding: "7px 10px",
                                background: "transparent",
                                border: "none",
                                borderRadius: 6,
                                cursor: item.onClick ? "pointer" : "default",
                                font: `500 13px/18px ${FONT}`,
                                color: item.danger
                                    ? C.danger
                                    : item.onClick
                                      ? C.text
                                      : C.textSubtle,
                                textAlign: "left",
                            }}
                        >
                            {item.icon && (
                                <Icon
                                    n={item.icon}
                                    s={13}
                                    c={
                                        item.danger
                                            ? C.danger
                                            : item.onClick
                                              ? C.textMuted
                                              : C.textSubtle
                                    }
                                   
                                />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {item.label}
                                </div>
                                {item.sub && (
                                    <div
                                        style={{
                                            font: `400 11px/14px ${FONT}`,
                                            color: C.textSubtle,
                                            marginTop: 1,
                                        }}
                                    >
                                        {item.sub}
                                    </div>
                                )}
                            </div>
                            {item.right && (
                                <div
                                    style={{
                                        font: `400 11px/14px ${MONO}`,
                                        color: C.textSubtle,
                                    }}
                                >
                                    {item.right}
                                </div>
                            )}
                            {item.check && (
                                <Icon
                                    n="check"
                                    s={12}
                                    c={C.accentSoft}
                                   
                                />
                            )}
                        </button>
                    )
                })}
            </div>
        </>
    )
}

// ============ GLOBAL STYLES ============

export function GlobalStyles() {
    const dark = THEME.dark
    const light = THEME.light
    const paletteVars = (p: typeof THEME.dark) => `
        --c-bg: ${p.bg};
        --c-surface: ${p.surface};
        --c-surface-hi: ${p.surfaceHi};
        --c-surface-hover: ${p.surfaceHover};
        --c-border: ${p.border};
        --c-border-hi: ${p.borderHi};
        --c-text: ${p.text};
        --c-text-muted: ${p.textMuted};
        --c-text-subtle: ${p.textSubtle};
        --c-accent: ${p.accent};
        --c-accent-soft: ${p.accentSoft};
        --c-accent-bg: ${p.accentBg};
        --c-success: ${p.success};
        --c-success-bg: ${p.successBg};
        --c-warning: ${p.warning};
        --c-warning-bg: ${p.warningBg};
        --c-danger: ${p.danger};
        --c-danger-bg: ${p.dangerBg};
        --c-hover-overlay: ${p.hoverOverlay};
        --c-track-fill: ${p.trackFill};
    `
    return (
        <style>{`
            :root, .theme-dark { ${paletteVars(dark)} }
            .theme-light { ${paletteVars(light)} }
            @keyframes zspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes zpulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
            @keyframes zfade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes zslide { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes zflash {
                0% { background: rgba(124,92,255,0.22); box-shadow: inset 3px 0 0 ${C.accentSoft}; }
                35% { background: rgba(124,92,255,0.14); box-shadow: inset 3px 0 0 ${C.accentSoft}; }
                100% { background: transparent; box-shadow: inset 3px 0 0 transparent; }
            }
            @keyframes ztoast {
                0% { transform: translateX(120%); opacity: 0; }
                6% { transform: translateX(0); opacity: 1; }
                90% { transform: translateX(0); opacity: 1; }
                100% { transform: translateX(120%); opacity: 0; }
            }
            @keyframes zbump { 0%, 100% { transform: scale(1); } 30% { transform: scale(1.06); color: ${C.accentSoft}; } }
            @keyframes zlivepulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,208,132,0.4); } 50% { box-shadow: 0 0 0 4px rgba(0,208,132,0); } }
            @keyframes zbarSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes zpanelIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            @keyframes zstepReveal { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes zcaret { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            @keyframes zviewIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            .zrow:hover { background: var(--c-hover-overlay); }
            .znav:hover { background: var(--c-hover-overlay); }
            .zbtn:hover { filter: brightness(1.08); }
            .zicon:hover { background: var(--c-hover-overlay); }
            .zinp:focus { outline: none; }
            .zflash-row { animation: zflash 2500ms ease-out; }
            .zslide-row { animation: zslide 320ms ease-out; }
            .ztoast { animation: ztoast 4500ms ease-out forwards; }
            .zbump-text { animation: zbump 600ms ease-out; display: inline-block; }
            .zlive-dot { animation: zpulse 1.6s ease-in-out infinite, zlivepulse 1.6s ease-in-out infinite; }
            .zbar-slide { animation: zbarSlide 240ms ease-out; }
            .zpanel { animation: zpanelIn 320ms cubic-bezier(0.16, 1, 0.3, 1); }
            .zstep-reveal { animation: zstepReveal 320ms ease-out; }
            .zcaret { animation: zcaret 1s steps(2) infinite; }
            .zview-in { animation: zviewIn 260ms cubic-bezier(0.16, 1, 0.3, 1); }
            .zfw-card { transition: transform 160ms ease, border-color 160ms ease, background 160ms ease; }
            .zfw-card:hover { transform: translateY(-2px); border-color: var(--c-border-hi); background: ${C.surfaceHi}; }
            .zfield { background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 8px; padding: 9px 12px; font: 400 13px/18px ${FONT}; color: ${C.text}; outline: none; transition: border-color 120ms; width: 100%; box-sizing: border-box; }
            .zfield:focus { border-color: ${C.accent}; }
            .zfield::placeholder { color: ${C.textSubtle}; }
        `}</style>
    )
}

// ============ DEFAULT EXPORT (preview only) ============

export default function DashboardLib() {
    return (
        <div
            style={{
                padding: 28,
                background: C.bg,
                color: C.text,
                font: `400 14px/22px ${FONT}`,
                height: "100%",
                boxSizing: "border-box",
            }}
        >
            <GlobalStyles />
            <div
                style={{
                    font: `600 18px/24px ${FONT}`,
                    letterSpacing: "-0.015em",
                    marginBottom: 6,
                }}
            >
                Dashboard Library
            </div>
            <div style={{ color: C.textMuted, marginBottom: 24 }}>
                Shared design tokens, icons, and primitives. Import named
                exports from this file.
            </div>
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 16,
                    flexWrap: "wrap",
                }}
            >
                <StatusPill s="passing" />
                <StatusPill s="review" />
                <StatusPill s="gap" />
                <StatusPill s="running" />
                <StatusPill s="paused" />
            </div>
            <div style={{ marginBottom: 16 }}>
                <ProgressBar value={72} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.keys(I)
                    .slice(0, 12)
                    .map((k) => (
                        <div
                            key={k}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                background: C.surface,
                                border: `1px solid ${C.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Icon
                                n={k as keyof typeof I}
                                s={14}
                                c={C.textMuted}
                            />
                        </div>
                    ))}
            </div>
        </div>
    )
}
