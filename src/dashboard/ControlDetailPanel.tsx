import * as React from "react"
import {
    C,
    FONT,
    MONO,
    Icon,
    StatusPill,
    Spinner,
    btnPrimary,
    btnSecondary,
    relTime,
} from "./DashboardLib"
import {
    type Ctl,
    type CtlStatus,
    getSectionKey,
    SECTION_LABELS,
} from "./DashboardData"

// ============ CONTROL DETAIL PANEL ============
//
// Right-side slide-in panel mirroring AgentRunPanel's pattern. Shows the full
// story for a single control · current state, evidence files, recent test
// history, and primary actions. Click outside or hit ESC to dismiss.
//
// All sub-data (evidence file list, test history) is generated from the
// control's properties so each control's panel feels unique without having
// to author per-control fixtures.

type EvidenceFile = {
    name: string
    source: string
    size: string
    addedMin: number
}

type HistoryRun = {
    at: number
    outcome: CtlStatus
    by: string
    note: string
}

function generateEvidence(c: Ctl, count: number): EvidenceFile[] {
    if (count <= 0) return []
    const sources = ["Notion", "GitHub", "Drive", "Okta", "AWS"]
    const exts = ["pdf", "md", "csv", "json", "log"]
    return Array.from({ length: count }, (_, i) => ({
        name: `${c.id.toLowerCase().replace(/\./g, "-")}-${i + 1}.${exts[i % exts.length]}`,
        source: sources[i % sources.length],
        size: `${(2 + i * 1.3).toFixed(1)} KB`,
        addedMin: c.lastTestMin + i * 7,
    }))
}

function generateHistory(c: Ctl, baseline: number): HistoryRun[] {
    const runs: HistoryRun[] = []
    const status = c.status
    runs.push({
        at: baseline - c.lastTestMin * 60000,
        outcome: status,
        by: "Controls Agent",
        note:
            status === "passing"
                ? "Test passed · evidence verified"
                : status === "review"
                  ? "Awaiting reviewer sign-off"
                  : "Gap detected · remediation drafted",
    })
    runs.push({
        at: baseline - (c.lastTestMin + 72) * 60000,
        outcome: "passing",
        by: "Controls Agent",
        note: "Routine validation complete",
    })
    runs.push({
        at: baseline - (c.lastTestMin + 240) * 60000,
        outcome: "passing",
        by: "Controls Agent",
        note: "Quarterly scope check",
    })
    runs.push({
        at: baseline - (c.lastTestMin + 720) * 60000,
        outcome: "review",
        by: "Sarah Goldberg",
        note: "Manually marked for re-review",
    })
    return runs
}

export function ControlDetailPanel({
    control,
    pageLoadMs,
    onClose,
    onRunTest,
    running,
    onMarkReview,
}: {
    control: Ctl & { status: CtlStatus }
    pageLoadMs: number
    onClose: () => void
    onRunTest: () => void
    running: boolean
    onMarkReview: () => void
}) {
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose])

    const evidence = React.useMemo(
        () => generateEvidence(control, control.evidence),
        [control]
    )
    const history = React.useMemo(
        () => generateHistory(control, pageLoadMs),
        [control, pageLoadMs]
    )
    const sectionKey = getSectionKey({ fw: control.fw, id: control.id })
    const sectionLabel = SECTION_LABELS[sectionKey] ?? sectionKey

    return (
        <div
            onClick={onClose}
            style={{
                position: "absolute",
                inset: 0,
                background: C.scrim,
                display: "flex",
                justifyContent: "flex-end",
                zIndex: 80,
                animation: "zfade 200ms ease",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="zpanel"
                style={{
                    width: 460,
                    height: "100%",
                    background: C.surfaceHi,
                    borderLeft: `1px solid ${C.borderHi}`,
                    boxShadow: C.shadowLg,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                <Header control={control} sectionLabel={sectionLabel} onClose={onClose} />

                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "18px 20px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 18,
                    }}
                >
                    <MetaGrid control={control} lastTested={relTime(pageLoadMs - control.lastTestMin * 60000)} />

                    <EvidenceSection
                        evidence={evidence}
                        pageLoadMs={pageLoadMs}
                    />

                    <HistorySection history={history} />
                </div>

                <Footer
                    onRunTest={onRunTest}
                    onMarkReview={onMarkReview}
                    running={running}
                    status={control.status}
                />
            </div>
        </div>
    )
}

// ============ HEADER ============

function Header({
    control,
    sectionLabel,
    onClose,
}: {
    control: Ctl & { status: CtlStatus }
    sectionLabel: string
    onClose: () => void
}) {
    return (
        <div
            style={{
                padding: "18px 20px 14px 20px",
                borderBottom: `1px solid ${C.border}`,
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                        }}
                    >
                        <div
                            style={{
                                font: `500 11px/14px ${MONO}`,
                                color: C.textMuted,
                                padding: "2px 6px",
                                background: C.hoverOverlay,
                                borderRadius: 4,
                            }}
                        >
                            {control.id}
                        </div>
                        <div
                            style={{
                                font: `400 11px/14px ${FONT}`,
                                color: C.textSubtle,
                            }}
                        >
                            {control.fw} · {sectionLabel}
                        </div>
                    </div>
                    <div
                        style={{
                            font: `600 16px/22px ${FONT}`,
                            color: C.text,
                            letterSpacing: "-0.005em",
                        }}
                    >
                        {control.title}
                    </div>
                </div>
                <StatusPill s={control.status} />
                <button
                    onClick={onClose}
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
                    aria-label="Close control detail"
                >
                    <Icon n="x" s={13} c={C.textMuted} />
                </button>
            </div>
        </div>
    )
}

// ============ META GRID ============

function MetaGrid({
    control,
    lastTested,
}: {
    control: Ctl & { status: CtlStatus }
    lastTested: string
}) {
    const rows: [string, string][] = [
        ["Owner", control.owner],
        ["Last tested", lastTested],
        ["Next test", "in 7 days"],
    ]
    return (
        <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "120px 1fr", rowGap: 10 }}>
            {rows.map(([label, value]) => (
                <React.Fragment key={label}>
                    <dt style={{ font: `400 13px/18px ${FONT}`, color: C.textSubtle }}>{label}</dt>
                    <dd style={{ margin: 0, font: `500 13px/18px ${FONT}`, color: C.text }}>{value}</dd>
                </React.Fragment>
            ))}
        </dl>
    )
}

