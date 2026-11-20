import * as React from "react"
import {
    C,
    FONT,
    MONO,
    SERIF,
    Icon,
    I,
    StatusPill,
    Spinner,
    ProgressBar,
    Checkbox,
    FilterChip,
    SortHeader,
    btnPrimary,
    btnSecondary,
    GlobalStyles,
    Accordion,
    panelStyle,
    eyebrowStyle,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    DropdownMenu,
    type DropdownItem,
    relTime,
    formatElapsed,
} from "./DashboardLib"
import {
    type CtlStatus,
    type Framework,
    type Ctl,
    type Activity,
    type RunStep,
    FRAMEWORKS,
    SECTION_LABELS,
    SECTION_ORDER,
    getSectionKey,
    CONTROLS,
    ACTIVITY_SEED,
    ACTIVITY_POOL,
    getScript,
} from "./DashboardData"
import { AddControlModal } from "./AddControlModal"
import {
    ExportModal,
    type ExportScope,
} from "./ExportModal"
import { SettingsModal } from "./SettingsModal"
import { TrustCenterModal } from "./TrustCenterModal"
import { ControlDetailPanel } from "./ControlDetailPanel"
import {
    AgentChat,
    type ChatMessage,
} from "./AgentChat"
import { VendorsView } from "../vendors/VendorsView"
import { CommandPalette, Kbd, type PaletteItem } from "./CommandPalette"
import { EvidenceView, PoliciesView, RisksView, AgentsView, ShortcutsModal, SignedOut, usePersistentState } from "./AppViews"
import { celebrate, useWinOnFinish } from "../lib/celebrate"

// Captured once at module load · used as a stable anchor for "minutes ago"
// fields so relTime() actually ticks forward as wall-clock time advances.
const PAGE_LOAD_MS = Date.now()

