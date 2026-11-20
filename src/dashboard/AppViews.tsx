import * as React from "react"
import {
    C,
    FONT,
    SERIF,
    MONO,
    Icon,
    FilterChip,
    Modal,
    ModalHeader,
    ModalBody,
    Spinner,
    btnPrimary,
    btnSecondary,
    panelStyle,
    eyebrowStyle,
    relTime,
} from "./DashboardLib"
import type { Activity, Ctl, CtlStatus } from "./DashboardData"

// ============ APP VIEWS ============
//
// Evidence, Policies, Risk register and Agents, plus the shortcut sheet and
// the signed-out screen. Each page is a filterable list whose rows fold open
// for detail; anything the user changes is kept in localStorage.

type Control = Ctl & { status: CtlStatus }

const NOW = Date.now()
const MIN = 60_000
const DAY = 24 * 60 * MIN

// State that survives a reload. Falls back to memory when storage is blocked.
export function usePersistentState<T>(key: string, initial: T) {
    const [value, setValue] = React.useState<T>(() => {
        try {
            const raw = window.localStorage.getItem(key)
            return raw ? (JSON.parse(raw) as T) : initial
        } catch {
            return initial
        }
    })
    React.useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value))
        } catch {
            // ignore (eg. private mode)
        }
    }, [key, value])
    return [value, setValue] as const
}

// ============ SHARED PIECES ============

function PageHeader({ title, sub, actions }: { title: string; sub: string; actions?: React.ReactNode }) {
    return (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
            <div>
                <h1 style={{ margin: 0, font: `500 34px/40px ${SERIF}`, letterSpacing: "-0.012em", color: C.text }}>{title}</h1>
                <div style={{ font: `400 13px/18px ${FONT}`, color: C.textMuted, marginTop: 4 }}>{sub}</div>
            </div>
            {actions}
        </div>
    )
}

function Toolbar({ children, query, setQuery, placeholder }: { children: React.ReactNode; query: string; setQuery: (q: string) => void; placeholder: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {children}
            <div style={{ flex: 1 }} />
            <label
                className="zfocus"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 30,
                    padding: "0 10px",
                    width: 240,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                }}
            >
                <Icon n="search" s={13} c={C.textSubtle} />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    className="zinp"
                    style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: C.text, font: `400 13px/18px ${FONT}` }}
                />
            </label>
        </div>
    )
}

function Dot({ color }: { color: string }) {
    return <span style={{ width: 6, height: 6, borderRadius: 999, background: color, flexShrink: 0 }} />
}

function StatusText({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, font: `500 12.5px/16px ${FONT}`, color, whiteSpace: "nowrap" }}>
            <Dot color={color} />
            {children}
        </span>
    )
}

function HeaderRow({ cols, labels }: { cols: string; labels: string[] }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 16, padding: "10px 20px", borderBottom: `1px solid ${C.border}`, ...eyebrowStyle }}>
            {labels.map((l, i) => (
                <div key={i}>{l}</div>
            ))}
        </div>
    )
}

// A list row that folds open. The header is a real button for keyboard use.
function FoldRow({
    cols,
    open,
    onToggle,
    last,
    cells,
    children,
}: {
    cols: string
    open: boolean
    onToggle: () => void
    last: boolean
    cells: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <div style={{ borderBottom: last ? "none" : `1px solid ${C.border}` }}>
            <button
                onClick={onToggle}
                aria-expanded={open}
                className="zrow"
                style={{
                    display: "grid",
                    gridTemplateColumns: cols,
                    gap: 16,
                    alignItems: "center",
                    width: "100%",
                    padding: "13px 20px",
                    background: open ? C.hoverOverlay : "transparent",
                    border: "none",
                    textAlign: "left",
                    color: C.text,
                    cursor: "pointer",
                }}
            >
                {cells}
            </button>
            {open && <div style={{ padding: "4px 20px 18px 48px", animation: "zfade 160ms ease" }}>{children}</div>}
        </div>
    )
}

function Caret({ open }: { open: boolean }) {
    return <Icon n={open ? "caretDown" : "caretRight"} s={12} c={C.textSubtle} />
}