// ============ EVIDENCE SECTION ============

function EvidenceSection({
    evidence,
    pageLoadMs,
}: {
    evidence: EvidenceFile[]
    pageLoadMs: number
}) {
    return (
        <Section
            title="Evidence files"
            count={evidence.length}
            empty="No evidence yet. The agent collects it on the next test run."
        >
            {evidence.map((e, i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                    }}
                >
                    <div
                        style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: C.surfaceHi,
                            border: `1px solid ${C.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Icon n="fileText" s={12} c={C.textMuted} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                font: `500 12px/16px ${MONO}`,
                                color: C.text,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {e.name}
                        </div>
                        <div
                            style={{
                                font: `400 11px/14px ${FONT}`,
                                color: C.textSubtle,
                                marginTop: 1,
                            }}
                        >
                            {e.source} · {e.size} · added{" "}
                            {relTime(pageLoadMs - e.addedMin * 60000)}
                        </div>
                    </div>
                    <Icon n="download" s={12} c={C.textMuted} />
                </div>
            ))}
        </Section>
    )
}

// ============ HISTORY SECTION ============

function HistorySection({ history }: { history: HistoryRun[] }) {
    return (
        <Section title="Test history" count={history.length}>
            {history.map((h, i) => {
                const color =
                    h.outcome === "passing"
                        ? C.success
                        : h.outcome === "review"
                          ? C.warning
                          : C.danger
                return (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            gap: 10,
                            padding: "10px 0",
                            borderTop:
                                i === 0 ? "none" : `1px solid ${C.border}`,
                        }}
                    >
                        <div
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 999,
                                background: color,
                                marginTop: 8,
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
                                {h.note}
                            </div>
                            <div
                                style={{
                                    font: `400 11px/14px ${FONT}`,
                                    color: C.textSubtle,
                                    marginTop: 2,
                                }}
                            >
                                {h.by} · {relTime(h.at)}
                            </div>
                        </div>
                    </div>
                )
            })}
        </Section>
    )
}

// ============ SECTION WRAPPER ============

function Section({
    title,
    count,
    empty,
    children,
}: {
    title: string
    count: number
    empty?: string
    children: React.ReactNode
}) {
    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 8,
                }}
            >
                <div
                    style={{
                        font: `500 12px/16px ${FONT}`,
                        color: C.textMuted,
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        font: `500 11px/14px ${FONT}`,
                        color: C.textSubtle,
                    }}
                >
                    {count}
                </div>
            </div>
            {count === 0 && empty ? (
                <div
                    style={{
                        padding: "14px 12px",
                        background: C.surface,
                        border: `1px dashed ${C.border}`,
                        borderRadius: 8,
                        font: `400 12px/16px ${FONT}`,
                        color: C.textSubtle,
                        textAlign: "center",
                    }}
                >
                    {empty}
                </div>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    )
}

// ============ FOOTER ============

function Footer({
    onRunTest,
    onMarkReview,
    running,
    status,
}: {
    onRunTest: () => void
    onMarkReview: () => void
    running: boolean
    status: CtlStatus
}) {
    return (
        <div
            style={{
                padding: "14px 20px",
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                gap: 8,
                flexShrink: 0,
                background: C.surfaceSunken,
            }}
        >
            {status !== "review" && (
                <button
                    type="button"
                    className="zbtn"
                    style={btnSecondary}
                    onClick={onMarkReview}
                >
                    Mark for review
                </button>
            )}
            <div style={{ flex: 1 }} />
            <button
                type="button"
                className="zbtn"
                style={{
                    ...btnPrimary,
                    opacity: running ? 0.6 : 1,
                    cursor: running ? "default" : "pointer",
                }}
                onClick={onRunTest}
                disabled={running}
            >
                {running ? (
                    <Spinner size={11} />
                ) : (
                    <Icon n="play" s={10} c={C.primaryFg} />
                )}
                {running ? "Running…" : "Run test"}
            </button>
        </div>
    )
}
