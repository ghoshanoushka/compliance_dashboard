import * as React from "react"
import { celebrate } from "../lib/celebrate"
import {
    C,
    FONT,
    Icon,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Checkbox,
    btnPrimary,
    btnSecondary,
    relTime,
} from "./DashboardLib"

// ============ EXPORT MODAL ============
//
// Pick a format, then Export builds the file in the browser from the
// controls in scope and downloads it. Opened from the Controls page
// (all or selected controls) and from a framework's detail page.

export type ExportFormat = "csv" | "json"

export type ExportRow = {
    id: string
    fw: string
    title: string
    owner: string
    status: string
    evidence: number
    lastTestMin: number
}

export type ExportScope = {
    label: string // e.g. "All controls" or "SOC 2 Type II"
    rows: ExportRow[]
}

const FORMATS: { value: ExportFormat; label: string; hint: string }[] = [
    { value: "csv", label: "CSV", hint: "Opens in Excel, Numbers or Sheets" },
    { value: "json", label: "JSON", hint: "For scripts and other tools" },
]

function serialize(rows: ExportRow[], format: ExportFormat, withMeta: boolean): string {
    const now = Date.now()
    const records = rows.map((r) => ({
        id: r.id,
        framework: r.fw,
        control: r.title,
        status: r.status,
        ...(withMeta
            ? {
                  owner: r.owner,
                  evidence: r.evidence,
                  last_tested: relTime(now - r.lastTestMin * 60000),
              }
            : {}),
    }))
    if (format === "json") return JSON.stringify(records, null, 2)
    const cols = Object.keys(records[0] ?? { id: "" })
    const cell = (v: unknown) => {
        const t = String(v ?? "")
        return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
    }
    return [cols.join(","), ...records.map((r) => cols.map((c) => cell((r as any)[c])).join(","))].join("\n")
}

function download(filename: string, body: string, type: string) {
    const url = URL.createObjectURL(new Blob([body], { type }))
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ExportModal({
    open,
    close,
    scope,
}: {
    open: boolean
    close: () => void
    scope: ExportScope | null
}) {
    const [format, setFormat] = React.useState<ExportFormat>("csv")
    const [includeMeta, setIncludeMeta] = React.useState(true)
    const [file, setFile] = React.useState<{ name: string; body: string; type: string } | null>(null)
    const winRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (!open) setFile(null)
    }, [open])
    React.useEffect(() => {
        if (file) celebrate(winRef.current)
    }, [file])

    const runExport = () => {
        if (!scope) return
        const slug = scope.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        const stamp = new Date().toISOString().slice(0, 10)
        const next = {
            name: `${slug}-${stamp}.${format}`,
            body: serialize(scope.rows, format, includeMeta),
            type: format === "csv" ? "text/csv" : "application/json",
        }
        download(next.name, next.body, next.type)
        setFile(next)
    }

    const count = scope?.rows.length ?? 0
    return (
        <Modal open={open} close={close} width={480}>
            <ModalHeader
                icon="download"
                title={file ? "Exported" : "Export controls"}
                subtitle={scope ? `${count} ${count === 1 ? "control" : "controls"} · ${scope.label}` : undefined}
                close={close}
            />
            <ModalBody>
                {!file ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <FieldLabel>Format</FieldLabel>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {FORMATS.map((f) => {
                                const active = format === f.value
                                return (
                                    <button
                                        key={f.value}
                                        type="button"
                                        onClick={() => setFormat(f.value)}
                                        aria-pressed={active}
                                        className="zbtn"
                                        style={{
                                            padding: "12px",
                                            background: active ? C.accentBg : C.surface,
                                            border: `1px solid ${active ? C.accentLine : C.border}`,
                                            borderRadius: 10,
                                            cursor: "pointer",
                                            textAlign: "left",
                                        }}
                                    >
                                        <div style={{ font: `600 13px/18px ${FONT}`, color: C.text }}>{f.label}</div>
                                        <div style={{ font: `400 12px/16px ${FONT}`, color: C.textSubtle, marginTop: 2 }}>{f.hint}</div>
                                    </button>
                                )
                            })}
                        </div>
                        <div style={{ marginTop: 6 }}>
                            <Option
                                checked={includeMeta}
                                onChange={() => setIncludeMeta((v) => !v)}
                                title="Include details"
                                hint="Owner, evidence count and last test for each control"
                            />
                        </div>
                    </div>
                ) : (
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
                        <Icon n="check" s={16} c={C.success} />
                        <div style={{ minWidth: 0 }}>
                            <div style={{ font: `600 13px/18px ${FONT}`, color: C.text }}>{file.name}</div>
                            <div style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted, marginTop: 1 }}>
                                Saved to your downloads · {(new Blob([file.body]).size / 1024).toFixed(1)} KB
                            </div>
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                {!file ? (
                    <>
                        <button type="button" className="zbtn" style={btnSecondary} onClick={close}>
                            Cancel
                        </button>
                        <button type="button" className="zbtn" style={btnPrimary} onClick={runExport} disabled={count === 0}>
                            <Icon n="download" s={12} c={C.primaryFg} />
                            Export {format.toUpperCase()}
                        </button>
                    </>
                ) : (
                    <>
                        <button type="button" className="zbtn" style={btnSecondary} onClick={() => download(file.name, file.body, file.type)}>
                            Download again
                        </button>
                        <button type="button" className="zbtn" style={btnPrimary} onClick={close}>
                            Done
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
                font: `500 12px/16px ${FONT}`,
                color: C.textMuted,
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