function Primary({ title, sub }: { title: string; sub?: string }) {
    return (
        <div style={{ minWidth: 0 }}>
            <div style={{ font: `500 14px/20px ${FONT}`, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
            {sub && <div style={{ font: `400 12px/16px ${FONT}`, color: C.textSubtle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
        </div>
    )
}

function Muted({ children, tone }: { children: React.ReactNode; tone?: string }) {
    return <div style={{ font: `400 13px/18px ${FONT}`, color: tone ?? C.textMuted, whiteSpace: "nowrap" }}>{children}</div>
}

// Linked controls open the control panel, so every page connects back to the library.
function ControlLinks({ ids, controls, onOpenControl }: { ids: string[]; controls: Control[]; onOpenControl: (id: string) => void }) {
    const known = ids.map((id) => controls.find((c) => c.id === id)).filter(Boolean) as Control[]
    if (known.length === 0) return <Muted>No linked controls</Muted>
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {known.map((c) => (
                <button
                    key={c.id}
                    onClick={() => onOpenControl(c.id)}
                    className="zbtn"
                    title={c.title}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "5px 9px",
                        borderRadius: 7,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        cursor: "pointer",
                        color: C.text,
                        font: `400 12px/16px ${FONT}`,
                    }}
                >
                    <Dot color={c.status === "passing" ? C.success : c.status === "review" ? C.warning : C.danger} />
                    <span style={{ font: `500 11.5px/16px ${MONO}` }}>{c.id}</span>
                    <span style={{ color: C.textSubtle }}>{c.fw}</span>
                </button>
            ))}
        </div>
    )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 16, padding: "6px 0" }}>
            <div style={{ font: `400 13px/18px ${FONT}`, color: C.textSubtle }}>{label}</div>
            <div style={{ font: `400 13px/18px ${FONT}`, color: C.text, minWidth: 0 }}>{children}</div>
        </div>
    )
}

function Empty({ children }: { children: React.ReactNode }) {
    return <div style={{ padding: "40px 20px", textAlign: "center", font: `400 13px/18px ${FONT}`, color: C.textSubtle }}>{children}</div>
}

function matches(q: string, ...fields: string[]) {
    const needle = q.trim().toLowerCase()
    return !needle || fields.some((f) => f.toLowerCase().includes(needle))
}

const days = (n: number) => (n === 1 ? "1 day" : `${n} days`)

// ============ EVIDENCE ============

type Evidence = {
    id: string
    name: string
    source: string
    controls: string[]
    collectedMin: number
    expiresInDays: number | null
    by: string
}

const EVIDENCE: Evidence[] = [
    { id: "ev-01", name: "Okta MFA enforcement policy export", source: "Okta", controls: ["CC6.1", "PR.AA-01"], collectedMin: 42, expiresInDays: 88, by: "Evidence Agent" },
    { id: "ev-02", name: "Quarterly access review · Q3", source: "Google Drive", controls: ["CC6.2", "A.5.23"], collectedMin: 3 * 60, expiresInDays: 9, by: "Evidence Agent" },
    { id: "ev-03", name: "Branch protection settings · main", source: "GitHub", controls: ["CC8.1", "A.8.25"], collectedMin: 18, expiresInDays: 120, by: "Evidence Agent" },
    { id: "ev-04", name: "CloudTrail logging configuration", source: "AWS", controls: ["CC7.2", "DE.CM-1"], collectedMin: 95, expiresInDays: 60, by: "Evidence Agent" },
    { id: "ev-05", name: "Incident response runbook v4", source: "Notion", controls: ["CC7.4", "RS.CO-02"], collectedMin: 6 * 24 * 60, expiresInDays: -3, by: "Sarah Goldberg" },
    { id: "ev-06", name: "Security awareness training completions", source: "Google Drive", controls: ["A.6.3", "CC1.1"], collectedMin: 2 * 24 * 60, expiresInDays: 45, by: "Evidence Agent" },
    { id: "ev-07", name: "Vulnerability scan summary · October", source: "AWS", controls: ["A.8.9", "ID.RA-01"], collectedMin: 11 * 60, expiresInDays: 4, by: "Evidence Agent" },
    { id: "ev-08", name: "Code review approvals sample", source: "GitHub", controls: ["CC8.1"], collectedMin: 70, expiresInDays: 30, by: "Evidence Agent" },
    { id: "ev-09", name: "Data classification standard", source: "Notion", controls: ["PR.DS-01", "A.5.1"], collectedMin: 9 * 24 * 60, expiresInDays: 150, by: "Policy Agent" },
    { id: "ev-10", name: "Backup restore test results", source: "AWS", controls: ["A1.1", "RC.RP-01"], collectedMin: 14 * 24 * 60, expiresInDays: -10, by: "Evidence Agent" },
    { id: "ev-11", name: "AI system impact assessment draft", source: "Notion", controls: ["8.2.3", "9.2"], collectedMin: 26 * 60, expiresInDays: 75, by: "Remediation Agent" },
    { id: "ev-12", name: "Endpoint encryption report", source: "Okta", controls: ["A.8.3", "CC6.6"], collectedMin: 5 * 60, expiresInDays: 21, by: "Evidence Agent" },
]

