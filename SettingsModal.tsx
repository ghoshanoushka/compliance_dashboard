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
    btnPrimary,
    btnSecondary,
} from "https://framer.com/m/DashboardLib-1-xD05ae.js"

// ============ SETTINGS MODAL ============
//
// 4-tab settings panel. State is local · the demo doesn't persist anywhere,
// but the structure mirrors what a real product would look like.

type SettingsTab = "workspace" | "notifications" | "integrations" | "api"

const TABS: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "workspace", label: "Workspace", icon: "house" },
    { id: "notifications", label: "Notifications", icon: "bell" },
    { id: "integrations", label: "Integrations", icon: "globe" },
    { id: "api", label: "API", icon: "bolt" },
]

const INTEGRATIONS = [
    {
        name: "Okta",
        kind: "Identity",
        status: "connected",
        last: "2 min ago",
    },
    {
        name: "Notion",
        kind: "Docs",
        status: "connected",
        last: "9 min ago",
    },
    {
        name: "GitHub",
        kind: "Code",
        status: "connected",
        last: "just now",
    },
    {
        name: "Google Drive",
        kind: "Docs",
        status: "connected",
        last: "5 min ago",
    },
    {
        name: "AWS",
        kind: "Infra",
        status: "needs review",
        last: "1 hr ago",
    },
    {
        name: "Datadog",
        kind: "Monitoring",
        status: "disconnected",
        last: "",
    },
]

export function SettingsModal({
    open,
    close,
    onAction,
}: {
    open: boolean
    close: () => void
    onAction?: (label: string, note?: string) => void
}) {
    const [tab, setTab] = React.useState<SettingsTab>("workspace")
    const [workspaceName, setWorkspaceName] = React.useState("Acme Corp")
    const [region, setRegion] = React.useState("us-east-1")
    const [emailDigest, setEmailDigest] = React.useState(true)
    const [mentionAlerts, setMentionAlerts] = React.useState(true)
    const [frameworkAlerts, setFrameworkAlerts] = React.useState(true)
    const [weeklyReport, setWeeklyReport] = React.useState(false)

    React.useEffect(() => {
        if (!open) setTab("workspace")
    }, [open])

    return (
        <Modal open={open} close={close} width={620}>
            <ModalHeader
                icon="gear"
                title="Settings"
                subtitle="Workspace, notifications, integrations, and API access"
                close={close}
            />
            <ModalBody scrollable>
                <div style={{ display: "flex", gap: 20 }}>
                    <div
                        style={{
                            width: 168,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            flexShrink: 0,
                        }}
                    >
                        {TABS.map((t) => {
                            const active = tab === t.id
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setTab(t.id)}
                                    className="znav"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "8px 10px",
                                        background: active
                                            ? C.accentBg
                                            : "transparent",
                                        border: "none",
                                        borderRadius: 7,
                                        cursor: "pointer",
                                        font: `${active ? 600 : 500} 13px/18px ${FONT}`,
                                        color: active
                                            ? C.accentSoft
                                            : C.textMuted,
                                        textAlign: "left",
                                    }}
                                >
                                    <Icon
                                        n={t.icon}
                                        s={14}
                                        c={
                                            active ? C.accentSoft : C.textMuted
                                        }
                                    />
                                    {t.label}
                                </button>
                            )
                        })}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        {tab === "workspace" && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                }}
                            >
                                <Field label="Workspace name">
                                    <Input
                                        value={workspaceName}
                                        onChange={setWorkspaceName}
                                    />
                                </Field>
                                <Field label="Region">
                                    <Select
                                        value={region}
                                        onChange={setRegion}
                                        options={[
                                            {
                                                value: "us-east-1",
                                                label: "US East (N. Virginia)",
                                            },
                                            {
                                                value: "us-west-2",
                                                label: "US West (Oregon)",
                                            },
                                            {
                                                value: "eu-west-1",
                                                label: "EU (Ireland)",
                                            },
                                            {
                                                value: "eu-central-1",
                                                label: "EU (Frankfurt)",
                                            },
                                        ]}
                                    />
                                </Field>
                                <Field label="Plan">
                                    <PillRow>
                                        <Pill value="Enterprise" active />
                                        <Pill
                                            value="Renews Sep 1, 2027"
                                            muted
                                        />
                                    </PillRow>
                                </Field>
                            </div>
                        )}

                        {tab === "notifications" && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                <ToggleRow
                                    title="Daily email digest"
                                    hint="Summary of overnight runs sent at 8am local"
                                    checked={emailDigest}
                                    onChange={() =>
                                        setEmailDigest((v) => !v)
                                    }
                                />
                                <ToggleRow
                                    title="Mentions"
                                    hint="Notify me when an agent or teammate references me"
                                    checked={mentionAlerts}
                                    onChange={() =>
                                        setMentionAlerts((v) => !v)
                                    }
                                />
                                <ToggleRow
                                    title="Framework drift alerts"
                                    hint="Notify when a framework's passing rate drops more than 5%"
                                    checked={frameworkAlerts}
                                    onChange={() =>
                                        setFrameworkAlerts((v) => !v)
                                    }
                                />
                                <ToggleRow
                                    title="Weekly executive report"
                                    hint="Auto-generated PDF emailed every Monday"
                                    checked={weeklyReport}
                                    onChange={() =>
                                        setWeeklyReport((v) => !v)
                                    }
                                />
                            </div>
                        )}

                        {tab === "integrations" && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                {INTEGRATIONS.map((it) => (
                                    <IntegrationRow
                                        key={it.name}
                                        it={it}
                                        onAction={onAction}
                                    />
                                ))}
                            </div>
                        )}

                        {tab === "api" && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                }}
                            >
                                <Field
                                    label="API key"
                                    hint="Treat like a password · regenerate if exposed"
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                flex: 1,
                                                padding: "10px 12px",
                                                background: C.surface,
                                                border: `1px solid ${C.border}`,
                                                borderRadius: 8,
                                                font: `400 12px/18px ${MONO}`,
                                                color: C.text,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            zk_live_4f6c8d…a7e2
                                        </div>
                                        <button
                                            type="button"
                                            className="zbtn"
                                            style={btnSecondary}
                                            onClick={() =>
                                                onAction?.(
                                                    "API key",
                                                    "copied to clipboard"
                                                )
                                            }
                                        >
                                            Copy
                                        </button>
                                        <button
                                            type="button"
                                            className="zbtn"
                                            style={btnSecondary}
                                            onClick={() =>
                                                onAction?.(
                                                    "API key",
                                                    "regenerated · old key revoked"
                                                )
                                            }
                                        >
                                            Regenerate
                                        </button>
                                    </div>
                                </Field>
                                <Field
                                    label="Webhook URL"
                                    hint="POST events to this endpoint when runs complete"
                                >
                                    <Input
                                        value="https://acme.example.com/zania-events"
                                        onChange={() => {}}
                                    />
                                </Field>
                                <Field label="Rate limit">
                                    <PillRow>
                                        <Pill
                                            value="1,000 req / min"
                                            active
                                        />
                                        <Pill value="Enterprise tier" muted />
                                    </PillRow>
                                </Field>
                            </div>
                        )}
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
                    onClick={() => {
                        onAction?.("Settings", "saved")
                        close()
                    }}
                >
                    Save changes
                </button>
            </ModalFooter>
        </Modal>
    )
}