// "Jan 12, 2027" → "Jan 12, 2027 · in 1 year 2 months". "Continuous" passes
// through. Anything that doesn't parse is returned verbatim.
function formatRenewal(raw: string): string {
    if (!raw || /continuous/i.test(raw)) return raw || "-"
    const target = new Date(raw)
    if (Number.isNaN(target.getTime())) return raw
    const days = Math.round((target.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    if (days < 0) return `${raw} · ${Math.abs(days)} days overdue`
    if (days === 0) return `${raw} · today`
    if (days < 14) return `${raw} · in ${days} day${days === 1 ? "" : "s"}`
    if (days < 60) return `${raw} · in ${Math.round(days / 7)} weeks`
    if (days < 365) return `${raw} · in ${Math.round(days / 30)} months`
    const years = Math.floor(days / 365)
    const remMonths = Math.round((days % 365) / 30)
    return `${raw} · in ${years} year${years === 1 ? "" : "s"}${remMonths > 0 ? ` ${remMonths} mo` : ""}`
}

type NavItem = { id: string; label: string; icon: keyof typeof I }
type NavGroup = { id: string; label?: string; items: NavItem[] }

// Grouped by the job the user is doing. Labelled groups fold; the group
// holding the active view is always open.
const NAV_GROUPS: NavGroup[] = [
    { id: "home", items: [{ id: "dashboard", label: "Overview", icon: "house" }] },
    {
        id: "compliance",
        label: "Compliance",
        items: [
            { id: "frameworks", label: "Frameworks", icon: "shield" },
            { id: "controls", label: "Controls", icon: "listChecks" },
            { id: "evidence", label: "Evidence", icon: "fileText" },
            { id: "policies", label: "Policies", icon: "book" },
        ],
    },
    {
        id: "risk",
        label: "Risk",
        items: [
            { id: "risks", label: "Risk register", icon: "warning" },
            { id: "vendors", label: "Vendors", icon: "globe" },
        ],
    },
    {
        id: "automation",
        label: "Automation",
        items: [{ id: "agents", label: "Agents", icon: "robot" }],
    },
]

// Workspaces the signed-in user belongs to. Switching changes the name in the
// sidebar and title bar; the sandbox shares the same demo data.
const WORKSPACES = [
    { id: "acme", name: "Acme Corp", env: "Production" },
    { id: "acme-sandbox", name: "Acme Sandbox", env: "Sandbox · test data" },
]

// Time-range filter configuration.
// `ms` controls how far back activity / control-test history extends.
// `period` is the human label used in stat-card deltas ("+412 this month").
// `frameworksDelta` / `evidenceDelta` / `gapsResolvedDelta` scale with the
// chosen range so the KPI strip feels alive when the user changes filter.
const DAY = 24 * 60 * 60 * 1000
type RangeKey = "7d" | "30d" | "90d" | "ytd"
const RANGE_CONFIG: Record<
    RangeKey,
    {
        label: string
        ms: number
        period: string
        frameworksDelta: number
        evidenceDelta: number
        gapsResolvedDelta: number
    }
> = {
    "7d": {
        label: "Last 7 days",
        ms: 7 * DAY,
        period: "this week",
        frameworksDelta: 1,
        evidenceDelta: 96,
        gapsResolvedDelta: 1,
    },
    "30d": {
        label: "Last 30 days",
        ms: 30 * DAY,
        period: "this month",
        frameworksDelta: 2,
        evidenceDelta: 412,
        gapsResolvedDelta: 3,
    },
    "90d": {
        label: "Last 90 days",
        ms: 90 * DAY,
        period: "this quarter",
        frameworksDelta: 5,
        evidenceDelta: 1247,
        gapsResolvedDelta: 8,
    },
    ytd: {
        label: "Year to date",
        ms: 365 * DAY,
        period: "year to date",
        frameworksDelta: 12,
        evidenceDelta: 5180,
        gapsResolvedDelta: 15,
    },
}

// ============ MAIN COMPONENT ============

export default function ComplianceDashboard() {
    const [activeNav, setActiveNav] = React.useState("dashboard")
    // Filter text for the Controls table (set by its own search field and by
    // drill-downs). Global search lives in the ⌘K palette.
    const [searchQuery, setSearchQuery] = React.useState("")
    const [showPalette, setShowPalette] = React.useState(false)
    const [showShortcuts, setShowShortcuts] = React.useState(false)
    const [signedOut, setSignedOut] = React.useState(false)
    const [workspaceId, setWorkspaceId] = React.useState(() => {
        try {
            return window.localStorage.getItem("compliance-workspace") ?? "acme"
        } catch {
            return "acme"
        }
    })
    const workspace = WORKSPACES.find((w) => w.id === workspaceId) ?? WORKSPACES[0]
    const switchWorkspace = (id: string) => {
        setWorkspaceId(id)
        try {
            window.localStorage.setItem("compliance-workspace", id)
        } catch {
            // ignore (eg. private mode)
        }
    }
    // Global shortcuts: ⌘K toggles search, ⌘/ shows the shortcut sheet.
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!(e.metaKey || e.ctrlKey)) return
            if (e.key.toLowerCase() === "k") {
                e.preventDefault()
                setShowPalette((v) => !v)
            } else if (e.key === "/") {
                e.preventDefault()
                setShowShortcuts((v) => !v)
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [])
    const [timeRange, setTimeRange] = React.useState<RangeKey>("30d")
    const [runningTests, setRunningTests] = React.useState<Set<string>>(
        new Set()
    )
    const [, setTick] = React.useState(0)
    const [showNotif, setShowNotif] = React.useState(false)
    // Number of new notifications since last opening the panel. The bell
    // badge shows this count; opening the panel resets it to zero.
    const TOTAL_NOTIFICATIONS = 2
    const [notifUnread, setNotifUnread] = React.useState(TOTAL_NOTIFICATIONS)
    const openNotif = React.useCallback(() => {
        setShowNotif((open) => {
            const next = !open
            if (next) setNotifUnread(0)
            return next
        })
    }, [])
    const [showRange, setShowRange] = React.useState(false)
    const [newAssessment, setNewAssessment] = React.useState(false)
    const [selectedActivity, setSelectedActivity] =
        React.useState<Activity | null>(null)
    const [selectedActivityTab, setSelectedActivityTab] = React.useState<
        "timeline" | "chat"
    >("timeline")
    const [selectedFramework, setSelectedFramework] =
        React.useState<Framework | null>(null)

    const [activityLog, setActivityLog] =
        React.useState<Activity[]>(ACTIVITY_SEED)
    // Control changes persist on this device, so the app picks up where you left it.
    const [controlOverrides, setControlOverrides] = usePersistentState<
        Record<string, CtlStatus>
    >("app-control-status", {})
    // Per-control lastTestMin overrides, set by the auto-resolver when it
    // flips a control to "passing" so the displayed timestamp staggers
    // instead of clustering on identical "Xm ago" values.
    const [controlLastTestOverrides, setControlLastTestOverrides] =
        React.useState<Record<string, number>>({})
    const [resolvedFlash, setResolvedFlash] = React.useState<Set<string>>(
        new Set()
    )
    const EVIDENCE_BASELINE = 2847
    const [evidenceCount, setEvidenceCount] =
        React.useState(EVIDENCE_BASELINE)
    const evidenceLiveDrift = evidenceCount - EVIDENCE_BASELINE
    const [evidenceBump, setEvidenceBump] = React.useState(0)
    const [addedControls, setAddedControls] = usePersistentState<Ctl[]>("app-added-controls", [])
    const [showAddControl, setShowAddControl] = React.useState(false)
    const [exportScope, setExportScope] = React.useState<ExportScope | null>(
        null
    )
    // True while a vendor workspace is open · it lays out edge-to-edge and
    // scrolls internally, so the content area drops its padding and scroll.
    const [vendorWorkspaceOpen, setVendorWorkspaceOpen] = React.useState(false)
    const [theme, setTheme] = React.useState<"dark" | "light">(() => {
        if (typeof window === "undefined") return "dark"
        try {
            const saved = window.localStorage.getItem("compliance-theme")
            return saved === "light" ? "light" : "dark"
        } catch {
            return "dark"
        }
    })
    // Dropdown + modal flags for the sidebar and topbar surfaces.
    const [showWorkspaceMenu, setShowWorkspaceMenu] = React.useState(false)
    const [showUserMenu, setShowUserMenu] = React.useState(false)
    const [showSettings, setShowSettings] = React.useState(false)
    const [showTrustCenter, setShowTrustCenter] = React.useState(false)

    // Nav handoffs · when a dashboard stat or notification triggers a jump,
    // we set a seed value here, ControlsView reads it on next render, and we
    // reset to null in onSeedConsumed so the same value can fire again.
    const [controlsSeedStatus, setControlsSeedStatus] =
        React.useState<CtlStatus | null>(null)
    const [selectedControlId, setSelectedControlId] = React.useState<
        string | null
    >(null)

    // Per-activity chat threads · keyed by activity.id so a conversation
    // survives closing/reopening the AgentRunPanel.
    const [agentChats, setAgentChats] = React.useState<
        Record<string, ChatMessage[]>
    >({})
    const setChatFor = React.useCallback(
        (
            activityId: string,
            updater: (prev: ChatMessage[]) => ChatMessage[]
        ) => {
            setAgentChats((all) => ({
                ...all,
                [activityId]: updater(all[activityId] ?? []),
            }))
        },
        []
    )
    const drillToControls = React.useCallback(
        (status: CtlStatus | null, searchTerm: string | null = null) => {
            setControlsSeedStatus(status)
            if (searchTerm !== null) setSearchQuery(searchTerm)
            setActiveNav("controls")
        },
        []
    )
    // Mirror the theme class onto <html> so portalled popovers (rendered
    // outside this root) resolve the same tokens.
    React.useEffect(() => {
        const root = document.documentElement
        root.classList.toggle("theme-light", theme === "light")
        root.classList.toggle("theme-dark", theme !== "light")
    }, [theme])
    const toggleTheme = React.useCallback(() => {
        setTheme((t) => {
            const next = t === "dark" ? "light" : "dark"
            try {
                window.localStorage.setItem("compliance-theme", next)
            } catch {
                // ignore (eg. private mode)
            }
            return next
        })
    }, [])

    // Manual run from the Agents page: shows as running, completes after a few seconds.
    const runAgent = (agent: string) => {
        const id = `manual-${Date.now()}`
        setActivityLog((prev) =>
            [{ id, agent, action: "ran a manual check on", target: "its full scope", status: "running" as const, createdAt: Date.now() }, ...prev].slice(0, 8)
        )
        setTimeout(() => {
            setActivityLog((prev) => prev.map((a) => (a.id === id ? { ...a, status: "complete" as const, createdAt: Date.now() } : a)))
        }, 6000)
    }

    const overridesRef = React.useRef(controlOverrides)
    React.useEffect(() => {
        overridesRef.current = controlOverrides
    }, [controlOverrides])

    React.useEffect(() => {
        const t = setInterval(() => setTick((x) => x + 1), 5000)
        return () => clearInterval(t)
    }, [])

    React.useEffect(() => {
        let i = 0
        const inject = () => {
            const template = ACTIVITY_POOL[i % ACTIVITY_POOL.length]
            i++
            // Agents paused on the Agents page don't run in the background.
            try {
                const paused: string[] = JSON.parse(window.localStorage.getItem("app-agents-paused") ?? "[]")
                if (paused.includes(template.agent)) return
            } catch {
                // ignore (eg. private mode)
            }
            const activity = {
                ...template,
                id: `live-${Date.now()}-${i}`,
                createdAt: Date.now(),
            }
            setActivityLog((prev) => [activity, ...prev].slice(0, 8))
        }
        const first = setTimeout(inject, 9000)
        const interval = setInterval(inject, 28000)
        return () => {
            clearTimeout(first)
            clearInterval(interval)
        }
    }, [])

    React.useEffect(() => {
        // Floor for the background resolver. Once we're down to this many
        // open items (gap + review), the resolver stops so the demo always
        // has "some work in progress" rather than degenerating to 100%.
        const RESOLVER_FLOOR = 4
        const resolve = () => {
            // Controls with 0 evidence stay as gaps · the resolver only
            // closes things that already have evidence collected.
            const reviewable = CONTROLS.filter((c) => {
                const s = overridesRef.current[c.id] ?? c.status
                return (s === "review" || s === "gap") && c.evidence > 0
            })
            if (reviewable.length <= RESOLVER_FLOOR) return
            const target =
                reviewable[Math.floor(Math.random() * reviewable.length)]
            const wasGap =
                (overridesRef.current[target.id] ?? target.status) === "gap"
            setControlOverrides((prev) => ({ ...prev, [target.id]: "passing" }))
            // Stagger the displayed "Xm ago" so a burst of resolutions doesn't
            // all read identically. Each control gets a fresh 0-3 min ago value.
            setControlLastTestOverrides((prev) => ({
                ...prev,
                [target.id]: Math.floor(Math.random() * 4),
            }))
            setResolvedFlash((prev) => new Set(prev).add(target.id))
            setTimeout(() => {
                setResolvedFlash((prev) => {
                    const n = new Set(prev)
                    n.delete(target.id)
                    return n
                })
            }, 2500)
            setActivityLog((prev) =>
                [
                    {
                        id: `auto-${Date.now()}-${target.id}`,
                        agent: "Controls Agent",
                        action: wasGap ? "resolved gap in" : "validated",
                        target: target.id,
                        status: "complete" as const,
                        createdAt: Date.now(),
                    },
                    ...prev,
                ].slice(0, 8)
            )
        }
        const first = setTimeout(resolve, 6000)
        const interval = setInterval(resolve, 20000)
        return () => {
            clearTimeout(first)
            clearInterval(interval)
        }
    }, [])

    React.useEffect(() => {
        const tickEvidence = () => {
            const inc = 1 + Math.floor(Math.random() * 4)
            setEvidenceCount((c) => c + inc)
            setEvidenceBump((b) => b + 1)
        }
        const first = setTimeout(tickEvidence, 4000)
        const interval = setInterval(tickEvidence, 7500)
        return () => {
            clearTimeout(first)
            clearInterval(interval)
        }
    }, [])

    React.useEffect(() => {
        if (!selectedActivity) return
        const latest = activityLog.find((a) => a.id === selectedActivity.id)
        if (latest && latest !== selectedActivity) setSelectedActivity(latest)
    }, [activityLog, selectedActivity])

    React.useEffect(() => {
        if (!selectedActivity) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedActivity(null)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [selectedActivity])

    React.useEffect(() => {
        if (activeNav !== "frameworks") setSelectedFramework(null)
    }, [activeNav])

    const runTest = (id: string) => {
        if (runningTests.has(id)) return
        setRunningTests((p) => new Set(p).add(id))
        setTimeout(() => {
            setRunningTests((p) => {
                const n = new Set(p)
                n.delete(id)
                return n
            })
            setControlOverrides((prev) => ({ ...prev, [id]: "passing" }))
        }, 2400)
    }

    const startAssessment = () => {
        setNewAssessment(true)
    }
    const handleSelectActivity = (
        a: Activity,
        preferTab: "timeline" | "chat" = "timeline"
    ) => {
        if (selectedActivity?.id === a.id) {
            setSelectedActivity(null)
        } else {
            setSelectedActivity(a)
            setSelectedActivityTab(preferTab)
        }
    }
    const handleSelectFramework = (f: Framework) => {
        setSelectedFramework(f)
        setActiveNav("frameworks")
    }

    const effectiveControls = React.useMemo(
        () =>
            [...CONTROLS, ...addedControls].map((c: Ctl) => ({
                ...c,
                status: controlOverrides[c.id] ?? c.status,
                lastTestMin:
                    controlLastTestOverrides[c.id] ?? c.lastTestMin,
            })),
        [controlOverrides, controlLastTestOverrides, addedControls]
    )
    const filteredControls = React.useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return effectiveControls
        return effectiveControls.filter(
            (c) =>
                c.id.toLowerCase().includes(q) ||
                c.title.toLowerCase().includes(q) ||
                c.fw.toLowerCase().includes(q) ||
                c.owner.toLowerCase().includes(q)
        )
    }, [searchQuery, effectiveControls])

    // Apply the time-range filter on top of the search filter, for use by the
    // dashboard's "recent control tests" list. lastTestMin is minutes-ago.
    const rangeMinutes = RANGE_CONFIG[timeRange].ms / 60000
    const dashboardRecentControls = React.useMemo(() => {
        return filteredControls.filter((c) => c.lastTestMin <= rangeMinutes)
    }, [filteredControls, rangeMinutes])

    // Activity feed entries falling outside the range get hidden on dashboard.
    const rangeActivityLog = React.useMemo(() => {
        const cutoff = Date.now() - RANGE_CONFIG[timeRange].ms
        return activityLog.filter((a) => a.createdAt >= cutoff)
    }, [activityLog, timeRange])

    const totalControls = FRAMEWORKS.reduce(
        (s: number, f: Framework) => s + f.total,
        0
    )
    const basePassing = FRAMEWORKS.reduce(
        (s: number, f: Framework) => s + f.passing,
        0
    )
    const baseGaps = FRAMEWORKS.reduce(
        (s: number, f: Framework) => s + f.gaps,
        0
    )

    const stats = React.useMemo(() => {
        let resolvedFromGap = 0
        let resolvedFromReview = 0
        Object.entries(controlOverrides).forEach(([id, newStatus]) => {
            const orig = (CONTROLS as Ctl[]).find((c) => c.id === id)?.status
            if (newStatus === "passing") {
                if (orig === "gap") resolvedFromGap++
                if (orig === "review") resolvedFromReview++
            }
        })
        const resolvedTotal = resolvedFromGap + resolvedFromReview
        const passingControls = basePassing + resolvedTotal
        const gaps = Math.max(0, baseGaps - resolvedFromGap)
        return {
            passingControls,
            gaps,
            passingPct: Math.round((passingControls / totalControls) * 100),
        }
    }, [controlOverrides, basePassing, baseGaps, totalControls])

    const paletteItems = React.useMemo<PaletteItem[]>(() => {
        const go = (id: string) => {
            setSelectedFramework(null)
            setActiveNav(id)
        }
        const statusLabel: Record<CtlStatus, string> = {
            passing: "Passing",
            review: "In review",
            gap: "Gap",
        }
        return [
            { id: "act-assess", group: "Actions", label: "New assessment", icon: "plus", run: () => setNewAssessment(true) },
            { id: "act-control", group: "Actions", label: "Add control", icon: "plus", run: () => setShowAddControl(true) },
            {
                id: "act-export",
                group: "Actions",
                label: "Export report",
                icon: "download",
                run: () =>
                    setExportScope({ label: "All controls", rows: effectiveControls }),
            },
            { id: "act-trust", group: "Actions", label: "Open Trust Center", icon: "shieldCheck", run: () => setShowTrustCenter(true) },
            { id: "act-settings", group: "Actions", label: "Settings", icon: "gear", keywords: "preferences notifications", run: () => setShowSettings(true) },
            {
                id: "act-theme",
                group: "Actions",
                label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
                icon: theme === "dark" ? "sun" : "moon",
                keywords: "theme appearance mode",
                run: toggleTheme,
            },
            ...NAV_GROUPS.flatMap((g) =>
                g.items.map((n) => ({
                    id: `nav-${n.id}`,
                    group: "Pages",
                    label: n.label,
                    sub: g.label,
                    icon: n.icon,
                    run: () => go(n.id),
                }))
            ),
            ...(FRAMEWORKS as Framework[]).map((f) => ({
                id: `fw-${f.id}`,
                group: "Frameworks",
                label: f.name,
                sub: f.desc,
                icon: "shield" as const,
                hint: `${Math.round((f.passing / f.total) * 100)}%`,
                run: () => handleSelectFramework(f),
            })),
            ...effectiveControls.map((c) => ({
                id: `ctl-${c.id}-${c.fw}`,
                group: "Controls",
                label: c.title,
                sub: `${c.id} · ${c.fw} · ${c.owner}`,
                icon: "listChecks" as const,
                keywords: `${c.id} ${c.fw} ${c.owner}`,
                hint: statusLabel[c.status],
                run: () => setSelectedControlId(c.id),
            })),
            {
                id: "vendor-twilio",
                group: "Vendors",
                label: "Twilio",
                sub: "Communications API · evidence collection",
                icon: "globe",
                keywords: "vendor tprm",
                run: () => go("vendors"),
            },
        ]
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveControls, theme])
    const pageTitle = (() => {
        const item = NAV_GROUPS.flatMap((g) => g.items).find((n) => n.id === activeNav)
        const page = activeNav === "frameworks" && selectedFramework ? selectedFramework.name : item?.label
        return `${workspace.name} · ${page ?? "Overview"}`
    })()
    const paletteSuggested = [
        "act-assess",
        "nav-controls",
        "nav-frameworks",
        "vendor-twilio",
        "act-export",
        "act-theme",
    ]

    return (
        <>
            <GlobalStyles />
            {/* Desktop: the app is a frosted window floating over the
                wallpaper. Narrow viewports go edge to edge (see .zdesk). */}
            <div
                className={`zdesk ${theme === "light" ? "theme-light" : "theme-dark"}`}
                style={{
                    width: "100%",
                    height: "100%",
                    background: C.bg,
                    color: C.text,
                    font: `400 14px/20px ${FONT}`,
                    letterSpacing: "-0.005em",
                    position: "relative",
                    // Own stacking context so the backdrop (z -1) sits above
                    // this fill but beneath the window.
                    isolation: "isolate",
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <div className="zbackdrop" aria-hidden />
            <div
                className="zwindow"
                style={{
                    flex: 1,
                    maxWidth: 1600,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                    background: C.windowGlass,
                    border: `1px solid ${C.borderHi}`,
                    boxShadow: `${C.shadowLg}, inset 0 1px 0 ${C.glassEdge}`,
                }}
            >
                <TopBar
                    title={signedOut ? "Plumb" : pageTitle}
                    tools={!signedOut}
                    onOpenSearch={() => setShowPalette(true)}
                    showNotif={showNotif}
                    setShowNotif={setShowNotif}
                    notifUnread={notifUnread}
                    onToggleNotif={openNotif}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />
                <div style={{ flex: 1, minHeight: 0, display: "flex", visibility: signedOut ? "hidden" : "visible" }}>
                <Sidebar
                    activeNav={activeNav}
                    setActiveNav={setActiveNav}
                    showWorkspaceMenu={showWorkspaceMenu}
                    setShowWorkspaceMenu={setShowWorkspaceMenu}
                    showUserMenu={showUserMenu}
                    setShowUserMenu={setShowUserMenu}
                    workspace={workspace}
                    onSwitchWorkspace={switchWorkspace}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onOpenShortcuts={() => setShowShortcuts(true)}
                    onSignOut={() => setSignedOut(true)}
                    onOpenSettings={() => setShowSettings(true)}
                    onOpenTrustCenter={() => setShowTrustCenter(true)}
                    // Count what the Controls page lists, so the badge matches what a click shows.
                    badges={{ controls: effectiveControls.filter((c) => c.status === "gap").length }}
                />
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            minHeight: 0,
                            ...(activeNav === "vendors" && vendorWorkspaceOpen
                                ? { overflow: "hidden", padding: 0 }
                                : { overflow: "auto", padding: "28px 32px 60px 32px" }),
                        }}
                    >
                        {activeNav === "dashboard" && (
                            <DashboardView
                                timeRange={timeRange}
                                setTimeRange={setTimeRange}
                                showRange={showRange}
                                setShowRange={setShowRange}
                                startAssessment={startAssessment}
                                stats={stats}
                                totalControls={totalControls}
                                evidenceCount={evidenceCount}
                                evidenceBump={evidenceBump}
                                evidenceLiveDrift={evidenceLiveDrift}
                                baseGaps={baseGaps}
                                activityLog={rangeActivityLog}
                                filteredControls={dashboardRecentControls.slice(
                                    0,
                                    8
                                )}
                                searchQuery={searchQuery}
                                runningTests={runningTests}
                                resolvedFlash={resolvedFlash}
                                runTest={runTest}
                                onSelectActivity={handleSelectActivity}
                                selectedActivityId={selectedActivity?.id}
                                onSelectFramework={handleSelectFramework}
                                onNavigate={setActiveNav}
                                onDrillToControls={drillToControls}
                                agentChats={agentChats}
                                onAddControl={() => setShowAddControl(true)}
                                onExport={() =>
                                    setExportScope({ label: "All controls", rows: effectiveControls })
                                }
                                onOpenTrustCenter={() => setShowTrustCenter(true)}
                                onOpenSettings={() => setShowSettings(true)}
                            />
                        )}
                        {activeNav === "controls" && (
                            <ControlsView
                                effectiveControls={effectiveControls}
                                runningTests={runningTests}
                                resolvedFlash={resolvedFlash}
                                runTest={runTest}
                                setControlOverrides={setControlOverrides}
                                onAddControl={() => setShowAddControl(true)}
                                onExportAll={() =>
                                    setExportScope({ label: "All controls", rows: effectiveControls })
                                }
                                onExportSelected={(ids) =>
                                    setExportScope({
                                        label: "Selected controls",
                                        rows: effectiveControls.filter((c) => ids.has(c.id)),
                                    })
                                }
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                seedStatusFilter={controlsSeedStatus}
                                onSeedConsumed={() => {
                                    setControlsSeedStatus(null)
                                }}
                                onSelectControl={setSelectedControlId}
                            />
                        )}
                        {activeNav === "frameworks" && !selectedFramework && (
                            <FrameworksListView
                                onSelect={handleSelectFramework}
                                effectiveControls={effectiveControls}
                            />
                        )}
                        {activeNav === "frameworks" && selectedFramework && (
                            <FrameworkDetailView
                                framework={selectedFramework}
                                effectiveControls={effectiveControls}
                                runningTests={runningTests}
                                resolvedFlash={resolvedFlash}
                                runTest={runTest}
                                onBack={() => setSelectedFramework(null)}
                                onExport={() =>
                                    setExportScope({
                                        label: selectedFramework.name,
                                        rows: effectiveControls.filter((c) => c.fw === selectedFramework.fw),
                                    })
                                }
                                onSelectControl={setSelectedControlId}
                            />
                        )}
                        {activeNav === "vendors" && (
                            <VendorsView
                                onOpenChange={setVendorWorkspaceOpen}
                            />
                        )}
                        {activeNav === "evidence" && (
                            <EvidenceView controls={effectiveControls} onOpenControl={setSelectedControlId} />
                        )}
                        {activeNav === "policies" && (
                            <PoliciesView controls={effectiveControls} onOpenControl={setSelectedControlId} />
                        )}
                        {activeNav === "risks" && (
                            <RisksView controls={effectiveControls} onOpenControl={setSelectedControlId} />
                        )}
                        {activeNav === "agents" && <AgentsView activities={activityLog} onRunAgent={runAgent} />}
                    </div>
                </div>

                </div>
                {showNotif && (
                    <div
                        onClick={() => setShowNotif(false)}
                        style={{ position: "absolute", inset: 0, zIndex: 50 }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: "absolute",
                                top: 48,
                                right: 24,
                                width: 360,
                                background: C.surfaceHi,
                                border: `1px solid ${C.borderHi}`,
                                borderRadius: 12,
                                boxShadow: C.shadowLg,
                                animation: "zfade 160ms ease",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    padding: "14px 16px",
                                    borderBottom: `1px solid ${C.border}`,
                                    font: `600 13px/18px ${FONT}`,
                                }}
                            >
                                Notifications
                            </div>
                            {[
                                {
                                    t: "ISO 42001 control 6.2.4 marked as gap",
                                    s: "Just now",
                                    c: C.danger,
                                    nav: () => {
                                        drillToControls("gap", "6.2.4")
                                        setShowNotif(false)
                                    },
                                },
                                {
                                    t: "Twilio replied on HIPAA BAA Template",
                                    s: "4 hours ago",
                                    c: C.warning,
                                    nav: () => {
                                        setActiveNav("vendors")
                                        setShowNotif(false)
                                    },
                                },
                            ].map((n, i) => (
                                <div
                                    key={i}
                                    className="zrow"
                                    onClick={n.nav}
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        padding: "12px 16px",
                                        borderBottom:
                                            i < 1
                                                ? `1px solid ${C.border}`
                                                : "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: 999,
                                            background: n.c,
                                            marginTop: 6,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                font: `500 13px/18px ${FONT}`,
                                                color: C.text,
                                            }}
                                        >
                                            {n.t}
                                        </div>
                                        <div
                                            style={{
                                                font: `400 11px/14px ${FONT}`,
                                                color: C.textSubtle,
                                                marginTop: 2,
                                            }}
                                        >
                                            {n.s}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <ShortcutsModal open={showShortcuts && !signedOut} close={() => setShowShortcuts(false)} />
                {signedOut && (
                    // Sits on the bare window glass (app content is hidden) until the user signs back in.
                    <div
                        style={{
                            position: "absolute",
                            inset: "46px 0 0 0",
                            zIndex: 110,
                            display: "flex",
                        }}
                    >
                        <SignedOut workspace={workspace.name} onSignIn={() => setSignedOut(false)} />
                    </div>
                )}
                <CommandPalette
                    open={showPalette && !signedOut}
                    onClose={() => setShowPalette(false)}
                    items={paletteItems}
                    suggestedIds={paletteSuggested}
                />
                <NewAssessmentModal
                    open={newAssessment}
                    close={() => setNewAssessment(false)}
                />

                {selectedActivity && (
                    <AgentRunPanel
                        activity={selectedActivity}
                        close={() => setSelectedActivity(null)}
                        chatMessages={agentChats[selectedActivity.id] ?? []}
                        setChatMessages={(updater) =>
                            setChatFor(selectedActivity.id, updater)
                        }
                        initialTab={selectedActivityTab}
                    />
                )}
                {selectedControlId &&
                    (() => {
                        const c = effectiveControls.find(
                            (x) => x.id === selectedControlId
                        )
                        if (!c) return null
                        return (
                            <ControlDetailPanel
                                control={c}
                                pageLoadMs={PAGE_LOAD_MS}
                                onClose={() => setSelectedControlId(null)}
                                onRunTest={() => runTest(c.id)}
                                running={runningTests.has(c.id)}
                                onMarkReview={() => {
                                    setControlOverrides((prev) => ({
                                        ...prev,
                                        [c.id]: "review",
                                    }))
                                }}
                            />
                        )
                    })()}
                <AddControlModal
                    open={showAddControl}
                    close={() => setShowAddControl(false)}
                    existingIds={
                        new Set(effectiveControls.map((c) => c.id))
                    }
                    onAdd={(ctl) => {
                        setAddedControls((prev) => [...prev, ctl])
                    }}
                />
                <ExportModal
                    open={exportScope !== null}
                    close={() => setExportScope(null)}
                    scope={exportScope}
                />
                <SettingsModal
                    open={showSettings}
                    close={() => setShowSettings(false)}
                />
                <TrustCenterModal
                    open={showTrustCenter}
                    close={() => setShowTrustCenter(false)}
                />
            </div>
            </div>
        </>
    )
}

// ============ SIDEBAR ============

function Sidebar({
    activeNav,
    setActiveNav,
    showWorkspaceMenu,
    setShowWorkspaceMenu,
    showUserMenu,
    setShowUserMenu,
    workspace,
    onSwitchWorkspace,
    theme,
    toggleTheme,
    onOpenShortcuts,
    onSignOut,
    onOpenSettings,
    onOpenTrustCenter,
    badges,
}: {
    badges?: Record<string, number>
    activeNav: string
    setActiveNav: (s: string) => void
    showWorkspaceMenu: boolean
    setShowWorkspaceMenu: (b: boolean) => void
    showUserMenu: boolean
    setShowUserMenu: (b: boolean) => void
    workspace: (typeof WORKSPACES)[number]
    onSwitchWorkspace: (id: string) => void
    theme: "dark" | "light"
    toggleTheme: () => void
    onOpenShortcuts: () => void
    onSignOut: () => void
    onOpenSettings: () => void
    onOpenTrustCenter: () => void
}) {
    const workspaceItems: DropdownItem[] = [
        ...WORKSPACES.map((w) => ({
            label: w.name,
            sub: w.env,
            check: w.id === workspace.id,
            onClick: () => onSwitchWorkspace(w.id),
        })),
        "divider",
        { label: "Workspace settings", icon: "gear", onClick: onOpenSettings },
    ]
    const userMenuItems: DropdownItem[] = [
        { label: "Settings", icon: "gear", onClick: onOpenSettings },
        {
            label: theme === "dark" ? "Light theme" : "Dark theme",
            icon: theme === "dark" ? "sun" : "moon",
            onClick: toggleTheme,
        },
        { label: "Keyboard shortcuts", icon: "keyboard", right: "⌘/", onClick: onOpenShortcuts },
        "divider",
        { label: "Sign out", icon: "logout", onClick: onSignOut },
    ]
    return (
        <div
            style={{
                width: 232,
                flexShrink: 0,
                background: "transparent",
                borderRight: `1px solid ${C.border}`,
                display: "flex",
                flexDirection: "column",
                padding: "16px 12px",
            }}
        >
            <div style={{ position: "relative", marginBottom: 18 }}>
                <button
                    onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                    aria-haspopup="menu"
                    aria-expanded={showWorkspaceMenu}
                    className="znav"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        cursor: "pointer",
                        background: "transparent",
                        border: "none",
                        textAlign: "left",
                    }}
                >
                    <div
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            border: `1px solid ${C.borderHi}`,
                            background: C.surfaceHi,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            font: `500 15px/1 ${SERIF}`,
                            color: C.text,
                            flexShrink: 0,
                        }}
                    >
                        {workspace.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                font: `600 13px/16px ${FONT}`,
                                color: C.text,
                            }}
                        >
                            {workspace.name}
                        </div>
                        <div
                            style={{
                                font: `500 11px/14px ${FONT}`,
                                color: C.textSubtle,
                                marginTop: 1,
                            }}
                        >
                            {workspace.env}
                        </div>
                    </div>
                    <Icon n="caretDown" s={12} c={C.textSubtle} />
                </button>
                {showWorkspaceMenu && (
                    <DropdownMenu
                        items={workspaceItems}
                        onClose={() => setShowWorkspaceMenu(false)}
                        top={48}
                        left={0}
                        width={220}
                    />
                )}
            </div>
            <nav
                aria-label="Main"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    margin: "0 -4px",
                    padding: "0 4px",
                }}
            >
                {NAV_GROUPS.map((g) => (
                    <NavSection
                        key={g.id}
                        group={g}
                        activeNav={activeNav}
                        setActiveNav={setActiveNav}
                        badges={badges}
                    />
                ))}
                <NavSection
                    group={{
                        id: "workspace",
                        label: "Workspace",
                        items: [
                            { id: "__settings", label: "Settings", icon: "gear" },
                            { id: "__trust", label: "Trust Center", icon: "shieldCheck" },
                        ],
                    }}
                    activeNav={activeNav}
                    setActiveNav={(id) =>
                        id === "__settings" ? onOpenSettings() : onOpenTrustCenter()
                    }
                    defaultOpen={false}
                />
            </nav>

            <div style={{ position: "relative" }}>
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-haspopup="menu"
                    aria-expanded={showUserMenu}
                    className="znav"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        cursor: "pointer",
                        background: "transparent",
                        border: "none",
                        textAlign: "left",
                    }}
                >
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            background: C.surfaceHover,
                            border: `1px solid ${C.border}`,
                            color: C.text,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            font: `600 12px/12px ${FONT}`,
                            flexShrink: 0,
                        }}
                    >
                        SG
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                font: `500 13px/16px ${FONT}`,
                                color: C.text,
                            }}
                        >
                            Sarah Goldberg
                        </div>
                        <div
                            style={{
                                font: `400 11px/14px ${FONT}`,
                                color: C.textSubtle,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Head of GRC
                        </div>
                    </div>
                </button>
                {showUserMenu && (
                    <DropdownMenu
                        items={userMenuItems}
                        onClose={() => setShowUserMenu(false)}
                        top={-196}
                        left={0}
                        width={224}
                    />
                )}
            </div>
        </div>
    )
}

