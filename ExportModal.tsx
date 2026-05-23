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
    Checkbox,
    ProgressBar,
    Spinner,
    btnPrimary,
    btnSecondary,
} from "https://framer.com/m/DashboardLib-1-xD05ae.js"

// ============ EXPORT MODAL ============
//
// New file · one of the modal additions from the project brief.
// Reusable by three call sites:
//   · Controls tab "Export CSV"          → scope="All controls",         type="controls"
//   · Framework detail "Export"          → scope=framework.name,         type="framework"
//   · Controls bulk "Export selected"    → scope="N selected controls",  type="controls"
//
// Flow:
//   1. picker phase: choose format + options, click Export
//   2. running phase: ~2s progress bar
//   3. complete phase: download stub button
//
// The download stub fires the onComplete callback (so the parent can fire a toast).

export type ExportFormat = "csv" | "pdf" | "xlsx"

export type ExportScope = {
    label: string // shown in the modal header subtitle, e.g. "All controls" or "SOC 2 Type II"
    count: number // record count
    type: "controls" | "framework"
}

const FORMATS: {
    value: ExportFormat
    label: string
    ext: string
    icon: "fileText" | "fileText" | "fileText"
    hint: string
}[] = [
    {
        value: "csv",
        label: "CSV",
        ext: ".csv",
        icon: "fileText",
        hint: "Comma-separated · spreadsheet ready",
    },
    {
        value: "pdf",
        label: "PDF",
        ext: ".pdf",
        icon: "fileText",
        hint: "Audit-ready report with cover page",
    },
    {
        value: "xlsx",
        label: "Excel",
        ext: ".xlsx",
        icon: "fileText",
        hint: "Multi-sheet workbook · formulas preserved",
    },
]

type Phase = "picker" | "running" | "complete"

