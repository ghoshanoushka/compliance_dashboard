import * as React from "react"
import wallpaper from "../assets/wallpaper-dunes.jpg"

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
    // Recessed wells · inputs, modal footers, code blocks.
    surfaceSunken: "var(--c-surface-sunken)",
    border: "var(--c-border)",
    borderHi: "var(--c-border-hi)",
    glassEdge: "var(--c-glass-edge)",
    // The app window's own frosted fill.
    windowGlass: "var(--c-window-glass)",
    text: "var(--c-text)",
    textMuted: "var(--c-text-muted)",
    textSubtle: "var(--c-text-subtle)",
    accent: "var(--c-accent)",
    accentSoft: "var(--c-accent-soft)",
    accentBg: "var(--c-accent-bg)",
    // Foreground for anything sitting on a solid accent fill.
    accentFg: "var(--c-accent-fg)",
    // Selection fill, border and wash. Deliberately neutral: orange is reserved
    // for text, focus and the CTA, so selected chips never read as alerts.
    accentLine: "var(--c-accent-line)",
    accentTint: "var(--c-accent-tint)",
    // The one high-emphasis CTA fill per view.
    primary: "var(--c-primary)",
    primaryFg: "var(--c-primary-fg)",
    success: "var(--c-success)",
    successBg: "var(--c-success-bg)",
    successLine: "var(--c-success-line)",
    warning: "var(--c-warning)",
    warningBg: "var(--c-warning-bg)",
    danger: "var(--c-danger)",
    dangerBg: "var(--c-danger-bg)",
    // CSS-var-only · used in places that need theme-aware neutrals beyond
    // the standard token set (hover overlays, track fills, ring shadows).
    hoverOverlay: "var(--c-hover-overlay)",
    trackFill: "var(--c-track-fill)",
    scrim: "var(--c-scrim)",
    shadowSm: "var(--c-shadow-sm)",
    shadowLg: "var(--c-shadow-lg)",
}

// Neutral graphite (dark, default) and cool paper (light). Surfaces are glass:
// translucent so the wallpaper tints through; GlobalStyles applies the blur
// to anything painted with surface / surfaceHi. Orange marks interaction only.
export const THEME = {
    dark: {
        bg: "#0E0F12",
        surface: "rgba(255,255,255,0.055)",
        surfaceHi: "rgb(36,35,36)",
        fieldFocus: "rgba(255,255,255,0.34)",
        fieldHalo: "rgba(255,255,255,0.06)",
        surfaceHover: "rgba(255,255,255,0.08)",
        surfaceSunken: "rgba(0,0,0,0.24)",
        border: "rgba(255,255,255,0.08)",
        borderHi: "rgba(255,255,255,0.14)",
        // 1px top highlight that sells the glass edge.
        glassEdge: "rgba(255,255,255,0.06)",
        windowGlass: "rgba(16,17,20,0.68)",
        text: "#ECEDEF",
        textMuted: "rgba(236,237,239,0.74)",
        textSubtle: "rgba(236,237,239,0.62)",
        accent: "#F07A3A",
        accentSoft: "#F59A66",
        accentBg: "rgba(255,255,255,0.09)",
        accentFg: "#1A0E07",
        accentLine: "rgba(255,255,255,0.26)",
        accentTint: "rgba(255,255,255,0.035)",
        primary: "#FFFFFF",
        primaryFg: "#0E0F12",
        success: "#4CC98A",
        successBg: "rgba(76,201,138,0.14)",
        successLine: "rgba(76,201,138,0.32)",
        warning: "#E8C547",
        warningBg: "rgba(232,197,71,0.14)",
        danger: "#F47272",
        dangerBg: "rgba(244,114,114,0.14)",
        hoverOverlay: "rgba(255,255,255,0.05)",
        trackFill: "rgba(255,255,255,0.08)",
        scrim: "rgba(6,6,8,0.62)",
        shadowSm: "0 1px 2px rgba(0,0,0,0.30)",
        shadowLg: "0 24px 64px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)",
    },
    light: {
        bg: "#EEF1F5",
        surface: "rgba(255,255,255,0.60)",
        surfaceHi: "rgb(252,252,251)",
        fieldFocus: "rgba(15,23,42,0.36)",
        fieldHalo: "rgba(15,23,42,0.06)",
        surfaceHover: "rgba(241,243,247,0.85)",
        surfaceSunken: "rgba(15,23,42,0.04)",
        border: "rgba(15,23,42,0.09)",
        borderHi: "rgba(15,23,42,0.16)",
        glassEdge: "rgba(255,255,255,0.70)",
        windowGlass: "rgba(248,248,247,0.82)",
        text: "#14161A",
        textMuted: "rgba(20,22,26,0.74)",
        textSubtle: "rgba(20,22,26,0.62)",
        accent: "#B04D14",
        accentSoft: "#B04D14",
        accentBg: "rgba(15,23,42,0.06)",
        accentFg: "#FFFFFF",
        accentLine: "rgba(15,23,42,0.26)",
        accentTint: "rgba(15,23,42,0.025)",
        primary: "#B04D14",
        primaryFg: "#FFFFFF",
        success: "#166B3F",
        successBg: "rgba(22,107,63,0.10)",
        successLine: "rgba(22,107,63,0.30)",
        warning: "#8A5205",
        warningBg: "rgba(138,82,5,0.11)",
        danger: "#B42A25",
        dangerBg: "rgba(180,42,37,0.09)",
        hoverOverlay: "rgba(15,23,42,0.04)",
        trackFill: "rgba(15,23,42,0.08)",
        scrim: "rgba(20,20,24,0.30)",
        shadowSm: "0 1px 2px rgba(15,23,42,0.06)",
        shadowLg: "0 24px 64px rgba(15,23,42,0.16), 0 2px 8px rgba(15,23,42,0.06)",
    },
}
export const FONT =
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
// Display face · page titles and the wordmark only.
export const SERIF = "Newsreader, 'Iowan Old Style', Georgia, serif"
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
    news: {
        d: "M16 6h3a1 1 0 0 1 1 1v11a2 2 0 0 1 -4 0v-13a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1v12a3 3 0 0 0 3 3h11 M8 8l4 0 M8 12l4 0 M8 16l4 0",
    },
    hierarchy: {
        d: "M12 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M5 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M19 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M6.5 17.5l5.5 -4.5l5.5 4.5 M12 7l0 6",
    },
    loader: { d: "M12 3a9 9 0 1 0 9 9" },
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
                whiteSpace: "nowrap",
                flexShrink: 0,
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