const SOURCES = ["GitHub", "Okta", "AWS", "Google Drive", "Notion"]

function evidenceState(e: Evidence, requested: boolean) {
    if (requested) return { label: "Refresh requested", color: C.textMuted }
    if (e.expiresInDays === null) return { label: "Current", color: C.success }
    if (e.expiresInDays < 0) return { label: "Expired", color: C.danger }
    if (e.expiresInDays <= 14) return { label: `Expires in ${days(e.expiresInDays)}`, color: C.warning }
    return { label: "Current", color: C.success }
}

export function EvidenceView({ controls, onOpenControl }: { controls: Control[]; onOpenControl: (id: string) => void }) {
    const [source, setSource] = React.useState<string | null>(null)
    const [query, setQuery] = React.useState("")
    const [open, setOpen] = React.useState<string | null>(null)
    const [requested, setRequested] = usePersistentState<string[]>("app-evidence-requested", [])

    const rows = EVIDENCE.filter((e) => (!source || e.source === source) && matches(query, e.name, e.source, ...e.controls))
    const attention = EVIDENCE.filter((e) => e.expiresInDays !== null && e.expiresInDays <= 14 && !requested.includes(e.id)).length
    const cols = "12px minmax(0, 1fr) 120px 170px 110px"

    return (
        <div className="zview-in" style={{ maxWidth: 1280, margin: "0 auto" }}>
            <PageHeader
                title="Evidence"
                sub={`${EVIDENCE.length} files from ${SOURCES.length} sources · ${attention} expiring or expired`}
            />
            <Toolbar query={query} setQuery={setQuery} placeholder="Search evidence or control ID">
                <FilterChip active={source === null} onClick={() => setSource(null)}>
                    All
                </FilterChip>
                {SOURCES.map((s) => (
                    <FilterChip key={s} active={source === s} onClick={() => setSource(source === s ? null : s)}>
                        {s}
                    </FilterChip>
                ))}
            </Toolbar>
            <div style={panelStyle}>
                <HeaderRow cols={cols} labels={["", "File", "Source", "Status", "Collected"]} />
                {rows.length === 0 && <Empty>No evidence matches. Clear the search or pick another source.</Empty>}
                {rows.map((e, i) => {
                    const isRequested = requested.includes(e.id)
                    const st = evidenceState(e, isRequested)
                    const stale = e.expiresInDays !== null && e.expiresInDays <= 14
                    return (
                        <FoldRow
                            key={e.id}
                            cols={cols}
                            open={open === e.id}
                            onToggle={() => setOpen(open === e.id ? null : e.id)}
                            last={i === rows.length - 1}
                            cells={
                                <>
                                    <Caret open={open === e.id} />
                                    <Primary title={e.name} sub={e.controls.join(", ")} />
                                    <Muted>{e.source}</Muted>
                                    <StatusText color={st.color}>{st.label}</StatusText>
                                    <Muted>{relTime(NOW - e.collectedMin * MIN)}</Muted>
                                </>
                            }
                        >
                            <Detail label="Collected by">{e.by}</Detail>
                            <Detail label="Valid until">
                                {e.expiresInDays === null
                                    ? "No expiry"
                                    : new Date(NOW + e.expiresInDays * DAY).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </Detail>
                            <Detail label="Supports">
                                <ControlLinks ids={e.controls} controls={controls} onOpenControl={onOpenControl} />
                            </Detail>
                            {stale && (
                                <div style={{ marginTop: 10, paddingLeft: 156 }}>
                                    <button
                                        className="zbtn"
                                        style={btnSecondary}
                                        onClick={() =>
                                            setRequested((r) => (isRequested ? r.filter((x) => x !== e.id) : [...r, e.id]))
                                        }
                                    >
                                        <Icon n={isRequested ? "x" : "refresh"} s={12} c={C.textMuted} />
                                        {isRequested ? "Cancel request" : `Ask ${e.by === "Sarah Goldberg" ? "owner" : "agent"} to refresh`}
                                    </button>
                                </div>
                            )}
                        </FoldRow>
                    )
                })}
            </div>
        </div>
    )
}

// ============ POLICIES ============

type PolicyStatus = "Published" | "In review" | "Draft"

type Policy = {
    id: string
    name: string
    owner: string
    version: string
    status: PolicyStatus
    reviewedDaysAgo: number
    reviewEveryDays: number
    controls: string[]
    summary: string
}

const POLICIES: Policy[] = [
    { id: "pol-01", name: "Information Security Policy", owner: "GRC", version: "4.2", status: "Published", reviewedDaysAgo: 120, reviewEveryDays: 365, controls: ["A.5.1", "CC1.1", "GV.OC-01"], summary: "Sets the security program's scope, roles and the management commitment every other policy builds on." },
    { id: "pol-02", name: "Access Control Policy", owner: "Security", version: "3.1", status: "Published", reviewedDaysAgo: 380, reviewEveryDays: 365, controls: ["CC6.1", "CC6.2", "PR.AA-01"], summary: "Least privilege, MFA everywhere, and quarterly access reviews for production systems." },
    { id: "pol-03", name: "Incident Response Policy", owner: "SecOps", version: "2.0", status: "In review", reviewedDaysAgo: 5, reviewEveryDays: 365, controls: ["CC7.4", "RS.CO-02"], summary: "Severity levels, on-call escalation and customer notification within 72 hours." },
    { id: "pol-04", name: "AI Acceptable Use Policy", owner: "AI Governance", version: "1.0", status: "Draft", reviewedDaysAgo: 2, reviewEveryDays: 180, controls: ["5.1", "6.2.4"], summary: "Which AI tools staff may use, with what data, and who approves new models." },
    { id: "pol-05", name: "Change Management Policy", owner: "Engineering", version: "2.3", status: "Published", reviewedDaysAgo: 90, reviewEveryDays: 365, controls: ["CC8.1", "A.8.25"], summary: "Peer review, CI checks and approval before anything reaches production." },
    { id: "pol-06", name: "Business Continuity Policy", owner: "SRE", version: "1.4", status: "Published", reviewedDaysAgo: 400, reviewEveryDays: 365, controls: ["A1.1", "RC.RP-01"], summary: "Recovery objectives, backup cadence and annual restore testing." },
    { id: "pol-07", name: "Vendor Management Policy", owner: "GRC", version: "2.1", status: "In review", reviewedDaysAgo: 12, reviewEveryDays: 365, controls: ["A.5.23", "GV.RM-01"], summary: "Tiering, due diligence and contract terms for every third party that touches customer data." },
    { id: "pol-08", name: "Data Retention Policy", owner: "Security", version: "1.2", status: "Published", reviewedDaysAgo: 200, reviewEveryDays: 365, controls: ["PR.DS-01"], summary: "How long each data class is kept and how it is deleted." },
]

const POLICY_COLOR: Record<PolicyStatus, string> = {
    Published: C.success,
    "In review": C.warning,
    Draft: C.textMuted,
}

type PolicyEdit = { status: PolicyStatus; version: string; reviewedDaysAgo: number }

function bumpVersion(v: string) {
    const [major, minor] = v.split(".").map(Number)
    return `${major}.${(minor || 0) + 1}`
}

export function PoliciesView({ controls, onOpenControl }: { controls: Control[]; onOpenControl: (id: string) => void }) {
    const [filter, setFilter] = React.useState<PolicyStatus | "Overdue" | null>(null)
    const [query, setQuery] = React.useState("")
    const [open, setOpen] = React.useState<string | null>(null)
    const [edits, setEdits] = usePersistentState<Record<string, PolicyEdit>>("app-policy-edits", {})

    const policies = POLICIES.map((p) => ({ ...p, ...edits[p.id] }))
    const dueIn = (p: Policy) => p.reviewEveryDays - p.reviewedDaysAgo
    const overdue = policies.filter((p) => dueIn(p) < 0).length
    const rows = policies.filter(
        (p) => (!filter || (filter === "Overdue" ? dueIn(p) < 0 : p.status === filter)) && matches(query, p.name, p.owner)
    )
    const update = (id: string, next: PolicyEdit) => setEdits((e) => ({ ...e, [id]: next }))
    const cols = "12px minmax(0, 1fr) 120px 110px 70px 150px"

    return (
        <div className="zview-in" style={{ maxWidth: 1280, margin: "0 auto" }}>
            <PageHeader
                title="Policies"
                sub={`${POLICIES.length} policies · ${policies.filter((p) => p.status !== "Published").length} not yet published · ${overdue} overdue for review`}
            />
            <Toolbar query={query} setQuery={setQuery} placeholder="Search policies">
                <FilterChip active={filter === null} onClick={() => setFilter(null)}>
                    All
                </FilterChip>
                {(["Published", "In review", "Draft"] as PolicyStatus[]).map((s) => (
                    <FilterChip key={s} active={filter === s} color={POLICY_COLOR[s]} onClick={() => setFilter(filter === s ? null : s)}>
                        {s}
                    </FilterChip>
                ))}
                <FilterChip active={filter === "Overdue"} color={C.danger} onClick={() => setFilter(filter === "Overdue" ? null : "Overdue")}>
                    Review overdue
                </FilterChip>
            </Toolbar>
            <div style={panelStyle}>
                <HeaderRow cols={cols} labels={["", "Policy", "Owner", "Status", "Version", "Next review"]} />
                {rows.length === 0 && <Empty>No policies match these filters.</Empty>}
                {rows.map((p, i) => {
                    const due = dueIn(p)
                    return (
                        <FoldRow
                            key={p.id}
                            cols={cols}
                            open={open === p.id}
                            onToggle={() => setOpen(open === p.id ? null : p.id)}
                            last={i === rows.length - 1}
                            cells={
                                <>
                                    <Caret open={open === p.id} />
                                    <Primary title={p.name} />
                                    <Muted>{p.owner}</Muted>
                                    <StatusText color={POLICY_COLOR[p.status]}>{p.status}</StatusText>
                                    <Muted>v{p.version}</Muted>
                                    <Muted tone={due < 0 ? C.danger : due <= 30 ? C.warning : undefined}>
                                        {due < 0 ? `Overdue by ${days(-due)}` : `In ${days(due)}`}
                                    </Muted>
                                </>
                            }
                        >
                            <p style={{ margin: "0 0 10px", font: `400 13px/20px ${FONT}`, color: C.textMuted, maxWidth: 680 }}>{p.summary}</p>
                            <Detail label="Last reviewed">{p.reviewedDaysAgo === 0 ? "Today" : `${days(p.reviewedDaysAgo)} ago`}</Detail>
                            <Detail label="Review cycle">Every {days(p.reviewEveryDays)}</Detail>
                            <Detail label="Maps to">
                                <ControlLinks ids={p.controls} controls={controls} onOpenControl={onOpenControl} />
                            </Detail>
                            <div style={{ display: "flex", gap: 8, marginTop: 12, paddingLeft: 156 }}>
                                {p.status === "Draft" && (
                                    <button className="zbtn" style={btnSecondary} onClick={() => update(p.id, { status: "In review", version: p.version, reviewedDaysAgo: p.reviewedDaysAgo })}>
                                        Send for review
                                    </button>
                                )}
                                {p.status === "In review" && (
                                    <button className="zbtn" style={btnPrimary} onClick={() => update(p.id, { status: "Published", version: bumpVersion(p.version), reviewedDaysAgo: 0 })}>
                                        <Icon n="check" s={12} c={C.primaryFg} />
                                        Approve and publish v{bumpVersion(p.version)}
                                    </button>
                                )}
                                {p.status === "Published" && (
                                    <button
                                        className="zbtn"
                                        style={due < 0 ? btnPrimary : btnSecondary}
                                        disabled={p.reviewedDaysAgo === 0}
                                        onClick={() => update(p.id, { status: "Published", version: p.version, reviewedDaysAgo: 0 })}
                                    >
                                        <Icon n="check" s={12} c={due < 0 ? C.primaryFg : C.textMuted} />
                                        {p.reviewedDaysAgo === 0 ? "Reviewed today" : "Mark reviewed"}
                                    </button>
                                )}
                            </div>
                        </FoldRow>
                    )
                })}
            </div>
        </div>
    )
}

// ============ RISK REGISTER ============

type Treatment = "Mitigate" | "Accept" | "Transfer"

type Risk = {
    id: string
    title: string
    category: string
    likelihood: number // 1–5
    impact: number // 1–5
    owner: string
    treatment: Treatment
    plan: string
    controls: string[]
}

const RISKS: Risk[] = [
    { id: "R-01", title: "Compromised admin credentials", category: "Security", likelihood: 3, impact: 5, owner: "Security", treatment: "Mitigate", plan: "Hardware keys for all admins; session length cut to 8 hours.", controls: ["CC6.1", "PR.AA-01"] },
    { id: "R-02", title: "Customer data in AI prompts", category: "AI", likelihood: 4, impact: 4, owner: "AI Governance", treatment: "Mitigate", plan: "Prompt filtering and an approved-models list before Q1.", controls: ["6.2.4", "8.2.3"] },
    { id: "R-03", title: "Critical vendor outage (Twilio)", category: "Third party", likelihood: 2, impact: 4, owner: "SRE", treatment: "Transfer", plan: "Secondary SMS provider and contractual SLA credits.", controls: ["A.5.23"] },
    { id: "R-04", title: "Untested backup restores", category: "Resilience", likelihood: 3, impact: 4, owner: "SRE", treatment: "Mitigate", plan: "Quarterly restore drills with evidence captured automatically.", controls: ["A1.1", "RC.RP-01"] },
    { id: "R-05", title: "Phishing leading to account takeover", category: "Security", likelihood: 4, impact: 3, owner: "SecOps", treatment: "Mitigate", plan: "Monthly simulations and mandatory training for repeat clickers.", controls: ["A.6.3", "CC1.1"] },
    { id: "R-06", title: "Unpatched internet-facing services", category: "Security", likelihood: 2, impact: 5, owner: "Engineering", treatment: "Mitigate", plan: "Patch SLA of 7 days for critical CVEs, tracked by the Controls agent.", controls: ["A.8.9", "ID.RA-01"] },
    { id: "R-07", title: "Key engineer leaves with undocumented systems", category: "Operational", likelihood: 2, impact: 3, owner: "Engineering", treatment: "Accept", plan: "Accepted for this year; runbooks reviewed at each offboarding.", controls: [] },
    { id: "R-08", title: "Regulatory change in EU AI Act scope", category: "Compliance", likelihood: 3, impact: 2, owner: "GRC", treatment: "Accept", plan: "Monitor guidance; revisit when implementing acts publish.", controls: ["5.1"] },
]

const score = (r: Risk) => r.likelihood * r.impact
function severity(s: number) {
    if (s >= 15) return { label: "High", color: C.danger }
    if (s >= 8) return { label: "Medium", color: C.warning }
    return { label: "Low", color: C.textMuted }
}

function ScaleSelect({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
    return (
        <div role="radiogroup" aria-label={label} style={{ display: "inline-flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    role="radio"
                    aria-checked={value === n}
                    onClick={() => onChange(n)}
                    className="zbtn"
                    style={{
                        width: 28,
                        height: 26,
                        borderRadius: 6,
                        border: `1px solid ${value === n ? C.accentLine : C.border}`,
                        background: value === n ? C.accentBg : "transparent",
                        color: value === n ? C.text : C.textMuted,
                        font: `500 12px/16px ${FONT}`,
                        cursor: "pointer",
                    }}
                >
                    {n}
                </button>
            ))}
        </div>
    )
}

export function RisksView({ controls, onOpenControl }: { controls: Control[]; onOpenControl: (id: string) => void }) {
    const [sev, setSev] = React.useState<string | null>(null)
    const [query, setQuery] = React.useState("")
    const [open, setOpen] = React.useState<string | null>(null)
    const [edits, setEdits] = usePersistentState<Record<string, Partial<Risk>>>("app-risk-edits", {})

    const risks = RISKS.map((r) => ({ ...r, ...edits[r.id] })).sort((a, b) => score(b) - score(a))
    const rows = risks.filter((r) => (!sev || severity(score(r)).label === sev) && matches(query, r.title, r.category, r.owner, r.id))
    const count = (label: string) => risks.filter((r) => severity(score(r)).label === label).length
    const edit = (id: string, patch: Partial<Risk>) => setEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } }))
    const cols = "12px 52px minmax(0, 1fr) 120px 96px 100px"

    return (
        <div className="zview-in" style={{ maxWidth: 1280, margin: "0 auto" }}>
            <PageHeader title="Risk register" sub={`${RISKS.length} risks · ${count("High")} high · scored by likelihood × impact`} />
            <Toolbar query={query} setQuery={setQuery} placeholder="Search risks">
                <FilterChip active={sev === null} onClick={() => setSev(null)}>
                    All
                </FilterChip>
                {[
                    ["High", C.danger],
                    ["Medium", C.warning],
                    ["Low", C.textMuted],
                ].map(([label, color]) => (
                    <FilterChip key={label} active={sev === label} color={color} onClick={() => setSev(sev === label ? null : label)}>
                        {label} <span style={{ opacity: 0.7 }}>{count(label)}</span>
                    </FilterChip>
                ))}
            </Toolbar>
            <div style={panelStyle}>
                <HeaderRow cols={cols} labels={["", "Score", "Risk", "Owner", "Treatment", "Severity"]} />
                {rows.length === 0 && <Empty>No risks match these filters.</Empty>}
                {rows.map((r, i) => {
                    const s = score(r)
                    const sv = severity(s)
                    return (
                        <FoldRow
                            key={r.id}
                            cols={cols}
                            open={open === r.id}
                            onToggle={() => setOpen(open === r.id ? null : r.id)}
                            last={i === rows.length - 1}
                            cells={
                                <>
                                    <Caret open={open === r.id} />
                                    <div style={{ font: `600 15px/20px ${FONT}`, color: C.text, fontVariantNumeric: "tabular-nums" }}>{s}</div>
                                    <Primary title={r.title} sub={`${r.id} · ${r.category}`} />
                                    <Muted>{r.owner}</Muted>
                                    <Muted>{r.treatment}</Muted>
                                    <StatusText color={sv.color}>{sv.label}</StatusText>
                                </>
                            }
                        >
                            <Detail label="Likelihood">
                                <ScaleSelect label="Likelihood" value={r.likelihood} onChange={(n) => edit(r.id, { likelihood: n })} />
                            </Detail>
                            <Detail label="Impact">
                                <ScaleSelect label="Impact" value={r.impact} onChange={(n) => edit(r.id, { impact: n })} />
                            </Detail>
                            <Detail label="Treatment">
                                <div style={{ display: "inline-flex", gap: 6 }}>
                                    {(["Mitigate", "Transfer", "Accept"] as Treatment[]).map((t) => (
                                        <FilterChip key={t} active={r.treatment === t} onClick={() => edit(r.id, { treatment: t })}>
                                            {t}
                                        </FilterChip>
                                    ))}
                                </div>
                            </Detail>
                            <Detail label="Plan">{r.plan}</Detail>
                            <Detail label="Mitigating controls">
                                <ControlLinks ids={r.controls} controls={controls} onOpenControl={onOpenControl} />
                            </Detail>
                        </FoldRow>
                    )
                })}
            </div>
        </div>
    )
}