// ============ TOP BAR ============

function NavSection({
    group,
    activeNav,
    setActiveNav,
    badges,
    defaultOpen = true,
}: {
    group: NavGroup
    activeNav: string
    setActiveNav: (id: string) => void
    badges?: Record<string, number>
    defaultOpen?: boolean
}) {
    const storageKey = `nav-group-${group.id}`
    const [open, setOpen] = React.useState<boolean>(() => {
        try {
            const v = window.localStorage.getItem(storageKey)
            return v === null ? defaultOpen : v === "1"
        } catch {
            return defaultOpen
        }
    })
    const holdsActive = group.items.some((i) => i.id === activeNav)
    const expanded = !group.label || open || holdsActive
    const toggle = () => {
        const next = !open
        setOpen(next)
        try {
            window.localStorage.setItem(storageKey, next ? "1" : "0")
        } catch {
            // ignore (private mode)
        }
    }
    return (
        <div>
            {group.label && (
                <button
                    onClick={toggle}
                    aria-expanded={expanded}
                    className="znav"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        width: "100%",
                        padding: "4px 10px",
                        marginBottom: 2,
                        background: "transparent",
                        border: "none",
                        borderRadius: 6,
                        cursor: holdsActive ? "default" : "pointer",
                        font: `500 12px/16px ${FONT}`,
                        color: C.textSubtle,
                        textAlign: "left",
                    }}
                >
                    <span style={{ flex: 1 }}>{group.label}</span>
                    {!expanded && (
                        <span style={{ font: `500 10px/14px ${FONT}`, letterSpacing: 0 }}>
                            {group.items.length}
                        </span>
                    )}
                    <span
                        style={{
                            display: "flex",
                            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                            transition: "transform 180ms ease",
                            opacity: holdsActive ? 0.35 : 1,
                        }}
                    >
                        <Icon n="caretDown" s={11} c={C.textSubtle} />
                    </span>
                </button>
            )}
            <div className="zfold" data-open={expanded}>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {group.items.map((item) => {
                        const active = activeNav === item.id
                        const badge = badges?.[item.id]
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveNav(item.id)}
                                aria-current={active ? "page" : undefined}
                                tabIndex={expanded ? 0 : -1}
                                className={active ? "znav-active" : "znav"}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "7px 10px",
                                    borderRadius: 7,
                                    background: active ? C.hoverOverlay : "transparent",
                                    boxShadow: active ? `inset 0 0 0 1px ${C.border}` : "none",
                                    border: "none",
                                    cursor: "pointer",
                                    font: `${active ? 600 : 500} 13px/18px ${FONT}`,
                                    color: active ? C.text : C.textMuted,
                                    textAlign: "left",
                                    width: "100%",
                                    transition: "background 120ms, color 120ms",
                                }}
                            >
                                <Icon n={item.icon} s={15} c={active ? C.accentSoft : C.textMuted} />
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {badge ? (
                                    <span
                                        style={{
                                            font: `500 11px/14px ${FONT}`,
                                            color: C.danger,
                                        }}
                                        aria-label={`${badge} open gaps`}
                                    >
                                        {badge}
                                    </span>
                                ) : null}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function TopBar({
    title,
    tools = true,
    onOpenSearch,
    showNotif,
    setShowNotif,
    notifUnread,
    onToggleNotif,
    theme,
    toggleTheme,
}: {
    title: string
    // False while signed out: the title bar keeps only the window controls.
    tools?: boolean
    onOpenSearch: () => void
    showNotif: boolean
    setShowNotif: (b: boolean) => void
    notifUnread: number
    onToggleNotif: () => void
    theme: "dark" | "light"
    toggleTheme: () => void
}) {
    // Window title bar: decorative window controls, centered title, and the
    // app-level tools (search, notifications, theme) on the right.
    return (
        <div
            style={{
                height: 46,
                flexShrink: 0,
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                padding: "0 12px 0 16px",
                gap: 10,
                position: "relative",
            }}
        >
            <div aria-hidden style={{ display: "flex", gap: 8 }}>
                {["#EE6A5F", "#F5BF4F", "#62C554"].map((c) => (
                    <span
                        key={c}
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            background: c,
                            boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.25)",
                        }}
                    />
                ))}
            </div>
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    font: `500 12.5px/16px ${FONT}`,
                    color: C.textSubtle,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                }}
            >
                {title}
            </div>
            {tools && (
                <>
                <div style={{ flex: 1 }} />
                <button
                    onClick={onOpenSearch}
                    aria-label="Search (⌘K)"
                    aria-keyshortcuts="Meta+K"
                    className="zbtn"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        height: 30,
                        padding: "0 6px 0 10px",
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        cursor: "pointer",
                        font: `400 12.5px/16px ${FONT}`,
                        color: C.textMuted,
                    }}
                >
                    <Icon n="search" s={13} c={C.textMuted} />
                    <span style={{ marginRight: 14 }}>Search</span>
                    <Kbd>⌘K</Kbd>
                </button>
                <button
                    className="zicon"
                    onClick={onToggleNotif}
                    aria-label={`Notifications${notifUnread > 0 ? ` · ${notifUnread} unread` : ""}`}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                    }}
                >
                    <Icon n="bell" s={16} c={C.textMuted} />
                    {notifUnread > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                top: 5,
                                right: 4,
                                minWidth: 15,
                                height: 15,
                                padding: "0 4px",
                                boxSizing: "border-box",
                                borderRadius: 999,
                                background: C.accent,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                font: `600 10px/15px ${FONT}`,
                                fontVariantNumeric: "tabular-nums",
                                color: C.accentFg,
                            }}
                        >
                            {notifUnread > 9 ? "9+" : notifUnread}
                        </div>
                    )}
                </button>
                <button
                    className="zicon"
                    onClick={toggleTheme}
                    aria-label={
                        theme === "dark"
                            ? "Switch to light theme"
                            : "Switch to dark theme"
                    }
                    title={
                        theme === "dark"
                            ? "Switch to light theme"
                            : "Switch to dark theme"
                    }
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Icon
                        n={theme === "dark" ? "sun" : "moon"}
                        s={16}
                        c={C.textMuted}
                   
                    />
                </button>
                </>
            )}
        </div>
    )
}

// ============ DASHBOARD VIEW ============

function DashboardView(props: any) {
    const {
        timeRange,
        setTimeRange,
        showRange,
        setShowRange,
        startAssessment,
        stats,
        totalControls,
        evidenceCount,
        evidenceBump,
        evidenceLiveDrift,
        baseGaps,
        activityLog,
        filteredControls,
        searchQuery,
        runningTests,
        resolvedFlash,
        runTest,
        onSelectActivity,
        selectedActivityId,
        onSelectFramework,
        onNavigate,
        onDrillToControls,
        agentChats,
        onAddControl,
        onExport,
        onOpenTrustCenter,
        onOpenSettings,
    } = props
    const rangeLabels: Record<string, string> = {
        "7d": "Last 7 days",
        "30d": "Last 30 days",
        "90d": "Last 90 days",
        ytd: "Year to date",
    }
    const range = RANGE_CONFIG[timeRange as RangeKey] ?? RANGE_CONFIG["30d"]
    const runningCount = activityLog.filter((a: Activity) => a.status === "running").length
    const testsPassing = filteredControls.filter((c: Ctl) => c.status === "passing").length
    // Ordered by urgency: open gaps, then sign-offs, then vendor blockers,
    // then work already in motion.
    const gapFrameworks = (FRAMEWORKS as Framework[])
        .filter((f) => f.gaps > 0)
        .sort((x, y) => y.gaps - x.gaps)
        .slice(0, 2)
    const inReview = (FRAMEWORKS as Framework[]).reduce((n, f) => n + f.review, 0)
    const attention: AttentionItem[] = [
        ...gapFrameworks.map((f) => ({
            id: `gap-${f.id}`,
            icon: "warning" as const,
            tone: C.danger,
            title: `Remediate ${f.gaps} gaps in ${f.name}`,
            meta: `${f.passing}/${f.total} passing`,
            action: "Remediate",
            onClick: () => onDrillToControls?.("gap", f.fw),
        })),
        {
            id: "review",
            icon: "eye",
            tone: C.warning,
            title: `Sign off ${inReview} controls waiting for review`,
            meta: `${FRAMEWORKS.length} frameworks`,
            action: "Review",
            onClick: () => onDrillToControls?.("review", null),
        },
        {
            id: "vendor-twilio",
            icon: "globe",
            tone: C.textMuted,
            title: "Twilio pen test report is blocked on an NDA",
            meta: "Vendor · tier 3",
            action: "Open",
            onClick: () => onNavigate?.("vendors"),
        },
    ]
    return (
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 28,
                }}
            >
                <div>
                    <div
                        style={{
                            font: `400 13px/16px ${FONT}`,
                            color: C.textSubtle,
                            marginBottom: 4,
                        }}
                    >
                        {new Date().toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                        })}
                    </div>
                    <h1
                        style={{
                            margin: 0,
                            font: `500 34px/40px ${SERIF}`,
                            letterSpacing: "-0.012em",
                            color: C.text,
                        }}
                    >
                        Compliance overview
                    </h1>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ position: "relative" }}>
                        <button
                            onClick={() => setShowRange(!showRange)}
                            className="zbtn"
                            style={{
                                ...btnSecondary,
                                ...(timeRange !== "30d" && {
                                    borderColor: C.accentLine,
                                    background: C.accentBg,
                                    color: C.accentSoft,
                                }),
                            }}
                        >
                            {timeRange !== "30d" && (
                                <span
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 999,
                                        background: C.accent,
                                        display: "inline-block",
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                            {rangeLabels[timeRange]}
                            <Icon
                                n="caretDown"
                                s={11}
                                c={
                                    timeRange !== "30d"
                                        ? C.accentSoft
                                        : C.textMuted
                                }
                               
                            />
                        </button>
                        {showRange && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 4px)",
                                    right: 0,
                                    width: 180,
                                    background: C.surfaceHi,
                                    border: `1px solid ${C.borderHi}`,
                                    borderRadius: 8,
                                    padding: 4,
                                    zIndex: 20,
                                    boxShadow: C.shadowLg,
                                    animation: "zfade 140ms ease",
                                }}
                            >
                                {Object.entries(rangeLabels).map(([k, v]) => (
                                    <button
                                        key={k}
                                        onClick={() => {
                                            setTimeRange(k)
                                            setShowRange(false)
                                        }}
                                        className="znav"
                                        style={{
                                            display: "flex",
                                            width: "100%",
                                            padding: "8px 10px",
                                            background:
                                                timeRange === k
                                                    ? C.accentBg
                                                    : "transparent",
                                            border: "none",
                                            borderRadius: 6,
                                            cursor: "pointer",
                                            font: `500 13px/18px ${FONT}`,
                                            color:
                                                timeRange === k
                                                    ? C.accentSoft
                                                    : C.textMuted,
                                            textAlign: "left",
                                        }}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={startAssessment}
                        className="zbtn"
                        style={btnPrimary}
                    >
                        <Icon n="plus" s={13} c={C.primaryFg} />
                        New assessment
                    </button>
                </div>
            </div>
            <section
                aria-label="Key metrics"
                style={{
                    ...panelStyle,
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    marginBottom: 28,
                }}
            >
                <StatCard
                    label="Controls passing"
                    value={`${stats.passingPct}%`}
                    delta={`${stats.passingControls} of ${totalControls}`}
                    deltaColor={C.textMuted}
                    onClick={() => onDrillToControls?.("passing", null)}
                />
                <StatCard
                    label="Open gaps"
                    value={String(stats.gaps)}
                    delta={
                        stats.gaps < baseGaps
                            ? `${baseGaps - stats.gaps} resolved ${range.period}`
                            : `−${range.gapsResolvedDelta} ${range.period}`
                    }
                    deltaColor={C.success}
                    onClick={() => onDrillToControls?.("gap", null)}
                />
                <StatCard
                    label="Evidence items"
                    value={evidenceCount.toLocaleString()}
                    delta={`+${(
                        range.evidenceDelta + (evidenceLiveDrift ?? 0)
                    ).toLocaleString()} ${range.period}`}
                    deltaColor={C.success}
                    bumpKey={evidenceBump}
                    onClick={() => onNavigate?.("evidence")}
                />
                <StatCard
                    label="Active frameworks"
                    value={String(FRAMEWORKS.length)}
                    delta={`+${range.frameworksDelta} ${range.period}`}
                    deltaColor={C.success}
                    onClick={() => onNavigate?.("frameworks")}
                />
            </section>

            <SectionHeader
                title="Needs attention"
                count={attention.length}
            />
            <section style={{ ...panelStyle, marginBottom: 12 }}>
                {attention.map((item, i) => (
                    <AttentionRow
                        key={item.id}
                        item={item}
                        last={i === attention.length - 1}
                    />
                ))}
            </section>
            <nav
                aria-label="Quick actions"
                style={{
                    ...panelStyle,
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    marginBottom: 32,
                }}
            >
                {(
                    [
                        ["plus", "Add control", onAddControl],
                        ["download", "Export report", onExport],
                        ["shieldCheck", "Trust Center", onOpenTrustCenter],
                        ["gear", "Settings", onOpenSettings],
                    ] as [keyof typeof I, string, () => void][]
                ).map(([icon, label, onClick], i) => (
                    <button
                        key={label}
                        onClick={onClick}
                        className="znav"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            padding: "11px 12px",
                            background: "transparent",
                            border: "none",
                            borderLeft: i === 0 ? "none" : `1px solid ${C.border}`,
                            borderRadius: 0,
                            cursor: "pointer",
                            font: `500 13px/18px ${FONT}`,
                            color: C.textMuted,
                        }}
                    >
                        <Icon n={icon} s={14} c={C.textSubtle} />
                        {label}
                    </button>
                ))}
            </nav>

            <SectionHeader
                title="Frameworks"
                count={FRAMEWORKS.length}
            />
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
                    gap: 12,
                    marginBottom: 32,
                }}
            >
                {(FRAMEWORKS as Framework[]).map((f) => (
                    <FrameworkCard
                        key={f.id}
                        f={f}
                        onClick={() => onSelectFramework(f)}
                    />
                ))}
            </div>

            <SectionHeader title="History" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Accordion
                    id="overview-activity"
                    title="Agent activity"
                    summary={`${activityLog.length} run${activityLog.length === 1 ? "" : "s"} · ${runningCount} running · ${rangeLabels[timeRange]?.toLowerCase() ?? ""}`}
                    right={
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                font: `500 11px/14px ${FONT}`,
                                color: C.success,
                            }}
                        >
                            <div
                                className="zlive-dot"
                                style={{ width: 6, height: 6, borderRadius: 999, background: C.success }}
                            />
                            Live
                        </div>
                    }
                >
                    {activityLog.map((a: Activity, i: number) => {
                        const msgs = agentChats?.[a.id] ?? []
                        // Has chat = at least one user message has been
                        // sent (welcome bubble alone doesn't count).
                        const hasChat = msgs.some(
                            (m: ChatMessage) => m.role === "user"
                        )
                        return (
                            <ActivityRow
                                key={a.id}
                                a={a}
                                last={i === activityLog.length - 1}
                                isNew={
                                    a.id.startsWith("live-") ||
                                    a.id.startsWith("auto-")
                                }
                                onClick={() => onSelectActivity(a)}
                                onOpenChat={() => onSelectActivity(a, "chat")}
                                active={selectedActivityId === a.id}
                                hasChat={hasChat}
                            />
                        )
                    })}
                </Accordion>
                <Accordion
                    id="overview-tests"
                    title="Recent control tests"
                    summary={
                        searchQuery
                            ? `${filteredControls.length} matching "${searchQuery}"`
                            : `${filteredControls.length} most recent · ${testsPassing} passing`
                    }
                >
                    {filteredControls.length === 0 && (
                        <div
                            style={{
                                padding: "40px 18px",
                                textAlign: "center",
                                color: C.textSubtle,
                                font: `400 13px/18px ${FONT}`,
                            }}
                        >
                            No controls match "{searchQuery}"
                        </div>
                    )}
                    {filteredControls.map((c: Ctl, i: number) => (
                        <DashboardControlRow
                            key={c.id}
                            c={c}
                            last={i === filteredControls.length - 1}
                            running={runningTests.has(c.id)}
                            flash={resolvedFlash.has(c.id)}
                            runTest={() => runTest(c.id)}
                        />
                    ))}
                </Accordion>
            </div>
        </div>
    )
}

