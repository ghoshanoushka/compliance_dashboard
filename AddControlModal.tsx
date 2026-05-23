import * as React from "react"
import {
    C,
    FONT,
    MONO,
    Icon,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    btnPrimary,
    btnSecondary,
} from "./DashboardLib_1"
import {
    type Ctl,
    type CtlStatus,
    type Framework,
    FRAMEWORKS,
} from "./DashboardData"

// ============ ADD CONTROL MODAL ============
//
// New file · one of the modal additions from the project brief.
// Opens from the "Add control" button in the Controls tab header.
// Validates ID uniqueness and that all fields are filled, then calls onAdd
// with the assembled Ctl object.

const STATUS_OPTIONS: { value: CtlStatus; label: string; color: string }[] = [
    { value: "passing", label: "Passing", color: C.success },
    { value: "review", label: "In review", color: C.warning },
    { value: "gap", label: "Gap", color: C.danger },
]

export function AddControlModal({
    open,
    close,
    existingIds,
    onAdd,
}: {
    open: boolean
    close: () => void
    existingIds: Set<string>
    onAdd: (ctl: Ctl) => void
}) {
    const [id, setId] = React.useState("")
    const [title, setTitle] = React.useState("")
    const [fw, setFw] = React.useState<string>(FRAMEWORKS[0]?.fw ?? "")
    const [owner, setOwner] = React.useState("")
    const [status, setStatus] = React.useState<CtlStatus>("review")
    const [submitted, setSubmitted] = React.useState(false)

    // Reset whenever the modal closes so re-opening starts clean.
    React.useEffect(() => {
        if (!open) {
            setId("")
            setTitle("")
            setFw(FRAMEWORKS[0]?.fw ?? "")
            setOwner("")
            setStatus("review")
            setSubmitted(false)
        }
    }, [open])

    const trimmedId = id.trim()
    const trimmedTitle = title.trim()
    const trimmedOwner = owner.trim()
    const idIsDuplicate = trimmedId.length > 0 && existingIds.has(trimmedId)
    const idError = submitted
        ? trimmedId.length === 0
            ? "ID is required"
            : idIsDuplicate
              ? "A control with this ID already exists"
              : null
        : idIsDuplicate
          ? "A control with this ID already exists"
          : null
    const titleError =
        submitted && trimmedTitle.length === 0 ? "Title is required" : null
    const ownerError =
        submitted && trimmedOwner.length === 0 ? "Owner is required" : null

    const canSubmit =
        trimmedId.length > 0 &&
        !idIsDuplicate &&
        trimmedTitle.length > 0 &&
        trimmedOwner.length > 0 &&
        fw.length > 0

    const handleSubmit = () => {
        setSubmitted(true)
        if (!canSubmit) return
        const ctl: Ctl = {
            id: trimmedId,
            fw,
            title: trimmedTitle,
            owner: trimmedOwner,
            status,
            lastTest: "Just now",
            lastTestMin: 0,
            evidence: 0,
        }
        onAdd(ctl)
        close()
    }

    return (
        <Modal open={open} close={close} width={520}>
            <ModalHeader
                icon="plus"
                title="Add a new control"
                subtitle="Manually register a control · evidence and tests can be linked later"
                close={close}
            />
            <ModalBody>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    <Row label="Control ID" error={idError}>
                        <input
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            placeholder="e.g. CC9.1"
                            style={inputStyle(MONO, !!idError)}
                            autoFocus
                        />
                    </Row>
                    <Row label="Title" error={titleError}>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Short description of what this control enforces"
                            style={inputStyle(FONT, !!titleError)}
                        />
                    </Row>
                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <Row label="Framework">
                                <Select
                                    value={fw}
                                    onChange={setFw}
                                    options={FRAMEWORKS.map((f: Framework) => ({
                                        value: f.fw,
                                        label: f.name,
                                    }))}
                                />
                            </Row>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Row label="Status">
                                <Select
                                    value={status}
                                    onChange={(v) => setStatus(v as CtlStatus)}
                                    options={STATUS_OPTIONS.map((s) => ({
                                        value: s.value,
                                        label: s.label,
                                    }))}
                                />
                            </Row>
                        </div>
                    </div>
                    <Row label="Owner" error={ownerError}>
                        <input
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                            placeholder="e.g. Security, Engineering, GRC"
                            style={inputStyle(FONT, !!ownerError)}
                        />
                    </Row>
                </div>
            </ModalBody>
            <ModalFooter>
                <button
                    className="zbtn"
                    style={btnSecondary}
                    onClick={close}
                    type="button"
                >
                    Cancel
                </button>
                <button
                    className="zbtn"
                    style={{
                        ...btnPrimary,
                        opacity: canSubmit ? 1 : 0.5,
                        cursor: canSubmit ? "pointer" : "not-allowed",
                    }}
                    onClick={handleSubmit}
                    type="button"
                >
                    <Icon n="plus" s={12} c={C.bg} />
                    Add control
                </button>
            </ModalFooter>
        </Modal>
    )
}

// ============ INTERNAL HELPERS ============

function Row({
    label,
    error,
    children,
}: {
    label: string
    error?: string | null
    children: React.ReactNode
}) {
    return (
        <label
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
            }}
        >
            <div
                style={{
                    font: `500 11px/14px ${FONT}`,
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                }}
            >
                {label}
            </div>
            {children}
            {error && (
                <div
                    style={{
                        font: `400 11px/14px ${FONT}`,
                        color: C.danger,
                        marginTop: 2,
                    }}
                >
                    {error}
                </div>
            )}
        </label>
    )
}

function inputStyle(
    family: string,
    hasError: boolean
): React.CSSProperties {
    return {
        width: "100%",
        padding: "10px 12px",
        background: C.surface,
        border: `1px solid ${hasError ? C.danger : C.border}`,
        borderRadius: 8,
        color: C.text,
        font: `400 13px/18px ${family}`,
        outline: "none",
        boxSizing: "border-box",
    }
}

function Select({
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
                        style={{ background: C.surfaceHi, color: C.text }}
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