// ============ AGENTS ============

type Agent = { name: string; job: string; schedule: string; sources: string }

const AGENTS: Agent[] = [
    { name: "Evidence Agent", job: "Collects evidence from connected tools and maps it to controls.", schedule: "Every 6 hours", sources: "GitHub, Okta, AWS, Google Drive, Notion" },
    { name: "Controls Agent", job: "Tests each control against its latest evidence and flags gaps.", schedule: "Daily at 02:00", sources: "Control library" },
    { name: "Risk Agent", job: "Scores new risks and re-scores existing ones when controls change.", schedule: "On change", sources: "Risk register, vendor assessments" },
    { name: "Questionnaire Agent", job: "Drafts answers to customer security questionnaires from approved evidence.", schedule: "On request", sources: "Evidence, policies" },
    { name: "Policy Agent", job: "Keeps policies mapped to frameworks and reminds owners before reviews are due.", schedule: "Weekly on Monday", sources: "Policies" },
    { name: "Remediation Agent", job: "Drafts fixes and tickets for open gaps, then retests once they ship.", schedule: "When a gap opens", sources: "Controls, Jira" },
]

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
    return (
        <button
            role="switch"
            aria-checked={on}
            aria-label={label}
            onClick={(e) => {
                e.stopPropagation()
                onChange()
            }}
            style={{
                width: 34,
                height: 20,
                borderRadius: 999,
                border: "none",
                padding: 2,
                cursor: "pointer",
                background: on ? C.success : C.trackFill,
                transition: "background 160ms",
                display: "flex",
                justifyContent: on ? "flex-end" : "flex-start",
            }}
        >
            <span style={{ width: 16, height: 16, borderRadius: 999, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }} />
        </button>
    )
}