export function ExportModal({
    open,
    close,
    scope,
    onComplete,
}: {
    open: boolean
    close: () => void
    scope: ExportScope | null
    onComplete?: (info: { format: ExportFormat; filename: string }) => void
}) {
    const [format, setFormat] = React.useState<ExportFormat>("csv")
    const [includeMeta, setIncludeMeta] = React.useState(true)
    const [includeEvidenceUrls, setIncludeEvidenceUrls] = React.useState(true)
    const [includeHistory, setIncludeHistory] = React.useState(false)
    const [phase, setPhase] = React.useState<Phase>("picker")
    const [progress, setProgress] = React.useState(0)
    const [filename, setFilename] = React.useState<string>("")

    // Reset to picker phase whenever the modal opens / closes.
    React.useEffect(() => {
        if (!open) {
            setPhase("picker")
            setProgress(0)
            setFilename("")
        }
    }, [open])

    // Fake progress when running.
    React.useEffect(() => {
        if (phase !== "running") return
        const start = Date.now()
        const total = 2000
        let raf = 0
        const step = () => {
            const elapsed = Date.now() - start
            const pct = Math.min(100, (elapsed / total) * 100)
            setProgress(pct)
            if (pct < 100) {
                raf = window.requestAnimationFrame(step)
            } else {
                setPhase("complete")
                onComplete?.({ format, filename })
            }
        }
        raf = window.requestAnimationFrame(step)
        return () => window.cancelAnimationFrame(raf)
        // onComplete is intentionally omitted so a parent re-render doesn't restart progress
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])

    const startExport = () => {
        if (!scope) return
        const slug = scope.label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
        const ext = FORMATS.find((f) => f.value === format)?.ext ?? ".csv"
        const stamp = new Date().toISOString().slice(0, 10)
        setFilename(`zania-${slug}-${stamp}${ext}`)
        setProgress(0)
        setPhase("running")
    }

    const headerSubtitle = scope
        ? `${scope.count.toLocaleString()} ${scope.type === "framework" ? "controls in" : "records from"} ${scope.label}`
        : undefined

    return (
        <Modal open={open} close={close} width={520}>
            <ModalHeader
                icon="download"
                title={
                    phase === "complete"
                        ? "Export ready"
                        : phase === "running"
                          ? "Preparing export"
                          : "Export data"
                }
                subtitle={headerSubtitle}
                close={close}
            />
            <ModalBody>
                {phase === "picker" && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 18,
                        }}
                    >
                        <FieldLabel>Format</FieldLabel>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 8,
                            }}
                        >
                            {FORMATS.map((f) => {
                                const active = format === f.value
                                return (
                                    <button
                                        key={f.value}
                                        type="button"
                                        onClick={() => setFormat(f.value)}
                                        className="zbtn"
                                        style={{
                                            padding: "12px 10px",
                                            background: active
                                                ? C.accentBg
                                                : C.surface,
                                            border: `1px solid ${active ? "rgba(124,92,255,0.45)" : C.border}`,
                                            borderRadius: 10,
                                            cursor: "pointer",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "flex-start",
                                            gap: 6,
                                            textAlign: "left",
                                            transition: "all 120ms",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <Icon
                                                n={f.icon}
                                                s={14}
                                                c={
                                                    active
                                                        ? C.accentSoft
                                                        : C.textMuted
                                                }
                                            />
                                            <div
                                                style={{
                                                    font: `600 13px/16px ${FONT}`,
                                                    color: C.text,
                                                }}
                                            >
                                                {f.label}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                font: `400 11px/14px ${FONT}`,
                                                color: C.textSubtle,
                                            }}
                                        >
                                            {f.hint}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        <FieldLabel>Include</FieldLabel>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            <Option
                                checked={includeMeta}
                                onChange={() => setIncludeMeta((v) => !v)}
                                title="Metadata"
                                hint="Owner, framework section, last test, evidence count"
                            />
                            <Option
                                checked={includeEvidenceUrls}
                                onChange={() =>
                                    setIncludeEvidenceUrls((v) => !v)
                                }
                                title="Evidence URLs"
                                hint="Direct links to source documents in connected tools"
                            />
                            <Option
                                checked={includeHistory}
                                onChange={() => setIncludeHistory((v) => !v)}
                                title="Test history"
                                hint="Past 90 days of control runs and outcomes"
                            />
                        </div>
                    </div>
                )}

                {phase === "running" && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            padding: "8px 0",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <Spinner size={14} />
                            <div
                                style={{
                                    font: `500 13px/18px ${FONT}`,
                                    color: C.text,
                                }}
                            >
                                Generating{" "}
                                <span
                                    style={{
                                        font: `500 12px/16px ${MONO}`,
                                        color: C.accentSoft,
                                    }}
                                >
                                    {filename}
                                </span>
                            </div>
                        </div>
                        <ProgressBar value={progress} height={8} />
                        <div
                            style={{
                                font: `400 12px/16px ${FONT}`,
                                color: C.textSubtle,
                            }}
                        >
                            {progress < 40
                                ? "Collecting records…"
                                : progress < 80
                                  ? "Attaching evidence references…"
                                  : "Compressing output…"}
                        </div>
                    </div>
                )}

                {phase === "complete" && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            padding: "4px 0",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "14px 14px",
                                background: C.successBg,
                                border: `1px solid rgba(0,208,132,0.3)`,
                                borderRadius: 10,
                            }}
                        >
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 999,
                                    background: "rgba(0,208,132,0.25)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Icon n="check" s={14} c={C.success} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        font: `600 13px/18px ${FONT}`,
                                        color: C.text,
                                    }}
                                >
                                    {filename}
                                </div>
                                <div
                                    style={{
                                        font: `400 11px/14px ${FONT}`,
                                        color: C.textMuted,
                                        marginTop: 1,
                                    }}
                                >
                                    {scope?.count.toLocaleString() ?? "0"}{" "}
                                    records ·{" "}
                                    {(
                                        ((scope?.count ?? 0) *
                                            (format === "pdf" ? 4.2 : 1.1)) /
                                        1024
                                    ).toFixed(2)}{" "}
                                    MB
                                </div>
                            </div>
                        </div>
                        <div
                            style={{
                                font: `400 12px/16px ${FONT}`,
                                color: C.textSubtle,
                            }}
                        >
                            Files are kept for 24 hours · re-download from the
                            Exports page in Settings.
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                {phase === "picker" && (
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
                            style={btnPrimary}
                            onClick={startExport}
                        >
                            <Icon n="download" s={12} c={C.bg} />
                            Export {FORMATS.find((f) => f.value === format)?.label}
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
                        Cancel
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
                            onClick={() => {
                                // Stub · in Framer this would hit a presigned URL.
                                // Closing the modal afterward feels right.
                                close()
                            }}
                        >
                            <Icon n="download" s={12} c={C.bg} />
                            Download
                        </button>
                    </>
                )}
            </ModalFooter>
        </Modal>
    )
}

// ============ INTERNAL HELPERS ============

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                font: `500 11px/14px ${FONT}`,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
            }}
        >
            {children}
        </div>
    )
}

function Option({
    checked,
    onChange,
    title,
    hint,
}: {
    checked: boolean
    onChange: () => void
    title: string
    hint: string
}) {
    return (
        <div
            onClick={onChange}
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                cursor: "pointer",
            }}
        >
            <div style={{ paddingTop: 2 }}>
                <Checkbox checked={checked} onChange={onChange} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        font: `500 13px/18px ${FONT}`,
                        color: C.text,
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        font: `400 11px/14px ${FONT}`,
                        color: C.textSubtle,
                        marginTop: 1,
                    }}
                >
                    {hint}
                </div>
            </div>
        </div>
    )
}

export default function ExportModalDefault() {
    return null
}

addPropertyControls(ExportModalDefault, {})