type AttentionItem = {
    id: string
    icon: keyof typeof I
    tone: string
    title: string
    meta: string
    action: string
    onClick: () => void
}

function AttentionRow({ item, last }: { item: AttentionItem; last: boolean }) {
    return (
        <button
            onClick={item.onClick}
            className="zrow"
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "12px 18px",
                background: "transparent",
                border: "none",
                borderBottom: last ? "none" : `1px solid ${C.border}`,
                cursor: "pointer",
                textAlign: "left",
                color: C.text,
            }}
        >
            <span
                style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    background: `color-mix(in srgb, ${item.tone} 14%, transparent)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <Icon n={item.icon} s={13} c={item.tone} />
            </span>
            <span style={{ flex: 1, minWidth: 0, font: `500 13.5px/18px ${FONT}` }}>
                {item.title}
            </span>
            <span style={{ font: `400 11.5px/16px ${FONT}`, color: C.textSubtle }}>
                {item.meta}
            </span>
            <span
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    minWidth: 92,
                    justifyContent: "flex-end",
                    font: `500 12.5px/16px ${FONT}`,
                    color: C.textMuted,
                }}
            >
                {item.action}
            </span>
        </button>
    )
}

function StatCard({
    label,
    value,
    delta,
    deltaColor,
    bumpKey,
    onClick,
}: {
    label: string
    value: string
    delta: string
    deltaColor: string
    bumpKey?: number
    onClick?: () => void
}) {
    // A cell inside the shared KPI strip · the strip owns the glass panel.
    return (
        <button
            onClick={onClick}
            className="znav zkpi"
            style={{
                display: "block",
                textAlign: "left",
                background: "transparent",
                border: "none",
                borderRadius: 0,
                padding: "16px 20px 18px",
                cursor: onClick ? "pointer" : "default",
                color: C.text,
            }}
        >
            <div style={{ ...eyebrowStyle, marginBottom: 10 }}>{label}</div>
            <div
                key={bumpKey}
                className={bumpKey !== undefined ? "zbump-text" : undefined}
                style={{
                    font: `600 30px/34px ${FONT}`,
                    letterSpacing: "-0.03em",
                    color: C.text,
                    marginBottom: 4,
                }}
            >
                {value}
            </div>
            <div style={{ font: `500 12px/16px ${FONT}`, color: deltaColor }}>
                {delta}
            </div>
        </button>
    )
}

function SectionHeader({
    title,
    sub,
    count,
}: {
    title: string
    sub?: string
    count?: number
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                marginBottom: 10,
            }}
        >
            <h2
                style={{
                    margin: 0,
                    font: `600 15px/20px ${FONT}`,
                    letterSpacing: "-0.01em",
                    color: C.text,
                }}
            >
                {title}
            </h2>
            {count !== undefined && (
                <span style={{ font: `500 12px/16px ${FONT}`, color: C.textSubtle }}>
                    {count}
                </span>
            )}
            {sub && (
                <span style={{ font: `400 12.5px/16px ${FONT}`, color: C.textSubtle }}>
                    {sub}
                </span>
            )}
        </div>
    )
}

function FrameworkCard({ f, onClick }: { f: Framework; onClick: () => void }) {
    const pct = Math.round((f.passing / f.total) * 100)
    return (
        <button
            onClick={onClick}
            className="zfw-card"
            style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                color: C.text,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: 18,
                cursor: "pointer",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    minHeight: 22,
                }}
            >
                <div style={{ font: `600 15px/20px ${FONT}`, letterSpacing: "-0.005em" }}>
                    {f.name}
                </div>
                {/* Status by exception: the bar colour already says "on track". */}
                {f.status === "attention" && <StatusPill s={f.status} />}
            </div>
            <div
                style={{
                    font: `400 12px/16px ${FONT}`,
                    color: C.textSubtle,
                    marginBottom: 14,
                }}
            >
                {f.desc}
            </div>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                    marginBottom: 8,
                    whiteSpace: "nowrap",
                }}
            >
                <div style={{ font: `600 26px/30px ${FONT}`, letterSpacing: "-0.025em" }}>
                    {pct}%
                </div>
                <div style={{ font: `400 13px/18px ${FONT}`, color: C.textSubtle }}>
                    {f.passing} / {f.total} passing
                </div>
            </div>
            <ProgressBar value={pct} />
            <div
                style={{
                    display: "flex",
                    gap: 14,
                    marginTop: 14,
                    whiteSpace: "nowrap",
                    font: `400 12px/16px ${FONT}`,
                    color: C.textSubtle,
                    alignItems: "center",
                }}
            >
                <div>
                    <span style={{ color: C.danger, fontWeight: 600 }}>
                        {f.gaps}
                    </span>{" "}
                    gaps
                </div>
                <div>
                    <span style={{ color: C.warning, fontWeight: 600 }}>
                        {f.review}
                    </span>{" "}
                    in review
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ font: `400 11px/14px ${FONT}`, whiteSpace: "nowrap" }}>
                    {relTime(PAGE_LOAD_MS - f.lastTestMin * 60000)}
                </div>
                <Icon n="caretRight" s={11} c={C.textSubtle} />
            </div>
        </button>
    )
}

function ActivityRow({
    a,
    last,
    isNew,
    onClick,
    onOpenChat,
    active,
    hasChat,
}: {
    a: Activity
    last: boolean
    isNew: boolean
    onClick: () => void
    onOpenChat: () => void
    active: boolean
    hasChat: boolean
}) {
    const iconN: keyof typeof I =
        a.status === "running"
            ? "loader"
            : a.status === "complete"
              ? "check"
              : "play"
    const iconColor =
        a.status === "running"
            ? C.accentSoft
            : a.status === "complete"
              ? C.success
              : C.textSubtle
    const iconBg =
        a.status === "running"
            ? C.accentBg
            : a.status === "complete"
              ? C.successBg
              : "var(--c-hover-overlay)"
    return (
        <div
            onClick={onClick}
            className={`zrow ${isNew ? "zslide-row" : ""}`}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 18px",
                borderBottom: last ? "none" : `1px solid ${C.border}`,
                background: active
                    ? C.accentBg
                    : a.status === "running"
                      ? C.accentTint
                      : "transparent",
                cursor: "pointer",
                borderLeft: active
                    ? `3px solid ${C.accent}`
                    : `3px solid transparent`,
                transition: "background 120ms, border-color 120ms",
            }}
        >
            <div
                style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                {a.status === "running" ? (
                    <Spinner size={11} color={C.accentSoft} />
                ) : (
                    <Icon n={iconN} s={11} c={iconColor} />
                )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: `400 13px/18px ${FONT}`, color: C.text }}>
                    <span style={{ fontWeight: 600 }}>{a.agent}</span>{" "}
                    <span style={{ color: C.textMuted }}>{a.action}</span>{" "}
                    <span style={{ color: C.accentSoft, fontWeight: 500 }}>
                        {a.target}
                    </span>
                </div>
            </div>
            {hasChat && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onOpenChat()
                    }}
                    title="Open conversation"
                    aria-label="Open conversation"
                    className="zbtn"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 6px",
                        borderRadius: 999,
                        background: C.accentBg,
                        border: "none",
                        color: C.accentSoft,
                        font: `500 10px/14px ${FONT}`,
                        flexShrink: 0,
                        cursor: "pointer",
                    }}
                >
                    <Icon n="message" s={10} c={C.accentSoft} />
                    chat
                </button>
            )}
            <div
                style={{
                    font: `400 11px/14px ${FONT}`,
                    color: C.textSubtle,
                    flexShrink: 0,
                }}
            >
                {relTime(a.createdAt)}
            </div>
            <Icon
                n="caretRight"
                s={11}
                c={active ? C.accentSoft : C.textSubtle}
               
            />
        </div>
    )
}

function DashboardControlRow({
    c,
    last,
    running,
    flash,
    runTest,
}: {
    c: Ctl
    last: boolean
    running: boolean
    flash: boolean
    runTest: () => void
}) {
    return (
        <div
            className={`zrow ${flash ? "zflash-row" : ""}`}
            style={{
                padding: "13px 18px",
                borderBottom: last ? "none" : `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                transition: "background 100ms",
                position: "relative",
            }}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                    }}
                >
                    <div
                        style={{
                            font: `500 11px/14px ${MONO}`,
                            color: C.textMuted,
                            padding: "2px 6px",
                            background: "var(--c-hover-overlay)",
                            borderRadius: 4,
                        }}
                    >
                        {c.id}
                    </div>
                    <div
                        style={{
                            font: `500 11px/14px ${FONT}`,
                            color: C.textSubtle,
                        }}
                    >
                        {c.fw}
                    </div>
                </div>
                <div
                    title={c.title}
                    style={{
                        font: `400 13px/18px ${FONT}`,
                        color: C.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {c.title}
                </div>
                <div
                    style={{
                        font: `400 11px/14px ${FONT}`,
                        color: C.textSubtle,
                        marginTop: 3,
                    }}
                >
                    {c.owner} · {c.evidence} evidence · {relTime(PAGE_LOAD_MS - c.lastTestMin * 60000)}
                </div>
            </div>
            <WinPill running={running} status={c.status} />
            <button
                onClick={runTest}
                disabled={running}
                className="zbtn"
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: running ? C.accentBg : "transparent",
                    border: `1px solid ${running ? C.accentLine : C.border}`,
                    cursor: running ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
                title="Run test"
            >
                {running ? (
                    <Spinner size={11} />
                ) : (
                    <Icon n="play" s={9} c={C.textMuted} />
                )}
            </button>
        </div>
    )
}

// Status pill that celebrates when a test run finishes passing.
function WinPill({ running, status }: { running: boolean; status: CtlStatus }) {
    const ref = React.useRef<HTMLSpanElement>(null)
    useWinOnFinish(running, status === "passing", ref)
    return (
        <span ref={ref} style={{ display: "inline-flex", borderRadius: 999 }}>
            <StatusPill s={running ? "running" : status} />
        </span>
    )
}

// ============ FRAMEWORKS LIST VIEW ============

function FrameworksListView({
    onSelect,
    effectiveControls,
}: {
    onSelect: (f: Framework) => void
    effectiveControls: (Ctl & { status: CtlStatus })[]
}) {
    return (
        <div className="zview-in" style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ marginBottom: 24 }}>
                <h1
                    style={{
                        margin: 0,
                        font: `500 34px/40px ${SERIF}`,
                        letterSpacing: "-0.012em",
                        color: C.text,
                    }}
                >
                    Frameworks
                </h1>
                <div
                    style={{
                        font: `400 13px/18px ${FONT}`,
                        color: C.textMuted,
                        marginTop: 4,
                    }}
                >
                    {FRAMEWORKS.length} frameworks under continuous monitoring
                </div>
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 12,
                }}
            >
                {(FRAMEWORKS as Framework[]).map((f) => (
                    <FrameworkListCard key={f.id} f={f} onClick={() => onSelect(f)} />
                ))}
            </div>
        </div>
    )
}

