import * as React from "react"
import { C, FONT, MONO, Icon, I, eyebrowStyle } from "./DashboardLib"

// ============ COMMAND PALETTE ============
//
// Spotlight-style search opened with ⌘K (or the top-bar trigger). The parent
// supplies a flat item list; the palette ranks, groups, and handles keyboard
// navigation. Selecting an item runs it and closes the palette.

export type PaletteItem = {
    id: string
    group: string
    label: string
    sub?: string
    icon: keyof typeof I
    keywords?: string
    // Right-aligned hint, e.g. a shortcut or a status.
    hint?: string
    run: () => void
}

// Group order when results are shown; anything else sorts after.
const GROUP_ORDER = ["Actions", "Pages", "Frameworks", "Controls", "Vendors"]
const PER_GROUP = 6

function score(item: PaletteItem, q: string): number {
    if (!q) return 1
    const label = item.label.toLowerCase()
    if (label.startsWith(q)) return 4
    if (label.split(/[\s:·/-]+/).some((w) => w.startsWith(q))) return 3
    if (label.includes(q)) return 2
    const rest = `${item.sub ?? ""} ${item.keywords ?? ""}`.toLowerCase()
    return rest.includes(q) ? 1 : 0
}

export function CommandPalette({
    open,
    onClose,
    items,
    suggestedIds,
}: {
    open: boolean
    onClose: () => void
    items: PaletteItem[]
    // Shown (in this order) before the user types anything.
    suggestedIds: string[]
}) {
    const [query, setQuery] = React.useState("")
    const [active, setActive] = React.useState(0)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (!open) return
        setQuery("")
        setActive(0)
        // Focus after the enter animation's first frame.
        requestAnimationFrame(() => inputRef.current?.focus())
    }, [open])

    const groups = React.useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) {
            const byId = new Map(items.map((i) => [i.id, i]))
            const suggested = suggestedIds
                .map((id) => byId.get(id))
                .filter(Boolean) as PaletteItem[]
            return [{ name: "Suggested", items: suggested }]
        }
        const ranked = items
            .map((item) => ({ item, s: score(item, q) }))
            .filter((r) => r.s > 0)
            .sort((a, b) => b.s - a.s)
        const byGroup = new Map<string, PaletteItem[]>()
        ranked.forEach(({ item }) => {
            const list = byGroup.get(item.group) ?? []
            if (list.length < PER_GROUP) list.push(item)
            byGroup.set(item.group, list)
        })
        const rank = (g: string) => {
            const i = GROUP_ORDER.indexOf(g)
            return i === -1 ? GROUP_ORDER.length : i
        }
        return [...byGroup.entries()]
            .sort((a, b) => rank(a[0]) - rank(b[0]))
            .map(([name, list]) => ({ name, items: list }))
    }, [query, items, suggestedIds])

    const flat = React.useMemo(() => groups.flatMap((g) => g.items), [groups])

    React.useEffect(() => setActive(0), [query])
    React.useEffect(() => {
        listRef.current
            ?.querySelector(`[data-index="${active}"]`)
            ?.scrollIntoView({ block: "nearest" })
    }, [active])

    if (!open) return null

    const choose = (item: PaletteItem | undefined) => {
        if (!item) return
        onClose()
        item.run()
    }
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault()
            setActive((a) => (flat.length ? (a + 1) % flat.length : 0))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0))
        } else if (e.key === "Enter") {
            e.preventDefault()
            choose(flat[active])
        } else if (e.key === "Escape") {
            e.preventDefault()
            onClose()
        }
    }

    let index = -1
    return (
        <div
            onMouseDown={onClose}
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 120,
                background: C.scrim,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                paddingTop: "14vh",
                animation: "zfade 140ms ease",
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Search"
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={onKeyDown}
                className="zpalette"
                style={{
                    width: "min(640px, calc(100% - 48px))",
                    background: C.surfaceHi,
                    border: `1px solid ${C.borderHi}`,
                    borderRadius: 16,
                    boxShadow: `${C.shadowLg}, inset 0 1px 0 ${C.glassEdge}`,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "0 18px",
                        height: 58,
                        borderBottom: `1px solid ${C.border}`,
                    }}
                >
                    <Icon n="search" s={18} c={C.textSubtle} />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search controls, frameworks, vendors, actions"
                        aria-label="Search"
                        aria-controls="zpalette-list"
                        aria-activedescendant={flat[active] ? `zpalette-${flat[active].id}` : undefined}
                        className="zinp"
                        style={{
                            flex: 1,
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            color: C.text,
                            font: `400 17px/24px ${FONT}`,
                            letterSpacing: "-0.01em",
                        }}
                    />
                    <Kbd>esc</Kbd>
                </div>
                <div
                    ref={listRef}
                    id="zpalette-list"
                    role="listbox"
                    style={{ maxHeight: "min(52vh, 440px)", overflowY: "auto", padding: 6 }}
                >
                    {flat.length === 0 && (
                        <div
                            style={{
                                padding: "36px 16px",
                                textAlign: "center",
                                font: `400 13px/18px ${FONT}`,
                                color: C.textSubtle,
                            }}
                        >
                            No results for "{query}"
                        </div>
                    )}
                    {groups.map((g) =>
                        g.items.length === 0 ? null : (
                            <div key={g.name} style={{ marginBottom: 4 }}>
                                <div style={{ ...eyebrowStyle, padding: "10px 12px 6px" }}>
                                    {g.name}
                                </div>
                                {g.items.map((item) => {
                                    index += 1
                                    const i = index
                                    const isActive = i === active
                                    return (
                                        <div
                                            key={item.id}
                                            id={`zpalette-${item.id}`}
                                            role="option"
                                            aria-selected={isActive}
                                            data-index={i}
                                            onMouseMove={() => setActive(i)}
                                            onClick={() => choose(item)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                                padding: "9px 12px",
                                                borderRadius: 9,
                                                cursor: "pointer",
                                                background: isActive ? C.accentBg : "transparent",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 7,
                                                    border: `1px solid ${C.border}`,
                                                    background: C.hoverOverlay,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Icon
                                                    n={item.icon}
                                                    s={14}
                                                    c={isActive ? C.accentSoft : C.textMuted}
                                                />
                                            </span>
                                            <span style={{ flex: 1, minWidth: 0 }}>
                                                <span
                                                    style={{
                                                        display: "block",
                                                        font: `500 13.5px/18px ${FONT}`,
                                                        color: C.text,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {item.label}
                                                </span>
                                                {item.sub && (
                                                    <span
                                                        style={{
                                                            display: "block",
                                                            font: `400 12px/16px ${FONT}`,
                                                            color: C.textSubtle,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {item.sub}
                                                    </span>
                                                )}
                                            </span>
                                            {item.hint && (
                                                <span
                                                    style={{
                                                        font: `400 11.5px/16px ${FONT}`,
                                                        color: C.textSubtle,
                                                    }}
                                                >
                                                    {item.hint}
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    )}
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "9px 16px",
                        borderTop: `1px solid ${C.border}`,
                        background: C.surfaceSunken,
                        font: `400 11.5px/16px ${FONT}`,
                        color: C.textSubtle,
                    }}
                >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Kbd>↑</Kbd>
                        <Kbd>↓</Kbd> to navigate
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Kbd>↵</Kbd> to open
                    </span>
                    <span style={{ flex: 1 }} />
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Kbd>⌘K</Kbd> to toggle
                    </span>
                </div>
            </div>
        </div>
    )
}

export function Kbd({ children }: { children: React.ReactNode }) {
    return (
        <kbd
            style={{
                font: `500 10.5px/14px ${MONO}`,
                color: C.textMuted,
                padding: "2px 6px",
                minWidth: 20,
                textAlign: "center",
                border: `1px solid ${C.border}`,
                borderBottomWidth: 2,
                borderRadius: 5,
                background: C.hoverOverlay,
            }}
        >
            {children}
        </kbd>
    )
}
