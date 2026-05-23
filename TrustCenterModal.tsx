import * as React from "react"
import { addPropertyControls } from "framer"
import {
    C,
    FONT,
    MONO,
    Icon,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ProgressBar,
    btnPrimary,
    btnSecondary,
} from "https://framer.com/m/DashboardLib-1-xD05ae.js"
import {
    type Framework,
    FRAMEWORKS,
} from "https://framer.com/m/DashboardData-6dyjDj.js"

// ============ TRUST CENTER MODAL ============
//
// Public-facing compliance posture summary. Mirrors what a customer prospect
// would see on the published trust center page · same data as the dashboard
// but framed as outward-facing marketing.

const PUBLIC_URL = "https://trust.acme-corp.com"

export function TrustCenterModal({
    open,
    close,
    onAction,
}: {
    open: boolean
    close: () => void
    onAction?: (label: string, note?: string) => void
}) {
    const overall = React.useMemo(() => {
        const totalControls = FRAMEWORKS.reduce(
            (s: number, f: Framework) => s + f.total,
            0
        )
        const passing = FRAMEWORKS.reduce(
            (s: number, f: Framework) => s + f.passing,
            0
        )
        return Math.round((passing / Math.max(1, totalControls)) * 100)
    }, [])

    return (
        <Modal open={open} close={close} width={560}>
            <ModalHeader
                icon="shieldCheck"
                title="Trust Center"
                subtitle="Public compliance posture · what your customers see"
                close={close}
            />
            <ModalBody scrollable>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 18,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: 16,
                            background: `linear-gradient(135deg, rgba(124,92,255,0.14), rgba(124,92,255,0.04))`,
                            border: `1px solid rgba(124,92,255,0.22)`,
                            borderRadius: 12,
                        }}
                    >
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: `linear-gradient(135deg, ${C.accent}, ${C.accentSoft})`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <Icon n="shieldCheck" s={22} c={C.text} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    font: `400 11px/14px ${FONT}`,
                                    color: C.textSubtle,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                }}
                            >
                                Overall posture
                            </div>
                            <div
                                style={{
                                    font: `600 28px/32px ${FONT}`,
                                    color: C.text,
                                    letterSpacing: "-0.025em",
                                    marginTop: 2,
                                }}
                            >
                                {overall}% compliant
                            </div>
                            <div
                                style={{
                                    font: `400 12px/16px ${FONT}`,
                                    color: C.textMuted,
                                    marginTop: 2,
                                }}
                            >
                                Across {FRAMEWORKS.length} active frameworks ·
                                continuously monitored by Director Agent
                            </div>
                        </div>
                    </div>

                    <div>
                        <div
                            style={{
                                font: `500 11px/14px ${FONT}`,
                                color: C.textMuted,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                marginBottom: 10,
                            }}
                        >
                            By framework
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            {FRAMEWORKS.map((f: Framework) => {
                                const pct = Math.round(
                                    (f.passing / Math.max(1, f.total)) * 100
                                )
                                return (
                                    <div
                                        key={f.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "12px 14px",
                                            background: C.surface,
                                            border: `1px solid ${C.border}`,
                                            borderRadius: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "baseline",
                                                    justifyContent:
                                                        "space-between",
                                                    gap: 8,
                                                    marginBottom: 6,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        font: `600 13px/16px ${FONT}`,
                                                        color: C.text,
                                                    }}
                                                >
                                                    {f.name}
                                                </div>
                                                <div
                                                    style={{
                                                        font: `600 13px/16px ${FONT}`,
                                                        color:
                                                            pct >= 85
                                                                ? C.success
                                                                : pct >= 70
                                                                  ? C.accentSoft
                                                                  : C.warning,
                                                    }}
                                                >
                                                    {pct}%
                                                </div>
                                            </div>
                                            <ProgressBar
                                                value={pct}
                                                height={5}
                                            />
                                            <div
                                                style={{
                                                    font: `400 11px/14px ${FONT}`,
                                                    color: C.textSubtle,
                                                    marginTop: 6,
                                                }}
                                            >
                                                {f.passing} of {f.total} controls
                                                passing · audited by {f.auditor}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "12px 14px",
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                        }}
                    >
                        <Icon n="globe" s={14} c={C.textMuted} />
                        <div
                            style={{
                                flex: 1,
                                font: `400 12px/16px ${MONO}`,
                                color: C.text,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {PUBLIC_URL}
                        </div>
                        <button
                            type="button"
                            className="zbtn"
                            style={{
                                ...btnSecondary,
                                padding: "6px 10px",
                                font: `500 12px/16px ${FONT}`,
                            }}
                            onClick={() =>
                                onAction?.(
                                    "Trust URL",
                                    "copied to clipboard"
                                )
                            }
                        >
                            Copy
                        </button>
                    </div>

                    <div
                        style={{
                            font: `400 12px/16px ${FONT}`,
                            color: C.textSubtle,
                        }}
                    >
                        Customers and prospects can request SOC 2 / ISO reports
                        directly from the public page. Auto-NDA gating on by
                        default.
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
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
                    onClick={() =>
                        onAction?.("Trust Center", "preview opened in new tab")
                    }
                >
                    <Icon n="eye" s={12} c={C.bg} />
                    View as customer
                </button>
            </ModalFooter>
        </Modal>
    )
}

export default function TrustCenterModalDefault() {
    return null
}

addPropertyControls(TrustCenterModalDefault, {})