// Copies text and confirms in place, so no toast is needed.
export function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = React.useState(false)
    React.useEffect(() => {
        if (!copied) return
        const t = setTimeout(() => setCopied(false), 1600)
        return () => clearTimeout(t)
    }, [copied])
    return (
        <button
            type="button"
            className="zbtn"
            style={{ ...btnSecondary, padding: "6px 10px", font: `500 12px/16px ${FONT}`, minWidth: 66, justifyContent: "center" }}
            onClick={() => {
                navigator.clipboard?.writeText(text).then(() => setCopied(true), () => {})
            }}
        >
            {copied && <Icon n="check" s={11} c={C.success} />}
            {copied ? "Copied" : "Copy"}
        </button>
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
    // Status colors only · accent never encodes health.
    const color = pct >= 85 ? C.success : pct >= 70 ? C.warning : C.danger
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
            {checked && <Icon n="check" s={10} c={C.accentFg} />}
            {indeterminate && !checked && (
                <div
                    style={{
                        width: 8,
                        height: 2,
                        background: C.accentFg,
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
                // color-mix, not hex-suffix alpha · callers pass CSS vars.
                background: active
                    ? color
                        ? `color-mix(in srgb, ${color} 16%, transparent)`
                        : C.accentBg
                    : "transparent",
                border: `1px solid ${active ? `color-mix(in srgb, ${color || C.accent} 45%, transparent)` : C.border}`,
                cursor: "pointer",
                font: `${active ? 600 : 500} 12px/16px ${FONT}`,
                color: active ? color || C.accentSoft : C.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 120ms",
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
    background: C.primary,
    color: C.primaryFg,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    font: `600 13px/18px ${FONT}`,
    boxShadow: C.shadowSm,
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
// Small label that names a group (KPI labels, nav groups, table headers).
export const eyebrowStyle: React.CSSProperties = {
    font: `500 12px/16px ${FONT}`,
    color: C.textSubtle,
}

// Glass panel shell shared by sections on every view.
export const panelStyle: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    overflow: "hidden",
}

// ============ ACCORDION ============
//
// Folds secondary information behind a one-line summary so the screen reads
// in order of operations. Open state persists per `id`.
export function Accordion({
    id,
    title,
    summary,
    right,
    defaultOpen = false,
    children,
}: {
    id: string
    title: string
    summary?: React.ReactNode
    right?: React.ReactNode
    defaultOpen?: boolean
    children: React.ReactNode
}) {
    const key = `acc-${id}`
    const [open, setOpen] = React.useState<boolean>(() => {
        try {
            const v = window.localStorage.getItem(key)
            return v === null ? defaultOpen : v === "1"
        } catch {
            return defaultOpen
        }
    })
    const toggle = () => {
        setOpen((o) => {
            try {
                window.localStorage.setItem(key, o ? "0" : "1")
            } catch {
                // ignore (private mode)
            }
            return !o
        })
    }
    const bodyId = `${key}-body`
    return (
        <section style={panelStyle}>
            <div style={{ display: "flex", alignItems: "center" }}>
                <button
                    onClick={toggle}
                    aria-expanded={open}
                    aria-controls={bodyId}
                    className="znav"
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "14px 18px",
                        background: "transparent",
                        border: "none",
                        borderRadius: 0,
                        cursor: "pointer",
                        textAlign: "left",
                        color: C.text,
                    }}
                >
                    <span
                        style={{
                            display: "flex",
                            transform: open ? "rotate(90deg)" : "rotate(0deg)",
                            transition: "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                    >
                        <Icon n="caretRight" s={13} c={C.textSubtle} />
                    </span>
                    <span style={{ font: `600 14px/20px ${FONT}`, color: C.text }}>
                        {title}
                    </span>
                    {summary && (
                        <span
                            style={{
                                font: `400 12.5px/18px ${FONT}`,
                                color: C.textSubtle,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {summary}
                        </span>
                    )}
                </button>
                {right && (
                    <div style={{ paddingRight: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        {right}
                    </div>
                )}
            </div>
            <div className="zfold" data-open={open} id={bodyId}>
                <div>
                    <div style={{ borderTop: `1px solid ${C.border}` }}>{children}</div>
                </div>
            </div>
        </section>
    )
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
                background: C.scrim,
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
                    boxShadow: C.shadowLg,
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
                        background: iconBg ?? C.accentBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <Icon n={icon} s={18} c={iconColor ?? C.accentSoft} />
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
                background: C.surfaceSunken,
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
                    boxShadow: C.shadowLg,
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
                                        font: `400 11px/14px ${FONT}`,
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
    // camelCase palette key → --c-kebab-case var, so C and THEME never drift.
    const paletteVars = (p: typeof THEME.dark) =>
        Object.entries(p)
            .map(([k, v]) => `--c-${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}: ${v};`)
            .join("\n")
    return (
        <style>{`
            :root, .theme-dark { ${paletteVars(dark)} }
            .theme-light { ${paletteVars(light)} }
            @keyframes zspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes zpulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
            @keyframes zfade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes zslide { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes zflash {
                0% { background: ${C.accentBg}; box-shadow: inset 3px 0 0 ${C.accentSoft}; }
                35% { background: ${C.accentTint}; box-shadow: inset 3px 0 0 ${C.accentSoft}; }
                100% { background: transparent; box-shadow: inset 3px 0 0 transparent; }
            }
            @keyframes zbump { 0%, 100% { transform: scale(1); } 30% { transform: scale(1.06); color: ${C.accentSoft}; } }
            @keyframes zlivepulse { 0%, 100% { box-shadow: 0 0 0 0 ${C.successLine}; } 50% { box-shadow: 0 0 0 4px transparent; } }
            @keyframes zbarSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes zpanelIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            @keyframes zstepReveal { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes zcaret { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            @keyframes zviewIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            .theme-dark, .theme-light { font-variant-numeric: tabular-nums; font-feature-settings: "cv11", "ss01"; -webkit-font-smoothing: antialiased; }
            .theme-dark { color-scheme: dark; }
            .theme-light { color-scheme: light; }
            .theme-dark ::selection, .theme-light ::selection { background: var(--c-accent-bg); }
            :is(.theme-dark, .theme-light) :is(button, a, select, [tabindex]):focus-visible {
                outline: 2px solid var(--c-accent); outline-offset: 2px;
            }
            /* Text fields never get the ring. A bordered field brightens its own
               border; a bare input (.zinp) inside a box lights the box (.zfocus). */
            :is(.theme-dark, .theme-light) :is(input, textarea):focus { outline: none; }
            :is(.theme-dark, .theme-light) :is(input, textarea):not(.zinp):not([type="checkbox"]):focus,
            .zfocus:focus-within {
                border-color: var(--c-field-focus) !important;
                box-shadow: 0 0 0 3px var(--c-field-halo);
            }
            /* Frosted glass. Only the window itself blurs the wallpaper: a
               backdrop-filter nested inside it can't see past the window, so it
               would paint a dark slab instead of frost. Panels are a light tint
               over the window's frost; raised layers (menus, modals, drawers)
               are near-opaque so nothing underneath reads through. */
            [style*="background: var(--c-surface);"] {
                box-shadow: inset 0 1px 0 var(--c-glass-edge);
            }
            .zdesk { padding: 32px 44px; }
            .zwindow {
                border-radius: 14px;
                -webkit-backdrop-filter: blur(40px) saturate(160%);
                backdrop-filter: blur(40px) saturate(160%);
            }
            @media (max-width: 900px) {
                .zdesk { padding: 0; }
                .zwindow { border-radius: 0; border: none !important; }
            }
            .zpalette { animation: zpaletteIn 180ms cubic-bezier(0.16, 1, 0.3, 1); }
            @keyframes zpaletteIn { from { opacity: 0; transform: translateY(-6px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
            .zbackdrop { position: absolute; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
            /* Desktop wallpaper: "Rolling sand dunes" by Wolfgang Hasselmann
               (Unsplash License). A tint keeps glass and text legible. */
            .theme-dark .zbackdrop {
                background:
                    linear-gradient(180deg, rgba(10,9,8,0.42), rgba(10,9,8,0.58)),
                    url(${wallpaper}) center 60% / cover no-repeat;
            }
            .theme-light .zbackdrop {
                background:
                    linear-gradient(180deg, rgba(255,250,245,0.10), rgba(255,250,245,0.18)),
                    url(${wallpaper}) center 60% / cover no-repeat;
            }
            .zfold { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease; }
            .zfold > * { overflow: hidden; min-height: 0; }
            .zfold[data-open="false"] { grid-template-rows: 0fr; opacity: 0; }
            .zkpi + .zkpi { box-shadow: inset 1px 0 0 var(--c-border); }
            .zrow:hover { background: var(--c-hover-overlay); }
            .znav:hover { background: var(--c-hover-overlay); }
            .zbtn { transition: background 120ms ease, border-color 120ms ease, color 120ms ease, filter 120ms ease, transform 120ms ease; }
            .zbtn:hover { filter: brightness(1.06); }
            .zbtn:active { transform: translateY(0.5px); }
            .zbtn-primary { box-shadow: var(--c-shadow-sm); }
            .zbtn-primary:hover { filter: brightness(1.08); }
            .zicon:hover { background: var(--c-hover-overlay); }
            .zflash-row { animation: zflash 2500ms ease-out; }
            .zslide-row { animation: zslide 320ms ease-out; }
            .zbump-text { animation: zbump 600ms ease-out; display: inline-block; }
            .zlive-dot { animation: zpulse 1.6s ease-in-out infinite, zlivepulse 1.6s ease-in-out infinite; }
            .zbar-slide { animation: zbarSlide 240ms ease-out; }
            .zpanel { animation: zpanelIn 320ms cubic-bezier(0.16, 1, 0.3, 1); }
            .zstep-reveal { animation: zstepReveal 320ms ease-out; }
            .zcaret { animation: zcaret 1s steps(2) infinite; }
            .zview-in { animation: zviewIn 260ms cubic-bezier(0.16, 1, 0.3, 1); }
            .zfw-card { transition: transform 160ms ease, border-color 160ms ease, background 160ms ease; }
            .zfw-card:hover { transform: translateY(-2px); border-color: var(--c-border-hi); background: ${C.surfaceHi}; }
            @media (prefers-reduced-motion: reduce) {
                :is(.theme-dark, .theme-light) *, :is(.theme-dark, .theme-light) *::before, :is(.theme-dark, .theme-light) *::after {
                    animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important;
                }
            }
        `}</style>
    )
}