function FrameworkListCard({
    f,
    onClick,
}: {
    f: Framework
    onClick: () => void
}) {
    const pct = Math.round((f.passing / f.total) * 100)
    return (
        <div
            onClick={onClick}
            className="zfw-card"
            style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: 20,
                cursor: "pointer",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                    }}
                >
                    <div>
                        <div
                            style={{
                                font: `600 16px/22px ${FONT}`,
                                letterSpacing: "-0.01em",
                                marginBottom: 2,
                            }}
                        >
                            {f.name}
                        </div>
                        <div
                            style={{
                                font: `400 12px/16px ${FONT}`,
                                color: C.textSubtle,
                            }}
                        >
                            {f.desc}
                        </div>
                    </div>
                </div>
                {f.status === "attention" && <StatusPill s={f.status} />}
            </div>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 8,
                }}
            >
                <div
                    style={{
                        font: `600 28px/32px ${FONT}`,
                        letterSpacing: "-0.025em",
                    }}
                >
                    {pct}%
                </div>
                <div
                    style={{
                        font: `400 13px/18px ${FONT}`,
                        color: C.textSubtle,
                    }}
                >
                    {f.passing} / {f.total} controls passing
                </div>
            </div>
            <ProgressBar value={pct} />
            <div
                style={{
                    display: "flex",
                    gap: 16,
                    marginTop: 14,
                    font: `400 12px/16px ${FONT}`,
                    color: C.textSubtle,
                }}
            >
                <div>
                    <span style={{ color: C.danger, fontWeight: 600 }}>
                        {f.gaps}
                    </span>{" "}
                    gaps
                </div>
                <div>
                    <span style={{ color: C.warning, fontWeight: 600 }}>
                        {f.review}
                    </span>{" "}
                    in review
                </div>
            </div>
            <div
                style={{
                    borderTop: `1px solid ${C.border}`,
                    marginTop: 14,
                    paddingTop: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    font: `400 11px/14px ${FONT}`,
                    color: C.textSubtle,
                }}
            >
                <div>
                    Audited by{" "}
                    <span style={{ color: C.text }}>{f.auditor}</span>
                </div>
                <div title={`Renews ${formatRenewal(f.renewal)}`}>
                    Renews{" "}
                    <span style={{ color: C.text }}>
                        {formatRenewal(f.renewal)}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ============ FRAMEWORK DETAIL VIEW ============

function FrameworkDetailView({
    framework,
    effectiveControls,
    runningTests,
    resolvedFlash,
    runTest,
    onBack,
    onExport,
    onSelectControl,
}: {
    framework: Framework
    effectiveControls: (Ctl & { status: CtlStatus })[]
    runningTests: Set<string>
    resolvedFlash: Set<string>
    runTest: (id: string) => void
    onBack: () => void
    onExport: () => void
    onSelectControl: (id: string) => void
}) {
    // Open only the sections with work in them; fully passing (or empty)
    // sections start folded so gaps and reviews surface first.
    const [collapsed, setCollapsed] = React.useState<Set<string>>(() => {
        const needsWork = new Set(
            effectiveControls
                .filter((c) => c.fw === framework.fw && c.status !== "passing")
                .map((c) => getSectionKey(c))
        )
        const order: string[] = SECTION_ORDER[framework.fw] ?? []
        return new Set(order.filter((k) => !needsWork.has(k)))
    })
    const fwControls = React.useMemo(
        () => effectiveControls.filter((c) => c.fw === framework.fw),
        [effectiveControls, framework.fw]
    )
    const inLibrary = fwControls.length
    const officialPct = Math.round((framework.passing / framework.total) * 100)

    const grouped = React.useMemo(() => {
        const groups: Record<string, (Ctl & { status: CtlStatus })[]> = {}
        fwControls.forEach((c) => {
            const key = getSectionKey(c)
            if (!groups[key]) groups[key] = []
            groups[key].push(c)
        })
        const order = SECTION_ORDER[framework.fw] ?? Object.keys(groups).sort()
        // Render every canonical section · empty ones show as "0 tracked"
        // so the framework structure is visible at a glance.
        return order.map((k: string) => ({
            key: k,
            label: SECTION_LABELS[k] ?? k,
            controls: groups[k] ?? [],
        }))
    }, [fwControls, framework.fw])

    const toggleSection = (k: string) =>
        setCollapsed((p) => {
            const n = new Set(p)
            if (n.has(k)) n.delete(k)
            else n.add(k)
            return n
        })
    const expandAll = () => setCollapsed(new Set())
    const collapseAll = () => setCollapsed(new Set(grouped.map((g) => g.key)))
    const allCollapsed = collapsed.size === grouped.length
    const runAllNonPassing = () => {
        fwControls
            .filter((c) => c.status !== "passing" && !runningTests.has(c.id))
            .forEach((c) => runTest(c.id))
    }
    const nonPassingCount = fwControls.filter(
        (c) => c.status !== "passing"
    ).length

    return (
        <div className="zview-in" style={{ maxWidth: 1280, margin: "0 auto" }}>
            <button
                onClick={onBack}
                className="zbtn"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px 5px 8px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    font: `500 12px/16px ${FONT}`,
                    color: C.textMuted,
                    marginBottom: 16,
                    marginLeft: -10,
                    borderRadius: 6,
                }}
            >
                <Icon n="arrowLeft" s={12} c={C.textMuted} />
                Frameworks
            </button>

            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 20,
                    gap: 16,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 16,
                        alignItems: "flex-start",
                        minWidth: 0,
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 4,
                            }}
                        >
                            <h1
                                style={{
                                    margin: 0,
                                    font: `500 34px/40px ${SERIF}`,
                                    letterSpacing: "-0.012em",
                                    color: C.text,
                                }}
                            >
                                {framework.name}
                            </h1>
                            <StatusPill s={framework.status} />
                        </div>
                        <div
                            style={{
                                font: `400 14px/20px ${FONT}`,
                                color: C.textMuted,
                            }}
                        >
                            {framework.desc}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                        className="zbtn"
                        style={btnSecondary}
                        onClick={onExport}
                    >
                        <Icon n="download" s={13} c={C.textMuted} />
                        Export
                    </button>
                    <button
                        onClick={runAllNonPassing}
                        disabled={nonPassingCount === 0}
                        className="zbtn"
                        style={{
                            ...btnPrimary,
                            background:
                                nonPassingCount === 0 ? C.surface : C.text,
                            color: nonPassingCount === 0 ? C.textSubtle : C.bg,
                            border:
                                nonPassingCount === 0
                                    ? `1px solid ${C.border}`
                                    : "none",
                            cursor:
                                nonPassingCount === 0 ? "default" : "pointer",
                        }}
                    >
                        <Icon
                            n="play"
                            s={11}
                            c={nonPassingCount === 0 ? C.textSubtle : C.bg}
                        />
                        {nonPassingCount === 0
                            ? "Run all"
                            : nonPassingCount === 1
                              ? "Run 1 test"
                              : `Run all (${nonPassingCount})`}
                    </button>
                </div>
            </div>

            <div
                style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "20px 22px",
                    marginBottom: 28,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 24,
                        marginBottom: 16,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <div
                            style={{
                                font: `600 36px/40px ${FONT}`,
                                letterSpacing: "-0.035em",
                                color: C.text,
                            }}
                        >
                            {officialPct}%
                        </div>
                        <div
                            style={{
                                font: `500 12px/16px ${FONT}`,
                                color: C.textSubtle,
                            }}
                        >
                            Coverage
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <ProgressBar value={officialPct} height={8} />
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                                marginTop: 10,
                                font: `400 12px/16px ${FONT}`,
                                color: C.textMuted,
                                flexWrap: "wrap",
                            }}
                        >
                            <div>
                                <span
                                    style={{
                                        color: C.success,
                                        fontWeight: 600,
                                    }}
                                >
                                    {framework.passing}
                                </span>{" "}
                                passing
                            </div>
                            <div style={{ color: C.textSubtle }}>·</div>
                            <div>
                                <span
                                    style={{
                                        color: C.warning,
                                        fontWeight: 600,
                                    }}
                                >
                                    {framework.review}
                                </span>{" "}
                                in review
                            </div>
                            <div style={{ color: C.textSubtle }}>·</div>
                            <div>
                                <span
                                    style={{ color: C.danger, fontWeight: 600 }}
                                >
                                    {framework.gaps}
                                </span>{" "}
                                gaps
                            </div>
                            <div style={{ color: C.textSubtle }}>·</div>
                            <div style={{ color: C.textSubtle }}>
                                <span
                                    style={{ color: C.text, fontWeight: 500 }}
                                >
                                    {framework.total}
                                </span>{" "}
                                total controls in scope
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        borderTop: `1px solid ${C.border}`,
                        paddingTop: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 24,
                        font: `400 12px/16px ${FONT}`,
                        color: C.textSubtle,
                        flexWrap: "wrap",
                    }}
                >
                    <MetaItem label="Auditor" value={framework.auditor} />
                    <MetaItem
                        label="Last test"
                        value={relTime(
                            PAGE_LOAD_MS - framework.lastTestMin * 60000
                        )}
                    />
                    <MetaItem
                        label="Next renewal"
                        value={formatRenewal(framework.renewal)}
                    />
                    <div style={{ flex: 1 }} />
                    <div
                        style={{
                            font: `400 11px/14px ${FONT}`,
                            color: C.textSubtle,
                        }}
                    >
                        {inLibrary} of {framework.total} controls tracked
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 12,
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: 0,
                            font: `600 16px/22px ${FONT}`,
                            letterSpacing: "-0.015em",
                        }}
                    >
                        Controls by section
                    </h2>
                    <div
                        style={{
                            font: `400 12px/16px ${FONT}`,
                            color: C.textSubtle,
                            marginTop: 3,
                        }}
                    >
                        {grouped.length} sections · {inLibrary} controls
                    </div>
                </div>
                <button
                    type="button"
                    onClick={allCollapsed ? expandAll : collapseAll}
                    className="zbtn"
                    title={
                        allCollapsed ? "Expand all sections" : "Collapse all sections"
                    }
                    aria-label={
                        allCollapsed ? "Expand all sections" : "Collapse all sections"
                    }
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 7,
                        background: "transparent",
                        border: `1px solid ${C.border}`,
                        color: C.textMuted,
                        font: `500 12px/16px ${FONT}`,
                        cursor: "pointer",
                    }}
                >
                    <Icon
                        n={allCollapsed ? "caretDown" : "caretUp"}
                        s={10}
                        c={C.textMuted}
                       
                    />
                    {allCollapsed ? "Expand all" : "Collapse all"}
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {grouped.map((g) => (
                    <SectionGroup
                        key={g.key}
                        sectionKey={g.key}
                        label={g.label}
                        controls={g.controls}
                        collapsed={collapsed.has(g.key)}
                        onToggle={() => toggleSection(g.key)}
                        runningTests={runningTests}
                        resolvedFlash={resolvedFlash}
                        runTest={runTest}
                        onSelectControl={onSelectControl}
                    />
                ))}
            </div>
        </div>
    )
}

function MetaItem({
    label,
    value,
    mono,
}: {
    label: string
    value: string
    mono?: boolean
}) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: C.textSubtle }}>{label}:</span>
            <span
                style={{
                    color: C.text,
                    font: mono
                        ? `500 12px/16px ${MONO}`
                        : `500 12px/16px ${FONT}`,
                }}
            >
                {value}
            </span>
        </div>
    )
}

