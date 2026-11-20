import * as React from "react"
import { C, FONT, SERIF, Icon, panelStyle, eyebrowStyle } from "../dashboard/DashboardLib"
import { EvidenceCollection } from "./evidence/EvidenceCollection"

// ============ VENDORS ============
//
// Vendor list → per-vendor assessment workspace. Only Twilio has a built-out
// assessment (the evidence collection step); the other rows show where each
// vendor sits in the TPRM pipeline but don't open.

const STAGES = ["Intake", "Risk tiering", "Evidence collection", "Risk assessment", "Issues", "Monitoring"]

type Vendor = {
    id: string
    name: string
    category: string
    tier: 1 | 2 | 3
    stage: number // index into STAGES
    openItems: number
    due: string
    dueInDays: number
    interactive?: boolean
}

const VENDORS: Vendor[] = [
    { id: "twilio", name: "Twilio", category: "Communications API", tier: 3, stage: 2, openItems: 6, due: "Dec 4", dueInDays: 15, interactive: true },
    { id: "snowflake", name: "Snowflake", category: "Data warehouse", tier: 1, stage: 3, openItems: 2, due: "Nov 28", dueInDays: 9 },
    { id: "zendesk", name: "Zendesk", category: "Customer support", tier: 2, stage: 4, openItems: 3, due: "Dec 1", dueInDays: 12 },
    { id: "gusto", name: "Gusto", category: "Payroll", tier: 2, stage: 0, openItems: 4, due: "Dec 12", dueInDays: 23 },
    { id: "okta", name: "Okta", category: "Identity provider", tier: 1, stage: 5, openItems: 0, due: "Mar 2", dueInDays: 103 },
]

// Tier 1 is the most critical vendor class, so it carries the strongest tone.
const TIER: Record<Vendor["tier"], { label: string; tone: string }> = {
    1: { label: "Tier 1 · High", tone: C.danger },
    2: { label: "Tier 2 · Medium", tone: C.warning },
    3: { label: "Tier 3 · Low", tone: C.textMuted },
}

const COLS = "minmax(220px, 1.3fr) 130px minmax(220px, 1.4fr) 70px 110px 20px"

export function VendorsView({
    onOpenChange,
}: {
    onOpenChange?: (open: boolean) => void
}) {
    const [openId, setOpenId] = React.useState<string | null>(null)
    const open = (id: string | null) => {
        setOpenId(id)
        onOpenChange?.(id !== null)
    }
    // Leaving the Vendors tab unmounts this view; reset the parent's layout flags.
    React.useEffect(
        () => () => {
            onOpenChange?.(false)
        },
        []
    )

    if (openId === "twilio") return <EvidenceCollection onBack={() => open(null)} />

    const totalOpen = VENDORS.reduce((n, v) => n + v.openItems, 0)
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
                    Vendors
                </h1>
                <div style={{ font: `400 13px/18px ${FONT}`, color: C.textMuted, marginTop: 4 }}>
                    {VENDORS.length} vendors in assessment · {totalOpen} open items
                </div>
            </div>
            <div style={panelStyle}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: COLS,
                        gap: 20,
                        padding: "10px 20px",
                        borderBottom: `1px solid ${C.border}`,
                        ...eyebrowStyle,
                    }}
                >
                    <div>Vendor</div>
                    <div>Risk tier</div>
                    <div>Stage</div>
                    <div>Open</div>
                    <div>Due</div>
                    <div />
                </div>
                {VENDORS.map((v, i) => (
                    <VendorRow
                        key={v.id}
                        v={v}
                        last={i === VENDORS.length - 1}
                        onOpen={v.interactive ? () => open(v.id) : undefined}
                    />
                ))}
            </div>
            <div style={{ font: `400 12px/16px ${FONT}`, color: C.textSubtle, marginTop: 10 }}>
                Twilio has a full assessment workspace in this prototype.
            </div>
        </div>
    )
}

function VendorRow({ v, last, onOpen }: { v: Vendor; last: boolean; onOpen?: () => void }) {
    const tier = TIER[v.tier]
    const soon = v.dueInDays <= 10
    return (
        <div
            role={onOpen ? "button" : undefined}
            tabIndex={onOpen ? 0 : undefined}
            onClick={onOpen}
            onKeyDown={(e) => onOpen && (e.key === "Enter" || e.key === " ") && onOpen()}
            className={onOpen ? "zrow" : undefined}
            style={{
                display: "grid",
                gridTemplateColumns: COLS,
                gap: 20,
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: last ? "none" : `1px solid ${C.border}`,
                cursor: onOpen ? "pointer" : "default",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.hoverOverlay,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        font: `500 16px/1 ${SERIF}`,
                        color: C.text,
                        flexShrink: 0,
                    }}
                >
                    {v.name[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ font: `500 14px/20px ${FONT}`, color: C.text }}>{v.name}</div>
                    <div style={{ font: `400 12px/16px ${FONT}`, color: C.textSubtle }}>{v.category}</div>
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, font: `500 12.5px/16px ${FONT}`, color: C.textMuted }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: tier.tone, flexShrink: 0 }} />
                {tier.label}
            </div>
            <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 6 }} aria-hidden>
                    {STAGES.map((s, i) => (
                        <span
                            key={s}
                            style={{
                                flex: 1,
                                height: 4,
                                borderRadius: 999,
                                background: i < v.stage ? C.textSubtle : i === v.stage ? C.text : C.trackFill,
                            }}
                        />
                    ))}
                </div>
                <div style={{ font: `400 12.5px/16px ${FONT}`, color: C.textMuted }}>
                    {STAGES[v.stage]}
                    <span style={{ color: C.textSubtle }}> · step {v.stage + 1} of {STAGES.length}</span>
                </div>
            </div>
            <div style={{ font: `500 13px/18px ${FONT}`, color: v.openItems > 0 ? C.text : C.textSubtle }}>
                {v.openItems}
            </div>
            <div>
                <div style={{ font: `400 13px/18px ${FONT}`, color: C.text }}>{v.due}</div>
                <div style={{ font: `400 11.5px/16px ${FONT}`, color: soon ? C.warning : C.textSubtle }}>
                    in {v.dueInDays}d
                </div>
            </div>
            <div>{onOpen && <Icon n="caretRight" s={14} c={C.textSubtle} />}</div>
        </div>
    )
}
