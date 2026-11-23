import { useEffect, useMemo, useRef, useState } from "react"
import { celebrate } from "@/lib/celebrate"
import {
    IconCheck,
    IconLoader2,
    IconChevronRight,
    IconMail,
    IconLink,
    IconClock,
    IconRefresh,
    IconSearch,
    IconBulb,
    IconGauge,
    IconRobot,
    IconMessage,
    IconMessage2,
    IconHistory,
    IconFileText,
    IconDownload,
    IconSend,
    IconX,
    IconUser,
    IconBuilding,
    IconChevronDown,
    IconArrowBackUp,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { ITEMS, COLLECTION_STAGES, STAGE_OF, STATUS_META, STEP_SUMMARIES, VENDOR, EvidenceItem, StepSummary, CoverageSection, Status, Variant } from "./data"
import { usePersistentState } from "@/dashboard/AppViews"

/* -------------------------------------------------------- Review decisions */

// An analyst's call on something the agent collected. Accepting verifies it;
// rejecting sends it back to the vendor with the reason as the next ask.
export interface Decision {
    verdict: "accepted" | "rejected"
    reason: string
    at: number
}

// Only single artifacts waiting on the analyst can be accepted or rejected.
// The questionnaire is a composite with its own round-based actions.
const ORIGINAL_STATUS = Object.fromEntries(ITEMS.map((i) => [i.id, i.status])) as Record<string, Status>
const isReviewable = (id: string) => ORIGINAL_STATUS[id] === "review" && id !== "questionnaire"

function applyDecision(item: EvidenceItem, d: Decision | undefined): EvidenceItem {
    if (!d || !isReviewable(item.id)) return item
    const time = timeAgo(d.at)
    if (d.verdict === "accepted") {
        return {
            ...item,
            status: "resolved",
            summary: d.reason ? `Accepted by you: ${d.reason}` : "Accepted by you.",
            outstanding: [],
            thread: [...item.thread, { id: `${item.id}-accepted`, kind: "analyst", round: item.round, time, body: d.reason ? `Accepted the agent's recommendation. ${d.reason}` : "Accepted the agent's recommendation." }],
        }
    }
    const next = item.round + 1
    return {
        ...item,
        status: "pending",
        round: next,
        source: `Sent back · Round ${next}`,
        summary: `Rejected by you: ${d.reason}`,
        outstanding: [d.reason],
        thread: [
            ...item.thread,
            { id: `${item.id}-rejected`, kind: "analyst", round: next, time, body: `Rejected the agent's recommendation. ${d.reason}` },
            { id: `${item.id}-requeued`, kind: "system", round: next, time, body: `Added to the Round ${next} follow-up for Twilio, with your reason as the request.` },
        ],
    }
}

function timeAgo(at: number) {
    const min = Math.round((Date.now() - at) / 60_000)
    if (min < 1) return "just now"
    if (min < 60) return `${min}m ago`
    const h = Math.round(min / 60)
    return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
}

const V: Record<Variant, { text: string; softBg: string; dot: string }> = {
    success: { text: "text-success", softBg: "bg-success/15", dot: "bg-success" },
    warning: { text: "text-warning", softBg: "bg-warning/15", dot: "bg-warning" },
    info: { text: "text-info", softBg: "bg-info/15", dot: "bg-info" },
    destructive: { text: "text-destructive", softBg: "bg-destructive/15", dot: "bg-destructive" },
    primary: { text: "text-primary", softBg: "bg-primary/15", dot: "bg-primary" },
}
const badgeVariant: Record<Variant, "success" | "warning" | "info" | "destructive" | "default"> = {
    success: "success",
    warning: "warning",
    info: "info",
    destructive: "destructive",
    primary: "default",
}

export type FilterKey = Status | "all"

export function EvidenceCollection({ onBack }: { onBack: () => void }) {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [bundleOpen, setBundleOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [filter, setFilter] = useState<FilterKey>("all")
    // When set, the board narrows to just this one item. Used by the
    // 'Longest negotiation' stat tile to focus the board on the dragging item
    // rather than just opening its drawer in a noisy board.
    const [focusedItemId, setFocusedItemId] = useState<string | null>(null)
    // The analyst's accept/reject calls on agent-collected items. Kept across
    // reloads; the board, counts and drawer all read the decided state.
    const [decisions, setDecisions] = usePersistentState<Record<string, Decision>>("vendor-evidence-decisions", {})
    const decide = (id: string, verdict: Decision["verdict"], reason: string) =>
        setDecisions((prev) => ({ ...prev, [id]: { verdict, reason: reason.trim(), at: Date.now() } }))
    const undo = (id: string) =>
        setDecisions((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
        })
    const items = useMemo(() => ITEMS.map((i) => applyDecision(i, decisions[i.id])), [decisions])

    const selected = items.find((i) => i.id === selectedId) ?? null

    const counts = useMemo(() => {
        const c = { resolved: 0, review: 0, pending: 0, blocked: 0 }
        items.forEach((i) => (c[i.status] += 1))
        return c
    }, [items])
    const maxRound = Math.max(...items.map((i) => i.round))
    // The item that's gone through the most rounds with the vendor. Surfaces
    // the "what's dragging" question · replaces the misleading 'Current round'.
    const longestNegotiation = useMemo(() => {
        if (maxRound === 0) return null
        return items.reduce((acc, i) => (i.round > acc.round ? i : acc), items[0])
    }, [items, maxRound])
    const bundleItems = items.filter((i) => i.status === "pending" || i.status === "blocked")

    const matchesFilter = (i: EvidenceItem) => {
        if (filter === "all") return true
        return i.status === filter
    }
    const filtered = items.filter((i) => {
        if (focusedItemId) return i.id === focusedItemId
        const q = query.trim().toLowerCase()
        const matchQ = !q || i.title.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
        return matchesFilter(i) && matchQ
    })

    // Any filter change also clears the focused-item lens.
    const chooseFilter = (key: FilterKey) => {
        setFocusedItemId(null)
        setFilter(key)
    }

    const openItem = (id: string) => {
        // Regular tile click clears any focus lens · they're navigating away
        // from the focused item.
        setFocusedItemId(null)
        setBundleOpen(false)
        setSelectedId(id)
    }
    // Open *and* focus the board to just this item (used by the Longest
    // negotiation stat tile). Toggle behavior: click again to clear.
    const openItemFocused = (id: string) => {
        if (focusedItemId === id) {
            setFocusedItemId(null)
            setSelectedId(null)
            return
        }
        setBundleOpen(false)
        setSelectedId(id)
        setFocusedItemId(id)
    }
    const closePanel = () => {
        setSelectedId(null)
        setBundleOpen(false)
        setFocusedItemId(null)
    }
    const panelOpen = selected !== null || bundleOpen

    return (
        <TooltipProvider delayDuration={200}>
            <div className="ev-root flex h-full overflow-hidden text-foreground">
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <TopBar onBack={onBack} />
                    <div className="flex min-h-0 flex-1">
                        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
                            <WorkspaceHeader counts={counts} longestNegotiation={longestNegotiation} focusedItemId={focusedItemId} bundleCount={bundleItems.length} onReviewBundle={() => { setSelectedId(null); setBundleOpen(true) }} onFocusItem={openItemFocused} />
                            <Toolbar query={query} setQuery={setQuery} filter={filter} setFilter={chooseFilter} counts={counts} />
                            <Board items={filtered} allItems={items} selectedId={selectedId} onSelect={openItem} filterActive={filter !== "all" || query.trim() !== ""} compact={panelOpen} />
                        </main>
                        {panelOpen && (
                            <aside key={selectedId ?? "bundle"} className="flex w-[460px] shrink-0 animate-slide-in-right flex-col border-l border-border bg-popover shadow-2xl">
                                {bundleOpen ? <BundleDrawer items={bundleItems} round={maxRound} onClose={closePanel} /> : selected ? (
                                    <InvestigationDrawer
                                        item={selected}
                                        decision={decisions[selected.id]}
                                        onDecide={(verdict, reason) => decide(selected.id, verdict, reason)}
                                        onUndo={() => undo(selected.id)}
                                        onClose={closePanel}
                                    />
                                ) : null}
                            </aside>
                        )}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}

/* ----------------------------------------------------------------- TopBar */

const STEPS = [
    { label: "Intake", done: true },
    { label: "Risk tiering", done: true },
    { label: "Evidence collection", active: true },
    { label: "Risk assessment" },
    { label: "Issues" },
    { label: "Monitoring" },
]

function TopBar({ onBack }: { onBack: () => void }) {
    return (
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-6">
            <nav aria-label="Breadcrumb" className="flex shrink-0 items-center gap-1.5 text-[13px]">
                <button onClick={onBack} className="font-medium text-muted-foreground transition-colors hover:text-foreground">
                    Vendors
                </button>
                <IconChevronRight size={13} className="text-muted-foreground/50" />
                <span className="font-semibold">{VENDOR.name}</span>
            </nav>
            <Separator orientation="vertical" className="h-5" />
            <nav aria-label="Assessment steps" className="flex items-center gap-1 overflow-hidden">
                {STEPS.map((s, i) => {
                    const summary = s.done ? STEP_SUMMARIES[s.label as keyof typeof STEP_SUMMARIES] : undefined
                    return (
                        <div key={s.label} className="flex items-center gap-1">
                            {i > 0 && <IconChevronRight size={13} className="text-muted-foreground/50" />}
                            <StepPill step={s} summary={summary} />
                        </div>
                    )
                })}
            </nav>
        </header>
    )
}

function StepPill({ step, summary }: { step: (typeof STEPS)[number]; summary?: StepSummary }) {
    const inner = (
        <>
            {step.done ? (
                <IconCheck size={13} className="text-success" stroke={3} />
            ) : (
                <span className={cn("h-1.5 w-1.5 rounded-full", step.active ? "bg-primary" : "bg-muted-foreground/40")} />
            )}
            <span className={cn("whitespace-nowrap text-xs", step.active ? "font-semibold text-foreground" : step.done ? "font-medium text-muted-foreground" : "font-medium text-muted-foreground/60")}>{step.label}</span>
        </>
    )

    const pillClass = cn(
        "flex items-center gap-1.5 rounded-md border px-2.5 py-1 transition-colors",
        step.active ? "border-border bg-[hsl(var(--surface-hi))]" : "border-transparent",
        summary && "cursor-pointer hover:border-border hover:bg-[hsl(var(--surface-hi))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    )

    if (!summary) return <div className={pillClass}>{inner}</div>

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button type="button" className={pillClass} aria-label={`${step.label} summary`}>
                    {inner}
                    <IconChevronDown size={11} className="text-muted-foreground/60" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0" align="start">
                <StepSummaryCard label={step.label} summary={summary} />
            </PopoverContent>
        </Popover>
    )
}

function StepSummaryCard({ label, summary }: { label: string; summary: StepSummary }) {
    return (
        <div>
            <div className="flex items-start gap-2.5 border-b border-border px-4 py-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-success/15">
                    <IconCheck size={15} className="text-success" stroke={2.6} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-muted-foreground/70">Completed step</div>
                    <div className="text-[14px] font-semibold leading-tight">{label}</div>
                </div>
            </div>
            <div className="px-4 py-3">
                <dl className="flex flex-col gap-2">
                    {summary.fields.map((f) => (
                        <div key={f.label} className="grid grid-cols-[112px_1fr] gap-2 text-[12.5px]">
                            <dt className="text-muted-foreground/80">{f.label}</dt>
                            <dd className="font-medium text-foreground">{f.value}</dd>
                        </div>
                    ))}
                </dl>
                {summary.rationale && (
                    <div className="mt-3 rounded-md border border-border bg-[hsl(var(--surface-hi))] px-2.5 py-2">
                        <div className="mb-0.5 flex items-center gap-1 text-[12px] font-medium text-muted-foreground/70">
                            <IconBulb size={11} className="text-muted-foreground" /> Rationale
                        </div>
                        <p className="text-[12px] leading-snug text-muted-foreground">{summary.rationale}</p>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border bg-[hsl(var(--surface-inset))] px-4 py-2.5 text-[11.5px] text-muted-foreground/80">
                <div className="flex items-center gap-1.5">
                    <IconUser size={12} />
                    <span>{summary.completedBy}</span>
                </div>
                <span>{summary.completedAt}</span>
            </div>
            <div className="border-t border-border px-3 py-2">
                <button className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[12px] font-medium text-primary hover:bg-primary/10">
                    Open full step
                    <IconChevronRight size={14} />
                </button>
            </div>
        </div>
    )
}

/* ------------------------------------------------------- WorkspaceHeader */

function WorkspaceHeader({ counts, longestNegotiation, focusedItemId, bundleCount, onReviewBundle, onFocusItem }: { counts: Record<Status, number>; longestNegotiation: EvidenceItem | null; focusedItemId: string | null; bundleCount: number; onReviewBundle: () => void; onFocusItem: (id: string) => void }) {
    const total = counts.resolved + counts.review + counts.pending + counts.blocked
    const pct = Math.round((counts.resolved / total) * 100)
    const segments: { n: number; label: string; color: string }[] = [
        { n: counts.resolved, label: "verified", color: "bg-success" },
        { n: counts.review, label: "needs review", color: "bg-info" },
        { n: counts.pending, label: "awaiting vendor", color: "bg-warning" },
        { n: counts.blocked, label: "action required", color: "bg-destructive" },
    ]
    return (
        <div className="px-8 pb-6 pt-7">
            <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-[hsl(var(--surface-hi))] font-serif text-[22px] font-medium">T</div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                        <h1 className="font-serif text-[32px] font-medium leading-9 tracking-[-0.012em]">{VENDOR.name}</h1>
                        <span className="rounded-full border border-border px-2 py-px text-[11.5px] font-medium text-muted-foreground">{VENDOR.tier}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                        <span className="whitespace-nowrap">{VENDOR.type.replace(" · ", ", ")}</span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap"><IconLink size={13} className="text-muted-foreground/60" />{VENDOR.trustCenter}</span>
                        {longestNegotiation && (
                            <button
                                onClick={() => onFocusItem(longestNegotiation.id)}
                                aria-pressed={focusedItemId === longestNegotiation.id}
                                className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded transition-colors hover:text-foreground", focusedItemId === longestNegotiation.id && "text-primary")}
                            >
                                <IconRefresh size={13} />
                                Longest negotiation: {longestNegotiation.title}, {longestNegotiation.round} rounds
                            </button>
                        )}
                    </div>
                </div>
                <Button onClick={onReviewBundle}>
                    <IconMail size={16} />
                    Review follow-up bundle
                    <span className="rounded-full bg-cta-foreground/10 px-2 py-px text-xs tabular-nums">{bundleCount}</span>
                </Button>
            </div>

            <div className="mt-6 flex items-center gap-5">
                <div className="flex shrink-0 items-baseline gap-2">
                    <span className="text-[28px] font-semibold leading-none tracking-tight">{pct}%</span>
                    <span className="text-[13px] text-muted-foreground">evidence complete</span>
                </div>
                <div className="flex h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[hsl(var(--surface-inset))]">
                    {segments.map((sg) =>
                        sg.n > 0 ? (
                            <Tooltip key={sg.label}>
                                <TooltipTrigger asChild>
                                    <span className={cn("block h-full", sg.color)} style={{ width: `${(sg.n / total) * 100}%` }} />
                                </TooltipTrigger>
                                <TooltipContent>{sg.n} {sg.label}</TooltipContent>
                            </Tooltip>
                        ) : null
                    )}
                </div>
                <span className="shrink-0 text-[12.5px] tabular-nums text-success">+23% in 24h</span>
            </div>
        </div>
    )
}

/* --------------------------------------------------------------- Toolbar */

function Toolbar({ query, setQuery, filter, setFilter, counts }: { query: string; setQuery: (s: string) => void; filter: FilterKey; setFilter: (s: FilterKey) => void; counts: Record<Status, number> }) {
    const tabs: { key: FilterKey; label: string; n: number; dot?: string }[] = [
        { key: "all", label: "All", n: counts.resolved + counts.review + counts.pending + counts.blocked },
        { key: "blocked", label: "Action required", n: counts.blocked, dot: "bg-destructive" },
        { key: "review", label: "Needs review", n: counts.review, dot: "bg-info" },
        { key: "pending", label: "Awaiting vendor", n: counts.pending, dot: "bg-warning" },
        { key: "resolved", label: "Verified", n: counts.resolved, dot: "bg-success" },
    ]
    return (
        <div className="flex items-center gap-3 px-8">
            <div role="tablist" aria-label="Filter evidence" className="flex min-w-0 items-center gap-0.5 overflow-x-auto whitespace-nowrap rounded-lg border border-border p-0.5 [background:hsl(var(--surface-inset)/0.4)]">
                {tabs.map((t) => {
                    const on = filter === t.key
                    return (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={on}
                            onClick={() => setFilter(t.key)}
                            className={cn(
                                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors",
                                on ? "bg-[hsl(var(--surface-hi))] text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t.dot && <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />}
                            {t.label}
                            <span className="tabular-nums text-muted-foreground/70">{t.n}</span>
                        </button>
                    )
                })}
            </div>
            <div className="relative ml-auto w-[220px] min-w-[140px] shrink">
                <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search evidence" className="h-8 pl-8 text-[13px]" />
            </div>
        </div>
    )
}

/* ----------------------------------------------------------------- Board */

// Order rows within a section by what needs the analyst's attention first:
// blocked (analyst is the blocker) → review (decision pending) → pending
// (passive wait) → resolved (reference). Higher round breaks ties (more rounds
// = staler = more urgent).
const STATUS_ORDER: Record<Status, number> = { blocked: 0, review: 1, pending: 2, resolved: 3 }
const byPriority = (a: EvidenceItem, b: EvidenceItem) => {
    const d = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    return d !== 0 ? d : b.round - a.round
}

function Board({ items, allItems, selectedId, onSelect, filterActive, compact }: { items: EvidenceItem[]; allItems: EvidenceItem[]; selectedId: string | null; onSelect: (id: string) => void; filterActive: boolean; compact: boolean }) {
    // Default-collapse fully-clean stages; keep ones needing attention open.
    const [collapsed, setCollapsed] = useState<Set<string>>(() => {
        const c = new Set<string>()
        COLLECTION_STAGES.forEach((s) => {
            const all = allItems.filter((i) => STAGE_OF[i.id] === s.id)
            if (all.length > 0 && all.every((i) => i.status === "resolved")) c.add(s.id)
        })
        return c
    })
    const toggle = (id: string) => setCollapsed((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

    // When an item is opened from outside the board (e.g. the longest
    // negotiation link), expand its section and scroll the row into view.
    useEffect(() => {
        if (!selectedId) return
        const stageId = STAGE_OF[selectedId]
        if (stageId) {
            setCollapsed((prev) => {
                if (!prev.has(stageId)) return prev
                const next = new Set(prev)
                next.delete(stageId)
                return next
            })
        }
        const t = setTimeout(() => {
            const el = document.querySelector(`[data-item-id="${selectedId}"]`) as HTMLElement | null
            if (!el) return
            const rect = el.getBoundingClientRect()
            const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
            if (!fullyVisible) el.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 80)
        return () => clearTimeout(t)
    }, [selectedId])

    const stages = COLLECTION_STAGES.map((s) => ({
        stage: s,
        all: allItems.filter((i) => STAGE_OF[i.id] === s.id).sort(byPriority),
        shown: items.filter((i) => STAGE_OF[i.id] === s.id).sort(byPriority),
    })).filter((g) => g.shown.length > 0)

    return (
        <div className="flex flex-col gap-3 px-8 pb-10 pt-4">
            {items.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground/70">No evidence matches your filters.</div>}
            {stages.map((g) => (
                <CollectionSection
                    key={g.stage.id}
                    stage={g.stage}
                    all={g.all}
                    shown={g.shown}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    open={filterActive || !collapsed.has(g.stage.id)}
                    onToggle={() => toggle(g.stage.id)}
                    compact={compact}
                />
            ))}
        </div>
    )
}

// `compact` is set while a drawer narrows the board: secondary text drops out.
function CollectionSection({ stage, all, shown, selectedId, onSelect, open, onToggle, compact }: { stage: (typeof COLLECTION_STAGES)[number]; all: EvidenceItem[]; shown: EvidenceItem[]; selectedId: string | null; onSelect: (id: string) => void; open: boolean; onToggle: () => void; compact: boolean }) {
    const n = (st: Status) => all.filter((i) => i.status === st).length
    const complete = n("resolved") === all.length
    const sig = all.find((i) => i.questions)
    // Only problems get color; the rest of the summary stays quiet.
    const parts: { text: string; className?: string }[] = sig
        ? [{ text: `${sig.questions!.filled} of ${sig.questions!.total} questions answered` }]
        : complete
        ? [{ text: stage.note ?? `${all.length} verified`, className: "text-success" }]
        : [
              { text: `${n("resolved")} of ${all.length} verified` },
              ...(n("blocked") ? [{ text: `${n("blocked")} action required`, className: "text-destructive" }] : []),
              ...(n("review") ? [{ text: `${n("review")} to review`, className: "text-foreground" }] : []),
              ...(n("pending") ? [{ text: `${n("pending")} awaiting vendor` }] : []),
          ]
    return (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
            <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[hsl(var(--surface-hi))]">
                <IconChevronRight size={14} className={cn("shrink-0 text-muted-foreground/60 transition-transform duration-200", open && "rotate-90")} />
                <span className="whitespace-nowrap text-[14px] font-semibold">{stage.name}</span>
                {!compact && <span className="truncate text-[12.5px] text-muted-foreground/70">{stage.desc}</span>}
                <span className="ml-auto flex shrink-0 items-center gap-2 text-[12.5px] text-muted-foreground">
                    {(compact ? parts.filter((p, i) => i === 0 || p.className) : parts).map((p, i) => (
                        <span key={p.text} className="flex items-center gap-2">
                            {i > 0 && <span className="text-muted-foreground/40">·</span>}
                            <span className={p.className}>{p.text}</span>
                        </span>
                    ))}
                </span>
            </button>
            {open && (
                <div className="border-t border-border">
                    {shown.map((it, i) => (
                        <EvidenceRow key={it.id} item={it} active={it.id === selectedId} last={i === shown.length - 1} onClick={() => onSelect(it.id)} compact={compact} />
                    ))}
                </div>
            )}
        </section>
    )
}

// One evidence item as an aligned row: status, title + provenance, the
// one-line summary, negotiation context, and recency.
function EvidenceRow({ item, active, last, onClick, compact }: { item: EvidenceItem; active: boolean; last: boolean; onClick: () => void; compact: boolean }) {
    const m = STATUS_META[item.status]
    const latest = item.thread[item.thread.length - 1]
    const hasNewReply = item.status === "review" && item.thread.some((e) => e.kind === "vendor")
    const weak = item.coverage?.sections.filter((s) => s.filled / s.total < 0.55) ?? []
    return (
        <button
            data-item-id={item.id}
            onClick={onClick}
            aria-current={active ? "true" : undefined}
            className={cn(
                "grid w-full items-center gap-5 px-4 py-3 text-left transition-colors hover:bg-[hsl(var(--surface-hi))]",
                compact ? "grid-cols-[minmax(0,1fr)_128px_32px]" : "grid-cols-[minmax(220px,1.1fr)_minmax(0,1.6fr)_84px_128px_32px]",
                !last && "border-b border-border",
                active && "bg-[var(--c-hover-overlay)] shadow-[inset_2px_0_0_hsl(var(--primary))]"
            )}
        >
            <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium text-foreground">{item.title}</div>
                <div className="truncate text-[11.5px] text-muted-foreground/70">{item.category} · {item.source}</div>
            </div>
            {!compact && (
            <div className="min-w-0">
                {item.questions ? (
                    <div className="flex items-center gap-3">
                        <Progress value={Math.round((item.questions.filled / item.questions.total) * 100)} className="h-1.5 w-28 shrink-0" indicatorClassName="bg-info" />
                        <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">{item.questions.filled}/{item.questions.total}</span>
                        {weak.length > 0 && <span className="truncate text-[12px] text-destructive">{weak.length} weak sections</span>}
                    </div>
                ) : (
                    <div className="truncate text-[12.5px] text-muted-foreground">{item.summary}</div>
                )}
            </div>
            )}
            {!compact && (
                <div className="flex items-center justify-end gap-1.5">
                    {hasNewReply && <span className="rounded border border-border px-1.5 py-px text-[11px] font-medium text-foreground">New reply</span>}
                </div>
            )}
            <span className={cn("flex items-center gap-1.5 text-[12px] font-medium", V[m.variant].text)}>
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", V[m.variant].dot)} />
                {m.label}
            </span>
            <span className="whitespace-nowrap text-right text-[12px] tabular-nums text-muted-foreground/60">{latest.time.replace(" ago", "").replace("just now", "now")}</span>
        </button>
    )
}

function StatusBadge({ status }: { status: Status }) {
    const m = STATUS_META[status]
    return (
        <Badge variant={badgeVariant[m.variant]} className="shrink-0">
            <span className={cn("h-1.5 w-1.5 rounded-full", V[m.variant].dot)} />
            {m.label}
        </Badge>
    )
}

/* ------------------------------------------------- InvestigationDrawer */

const EVENT_STYLE: Record<string, { label: string; icon: typeof IconUser; tint: string; iconBg: string }> = {
    ai: { label: "Agent", icon: IconRobot, tint: "text-foreground", iconBg: "bg-[hsl(var(--surface-hi))]" },
    analyst: { label: "You", icon: IconUser, tint: "text-foreground", iconBg: "bg-[hsl(var(--surface-hi))]" },
    vendor: { label: "Twilio", icon: IconBuilding, tint: "text-info", iconBg: "bg-info/15" },
    system: { label: "System", icon: IconRefresh, tint: "text-muted-foreground", iconBg: "bg-[hsl(var(--surface-hi))]" },
}

function InvestigationDrawer({ item, decision, onDecide, onUndo, onClose }: { item: EvidenceItem; decision?: Decision; onDecide: (verdict: Decision["verdict"], reason: string) => void; onUndo: () => void; onClose: () => void }) {
    const [draft, setDraft] = useState("")
    const rounds = Array.from(new Set(item.thread.map((e) => e.round))).sort((a, b) => a - b)
    const totalMessages = item.thread.filter((e) => e.kind !== "system").length
    // Round 0 is automated discovery, not a vendor outreach round.
    const outreachRoundCount = rounds.filter((r) => r > 0).length
    // Questionnaire is a composite (186 controls across 11 sections), not an
    // atomic artifact. It doesn't need a verbal "Latest answer" (the coverage
    // bars ARE the answer) or an "Outstanding" list (weak rows already show
    // that). Hardcoded special-case per design call.
    const isQuestionnaire = item.id === "questionnaire"
    // Full conversation collapsed by default · compresses long threads. Once
    // expanded, each round is itself collapsed with its 1-line synthesis,
    // except the latest round which auto-opens.
    const [threadOpen, setThreadOpen] = useState(false)
    const latestRound = rounds[rounds.length - 1] ?? 0
    const [openRounds, setOpenRounds] = useState<Set<number>>(() => new Set([latestRound]))
    const toggleRound = (r: number) => setOpenRounds((prev) => { const n = new Set(prev); n.has(r) ? n.delete(r) : n.add(r); return n })
    const [milestonesOpen, setMilestonesOpen] = useState(true)

    return (
        <>
            <DrawerHeader onClose={onClose} eyebrow={`${item.category} · ${item.source}`} title={item.title} badge={<StatusBadge status={item.status} />} />
            <ScrollArea className="min-h-0 flex-1">
                <div className="px-5 pb-4 pt-1">
                    <div className="flex flex-wrap gap-2 py-3">
                        {item.confidence != null && <KeyFact icon={IconGauge} label="AI confidence" value={`${item.confidence}%`} />}
                        {/* Answered keyfact is suppressed on questionnaire · coverage block already shows it. */}
                    </div>

                    {decision && isReviewable(item.id) && <DecisionRecord decision={decision} onUndo={onUndo} />}

                    {/* Latest answer · bottom line, always visible at top */}
                    {!isQuestionnaire && item.latestAnswer && (
                        <div className="mt-3 rounded-xl border border-border p-3.5">
                            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                                <IconMessage2 size={12} stroke={2.4} /> Latest answer
                            </div>
                            <p className="text-[13.5px] leading-relaxed text-foreground">{item.latestAnswer}</p>
                        </div>
                    )}

                    {/* Outstanding questions */}
                    {!isQuestionnaire && item.outstanding && item.outstanding.length > 0 && (
                        <div className="mt-3 rounded-xl border border-border p-3.5">
                            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-warning">
                                <IconClock size={12} stroke={2.4} /> Still open
                            </div>
                            <ul className="space-y-1.5">
                                {item.outstanding.map((q, i) => (
                                    <li key={i} className="flex gap-2 text-[13px] leading-snug text-foreground">
                                        <span className="text-warning">·</span>
                                        <span>{q}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Coverage by section · questionnaire-only composite view */}
                    {item.coverage && <CoverageBlock coverage={item.coverage} />}

                    {/* Key milestones digest */}
                    {item.milestones && item.milestones.length > 0 && (
                        <div className="mt-3 rounded-xl border border-border bg-card">
                            <button onClick={() => setMilestonesOpen(!milestonesOpen)} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left">
                                <IconHistory size={14} className="text-muted-foreground" />
                                <span className="flex-1 text-[12px] font-medium text-muted-foreground">Key milestones</span>
                                <span className="text-[11px] text-muted-foreground/60">{item.milestones.length} highlights</span>
                                <IconChevronDown size={15} className={cn("text-muted-foreground/60 transition-transform", milestonesOpen && "rotate-180")} />
                            </button>
                            {milestonesOpen && (
                                <ol className="space-y-2 border-t border-border px-3.5 py-3">
                                    {item.milestones.map((m, i) => {
                                        const style = m.tone ? EVENT_STYLE[m.tone === "agent" ? "ai" : m.tone] : EVENT_STYLE.system
                                        return (
                                            <li key={i} className="flex gap-2.5">
                                                <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold", style.iconBg, style.tint)}>
                                                    R{m.round}
                                                </span>
                                                <span className="text-[12.5px] leading-snug text-foreground">{m.text}</span>
                                            </li>
                                        )
                                    })}
                                </ol>
                            )}
                        </div>
                    )}

                    {/* Full conversation · collapsed by default */}
                    <div className="mt-4">
                        <button onClick={() => setThreadOpen(!threadOpen)} className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2.5 text-left transition-colors hover:bg-[hsl(var(--surface-hi))]">
                            <IconHistory size={14} className="text-muted-foreground" />
                            <span className="flex-1 text-[12px] font-medium text-muted-foreground">Full conversation</span>
                            <span className="text-[11px] text-muted-foreground/70">
                                {totalMessages} messages · {outreachRoundCount} {outreachRoundCount === 1 ? "round" : "rounds"}
                                {rounds.includes(0) && " + discovery"}
                            </span>
                            <IconChevronDown size={15} className={cn("text-muted-foreground/60 transition-transform", threadOpen && "rotate-180")} />
                        </button>
                        {threadOpen && (
                            <div className="mt-2 flex flex-col gap-2">
                                {rounds.map((r) => {
                                    const events = item.thread.filter((e) => e.round === r)
                                    const open = openRounds.has(r)
                                    const synthesis = item.roundSummaries?.[r]
                                    const isLatest = r === latestRound
                                    return (
                                        <div key={r} className={cn("overflow-hidden rounded-lg border", isLatest ? "border-foreground/20" : "border-border")}>
                                            <button onClick={() => toggleRound(r)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[hsl(var(--surface-hi))]">
                                                <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold", r === 0 ? "border-border bg-[hsl(var(--surface-hi))] text-muted-foreground/80" : "border-border text-foreground")}>
                                                    {r === 0 ? "Discovery" : `R${r}`}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    {synthesis ? (
                                                        <div className="text-[12.5px] leading-snug text-foreground">{synthesis}</div>
                                                    ) : (
                                                        <div className="text-[12.5px] leading-snug text-muted-foreground">{events.length} {events.length === 1 ? "message" : "messages"}</div>
                                                    )}
                                                </div>
                                                <span className="shrink-0 text-[10.5px] text-muted-foreground/60">{events.length}</span>
                                                <IconChevronDown size={14} className={cn("shrink-0 text-muted-foreground/60 transition-transform", open && "rotate-180")} />
                                            </button>
                                            {open && (
                                                <div className="border-t border-border bg-background px-3 py-3">
                                                    {events.map((e) => <ThreadBubble key={e.id} e={e} />)}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
            <DrawerActions item={item} decided={!!decision} onDecide={onDecide} draft={draft} setDraft={setDraft} />
        </>
    )
}

// Who decided, when and why, at the top of the drawer. Undo puts the item
// back in 'Needs review' and removes the decision from the thread.
function DecisionRecord({ decision, onUndo }: { decision: Decision; onUndo: () => void }) {
    const accepted = decision.verdict === "accepted"
    return (
        <div className={cn("mt-3 rounded-xl border p-3.5", accepted ? "border-success/40 bg-success/10" : "border-warning/40 bg-warning/10")}>
            <div className="flex items-center gap-2">
                {accepted ? <IconCheck size={14} stroke={2.4} className="text-success" /> : <IconArrowBackUp size={14} stroke={2.4} className="text-warning" />}
                <span className="flex-1 text-[13px] font-semibold text-foreground">
                    {accepted ? "Accepted by you" : "Rejected by you · sent back to Twilio"}
                    <span className="font-normal text-muted-foreground"> · {timeAgo(decision.at)}</span>
                </span>
                <Button variant="outline" size="sm" onClick={onUndo}>
                    Undo
                </Button>
            </div>
            {decision.reason && <p className="mt-1.5 pl-[22px] text-[13px] leading-snug text-foreground">{decision.reason}</p>}
        </div>
    )
}

// Accept or reject what the agent collected. One note field serves both:
// optional when accepting, required when rejecting, since a rejection with
// no reason gives the agent nothing to ask the vendor.
function ReviewActions({ onDecide }: { onDecide: (verdict: Decision["verdict"], reason: string) => void }) {
    const [reason, setReason] = useState("")
    const acceptRef = useRef<HTMLButtonElement>(null)
    const canReject = reason.trim().length > 0
    return (
        <div className="mb-3 space-y-2">
            <label htmlFor="review-reason" className="text-[12px] font-medium text-muted-foreground">
                Your reason <span className="font-normal">(required to reject)</span>
            </label>
            <textarea
                id="review-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="e.g. Cap is still below our $10M standard; ask for Legal sign-off"
                className="zfocus w-full resize-none rounded-lg border border-border bg-[hsl(var(--surface-hi))] px-3 py-2 text-[13px] leading-snug text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <div className="flex gap-2">
                <Button
                    ref={acceptRef}
                    className="flex-1"
                    onClick={() => {
                        celebrate(acceptRef.current)
                        onDecide("accepted", reason)
                    }}
                >
                    <IconCheck size={15} /> Accept & verify
                </Button>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {/* Wrapper keeps the tooltip working while the button is disabled. */}
                        <span tabIndex={canReject ? -1 : 0}>
                            <Button variant="outline" disabled={!canReject} onClick={() => onDecide("rejected", reason)}>
                                <IconArrowBackUp size={15} /> Reject
                            </Button>
                        </span>
                    </TooltipTrigger>
                    {!canReject && <TooltipContent>Add a reason to reject</TooltipContent>}
                </Tooltip>
            </div>
        </div>
    )
}

/* Coverage by section · specialized to the questionnaire's composite shape.
   Source attribution row shows where the auto-filled answers came from;
   section bars show per-section gaps so the analyst can target follow-ups. */
function CoverageBlock({ coverage }: { coverage: NonNullable<EvidenceItem["coverage"]> }) {
    const totalFilled = coverage.sections.reduce((s, x) => s + x.filled, 0)
    const totalAll = coverage.sections.reduce((s, x) => s + x.total, 0)
    const remaining = totalAll - totalFilled
    return (
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                    <IconFileText size={12} /> Coverage by section
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground/70">
                    {totalFilled} of {totalAll} questions filled · {remaining} remaining
                </div>
            </div>

            {/* Source attribution · auditable provenance row */}
            <ul className="border-b border-border px-3.5 py-3">
                {coverage.sources.map((src) => (
                    <li key={src.label} className="flex flex-wrap items-baseline gap-1.5 py-1 text-[12.5px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        <span className="text-foreground">{src.label}</span>
                        <span className="text-muted-foreground/60">→</span>
                        <span className="font-semibold text-success">{src.count} answers</span>
                        {src.categories && <span className="text-muted-foreground/60">({src.categories})</span>}
                    </li>
                ))}
                {remaining > 0 && (
                    <li className="mt-1 flex items-center gap-1.5 text-[12px] text-warning">
                        <IconMail size={12} />
                        <span><span className="font-semibold">{remaining} remaining</span> in vendor follow-up bundle</span>
                    </li>
                )}
            </ul>

            {/* Per-section bars */}
            <div className="flex flex-col gap-1.5 px-3.5 py-3">
                {coverage.sections.map((s) => <CoverageRow key={s.name} section={s} />)}
            </div>
        </div>
    )
}

function CoverageRow({ section }: { section: CoverageSection }) {
    const pct = (section.filled / section.total) * 100
    const tone = pct >= 80 ? "success" : pct >= 55 ? "warning" : "destructive"
    const fillClass = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-destructive"
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="grid grid-cols-[120px_1fr_44px] items-center gap-2 py-0.5">
                    <div className="truncate text-[12px] text-muted-foreground">{section.name}</div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-[hsl(var(--surface-inset))]">
                        <div className={cn("h-full rounded-full transition-all", fillClass)} style={{ width: `${Math.max(pct, 4)}%` }} />
                    </div>
                    <div className={cn("text-right text-[11.5px] tabular-nums", tone === "destructive" ? "font-semibold text-destructive" : "text-muted-foreground/80")}>
                        {section.filled}/{section.total}
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent side="left">
                <div className="text-[11px] font-semibold">{section.name} · {Math.round(pct)}%</div>
                {section.sources.length > 0 && <div className="mt-0.5 text-[11px] text-muted-foreground/80">From: {section.sources.join(", ")}</div>}
            </TooltipContent>
        </Tooltip>
    )
}

function ThreadBubble({ e }: { e: EvidenceItem["thread"][number] }) {
    const s = EVENT_STYLE[e.kind]
    const Ic = s.icon
    if (e.kind === "system") {
        return (
            <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground/70">
                <Ic size={13} />
                <span className="flex-1">{e.body}</span>
                <span>{e.time}</span>
            </div>
        )
    }
    return (
        <div className="mb-3.5 flex gap-2.5">
            <div className={cn("grid h-[26px] w-[26px] shrink-0 place-items-center rounded-md border border-border", s.iconBg)}>
                <Ic size={14} className={s.tint} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                    <span className={cn("text-[12.5px] font-semibold", s.tint)}>{s.label}</span>
                    <span className="text-[11px] text-muted-foreground/60">{e.time}</span>
                </div>
                <p className="text-[13px] leading-normal text-foreground">{e.body}</p>
                {e.attachment && (
                    <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-border bg-[hsl(var(--surface-hi))] px-2.5 py-2">
                        <div className="grid h-[30px] w-[30px] place-items-center rounded-md bg-destructive/15">
                            <IconFileText size={16} className="text-destructive" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[12.5px] font-semibold">{e.attachment.name}</div>
                            <div className="text-[11px] text-muted-foreground/70">{e.attachment.meta}</div>
                        </div>
                        <IconDownload size={16} className="text-muted-foreground" />
                    </div>
                )}
                {e.citation && (
                    <a href={e.citation.url} className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11.5px] text-primary no-underline hover:bg-[hsl(var(--surface-hi))]">
                        <IconLink size={12} /> {e.citation.label}
                    </a>
                )}
            </div>
        </div>
    )
}

function KeyFact({ icon: Ic, label, value }: { icon: typeof IconClock; label: string; value: string }) {
    return (
        <div className="min-w-[96px] flex-1 rounded-lg border border-border bg-[hsl(var(--surface-hi))] px-3 py-2">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                <Ic size={12} />
                {label}
            </div>
            <div className="mt-0.5 text-base font-bold">{value}</div>
        </div>
    )
}

function DrawerActions({ item, decided, onDecide, draft, setDraft }: { item: EvidenceItem; decided: boolean; onDecide: (verdict: Decision["verdict"], reason: string) => void; draft: string; setDraft: (s: string) => void }) {
    const isQuestionnaire = item.id === "questionnaire"
    const openQuestions = item.coverage
        ? item.coverage.sections.reduce((s, x) => s + (x.total - x.filled), 0)
        : 0
    return (
        <div className="border-t border-border bg-card p-4">
            {isQuestionnaire ? (
                // Process actions for a composite, not artifact accept/reject.
                <div className="mb-3 grid grid-cols-[1fr_auto_auto] gap-2">
                    <WinButton className="flex-1" doneLabel="Round 2 sent to Twilio">
                        <IconSend size={15} /> Send Round 2 ({openQuestions} open)
                    </WinButton>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon-sm"><IconDownload size={15} /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Download draft</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon-sm"><IconCheck size={15} /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark complete</TooltipContent>
                    </Tooltip>
                </div>
            ) : isReviewable(item.id) ? (
                // Decided items show their record (with Undo) at the top instead.
                decided ? null : <ReviewActions onDecide={onDecide} />
            ) : (
                <div className="mb-3 flex gap-2">
                    <WinButton
                        className="flex-1"
                        doneLabel={item.status === "review" ? "Verified" : item.status === "blocked" ? "NDA sent for signature" : "Added to follow-up"}
                    >
                        {item.status === "review" ? "Accept & verify" : item.status === "blocked" ? "Sign NDA to unlock" : "Add to follow-up"}
                    </WinButton>
                    <Button variant="outline">Snooze</Button>
                </div>
            )}
            <div className="zfocus flex items-center gap-2 rounded-lg border border-border bg-[hsl(var(--surface-hi))] py-1.5 pl-3 pr-1.5 transition-shadow">
                <IconMessage size={16} className="shrink-0 text-muted-foreground" />
                <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={1}
                    placeholder={isQuestionnaire ? "Ask the agent, e.g. 'draft Round 2 for HR Security'…" : "Ask the agent about this item…"}
                    className="zinp flex-1 resize-none self-center bg-transparent py-1 text-[13px] leading-tight text-foreground outline-none placeholder:text-muted-foreground/60"
                />
                <Button size="icon-sm" disabled={!draft} className="shrink-0">
                    <IconSend size={15} />
                </Button>
            </div>
        </div>
    )
}

/* -------------------------------------------------------------- WinButton */

// Primary action that resolves visibly: a short working beat, then a success
// state with a celebration. Drawers are keyed by item, so state resets per item.
function WinButton({ children, doneLabel, className, size, disabled }: { children: React.ReactNode; doneLabel: string; className?: string; size?: "default" | "lg"; disabled?: boolean }) {
    const [state, setState] = useState<"idle" | "working" | "done">("idle")
    const ref = useRef<HTMLButtonElement>(null)
    const run = () => {
        if (state !== "idle") return
        setState("working")
        window.setTimeout(() => {
            setState("done")
            celebrate(ref.current)
        }, 650)
    }
    return (
        <Button
            ref={ref}
            size={size}
            disabled={disabled}
            onClick={run}
            aria-live="polite"
            className={cn(className, state === "done" && "bg-success text-success-foreground hover:bg-success", state === "working" && "cursor-progress")}
        >
            {state === "working" && <IconLoader2 size={15} className="animate-spin" />}
            {state === "done" && (
                <span className="zwin-check">
                    <IconCheck size={15} stroke={2.6} />
                </span>
            )}
            {state === "done" ? doneLabel : state === "working" ? "Working…" : children}
        </Button>
    )
}

/* ----------------------------------------------------------- BundleDrawer */

function BundleDrawer({ items, round, onClose }: { items: EvidenceItem[]; round: number; onClose: () => void }) {
    const [checked, setChecked] = useState<Record<string, boolean>>(Object.fromEntries(items.map((i) => [i.id, true])))
    const n = Object.values(checked).filter(Boolean).length
    return (
        <>
            <DrawerHeader onClose={onClose} eyebrow="Vendor outreach" title={`Follow-up bundle · Round ${round + 1}`} badge={<Badge variant="warning">Draft</Badge>} />
            <ScrollArea className="min-h-0 flex-1">
                <div className="px-5 pb-4 pt-3">
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        The agent grouped every open gap into a single email to <strong className="text-foreground">trust@twilio.com</strong>. Sending as one request keeps the vendor's response in a single thread instead of {items.length} separate emails.
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                        {items.map((it) => {
                            const m = STATUS_META[it.status]
                            const on = checked[it.id]
                            return (
                                <label key={it.id} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors", on ? "border-foreground/25 bg-[hsl(var(--surface-hi))]" : "border-border")}>
                                    <Checkbox checked={on} onCheckedChange={(v) => setChecked({ ...checked, [it.id]: !!v })} className="mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13.5px] font-semibold">{it.title}</span>
                                            <span className={cn("rounded px-1.5 py-px text-[10.5px] font-semibold", V[m.variant].text, V[m.variant].softBg)}>{it.status === "blocked" ? "NDA" : `R${it.round}`}</span>
                                        </div>
                                        <div className="mt-0.5 text-xs leading-snug text-muted-foreground">{it.summary}</div>
                                    </div>
                                </label>
                            )
                        })}
                    </div>
                </div>
            </ScrollArea>
            <div className="border-t border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <IconClock size={14} /> Auto-sends in 1h 57m if not reviewed · est. reply in {VENDOR.avgResponseDays} days
                </div>
                <WinButton className="w-full" size="lg" disabled={n === 0} doneLabel={`${n} ${n === 1 ? "request" : "requests"} sent to Twilio`}>
                    <IconSend size={16} /> Send {n} {n === 1 ? "request" : "requests"} to Twilio
                </WinButton>
            </div>
        </>
    )
}

/* --------------------------------------------------------- shared drawer */

function DrawerHeader({ onClose, eyebrow, title, badge }: { onClose: () => void; eyebrow: string; title: string; badge?: React.ReactNode }) {
    return (
        <div className="shrink-0 border-b border-border px-5 pb-3.5 pt-4">
            <div className="flex items-start gap-2.5">
                <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-muted-foreground/70">{eyebrow}</div>
                    <h3 className="mb-2 mt-1 text-[17px] font-bold leading-tight tracking-tight">{title}</h3>
                    {badge}
                </div>
                <Button variant="outline" size="icon-sm" onClick={onClose}>
                    <IconX size={16} />
                </Button>
            </div>
        </div>
    )
}