export function AgentsView({ activities, onRunAgent }: { activities: Activity[]; onRunAgent: (agent: string) => void }) {
    const [paused, setPaused] = usePersistentState<string[]>("app-agents-paused", [])
    const [open, setOpen] = React.useState<string | null>(null)
    const cols = "12px minmax(0, 1fr) 150px 110px 120px 44px"
    const active = AGENTS.length - paused.length

    return (
        <div className="zview-in" style={{ maxWidth: 1280, margin: "0 auto" }}>
            <PageHeader title="Agents" sub={`${active} of ${AGENTS.length} agents active · ${activities.filter((a) => a.status === "running").length} running now`} />
            <div style={panelStyle}>
                <HeaderRow cols={cols} labels={["", "Agent", "Schedule", "Status", "Last run", "On"]} />
                {AGENTS.map((a, i) => {
                    const isPaused = paused.includes(a.name)
                    const runs = activities.filter((x) => x.agent === a.name).sort((x, y) => y.createdAt - x.createdAt)
                    const running = runs.some((x) => x.status === "running")
                    const last = runs.find((x) => x.status === "complete")
                    return (
                        <FoldRow
                            key={a.name}
                            cols={cols}
                            open={open === a.name}
                            onToggle={() => setOpen(open === a.name ? null : a.name)}
                            last={i === AGENTS.length - 1}
                            cells={
                                <>
                                    <Caret open={open === a.name} />
                                    <Primary title={a.name} sub={a.job} />
                                    <Muted>{a.schedule}</Muted>
                                    {isPaused ? (
                                        <StatusText color={C.textSubtle}>Paused</StatusText>
                                    ) : running ? (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, font: `500 12.5px/16px ${FONT}`, color: C.text }}>
                                            <Spinner size={10} />
                                            Running
                                        </span>
                                    ) : (
                                        <StatusText color={C.success}>Idle</StatusText>
                                    )}
                                    <Muted>{last ? relTime(last.createdAt) : running ? "First run" : "No runs yet"}</Muted>
                                    <Switch
                                        on={!isPaused}
                                        label={`${isPaused ? "Resume" : "Pause"} ${a.name}`}
                                        onChange={() => setPaused((p) => (isPaused ? p.filter((x) => x !== a.name) : [...p, a.name]))}
                                    />
                                </>
                            }
                        >
                            <Detail label="Reads from">{a.sources}</Detail>
                            <Detail label="Recent runs">
                                {runs.length === 0 ? (
                                    <span style={{ color: C.textSubtle }}>No runs in this session</span>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 520 }}>
                                        {runs.slice(0, 4).map((r) => (
                                            <div key={r.id} style={{ display: "flex", gap: 10 }}>
                                                <span style={{ flex: 1, minWidth: 0, color: C.textMuted }}>
                                                    {r.action} {r.target}
                                                </span>
                                                <span style={{ color: C.textSubtle, whiteSpace: "nowrap" }}>{r.status === "running" ? "Running" : relTime(r.createdAt)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Detail>
                            <div style={{ marginTop: 12, paddingLeft: 156 }}>
                                <button
                                    className="zbtn"
                                    style={{ ...btnSecondary, opacity: isPaused || running ? 0.5 : 1 }}
                                    disabled={isPaused || running}
                                    onClick={() => onRunAgent(a.name)}
                                    title={isPaused ? "Resume the agent to run it" : undefined}
                                >
                                    <Icon n="play" s={11} c={C.textMuted} />
                                    Run now
                                </button>
                            </div>
                        </FoldRow>
                    )
                })}
            </div>
        </div>
    )
}

// ============ SHORTCUTS + SIGNED OUT ============

const SHORTCUTS: [string, string][] = [
    ["Search", "⌘K"],
    ["Keyboard shortcuts", "⌘/"],
    ["Move through results", "↑ ↓"],
    ["Open result", "↵"],
    ["Close panel or dialog", "esc"],
]

export function ShortcutsModal({ open, close }: { open: boolean; close: () => void }) {
    return (
        <Modal open={open} close={close} width={400}>
            <ModalHeader icon="keyboard" title="Keyboard shortcuts" close={close} />
            <ModalBody>
                {SHORTCUTS.map(([label, keys], i) => (
                    <div
                        key={label}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 0",
                            borderBottom: i < SHORTCUTS.length - 1 ? `1px solid ${C.border}` : "none",
                            font: `400 13px/18px ${FONT}`,
                            color: C.text,
                        }}
                    >
                        {label}
                        <kbd style={{ font: `500 11px/14px ${MONO}`, color: C.textMuted, padding: "3px 7px", border: `1px solid ${C.border}`, borderBottomWidth: 2, borderRadius: 5, background: C.hoverOverlay }}>
                            {keys}
                        </kbd>
                    </div>
                ))}
            </ModalBody>
        </Modal>
    )
}

export function SignedOut({ workspace, onSignIn }: { workspace: string; onSignIn: () => void }) {
    return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ width: 340, textAlign: "center" }}>
                <div style={{ font: `500 30px/36px ${SERIF}`, color: C.text, letterSpacing: "-0.01em" }}>Signed out</div>
                <div style={{ font: `400 13px/20px ${FONT}`, color: C.textMuted, margin: "8px 0 24px" }}>
                    You've left {workspace} on Plumb. Your changes are saved on this device.
                </div>
                <button className="zbtn" style={{ ...btnPrimary, width: "100%", justifyContent: "center" }} onClick={onSignIn} autoFocus>
                    Sign back in as Sarah Goldberg
                </button>
            </div>
        </div>
    )
}