// ============ INTERNAL HELPERS ============

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
                        font: `500 11px/14px ${FONT}`,
                        color: C.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
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

function Input({
    value,
    onChange,
}: {
    value: string
    onChange: (v: string) => void
}) {
    return (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
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
            }}
        />
    )
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

function PillRow({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {children}
        </div>
    )
}

function Pill({
    value,
    active,
    muted,
}: {
    value: string
    active?: boolean
    muted?: boolean
}) {
    return (
        <div
            style={{
                padding: "6px 10px",
                borderRadius: 999,
                font: `500 12px/16px ${FONT}`,
                background: active
                    ? C.accentBg
                    : muted
                      ? C.surface
                      : C.surface,
                border: `1px solid ${active ? "rgba(124,92,255,0.45)" : C.border}`,
                color: active
                    ? C.accentSoft
                    : muted
                      ? C.textSubtle
                      : C.textMuted,
            }}
        >
            {value}
        </div>
    )
}

function ToggleRow({
    title,
    hint,
    checked,
    onChange,
}: {
    title: string
    hint: string
    checked: boolean
    onChange: () => void
}) {
    return (
        <div
            onClick={onChange}
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 14px",
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
                        font: `400 12px/16px ${FONT}`,
                        color: C.textSubtle,
                        marginTop: 2,
                    }}
                >
                    {hint}
                </div>
            </div>
        </div>
    )
}

function IntegrationRow({
    it,
    onAction,
}: {
    it: { name: string; kind: string; status: string; last: string }
    onAction?: (label: string, note?: string) => void
}) {
    const statusStyle =
        it.status === "connected"
            ? { bg: C.successBg, fg: C.success, dot: C.success }
            : it.status === "needs review"
              ? { bg: C.warningBg, fg: C.warning, dot: C.warning }
              : { bg: C.surface, fg: C.textSubtle, dot: C.textSubtle }
    const isConnected = it.status !== "disconnected"
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
            }}
        >
            <div
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: C.surfaceHi,
                    border: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    font: `600 12px/14px ${FONT}`,
                    color: C.text,
                    flexShrink: 0,
                }}
            >
                {it.name.slice(0, 1)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        font: `500 13px/18px ${FONT}`,
                        color: C.text,
                    }}
                >
                    {it.name}
                </div>
                <div
                    style={{
                        font: `400 11px/14px ${FONT}`,
                        color: C.textSubtle,
                        marginTop: 1,
                    }}
                >
                    {it.kind} {it.last && `· last sync ${it.last}`}
                </div>
            </div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: statusStyle.bg,
                }}
            >
                <div
                    style={{
                        width: 5,
                        height: 5,
                        borderRadius: 999,
                        background: statusStyle.dot,
                    }}
                />
                <div
                    style={{
                        font: `500 11px/14px ${FONT}`,
                        color: statusStyle.fg,
                    }}
                >
                    {it.status}
                </div>
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
                        it.name,
                        isConnected ? "reconfigured" : "connect started"
                    )
                }
            >
                {isConnected ? "Configure" : "Connect"}
            </button>
        </div>
    )
}

export default function SettingsModalDefault() {
    return null
}

addPropertyControls(SettingsModalDefault, {})