function SectionGroup({
    sectionKey,
    label,
    controls,
    collapsed,
    onToggle,
    runningTests,
    resolvedFlash,
    runTest,
    onSelectControl,
}: {
    sectionKey: string
    label: string
    controls: (Ctl & { status: CtlStatus })[]
    collapsed: boolean
    onToggle: () => void
    runningTests: Set<string>
    resolvedFlash: Set<string>
    runTest: (id: string) => void
    onSelectControl: (id: string) => void
}) {
    const total = controls.length
    const sectionPassing = controls.filter((c) => c.status === "passing").length
    const sectionReview = controls.filter((c) => c.status === "review").length
    const sectionGap = controls.filter((c) => c.status === "gap").length
    const pct = total > 0 ? Math.round((sectionPassing / total) * 100) : 0
    const isEmpty = total === 0
    return (
        <div
            style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                overflow: "hidden",
                opacity: isEmpty ? 0.55 : 1,
            }}
        >
            <div
                role="button"
                tabIndex={isEmpty ? -1 : 0}
                aria-expanded={!collapsed}
                onClick={isEmpty ? undefined : onToggle}
                onKeyDown={(e) => {
                    if (!isEmpty && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault()
                        onToggle()
                    }
                }}
                className="znav"
                style={{
                    display: "grid",
                    // Fixed columns so every section's bar and counts line up.
                    gridTemplateColumns: "12px minmax(0, 1fr) 220px 64px 56px 40px 40px",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 18px",
                    cursor: isEmpty ? "default" : "pointer",
                }}
            >
                <Icon n={collapsed ? "caretRight" : "caretDown"} s={12} c={C.textMuted} />
                <div
                    style={{
                        font: `600 14px/18px ${FONT}`,
                        color: C.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {label}
                </div>
                <div style={{ visibility: isEmpty ? "hidden" : "visible" }}>
                    <ProgressBar value={pct} height={4} />
                </div>
                <div style={{ justifySelf: "end" }}>
                    {!isEmpty && sectionPassing < total && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                controls
                                    .filter((c) => c.status !== "passing")
                                    .forEach((c) => {
                                        if (!runningTests.has(c.id)) runTest(c.id)
                                    })
                            }}
                            className="zbtn"
                            title={`Run ${total - sectionPassing} non-passing controls in ${label}`}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "transparent",
                                border: `1px solid ${C.border}`,
                                font: `500 11px/14px ${FONT}`,
                                color: C.textMuted,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Icon n="play" s={9} c={C.textMuted} />
                            Run {total - sectionPassing}
                        </button>
                    )}
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                        font: `600 12px/16px ${FONT}`,
                    }}
                >
                    {sectionGap > 0 && (
                        <span title={`${sectionGap} gaps`} style={{ display: "flex", alignItems: "center", gap: 4, color: C.danger }}>
                            <span style={{ width: 5, height: 5, borderRadius: 999, background: C.danger }} />
                            {sectionGap}
                        </span>
                    )}
                    {sectionReview > 0 && (
                        <span title={`${sectionReview} in review`} style={{ display: "flex", alignItems: "center", gap: 4, color: C.warning }}>
                            <span style={{ width: 5, height: 5, borderRadius: 999, background: C.warning }} />
                            {sectionReview}
                        </span>
                    )}
                </div>
                <div
                    style={{
                        font: `500 12px/16px ${FONT}`,
                        color: isEmpty ? C.textSubtle : C.textMuted,
                        textAlign: "right",
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {isEmpty ? "None" : `${sectionPassing}/${total}`}
                </div>
                <div
                    style={{
                        font: `600 13px/18px ${FONT}`,
                        color: C.text,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        visibility: isEmpty ? "hidden" : "visible",
                    }}
                >
                    {pct}%
                </div>
            </div>
            {!collapsed && (
                <div style={{ borderTop: `1px solid ${C.border}` }}>
                    {controls.map((c, i) => (
                        <SectionControlRow
                            key={c.id}
                            c={c}
                            last={i === controls.length - 1}
                            running={runningTests.has(c.id)}
                            flash={resolvedFlash.has(c.id)}
                            runTest={() => runTest(c.id)}
                            onOpen={() => onSelectControl(c.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function SectionControlRow({
    c,
    last,
    running,
    flash,
    runTest,
    onOpen,
}: {
    c: Ctl & { status: CtlStatus }
    last: boolean
    running: boolean
    flash: boolean
    runTest: () => void
    onOpen: () => void
}) {
    return (
        <div
            className={`zrow ${flash ? "zflash-row" : ""}`}
            onClick={onOpen}
            style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 130px 100px 36px",
                gap: 14,
                padding: "12px 18px 12px 50px",
                borderBottom: last ? "none" : `1px solid ${C.border}`,
                alignItems: "center",
                transition: "background 100ms",
                position: "relative",
                cursor: "pointer",
            }}
        >
            <div
                style={{
                    font: `500 12px/14px ${MONO}`,
                    color: C.text,
                    padding: "3px 8px",
                    background: "var(--c-hover-overlay)",
                    borderRadius: 4,
                    justifySelf: "start",
                }}
            >
                {c.id}
            </div>
            <div style={{ minWidth: 0 }}>
                <div
                    title={c.title}
                    style={{
                        font: `400 13px/18px ${FONT}`,
                        color: C.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {c.title}
                </div>
                <div
                    style={{
                        font: `400 11px/14px ${FONT}`,
                        color: C.textSubtle,
                        marginTop: 2,
                    }}
                >
                    {c.owner} · {c.evidence} evidence
                </div>
            </div>
            <WinPill running={running} status={c.status} />
            <div
                style={{
                    font: `400 11px/14px ${FONT}`,
                    color: C.textSubtle,
                    whiteSpace: "nowrap",
                }}
            >
                {relTime(PAGE_LOAD_MS - c.lastTestMin * 60000)}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    runTest()
                }}
                disabled={running}
                className="zbtn"
                style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: running ? C.accentBg : "transparent",
                    border: `1px solid ${running ? C.accentLine : C.border}`,
                    cursor: running ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
                title="Run test"
                aria-label="Run test"
            >
                {running ? (
                    <Spinner size={10} />
                ) : (
                    <Icon n="play" s={8} c={C.textMuted} />
                )}
            </button>
        </div>
    )
}

// ============ CONTROLS VIEW ============

const STATUS_RANK: Record<CtlStatus, number> = { passing: 0, review: 1, gap: 2 }
const TABLE_COLS = "32px 110px 1fr 130px 80px 100px 90px 36px"

function ControlsView({
    effectiveControls,
    runningTests,
    resolvedFlash,
    runTest,
    setControlOverrides,
    onAddControl,
    onExportAll,
    onExportSelected,
    searchQuery,
    setSearchQuery,
    seedStatusFilter,
    onSeedConsumed,
    onSelectControl,
}: {
    effectiveControls: (Ctl & { status: CtlStatus })[]
    runningTests: Set<string>
    resolvedFlash: Set<string>
    runTest: (id: string) => void
    setControlOverrides: React.Dispatch<
        React.SetStateAction<Record<string, CtlStatus>>
    >
    onAddControl: () => void
    onExportAll: () => void
    onExportSelected: (ids: Set<string>) => void
    searchQuery: string
    setSearchQuery: (s: string) => void
    seedStatusFilter?: CtlStatus | null
    onSeedConsumed?: () => void
    onSelectControl: (id: string) => void
}) {
    // Local-table search is fed by the topbar's global search · single
    // source of truth · also makes ⌘K reachable while on this page.
    const search = searchQuery
    const setSearch = setSearchQuery
    const [fwFilter, setFwFilter] = React.useState<Set<string>>(new Set())
    const [statusFilter, setStatusFilter] = React.useState<Set<CtlStatus>>(
        new Set()
    )

    // Apply seedStatusFilter from external nav events (stat card / notif).
    // Search itself is driven by the global topbar so no seed needed.
    React.useEffect(() => {
        if (seedStatusFilter) {
            setStatusFilter(new Set([seedStatusFilter]))
            onSeedConsumed?.()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seedStatusFilter])
    const [ownerFilter, setOwnerFilter] = React.useState<string>("all")
    const [showOwnerMenu, setShowOwnerMenu] = React.useState(false)
    const [sortBy, setSortBy] = React.useState<
        "id" | "owner" | "evidence" | "status" | "lastTest"
    >("lastTest")
    const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")
    const [selected, setSelected] = React.useState<Set<string>>(new Set())
    const [bulkAction, setBulkAction] = React.useState<string | null>(null)

    const allFrameworks = React.useMemo(
        () => Array.from(new Set((CONTROLS as Ctl[]).map((c) => c.fw))),
        []
    )
    const allOwners = React.useMemo(
        () =>
            Array.from(new Set((CONTROLS as Ctl[]).map((c) => c.owner))).sort(),
        []
    )

    const toggleFw = (fw: string) =>
        setFwFilter((p) => {
            const n = new Set(p)
            if (n.has(fw)) n.delete(fw)
            else n.add(fw)
            return n
        })
    const toggleStatus = (s: CtlStatus) =>
        setStatusFilter((p) => {
            const n = new Set(p)
            if (n.has(s)) n.delete(s)
            else n.add(s)
            return n
        })
    const clearFilters = () => {
        setSearch("")
        setFwFilter(new Set())
        setStatusFilter(new Set())
        setOwnerFilter("all")
    }
    const hasActiveFilter =
        search.trim().length > 0 ||
        fwFilter.size > 0 ||
        statusFilter.size > 0 ||
        ownerFilter !== "all"

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        let list = effectiveControls
        if (q)
            list = list.filter(
                (c) =>
                    c.id.toLowerCase().includes(q) ||
                    c.title.toLowerCase().includes(q) ||
                    c.fw.toLowerCase().includes(q) ||
                    c.owner.toLowerCase().includes(q)
            )
        if (fwFilter.size > 0) list = list.filter((c) => fwFilter.has(c.fw))
        if (statusFilter.size > 0)
            list = list.filter((c) => statusFilter.has(c.status))
        if (ownerFilter !== "all")
            list = list.filter((c) => c.owner === ownerFilter)
        const sorted = [...list].sort((a, b) => {
            let cmp = 0
            if (sortBy === "id") cmp = a.id.localeCompare(b.id)
            else if (sortBy === "owner") cmp = a.owner.localeCompare(b.owner)
            else if (sortBy === "evidence") cmp = a.evidence - b.evidence
            else if (sortBy === "status")
                cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status]
            else if (sortBy === "lastTest") cmp = a.lastTestMin - b.lastTestMin
            return sortDir === "asc" ? cmp : -cmp
        })
        return sorted
    }, [
        effectiveControls,
        search,
        fwFilter,
        statusFilter,
        ownerFilter,
        sortBy,
        sortDir,
    ])

    const allSelected =
        selected.size > 0 && filtered.every((c) => selected.has(c.id))
    const someSelected = selected.size > 0 && !allSelected
    const toggleAll = () => {
        if (allSelected) setSelected(new Set())
        else setSelected(new Set(filtered.map((c) => c.id)))
    }
    const toggle = (id: string) =>
        setSelected((p) => {
            const n = new Set(p)
            if (n.has(id)) n.delete(id)
            else n.add(id)
            return n
        })
    const clearSelection = () => setSelected(new Set())
    const bulkRun = () => {
        setBulkAction(`Running ${selected.size} tests`)
        Array.from(selected).forEach((id) => runTest(id))
        setTimeout(() => {
            setBulkAction(null)
            setSelected(new Set())
        }, 2800)
    }
    const bulkMarkReview = () => {
        setBulkAction(`Marked ${selected.size} for review`)
        const ids = Array.from(selected)
        setControlOverrides((prev) => {
            const next = { ...prev }
            ids.forEach((id) => {
                next[id] = "review"
            })
            return next
        })
        setTimeout(() => {
            setBulkAction(null)
            setSelected(new Set())
        }, 1400)
    }
    const bulkExport = () => {
        onExportSelected(selected)
        setSelected(new Set())
    }

    const totalCount = effectiveControls.length
    const passing = effectiveControls.filter(
        (c) => c.status === "passing"
    ).length
    const review = effectiveControls.filter((c) => c.status === "review").length
    const gap = effectiveControls.filter((c) => c.status === "gap").length
    const handleSort = (key: any) => {
        if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        else {
            setSortBy(key)
            setSortDir("asc")
        }
    }
    const anyFilterActive =
        search.length > 0 ||
        fwFilter.size > 0 ||
        statusFilter.size > 0 ||
        ownerFilter !== "all"

    return (
        <div className="zview-in" style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 24,
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            font: `500 34px/40px ${SERIF}`,
                            letterSpacing: "-0.012em",
                            color: C.text,
                        }}
                    >
                        Controls
                    </h1>
                    <div
                        style={{
                            font: `400 13px/18px ${FONT}`,
                            color: C.textMuted,
                            marginTop: 4,
                        }}
                    >
                        {totalCount} controls across {allFrameworks.length}{" "}
                        frameworks
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        className="zbtn"
                        style={btnSecondary}
                        onClick={onExportAll}
                    >
                        <Icon n="download" s={13} c={C.textMuted} />
                        Export CSV
                    </button>
                    <button
                        className="zbtn"
                        style={btnPrimary}
                        onClick={onAddControl}
                    >
                        <Icon n="plus" s={12} c={C.primaryFg} />
                        Add control
                    </button>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    padding: "14px 18px",
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    marginBottom: 20,
                }}
            >
                <SummaryStat
                    label="Total"
                    value={totalCount}
                    color={C.text}
                    onClick={() => setStatusFilter(new Set())}
                    active={statusFilter.size === 0}
                />
                <div style={{ width: 1, height: 28, background: C.border }} />
                <SummaryStat
                    label="Passing"
                    value={passing}
                    color={C.success}
                    onClick={() => setStatusFilter(new Set(["passing"]))}
                    active={
                        statusFilter.size === 1 && statusFilter.has("passing")
                    }
                />
                <div style={{ width: 1, height: 28, background: C.border }} />
                <SummaryStat
                    label="In review"
                    value={review}
                    color={C.warning}
                    onClick={() => setStatusFilter(new Set(["review"]))}
                    active={
                        statusFilter.size === 1 && statusFilter.has("review")
                    }
                />
                <div style={{ width: 1, height: 28, background: C.border }} />
                <SummaryStat
                    label="Gaps"
                    value={gap}
                    color={C.danger}
                    onClick={() => setStatusFilter(new Set(["gap"]))}
                    active={statusFilter.size === 1 && statusFilter.has("gap")}
                />
                <div style={{ flex: 1 }} />
                {hasActiveFilter && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="zbtn"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "5px 10px",
                            borderRadius: 999,
                            background: C.accentBg,
                            border: `1px solid ${C.accentLine}`,
                            cursor: "pointer",
                            font: `500 11px/14px ${FONT}`,
                            color: C.accentSoft,
                            marginRight: 14,
                            whiteSpace: "nowrap",
                        }}
                    >
                        Showing {filtered.length} of {totalCount}
                        <Icon
                            n="x"
                            s={9}
                            c={C.accentSoft}
                           
                        />
                    </button>
                )}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                    }}
                >
                    <div
                        style={{
                            font: `600 18px/22px ${FONT}`,
                            color: C.text,
                            letterSpacing: "-0.015em",
                        }}
                    >
                        {Math.round((passing / totalCount) * 100)}%
                    </div>
                    <div
                        style={{
                            font: `400 12px/16px ${FONT}`,
                            color: C.textSubtle,
                        }}
                    >
                        Coverage
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 4,
                    }}
                >
                    {allFrameworks.map((fw) => (
                        <FilterChip
                            key={fw}
                            active={fwFilter.has(fw)}
                            onClick={() => toggleFw(fw)}
                        >
                            {fw}
                        </FilterChip>
                    ))}
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: 4,
                        paddingLeft: 8,
                        borderLeft: `1px solid ${C.border}`,
                    }}
                >
                    <FilterChip
                        active={statusFilter.has("passing")}
                        onClick={() => toggleStatus("passing")}
                        color={C.success}
                    >
                        Passing
                        <span
                            style={{
                                font: `500 11px/14px ${FONT}`,
                                opacity: 0.7,
                                marginLeft: 2,
                            }}
                        >
                            {passing}
                        </span>
                    </FilterChip>
                    <FilterChip
                        active={statusFilter.has("review")}
                        onClick={() => toggleStatus("review")}
                        color={C.warning}
                    >
                        Review
                        <span
                            style={{
                                font: `500 11px/14px ${FONT}`,
                                opacity: 0.7,
                                marginLeft: 2,
                            }}
                        >
                            {review}
                        </span>
                    </FilterChip>
                    <FilterChip
                        active={statusFilter.has("gap")}
                        onClick={() => toggleStatus("gap")}
                        color={C.danger}
                    >
                        Gap
                        <span
                            style={{
                                font: `500 11px/14px ${FONT}`,
                                opacity: 0.7,
                                marginLeft: 2,
                            }}
                        >
                            {gap}
                        </span>
                    </FilterChip>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ position: "relative" }}>
                    <button
                        onClick={() => setShowOwnerMenu(!showOwnerMenu)}
                        className="zbtn"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 10px",
                            background:
                                ownerFilter !== "all" ? C.accentBg : C.surface,
                            border: `1px solid ${ownerFilter !== "all" ? C.accentLine : C.border}`,
                            borderRadius: 6,
                            cursor: "pointer",
                            font: `500 12px/16px ${FONT}`,
                            color:
                                ownerFilter !== "all"
                                    ? C.accentSoft
                                    : C.textMuted,
                        }}
                    >
                        <Icon
                            n="filter"
                            s={11}
                            c={
                                ownerFilter !== "all"
                                    ? C.accentSoft
                                    : C.textMuted
                            }
                           
                        />
                        Owner: {ownerFilter === "all" ? "All" : ownerFilter}
                        <Icon
                            n="caretDown"
                            s={9}
                            c={
                                ownerFilter !== "all"
                                    ? C.accentSoft
                                    : C.textMuted
                            }
                           
                        />
                    </button>
                    {showOwnerMenu && (
                        <>
                            <div
                                onClick={() => setShowOwnerMenu(false)}
                                style={{
                                    position: "fixed",
                                    inset: 0,
                                    zIndex: 30,
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 4px)",
                                    right: 0,
                                    width: 180,
                                    background: C.surfaceHi,
                                    border: `1px solid ${C.borderHi}`,
                                    borderRadius: 8,
                                    padding: 4,
                                    zIndex: 31,
                                    boxShadow: C.shadowLg,
                                    animation: "zfade 140ms ease",
                                    maxHeight: 280,
                                    overflowY: "auto",
                                }}
                            >
                                {["all", ...allOwners].map((o) => (
                                    <button
                                        key={o}
                                        onClick={() => {
                                            setOwnerFilter(o)
                                            setShowOwnerMenu(false)
                                        }}
                                        className="znav"
                                        style={{
                                            display: "flex",
                                            width: "100%",
                                            padding: "7px 10px",
                                            background:
                                                ownerFilter === o
                                                    ? C.accentBg
                                                    : "transparent",
                                            border: "none",
                                            borderRadius: 6,
                                            cursor: "pointer",
                                            font: `500 12px/16px ${FONT}`,
                                            color:
                                                ownerFilter === o
                                                    ? C.accentSoft
                                                    : C.textMuted,
                                            textAlign: "left",
                                        }}
                                    >
                                        {o === "all" ? "All owners" : o}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                {anyFilterActive && (
                    <button
                        onClick={clearFilters}
                        className="zbtn"
                        style={{
                            padding: "6px 10px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            font: `500 12px/16px ${FONT}`,
                            color: C.textSubtle,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        Clear <Icon n="x" s={10} c={C.textSubtle} />
                    </button>
                )}
            </div>

            <div
                style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    overflow: "hidden",
                }}
            >
                {selected.size > 0 && (
                    <div
                        className="zbar-slide"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 18px",
                            background: C.accentBg,
                            borderBottom: `1px solid ${C.accentLine}`,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    font: `600 13px/18px ${FONT}`,
                                    color: C.accentSoft,
                                }}
                            >
                                {selected.size} selected
                            </div>
                            <button
                                onClick={clearSelection}
                                className="zbtn"
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 4,
                                    background: C.accentBg,
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                }}
                            >
                                <Icon n="x" s={10} c={C.accentSoft} />
                            </button>
                        </div>
                        {bulkAction ? (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "4px 10px",
                                    background: "var(--c-hover-overlay)",
                                    borderRadius: 6,
                                    font: `500 12px/16px ${FONT}`,
                                    color: C.text,
                                }}
                            >
                                <Spinner size={11} color={C.accentSoft} />
                                {bulkAction}...
                            </div>
                        ) : (
                            <>
                                <div
                                    style={{
                                        width: 1,
                                        height: 18,
                                        background: C.borderHi,
                                    }}
                                />
                                <button
                                    onClick={bulkRun}
                                    className="zbtn"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "5px 10px",
                                        background: C.surface,
                                        border: `1px solid ${C.borderHi}`,
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        font: `500 12px/16px ${FONT}`,
                                        color: C.text,
                                    }}
                                >
                                    <Icon n="play" s={9} c={C.text} />
                                    Run tests
                                </button>
                                <button
                                    onClick={bulkMarkReview}
                                    className="zbtn"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "5px 10px",
                                        background: C.surface,
                                        border: `1px solid ${C.borderHi}`,
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        font: `500 12px/16px ${FONT}`,
                                        color: C.text,
                                    }}
                                >
                                    <Icon n="eye" s={11} c={C.text} />
                                    Mark for review
                                </button>
                                <button
                                    onClick={bulkExport}
                                    className="zbtn"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "5px 10px",
                                        background: C.surface,
                                        border: `1px solid ${C.borderHi}`,
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        font: `500 12px/16px ${FONT}`,
                                        color: C.text,
                                    }}
                                >
                                    <Icon
                                        n="download"
                                        s={11}
                                        c={C.text}
                                       
                                    />
                                    Export selected
                                </button>
                            </>
                        )}
                    </div>
                )}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: TABLE_COLS,
                        gap: 12,
                        padding: "10px 18px",
                        background: "var(--c-hover-overlay)",
                        borderBottom: `1px solid ${C.border}`,
                        alignItems: "center",
                    }}
                >
                    <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={toggleAll}
                        label="Select all visible controls"
                    />
                    <SortHeader
                        label="ID · Framework"
                        sortKey="id"
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onSort={handleSort}
                    />
                    <div
                        style={{
                            font: `500 12px/16px ${FONT}`,
                            color: C.textSubtle,
                        }}
                    >
                        Control
                    </div>
                    <SortHeader
                        label="Owner"
                        sortKey="owner"
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onSort={handleSort}
                    />
                    <SortHeader
                        label="Evidence"
                        sortKey="evidence"
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onSort={handleSort}
                        align="right"
                    />
                    <SortHeader
                        label="Status"
                        sortKey="status"
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onSort={handleSort}
                    />
                    <SortHeader
                        label="Last tested"
                        sortKey="lastTest"
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onSort={handleSort}
                    />
                    <div />
                </div>

                <div style={{ maxHeight: 560, overflowY: "auto" }}>
                    {filtered.length === 0 && (
                        <div
                            style={{
                                padding: "56px 18px 64px 18px",
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    background: C.surface,
                                    border: `1px solid ${C.border}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Icon
                                    n="search"
                                    s={18}
                                    c={C.textSubtle}
                                   
                                />
                            </div>
                            <div>
                                <div
                                    style={{
                                        font: `600 14px/20px ${FONT}`,
                                        color: C.text,
                                        marginBottom: 4,
                                    }}
                                >
                                    No controls match these filters
                                </div>
                                <div
                                    style={{
                                        font: `400 12px/18px ${FONT}`,
                                        color: C.textSubtle,
                                        maxWidth: 320,
                                    }}
                                >
                                    Try a different search term, or remove one
                                    of the active filters.
                                </div>
                            </div>
                            <button
                                type="button"
                                className="zbtn"
                                style={btnSecondary}
                                onClick={clearFilters}
                            >
                                <Icon n="x" s={11} c={C.textMuted} />
                                Clear all filters
                            </button>
                        </div>
                    )}
                    {filtered.map((c, i) => (
                        <ControlTableRow
                            key={c.id}
                            c={c}
                            last={i === filtered.length - 1}
                            checked={selected.has(c.id)}
                            onToggle={() => toggle(c.id)}
                            running={runningTests.has(c.id)}
                            flash={resolvedFlash.has(c.id)}
                            runTest={() => runTest(c.id)}
                            onOpen={() => onSelectControl(c.id)}
                        />
                    ))}
                </div>

                <div
                    style={{
                        padding: "12px 18px",
                        borderTop: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "var(--c-hover-overlay)",
                    }}
                >
                    <div
                        style={{
                            font: `400 12px/16px ${FONT}`,
                            color: C.textSubtle,
                        }}
                    >
                        Showing{" "}
                        <span style={{ color: C.text, fontWeight: 600 }}>
                            {filtered.length}
                        </span>{" "}
                        of {totalCount} controls
                    </div>
                </div>
            </div>
        </div>
    )
}

function SummaryStat({
    label,
    value,
    color,
    onClick,
    active,
}: {
    label: string
    value: number
    color: string
    onClick?: () => void
    active?: boolean
}) {
    const interactive = !!onClick
    return (
        <div
            onClick={onClick}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                padding: "2px 6px",
                margin: "-2px -6px",
                borderRadius: 6,
                cursor: interactive ? "pointer" : "default",
                background: active ? color + "1A" : "transparent",
                transition: "background 120ms",
            }}
        >
            <div
                style={{
                    font: `500 12px/16px ${FONT}`,
                    color: active ? color : C.textSubtle,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    font: `600 22px/26px ${FONT}`,
                    color,
                    letterSpacing: "-0.02em",
                }}
            >
                {value}
            </div>
        </div>
    )
}

function ControlTableRow({
    c,
    last,
    checked,
    onToggle,
    running,
    flash,
    runTest,
    onOpen,
}: {
    c: Ctl
    last: boolean
    checked: boolean
    onToggle: () => void
    running: boolean
    flash: boolean
    runTest: () => void
    onOpen: () => void
}) {
    return (
        <div
            className={`zrow ${flash ? "zflash-row" : ""}`}
            onClick={onOpen}
            style={{
                display: "grid",
                gridTemplateColumns: TABLE_COLS,
                gap: 12,
                padding: "12px 18px",
                borderBottom: last ? "none" : `1px solid ${C.border}`,
                alignItems: "center",
                background: checked ? C.accentTint : undefined,
                transition: "background 100ms",
                position: "relative",
                cursor: "pointer",
            }}
        >
            <Checkbox
                checked={checked}
                onChange={onToggle}
                label={`Select ${c.id}`}
            />
            <div style={{ minWidth: 0 }}>
                <div
                    style={{
                        font: `500 12px/14px ${MONO}`,
                        color: C.text,
                        padding: "2px 6px",
                        background: "var(--c-hover-overlay)",
                        borderRadius: 4,
                        display: "inline-block",
                        marginBottom: 3,
                    }}
                >
                    {c.id}
                </div>
                <div
                    style={{
                        font: `500 11px/14px ${FONT}`,
                        color: C.textSubtle,
                    }}
                >
                    {c.fw}
                </div>
            </div>
            <div
                title={c.title}
                style={{
                    minWidth: 0,
                    font: `400 13px/18px ${FONT}`,
                    color: C.text,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {c.title}
            </div>
            <div
                title={c.owner}
                style={{
                    font: `400 12px/16px ${FONT}`,
                    color: C.textMuted,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {c.owner}
            </div>
            <div
                style={{
                    font: `500 13px/18px ${FONT}`,
                    color: c.evidence === 0 ? C.danger : C.text,
                    textAlign: "right",
                }}
            >
                {c.evidence}
            </div>
            <WinPill running={running} status={c.status} />
            <div
                style={{
                    font: `400 11px/14px ${FONT}`,
                    color: C.textSubtle,
                    whiteSpace: "nowrap",
                }}
            >
                {relTime(PAGE_LOAD_MS - c.lastTestMin * 60000)}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    runTest()
                }}
                disabled={running}
                className="zbtn"
                style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: running ? C.accentBg : "transparent",
                    border: `1px solid ${running ? C.accentLine : C.border}`,
                    cursor: running ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
                title="Run test"
                aria-label="Run test"
            >
                {running ? (
                    <Spinner size={10} />
                ) : (
                    <Icon n="play" s={8} c={C.textMuted} />
                )}
            </button>
        </div>
    )
}

// ============ AGENT RUN PANEL ============

function AgentRunPanel({
    activity,
    close,
    chatMessages,
    setChatMessages,
    initialTab = "timeline",
}: {
    activity: Activity
    close: () => void
    chatMessages: ChatMessage[]
    setChatMessages: (
        updater: (prev: ChatMessage[]) => ChatMessage[]
    ) => void
    initialTab?: "timeline" | "chat"
}) {
    const [, setTick] = React.useState(0)
    const [tab, setTab] = React.useState<"timeline" | "chat">(initialTab)
    const isRunning = activity.status === "running"

    // Reset tab to the requested initial whenever a different run is selected
    // (or when the same row is re-clicked via the chat badge with chat hint).
    React.useEffect(() => {
        setTab(initialTab)
    }, [activity.id, initialTab])

    React.useEffect(() => {
        if (!isRunning) return
        const t = setInterval(() => setTick((x) => x + 1), 1000)
        return () => clearInterval(t)
    }, [isRunning])

    const script = getScript(activity)
    const elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - activity.createdAt) / 1000)
    )
    const totalDuration = script[script.length - 1]?.at ?? 60

    const activeIdx = isRunning
        ? (() => {
              let idx = -1
              for (let i = 0; i < script.length; i++) {
                  if (elapsedSeconds >= script[i].at) idx = i
                  else break
              }
              return idx
          })()
        : script.length - 1

    const isComplete = !isRunning || activeIdx >= script.length - 1
    const progressPct = isComplete
        ? 100
        : Math.min(99, Math.round((elapsedSeconds / totalDuration) * 100))

    const stepState = (i: number): "complete" | "active" | "pending" => {
        if (!isRunning) return "complete"
        if (i < activeIdx) return "complete"
        if (i === activeIdx && i < script.length - 1) return "active"
        if (i === activeIdx) return "complete"
        return "pending"
    }

    const agentIcon: keyof typeof I =
        (
            {
                "Evidence Agent": "fileText",
                "Risk Agent": "warning",
                "Questionnaire Agent": "listChecks",
                "Policy Agent": "book",
                "Remediation Agent": "shieldCheck",
                "Controls Agent": "shield",
                "Director Agent": "hierarchy",
            } as Record<string, keyof typeof I>
        )[activity.agent] || "robot"

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                width: 460,
                background: C.surface,
                borderLeft: `1px solid ${C.borderHi}`,
                boxShadow: C.shadowLg,
                zIndex: 80,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
            className="zpanel"
        >
            <div
                style={{
                    padding: "20px 22px 16px 22px",
                    borderBottom: `1px solid ${C.border}`,
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        marginBottom: 14,
                    }}
                >
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: isRunning ? C.accentBg : C.successBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Icon
                            n={agentIcon}
                            s={18}
                            c={isRunning ? C.accentSoft : C.success}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                font: `600 15px/20px ${FONT}`,
                                color: C.text,
                                marginBottom: 2,
                            }}
                        >
                            {activity.agent}
                        </div>
                        <div
                            style={{
                                font: `400 12px/16px ${FONT}`,
                                color: C.textMuted,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical" as any,
                            }}
                        >
                            {activity.action}{" "}
                            <span
                                style={{ color: C.accentSoft, fontWeight: 500 }}
                            >
                                {activity.target}
                            </span>
                        </div>
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
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                    }}
                >
                    <StatusPill s={isComplete ? "complete" : "running"} />
                    <div
                        style={{
                            font: `500 11px/14px ${FONT}`,
                            color: C.textSubtle,
                        }}
                    >
                        {isRunning && !isComplete ? "Elapsed" : "Duration"}:{" "}
                        <span style={{ color: C.text }}>
                            {formatElapsed(
                                Math.min(elapsedSeconds, totalDuration)
                            )}
                        </span>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div
                        style={{ font: `600 13px/18px ${FONT}`, color: C.text }}
                    >
                        {progressPct}%
                    </div>
                </div>
                <ProgressBar value={progressPct} height={4} />
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 12,
                    }}
                >
                    <div
                        style={{
                            font: `400 11px/14px ${MONO}`,
                            color: C.textSubtle,
                        }}
                    >
                        run-{activity.id.slice(0, 8)} · started{" "}
                        {relTime(activity.createdAt)}
                    </div>
                    {isRunning && !isComplete && (
                        <button
                            className="zbtn"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "4px 10px",
                                background: "transparent",
                                border: `1px solid ${C.border}`,
                                borderRadius: 6,
                                cursor: "pointer",
                                font: `500 11px/14px ${FONT}`,
                                color: C.textMuted,
                            }}
                        >
                            <Icon n="pause" s={9} c={C.textMuted} />
                            Pause
                        </button>
                    )}
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 4,
                    padding: "0 22px",
                    borderBottom: `1px solid ${C.border}`,
                    flexShrink: 0,
                }}
            >
                {(["timeline", "chat"] as const).map((id) => {
                    const active = tab === id
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTab(id)}
                            className="zbtn"
                            style={{
                                padding: "10px 12px",
                                background: "transparent",
                                border: "none",
                                borderBottom: `2px solid ${active ? C.accentSoft : "transparent"}`,
                                cursor: "pointer",
                                font: `${active ? 600 : 500} 12px/16px ${FONT}`,
                                color: active ? C.text : C.textMuted,
                                marginBottom: -1,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            {id === "timeline" ? (
                                <>
                                    <Icon
                                        n="listChecks"
                                        s={12}
                                        c={active ? C.accentSoft : C.textMuted}
                                    />
                                    Run timeline
                                </>
                            ) : (
                                <>
                                    <Icon
                                        n="message"
                                        s={12}
                                        c={active ? C.accentSoft : C.textMuted}
                                    />
                                    Ask agent
                                </>
                            )}
                        </button>
                    )
                })}
            </div>

            {tab === "chat" && (
                <AgentChat
                    activity={activity}
                    messages={chatMessages}
                    setMessages={setChatMessages}
                />
            )}
            {tab === "timeline" && (
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "20px 22px 32px 22px",
                }}
            >
                <div style={{ position: "relative" }}>
                    <div
                        style={{
                            position: "absolute",
                            left: 10,
                            top: 12,
                            bottom: 12,
                            width: 1,
                            background: C.border,
                        }}
                    />
                    {script.map((step: RunStep, i: number) => (
                        <TimelineStep
                            key={i}
                            step={step}
                            state={stepState(i)}
                            isFirstActive={
                                isRunning &&
                                i === activeIdx &&
                                stepState(i) === "active"
                            }
                        />
                    ))}
                </div>
                {isComplete && (
                    <div
                        className="zstep-reveal"
                        style={{
                            marginTop: 16,
                            padding: "14px 16px",
                            background: C.successBg,
                            border: `1px solid ${C.successLine}`,
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 999,
                                background: C.success,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <Icon n="check" s={13} c={C.primaryFg} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    font: `600 13px/18px ${FONT}`,
                                    color: C.success,
                                }}
                            >
                                Run completed successfully
                            </div>
                            <div
                                style={{
                                    font: `400 11px/14px ${FONT}`,
                                    color: C.textMuted,
                                    marginTop: 1,
                                }}
                            >
                                {script.length} steps ·{" "}
                                {formatElapsed(totalDuration)} total
                            </div>
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    )
}

function TimelineStep({
    step,
    state,
    isFirstActive,
}: {
    step: RunStep
    state: "complete" | "active" | "pending"
    isFirstActive: boolean
}) {
    return (
        <div
            style={{
                display: "flex",
                gap: 14,
                paddingBottom: 18,
                position: "relative",
                opacity: state === "pending" ? 0.4 : 1,
                transition: "opacity 400ms ease",
            }}
        >
            <div
                style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    flexShrink: 0,
                    background:
                        state === "complete"
                            ? C.successBg
                            : state === "active"
                              ? C.accentBg
                              : C.bg,
                    border:
                        state === "pending"
                            ? `1.5px solid var(--c-border-hi)`
                            : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {state === "complete" && (
                    <Icon n="check" s={10} c={C.success} />
                )}
                {state === "active" && (
                    <Spinner size={10} color={C.accentSoft} />
                )}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 8,
                    }}
                >
                    <div
                        style={{
                            font: `${state === "active" ? 600 : 500} 13px/18px ${FONT}`,
                            color:
                                state === "active"
                                    ? C.accentSoft
                                    : state === "complete"
                                      ? C.text
                                      : C.textMuted,
                        }}
                    >
                        {step.label}
                    </div>
                    <div
                        style={{
                            font: `400 11px/14px ${FONT}`,
                            color: C.textSubtle,
                            flexShrink: 0,
                        }}
                    >
                        {state === "pending" ? "-" : formatElapsed(step.at)}
                    </div>
                </div>
                {state === "active" && step.sub && (
                    <div
                        style={{
                            font: `400 12px/16px ${FONT}`,
                            color: C.textMuted,
                            marginTop: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        {step.sub}
                        <span
                            className="zcaret"
                            style={{ color: C.accentSoft }}
                        >
                            ▎
                        </span>
                    </div>
                )}
                {state !== "pending" && step.tool && (
                    <ToolCallBlock tool={step.tool} animate={isFirstActive} />
                )}
                {state !== "pending" && step.output && (
                    <OutputBlock output={step.output} animate={isFirstActive} />
                )}
            </div>
        </div>
    )
}

function ToolCallBlock({
    tool,
    animate,
}: {
    tool: { name: string; params: string; result?: string }
    animate: boolean
}) {
    return (
        <div
            className={animate ? "zstep-reveal" : undefined}
            style={{
                marginTop: 8,
                padding: "8px 12px",
                background: "var(--c-hover-overlay)",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    font: `500 12px/16px ${MONO}`,
                }}
            >
                <Icon n="bolt" s={11} c={C.accentSoft} />
                <span style={{ color: C.accentSoft }}>{tool.name}</span>
                <span style={{ color: C.textSubtle }}>(</span>
                <span
                    style={{
                        color: C.textMuted,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {tool.params}
                </span>
                <span style={{ color: C.textSubtle }}>)</span>
            </div>
            {tool.result && (
                <div
                    style={{
                        marginTop: 6,
                        paddingLeft: 17,
                        font: `400 12px/16px ${MONO}`,
                        color: C.success,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6,
                    }}
                >
                    <Icon n="arrowRight" s={10} c={C.textSubtle} />
                    <span style={{ color: C.textMuted }}>{tool.result}</span>
                </div>
            )}
        </div>
    )
}

function OutputBlock({
    output,
    animate,
}: {
    output: string
    animate: boolean
}) {
    return (
        <div
            className={animate ? "zstep-reveal" : undefined}
            style={{
                marginTop: 8,
                padding: "8px 12px",
                background: "var(--c-hover-overlay)",
                borderLeft: `2px solid ${C.accent}`,
                borderRadius: "0 6px 6px 0",
                font: `400 12px/18px ${MONO}`,
                color: C.textMuted,
                whiteSpace: "pre-wrap" as any,
            }}
        >
            {output}
        </div>
    )
}

// ============ EMPTY VIEW ============

// ============ NEW ASSESSMENT MODAL ============
//
// Three-phase modal:
//   1. configure · user picks framework, name, scope, evidence sources, due date
//   2. running   · Director Agent orchestrates 5 specialist agents (~1.2s/step)
//   3. complete  · summary card · close or "View results"
//
// Modal owns all of its own state. Parent only opens/closes it.

type AssessConfig = {
    framework: Framework
    name: string
    scopeMode: "all" | "selected"
    selectedSections: string[]
    sources: string[]
    dueDate: string // YYYY-MM-DD or "" if unset
}

const AVAILABLE_SOURCES = [
    "Okta",
    "Notion",
    "GitHub",
    "Google Drive",
    "AWS",
    "Datadog",
]

const DEFAULT_SOURCES = ["Okta", "Notion", "GitHub", "Google Drive"]

function defaultAssessmentName(fw: Framework): string {
    const d = new Date()
    const q = Math.floor(d.getMonth() / 3) + 1
    return `${fw.name} · ${d.getFullYear()} Q${q}`
}

function NewAssessmentModal({
    open,
    close,
}: {
    open: boolean
    close: () => void
}) {
    const [phase, setPhase] = React.useState<
        "configure" | "running" | "complete"
    >("configure")
    // The run finished · make completion feel like a win.
    const winRef = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        if (phase === "complete") celebrate(winRef.current)
    }, [phase])
    const [config, setConfig] = React.useState<AssessConfig>(() => ({
        framework: FRAMEWORKS[0],
        name: defaultAssessmentName(FRAMEWORKS[0]),
        scopeMode: "all",
        selectedSections: SECTION_ORDER[FRAMEWORKS[0].fw] ?? [],
        sources: DEFAULT_SOURCES,
        dueDate: "",
    }))
    const [step, setStep] = React.useState(0)
    const assessmentId = React.useMemo(
        () => `assessment-${Date.now().toString(36).slice(-6)}`,
        // re-roll the id each time the modal opens
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [open]
    )

    // Reset everything when the modal closes.
    React.useEffect(() => {
        if (!open) {
            setPhase("configure")
            setStep(0)
            setConfig({
                framework: FRAMEWORKS[0],
                name: defaultAssessmentName(FRAMEWORKS[0]),
                scopeMode: "all",
                selectedSections: SECTION_ORDER[FRAMEWORKS[0].fw] ?? [],
                sources: DEFAULT_SOURCES,
                dueDate: "",
            })
        }
    }, [open])

    // Step animation runs only during the running phase, then completes.
    React.useEffect(() => {
        if (phase !== "running") return
        if (step >= 4) {
            const finish = setTimeout(() => {
                setPhase("complete")
            }, 600)
            return () => clearTimeout(finish)
        }
        const t = setTimeout(() => setStep((s) => s + 1), 1200)
        return () => clearTimeout(t)
    }, [phase, step])

    const onFrameworkChange = (fwKey: string) => {
        const next = FRAMEWORKS.find((f: Framework) => f.fw === fwKey)
        if (!next) return
        setConfig((c) => ({
            ...c,
            framework: next,
            name: defaultAssessmentName(next),
            selectedSections: SECTION_ORDER[next.fw] ?? [],
        }))
    }

    const toggleSection = (key: string) =>
        setConfig((c) => ({
            ...c,
            selectedSections: c.selectedSections.includes(key)
                ? c.selectedSections.filter((k) => k !== key)
                : [...c.selectedSections, key],
        }))

    const toggleSource = (s: string) =>
        setConfig((c) => ({
            ...c,
            sources: c.sources.includes(s)
                ? c.sources.filter((x) => x !== s)
                : [...c.sources, s],
        }))

    const canStart =
        config.name.trim().length > 0 &&
        (config.scopeMode === "all" || config.selectedSections.length > 0) &&
        config.sources.length > 0

    const startRun = () => {
        if (!canStart) return
        setStep(0)
        setPhase("running")
    }

    const fwSections = SECTION_ORDER[config.framework.fw] ?? []
    const sectionsInScope =
        config.scopeMode === "all"
            ? fwSections.length
            : config.selectedSections.length

    const runningSteps = [
        {
            label: `Scoping ${config.framework.name} assessment`,
            agent: "Director Agent",
        },
        {
            label: `Collecting evidence from ${config.sources.length} source${config.sources.length === 1 ? "" : "s"}`,
            agent: "Evidence Agent",
        },
        {
            label: `Evaluating controls against ${config.framework.fw} criteria`,
            agent: "Controls Agent",
        },
        {
            label: "Identifying gaps and drafting remediation",
            agent: "Remediation Agent",
        },
        { label: "Assessment complete", agent: "Director Agent" },
    ]

    return (
        <Modal open={open} close={close} width={560}>
            <ModalHeader
                title={
                    phase === "complete"
                        ? "Assessment complete"
                        : phase === "running"
                          ? config.name
                          : "New assessment"
                }
                subtitle={
                    phase === "configure"
                        ? undefined
                        : assessmentId
                }
                close={close}
            />

            <ModalBody scrollable>
                {phase === "configure" && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                        }}
                    >
                        <Field label="Framework">
                            <ThemedSelect
                                value={config.framework.fw}
                                onChange={onFrameworkChange}
                                options={FRAMEWORKS.map((f: Framework) => ({
                                    value: f.fw,
                                    label: f.name,
                                }))}
                            />
                        </Field>

                        <Field label="Assessment name">
                            <ThemedInput
                                value={config.name}
                                onChange={(v) =>
                                    setConfig((c) => ({ ...c, name: v }))
                                }
                                placeholder="e.g. SOC 2 Type II · 2026 Q2"
                            />
                        </Field>

                        <Field label="Scope">
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    marginBottom:
                                        config.scopeMode === "selected"
                                            ? 10
                                            : 0,
                                }}
                            >
                                <ScopeChip
                                    active={config.scopeMode === "all"}
                                    label={`All sections (${fwSections.length})`}
                                    onClick={() =>
                                        setConfig((c) => ({
                                            ...c,
                                            scopeMode: "all",
                                        }))
                                    }
                                />
                                <ScopeChip
                                    active={config.scopeMode === "selected"}
                                    label="Selected sections"
                                    onClick={() =>
                                        setConfig((c) => ({
                                            ...c,
                                            scopeMode: "selected",
                                        }))
                                    }
                                />
                            </div>
                            {config.scopeMode === "selected" && (
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: 6,
                                    }}
                                >
                                    {fwSections.map((key) => {
                                        const checked =
                                            config.selectedSections.includes(
                                                key
                                            )
                                        return (
                                            <div
                                                key={key}
                                                onClick={() =>
                                                    toggleSection(key)
                                                }
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    padding: "7px 10px",
                                                    background: C.surface,
                                                    border: `1px solid ${C.border}`,
                                                    borderRadius: 6,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    onChange={() =>
                                                        toggleSection(key)
                                                    }
                                                />
                                                <div
                                                    style={{
                                                        font: `500 11px/14px ${MONO}`,
                                                        color: C.accentSoft,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {key}
                                                </div>
                                                <div
                                                    style={{
                                                        font: `400 12px/15px ${FONT}`,
                                                        color: C.textMuted,
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {SECTION_LABELS[key] ??
                                                        key}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </Field>

                        <Field label="Evidence sources">
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 6,
                                }}
                            >
                                {AVAILABLE_SOURCES.map((s) => {
                                    const on = config.sources.includes(s)
                                    return (
                                        <button
                                            type="button"
                                            key={s}
                                            onClick={() => toggleSource(s)}
                                            className="zbtn"
                                            style={{
                                                padding: "6px 10px",
                                                background: on
                                                    ? C.accentBg
                                                    : C.surface,
                                                border: `1px solid ${on ? C.accentLine : C.border}`,
                                                borderRadius: 999,
                                                font: `500 12px/16px ${FONT}`,
                                                color: on
                                                    ? C.accentSoft
                                                    : C.textMuted,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                            }}
                                        >
                                            {on && (
                                                <Icon
                                                    n="check"
                                                    s={10}
                                                    c={C.accentSoft}
                                                />
                                            )}
                                            {s}
                                        </button>
                                    )
                                })}
                            </div>
                        </Field>

                        <Field
                            label="Target completion"
                            hint="Optional"
                        >
                            <ThemedInput
                                value={config.dueDate}
                                onChange={(v) =>
                                    setConfig((c) => ({ ...c, dueDate: v }))
                                }
                                placeholder="YYYY-MM-DD"
                                type="date"
                            />
                        </Field>
                    </div>
                )}

                {phase === "running" && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                font: `400 13px/18px ${FONT}`,
                                color: C.textMuted,
                                marginBottom: 4,
                            }}
                        >
                            Director Agent orchestrating across{" "}
                            <span style={{ color: C.text, fontWeight: 600 }}>
                                {sectionsInScope}
                            </span>{" "}
                            sections and{" "}
                            <span style={{ color: C.text, fontWeight: 600 }}>
                                {config.sources.length}
                            </span>{" "}
                            evidence sources.
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            {runningSteps.map((s, i) => {
                                const done = i < step
                                const active = i === step
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "12px 14px",
                                            background: active
                                                ? C.accentBg
                                                : done
                                                  ? C.surface
                                                  : "transparent",
                                            border: `1px solid ${active ? C.accentLine : done ? C.border : "transparent"}`,
                                            borderRadius: 8,
                                            opacity:
                                                !active && !done ? 0.4 : 1,
                                            transition: "all 200ms",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: 999,
                                                background: done
                                                    ? C.successBg
                                                    : active
                                                      ? C.accentBg
                                                      : C.hoverOverlay,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {done ? (
                                                <Icon
                                                    n="check"
                                                    s={12}
                                                    c={C.success}
                                                   
                                                />
                                            ) : active ? (
                                                <Spinner size={12} />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: 5,
                                                        height: 5,
                                                        borderRadius: 999,
                                                        background:
                                                            C.textSubtle,
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    font: `500 13px/18px ${FONT}`,
                                                    color:
                                                        active || done
                                                            ? C.text
                                                            : C.textMuted,
                                                }}
                                            >
                                                {s.label}
                                            </div>
                                            <div
                                                style={{
                                                    font: `400 11px/14px ${FONT}`,
                                                    color: C.textSubtle,
                                                    marginTop: 1,
                                                }}
                                            >
                                                {s.agent}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {phase === "complete" && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                        }}
                    >
                        <div
                            ref={winRef}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: 14,
                                background: C.successBg,
                                border: `1px solid ${C.successLine}`,
                                borderRadius: 10,
                            }}
                        >
                            <div
                                className="zwin-check"
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 999,
                                    background: C.successBg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Icon
                                    n="check"
                                    s={16}
                                    c={C.success}
                                   
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        font: `600 14px/20px ${FONT}`,
                                        color: C.text,
                                    }}
                                >
                                    {config.name}
                                </div>
                                <div
                                    style={{
                                        font: `400 12px/16px ${FONT}`,
                                        color: C.textMuted,
                                        marginTop: 2,
                                    }}
                                >
                                    {config.framework.total} controls evaluated
                                    · {config.sources.length} sources synced
                                </div>
                            </div>
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 10,
                            }}
                        >
                            <SummaryStatBlock
                                label="Passing"
                                value={config.framework.passing}
                                color={C.success}
                            />
                            <SummaryStatBlock
                                label="In review"
                                value={config.framework.review}
                                color={C.warning}
                            />
                            <SummaryStatBlock
                                label="Gaps"
                                value={config.framework.gaps}
                                color={C.danger}
                            />
                        </div>
                        <div
                            style={{
                                font: `400 12px/16px ${FONT}`,
                                color: C.textSubtle,
                            }}
                        >
                            Director Agent will continue background runs to
                            keep this assessment fresh.
                        </div>
                    </div>
                )}
            </ModalBody>

            <ModalFooter>
                {phase === "configure" && (
                    <>
                        <button
                            type="button"
                            className="zbtn"
                            style={btnSecondary}
                            onClick={close}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="zbtn"
                            style={{
                                ...btnPrimary,
                                opacity: canStart ? 1 : 0.5,
                                cursor: canStart ? "pointer" : "not-allowed",
                            }}
                            onClick={startRun}
                        >
                            Start assessment
                        </button>
                    </>
                )}
                {phase === "running" && (
                    <button
                        type="button"
                        className="zbtn"
                        style={{ ...btnSecondary, opacity: 0.6 }}
                        disabled
                    >
                        Running…
                    </button>
                )}
                {phase === "complete" && (
                    <>
                        <button
                            type="button"
                            className="zbtn"
                            style={btnSecondary}
                            onClick={close}
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            className="zbtn"
                            style={btnPrimary}
                            onClick={close}
                        >
                            View results
                        </button>
                    </>
                )}
            </ModalFooter>
        </Modal>
    )
}

// ============ MODAL FIELD HELPERS ============

function Field({
    label,
    hint,
    children,
}: {
    label: string
    hint?: string
    children: React.ReactNode
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 8,
                }}
            >
                <div
                    style={{
                        font: `500 12px/16px ${FONT}`,
                        color: C.textMuted,
                    }}
                >
                    {label}
                </div>
                {hint && (
                    <div
                        style={{
                            font: `400 11px/14px ${FONT}`,
                            color: C.textSubtle,
                        }}
                    >
                        {hint}
                    </div>
                )}
            </div>
            {children}
        </div>
    )
}

function ThemedInput({
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    type?: string
}) {
    return (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            type={type}
            style={{
                width: "100%",
                padding: "10px 12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.text,
                font: `400 13px/18px ${FONT}`,
                outline: "none",
                boxSizing: "border-box",
                colorScheme: "dark",
            }}
        />
    )
}

function ThemedSelect({
    value,
    onChange,
    options,
}: {
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
}) {
    return (
        <div style={{ position: "relative" }}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: "100%",
                    appearance: "none",
                    WebkitAppearance: "none",
                    padding: "10px 36px 10px 12px",
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.text,
                    font: `400 13px/18px ${FONT}`,
                    outline: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                }}
            >
                {options.map((o) => (
                    <option
                        key={o.value}
                        value={o.value}
                        style={{
                            background: C.surfaceHi,
                            color: C.text,
                        }}
                    >
                        {o.label}
                    </option>
                ))}
            </select>
            <div
                style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                }}
            >
                <Icon n="caretDown" s={10} c={C.textMuted} />
            </div>
        </div>
    )
}

function ScopeChip({
    active,
    label,
    onClick,
}: {
    active: boolean
    label: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="zbtn"
            style={{
                padding: "8px 12px",
                background: active ? C.accentBg : C.surface,
                border: `1px solid ${active ? C.accentLine : C.border}`,
                borderRadius: 8,
                font: `500 12px/16px ${FONT}`,
                color: active ? C.accentSoft : C.textMuted,
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    )
}

function SummaryStatBlock({
    label,
    value,
    color,
}: {
    label: string
    value: number
    color: string
}) {
    return (
        <div
            style={{
                padding: "10px 12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
            }}
        >
            <div
                style={{
                    font: `600 20px/24px ${FONT}`,
                    color,
                    letterSpacing: "-0.015em",
                }}
            >
                {value}
            </div>
            <div
                style={{
                    font: `500 12px/16px ${FONT}`,
                    color: C.textMuted,
                    marginTop: 2,
                }}
            >
                {label}
            </div>
        </div>
    )
}
