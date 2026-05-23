import * as React from "react"

// CtlStatus is duplicated here (not imported) for type-resolution simplicity.
// Keep this in sync with DashboardLib's CtlStatus.
export type CtlStatus = "passing" | "review" | "gap"

export type Framework = {
    id: string
    name: string
    fw: string
    desc: string
    passing: number
    total: number
    gaps: number
    review: number
    status: "on_track" | "attention"
    lastTest: string
    lastTestMin: number
    auditor: string
    renewal: string
}

export type Ctl = {
    id: string
    fw: string
    title: string
    owner: string
    status: CtlStatus
    lastTest: string
    lastTestMin: number
    evidence: number
}

export type Activity = {
    id: string
    agent: string
    action: string
    target: string
    status: "complete" | "running" | "queued"
    createdAt: number
}

export type RunStep = {
    label: string
    at: number
    tool?: { name: string; params: string; result?: string }
    output?: string
    sub?: string
}

// ============ FRAMEWORKS ============

export const FRAMEWORKS: Framework[] = [
    {
        id: "soc2",
        name: "SOC 2 Type II",
        fw: "SOC 2",
        desc: "Trust services criteria",
        passing: 60,
        total: 64,
        gaps: 2,
        review: 2,
        status: "on_track",
        lastTest: "2 min ago",
        lastTestMin: 2,
        auditor: "Grant Thornton",
        renewal: "Jan 12, 2027",
    },
    {
        id: "iso27001",
        name: "ISO 27001:2022",
        fw: "ISO 27001",
        desc: "Information security management",
        passing: 82,
        total: 93,
        gaps: 5,
        review: 6,
        status: "on_track",
        lastTest: "12 min ago",
        lastTestMin: 12,
        auditor: "Armanino",
        renewal: "Mar 4, 2027",
    },
    {
        id: "iso42001",
        name: "ISO 42001",
        fw: "ISO 42001",
        desc: "AI management systems",
        passing: 29,
        total: 38,
        gaps: 6,
        review: 3,
        status: "attention",
        lastTest: "1 hr ago",
        lastTestMin: 60,
        auditor: "KPMG",
        renewal: "Sep 1, 2027",
    },
    {
        id: "nistcsf",
        name: "NIST CSF 2.0",
        fw: "NIST CSF",
        desc: "Cybersecurity framework",
        passing: 98,
        total: 108,
        gaps: 4,
        review: 6,
        status: "on_track",
        lastTest: "3 hr ago",
        lastTestMin: 180,
        auditor: "Internal",
        renewal: "Continuous",
    },
]

// ============ SECTIONS ============

export const SECTION_LABELS: Record<string, string> = {
    CC1: "Control Environment",
    CC2: "Communication and Information",
    CC5: "Risk Mitigation",
    CC6: "Logical and Physical Access",
    CC7: "System Operations",
    CC8: "Change Management",
    A1: "Availability",
    C1: "Confidentiality",
    "A.5": "Organizational Controls",
    "A.6": "People Controls",
    "A.8": "Technological Controls",
    "5": "Clause 5 · Leadership",
    "6": "Clause 6 · Planning",
    "7": "Clause 7 · Support",
    "8": "Clause 8 · Operation",
    "9": "Clause 9 · Performance Evaluation",
    "10": "Clause 10 · Improvement",
    GV: "Govern",
    ID: "Identify",
    PR: "Protect",
    DE: "Detect",
    RS: "Respond",
    RC: "Recover",
}

export const SECTION_ORDER: Record<string, string[]> = {
    "SOC 2": ["CC1", "CC2", "CC5", "CC6", "CC7", "CC8", "A1", "C1"],
    "ISO 27001": ["A.5", "A.6", "A.8"],
    "ISO 42001": ["5", "6", "7", "8", "9", "10"],
    "NIST CSF": ["GV", "ID", "PR", "DE", "RS", "RC"],
}

export function getSectionKey(c: { fw: string; id: string }): string {
    if (c.fw === "SOC 2") return c.id.split(".")[0]
    if (c.fw === "ISO 27001") {
        const parts = c.id.split(".")
        return `${parts[0]}.${parts[1]}`
    }
    if (c.fw === "ISO 42001") return c.id.split(".")[0]
    if (c.fw === "NIST CSF") return c.id.split(".")[0]
    return c.id
}

// ============ CONTROLS ============

export const CONTROLS: Ctl[] = [
    {
        id: "CC1.1",
        fw: "SOC 2",
        title: "Demonstrates commitment to integrity and ethical values",
        owner: "GRC",
        status: "passing",
        lastTest: "5 min ago",
        lastTestMin: 5,
        evidence: 8,
    },
    {
        id: "CC2.1",
        fw: "SOC 2",
        title: "COSO principles applied across the organization",
        owner: "GRC",
        status: "passing",
        lastTest: "18 min ago",
        lastTestMin: 18,
        evidence: 11,
    },
    {
        id: "CC5.1",
        fw: "SOC 2",
        title: "Selects activities to support information processing objectives",
        owner: "Security",
        status: "passing",
        lastTest: "42 min ago",
        lastTestMin: 42,
        evidence: 9,
    },
    {
        id: "CC6.1",
        fw: "SOC 2",
        title: "Logical access security software, infrastructure, and architectures",
        owner: "Engineering",
        status: "passing",
        lastTest: "8 min ago",
        lastTestMin: 8,
        evidence: 24,
    },
    {
        id: "CC6.2",
        fw: "SOC 2",
        title: "Prior to issuing system credentials, register and authorize new users",
        owner: "IT",
        status: "passing",
        lastTest: "11 min ago",
        lastTestMin: 11,
        evidence: 12,
    },
    {
        id: "CC6.6",
        fw: "SOC 2",
        title: "Logical access security measures for external system users",
        owner: "Engineering",
        status: "review",
        lastTest: "1 hr ago",
        lastTestMin: 60,
        evidence: 7,
    },
    {
        id: "CC7.1",
        fw: "SOC 2",
        title: "Detection and monitoring procedures to identify vulnerabilities",
        owner: "Security",
        status: "passing",
        lastTest: "23 min ago",
        lastTestMin: 23,
        evidence: 18,
    },
    {
        id: "CC7.2",
        fw: "SOC 2",
        title: "Monitors system components for anomalies",
        owner: "SecOps",
        status: "passing",
        lastTest: "16 min ago",
        lastTestMin: 16,
        evidence: 21,
    },
    {
        id: "CC7.4",
        fw: "SOC 2",
        title: "Implements incident response activities",
        owner: "SecOps",
        status: "review",
        lastTest: "2 hr ago",
        lastTestMin: 120,
        evidence: 5,
    },
    {
        id: "CC8.1",
        fw: "SOC 2",
        title: "Changes to infrastructure tested and approved",
        owner: "Engineering",
        status: "passing",
        lastTest: "1 hr ago",
        lastTestMin: 60,
        evidence: 16,
    },
    {
        id: "A1.1",
        fw: "SOC 2",
        title: "Capacity demand monitoring and forecasting",
        owner: "SRE",
        status: "passing",
        lastTest: "3 hr ago",
        lastTestMin: 180,
        evidence: 13,
    },
    {
        id: "A.5.1",
        fw: "ISO 27001",
        title: "Policies for information security",
        owner: "GRC",
        status: "review",
        lastTest: "1 hr ago",
        lastTestMin: 60,
        evidence: 6,
    },
    {
        id: "A.5.7",
        fw: "ISO 27001",
        title: "Threat intelligence collection and analysis",
        owner: "Security",
        status: "gap",
        lastTest: "Just now",
        lastTestMin: 0,
        evidence: 1,
    },
    {
        id: "A.5.23",
        fw: "ISO 27001",
        title: "Information security for use of cloud services",
        owner: "Engineering",
        status: "passing",
        lastTest: "45 min ago",
        lastTestMin: 45,
        evidence: 19,
    },
    {
        id: "A.6.3",
        fw: "ISO 27001",
        title: "Information security awareness, education, and training",
        owner: "HR",
        status: "passing",
        lastTest: "4 hr ago",
        lastTestMin: 240,
        evidence: 27,
    },
    {
        id: "A.8.3",
        fw: "ISO 27001",
        title: "Information access restriction based on need-to-know",
        owner: "Engineering",
        status: "passing",
        lastTest: "2 hr ago",
        lastTestMin: 120,
        evidence: 14,
    },
    {
        id: "A.8.9",
        fw: "ISO 27001",
        title: "Configuration management for systems and software",
        owner: "Engineering",
        status: "passing",
        lastTest: "1 hr ago",
        lastTestMin: 60,
        evidence: 22,
    },
    {
        id: "A.8.16",
        fw: "ISO 27001",
        title: "Monitoring activities for systems and networks",
        owner: "SecOps",
        status: "review",
        lastTest: "5 hr ago",
        lastTestMin: 300,
        evidence: 9,
    },
    {
        id: "A.8.25",
        fw: "ISO 27001",
        title: "Secure development lifecycle practices",
        owner: "Engineering",
        status: "passing",
        lastTest: "3 hr ago",
        lastTestMin: 180,
        evidence: 17,
    },
    {
        id: "5.1",
        fw: "ISO 42001",
        title: "Leadership commitment for AI management system",
        owner: "Executive",
        status: "passing",
        lastTest: "2 hr ago",
        lastTestMin: 120,
        evidence: 8,
    },
    {
        id: "6.2.4",
        fw: "ISO 42001",
        title: "AI system impact assessment for affected individuals",
        owner: "AI Governance",
        status: "gap",
        lastTest: "Just now",
        lastTestMin: 0,
        evidence: 0,
    },
    {
        id: "7.4",
        fw: "ISO 42001",
        title: "AI system communication with affected stakeholders",
        owner: "AI Governance",
        status: "passing",
        lastTest: "1 hr ago",
        lastTestMin: 60,
        evidence: 5,
    },
    {
        id: "8.2.3",
        fw: "ISO 42001",
        title: "AI system data quality controls and validation",
        owner: "ML Platform",
        status: "review",
        lastTest: "32 min ago",
        lastTestMin: 32,
        evidence: 4,
    },
    {
        id: "8.3",
        fw: "ISO 42001",
        title: "AI system technical documentation requirements",
        owner: "ML Platform",
        status: "gap",
        lastTest: "Just now",
        lastTestMin: 0,
        evidence: 2,
    },
    {
        id: "9.2",
        fw: "ISO 42001",
        title: "Internal AI management system audits",
        owner: "GRC",
        status: "passing",
        lastTest: "6 hr ago",
        lastTestMin: 360,
        evidence: 12,
    },
    {
        id: "GV.OC-01",
        fw: "NIST CSF",
        title: "Organizational mission understood and informs cybersecurity risk management",
        owner: "GRC",
        status: "passing",
        lastTest: "4 hr ago",
        lastTestMin: 240,
        evidence: 11,
    },
    {
        id: "GV.RM-01",
        fw: "NIST CSF",
        title: "Risk management objectives are established and agreed to",
        owner: "GRC",
        status: "passing",
        lastTest: "3 hr ago",
        lastTestMin: 180,
        evidence: 14,
    },
    {
        id: "ID.AM-1",
        fw: "NIST CSF",
        title: "Physical devices and systems within the organization inventoried",
        owner: "IT",
        status: "passing",
        lastTest: "3 hr ago",
        lastTestMin: 180,
        evidence: 22,
    },
    {
        id: "ID.RA-01",
        fw: "NIST CSF",
        title: "Vulnerabilities in assets are identified, validated, and recorded",
        owner: "Security",
        status: "review",
        lastTest: "1 hr ago",
        lastTestMin: 60,
        evidence: 8,
    },
    {
        id: "PR.AA-01",
        fw: "NIST CSF",
        title: "Identities and credentials issued, managed, verified, revoked",
        owner: "Security",
        status: "passing",
        lastTest: "4 hr ago",
        lastTestMin: 240,
        evidence: 31,
    },
    {
        id: "PR.DS-01",
        fw: "NIST CSF",
        title: "Data at rest is protected with encryption",
        owner: "Engineering",
        status: "passing",
        lastTest: "2 hr ago",
        lastTestMin: 120,
        evidence: 19,
    },
    {
        id: "DE.CM-1",
        fw: "NIST CSF",
        title: "The network is monitored to detect potential cybersecurity events",
        owner: "SecOps",
        status: "review",
        lastTest: "5 hr ago",
        lastTestMin: 300,
        evidence: 9,
    },
    {
        id: "DE.AE-02",
        fw: "NIST CSF",
        title: "Potentially adverse events are analyzed",
        owner: "Security",
        status: "passing",
        lastTest: "2 hr ago",
        lastTestMin: 120,
        evidence: 15,
    },
    {
        id: "RS.CO-02",
        fw: "NIST CSF",
        title: "Internal and external stakeholders notified of incidents",
        owner: "SecOps",
        status: "gap",
        lastTest: "Just now",
        lastTestMin: 0,
        evidence: 3,
    },
    {
        id: "RC.RP-01",
        fw: "NIST CSF",
        title: "Recovery plan is executed during or after a cybersecurity incident",
        owner: "SRE",
        status: "passing",
        lastTest: "6 hr ago",
        lastTestMin: 360,
        evidence: 11,
    },
]

// ============ ACTIVITY ============

const NOW = Date.now()
export const ACTIVITY_SEED: Activity[] = [
    {
        id: "s1",
        agent: "Evidence Agent",
        action: "collected 24 SOC 2 controls from",
        target: "Notion, Drive, GitHub",
        status: "complete",
        createdAt: NOW - 12_000,
    },
    {
        id: "s2",
        agent: "Risk Agent",
        action: "assessed 3 new vendors against",
        target: "NIST CSF 2.0",
        status: "complete",
        createdAt: NOW - 78_000,
    },
    {
        id: "s3",
        agent: "Questionnaire Agent",
        action: "answering 142-question SIG Lite from",
        target: "Acme Corp",
        status: "running",
        createdAt: NOW - 88_000,
    },
    {
        id: "s4",
        agent: "Policy Agent",
        action: "updated 2 policies to match",
        target: "ISO 42001 Annex A",
        status: "complete",
        createdAt: NOW - 240_000,
    },
    {
        id: "s5",
        agent: "Remediation Agent",
        action: "drafting prioritized plan for",
        target: "4 control gaps",
        status: "running",
        createdAt: NOW - 32_000,
    },
    {
        id: "s6",
        agent: "Evidence Agent",
        action: "synced quarterly access reviews from",
        target: "Okta, AWS IAM",
        status: "complete",
        createdAt: NOW - 612_000,
    },
]

export const ACTIVITY_POOL: Array<Omit<Activity, "id" | "createdAt">> = [
    {
        agent: "Evidence Agent",
        action: "synced 12 access reviews from",
        target: "Okta",
        status: "complete",
    },
    {
        agent: "Risk Agent",
        action: "rescored 14 vendors after",
        target: "CVE-2024-9842",
        status: "complete",
    },
    {
        agent: "Controls Agent",
        action: "validated quarterly evidence for",
        target: "SOC 2 CC7.2",
        status: "complete",
    },
    {
        agent: "Questionnaire Agent",
        action: "completed CAIQ Lite for",
        target: "Stripe Inc.",
        status: "complete",
    },
    {
        agent: "Policy Agent",
        action: "drafted",
        target: "Incident response policy v2.3",
        status: "complete",
    },
    {
        agent: "Remediation Agent",
        action: "resolved access gap in",
        target: "AWS IAM",
        status: "complete",
    },
    {
        agent: "Evidence Agent",
        action: "collected",
        target: "key rotation logs from KMS",
        status: "complete",
    },
    {
        agent: "Risk Agent",
        action: "completed AI risk assessment for",
        target: "Anthropic API integration",
        status: "running",
    },
    {
        agent: "Controls Agent",
        action: "tested monitoring for",
        target: "ISO 27001 A.8.16",
        status: "complete",
    },
    {
        agent: "Evidence Agent",
        action: "backfilled audit logs from",
        target: "Datadog, Splunk",
        status: "complete",
    },
    {
        agent: "Policy Agent",
        action: "mapped 8 policies to",
        target: "ISO 42001 Annex A",
        status: "complete",
    },
    {
        agent: "Risk Agent",
        action: "flagged elevated risk for",
        target: "Vercel contract renewal",
        status: "running",
    },
]

// ============ AGENT SCRIPTS ============

export const AGENT_SCRIPTS: Record<string, RunStep[]> = {
    "Evidence Agent": [
        {
            label: "Authenticating with source systems",
            at: 2,
            tool: {
                name: "auth.connect",
                params: "sources=['notion','drive','github','okta']",
                result: "✓ 4 sources authenticated",
            },
        },
        {
            label: "Discovering available evidence",
            at: 8,
            tool: {
                name: "connectors.list_evidence",
                params: "since='2026-04-20'",
                result: "47 new items found",
            },
        },
        {
            label: "Fetching evidence in parallel",
            at: 18,
            output: "Streaming from 4 sources, 47 items queued",
        },
        {
            label: "Validating freshness and integrity",
            at: 32,
            tool: {
                name: "validator.check_evidence",
                params: "items=47",
                result: "✓ All items valid · 0 stale · 0 corrupted",
            },
        },
        {
            label: "Mapping to control framework",
            at: 46,
            tool: {
                name: "mapper.match_controls",
                params: "framework='SOC 2 Type II'",
                result: "Mapped 47 → 24 controls",
            },
        },
        {
            label: "Storing in evidence vault",
            at: 58,
            output: 'Vault snapshot v.847 created\n{"items": 47, "controls": 24, "ts": "2026-05-20T14:23:18Z"}',
        },
        {
            label: "Notifying assigned reviewers",
            at: 68,
            tool: {
                name: "notifier.send",
                params: "channel='#grc-review', users=['sarah','marcus']",
            },
        },
        { label: "Run complete", at: 72 },
    ],
    "Risk Agent": [
        {
            label: "Loading vendor inventory",
            at: 2,
            tool: {
                name: "vendor.list",
                params: "tier=['critical','high','medium']",
                result: "127 vendors loaded",
            },
        },
        {
            label: "Querying threat intelligence feeds",
            at: 9,
            tool: {
                name: "threat_intel.search",
                params: "sources=['nvd','cisa','vendor_advisories']",
                result: "12 new advisories matched",
            },
        },
        {
            label: "Cross-referencing affected vendors",
            at: 20,
            output: "14 vendors potentially affected by CVE-2024-9842",
        },
        {
            label: "Recomputing risk scores",
            at: 32,
            tool: {
                name: "risk.recompute",
                params: "vendors=14, weights='enterprise_v3'",
                result: "3 elevated · 2 lowered · 9 unchanged",
            },
        },
        {
            label: "Checking contractual SLAs",
            at: 44,
            output: "All 14 vendors within SLA notification windows",
        },
        {
            label: "Generating risk delta report",
            at: 56,
            tool: {
                name: "report.generate",
                params: "format='pdf', recipients=['ciso','grc-team']",
                result: "✓ risk-delta-2026-05-20.pdf · 14 pages",
            },
        },
        { label: "Run complete", at: 64 },
    ],
    "Questionnaire Agent": [
        {
            label: "Fetching questionnaire from vendor portal",
            at: 3,
            tool: {
                name: "web.fetch",
                params: 'url="acmecorp.com/sig-lite/2026-Q2"',
                result: "✓ 200 OK · 47KB · 142 questions",
            },
        },
        {
            label: "Parsing questionnaire structure",
            at: 14,
            output: '{"sections": 9, "questions": 142, "evidence_required": 38}',
        },
        {
            label: "Loading evidence catalog",
            at: 28,
            tool: {
                name: "evidence.search",
                params: "frameworks=['SOC 2','ISO 27001'], status='current'",
                result: "89 matching evidence items found",
            },
        },
        {
            label: "Drafting answers · Section 1: Access Control",
            at: 48,
            output: "16/16 questions answered · 24 evidence citations",
        },
        {
            label: "Drafting answers · Section 2: Data Security",
            at: 78,
            output: "24/24 questions answered · 31 evidence citations",
        },
        {
            label: "Drafting answers · Section 3: Incident Response",
            at: 120,
            sub: "Currently processing Q3.12 of 18",
            output: 'Q3.7: "Describe your incident classification scheme..."\n→ Generated 280-word response citing CC7.4 + IR Policy v2.1',
        },
        { label: "Drafting answers · Section 4: Vendor Management", at: 175 },
        { label: "Reviewing answers for cross-section consistency", at: 220 },
        { label: "Generating executive summary", at: 240 },
        { label: "Submitting to Sarah Goldberg for human review", at: 254 },
        { label: "Run complete", at: 260 },
    ],
    "Policy Agent": [
        {
            label: "Loading current policy library",
            at: 2,
            tool: {
                name: "policies.list",
                params: "status='active'",
                result: "47 policies loaded",
            },
        },
        {
            label: "Querying framework requirements",
            at: 10,
            tool: {
                name: "framework.get_requirements",
                params: "framework='ISO 42001'",
                result: "87 requirements parsed",
            },
        },
        {
            label: "Identifying policy gaps",
            at: 22,
            output: "2 policies need updates · 0 new policies needed",
        },
        {
            label: "Drafting policy revisions",
            at: 38,
            tool: {
                name: "llm.generate",
                params: "template='ISMS-002', context='ISO 42001 Annex A'",
            },
        },
        {
            label: "Cross-referencing existing policies",
            at: 56,
            output: "No conflicts detected · 4 cross-references updated",
        },
        {
            label: "Saving drafts for human review",
            at: 70,
            output: "AI Governance Policy v3.1 → pending review\nData Retention Policy v2.4 → pending review",
        },
        { label: "Run complete", at: 78 },
    ],
    "Remediation Agent": [
        {
            label: "Analyzing identified control gaps",
            at: 3,
            tool: {
                name: "gaps.list",
                params: "severity=['critical','high']",
                result: "4 gaps identified · 2 critical, 2 high",
            },
        },
        {
            label: "Generating remediation actions",
            at: 14,
            tool: {
                name: "planner.create_plan",
                params: "gaps=4, optimizer='effort_vs_risk'",
            },
        },
        {
            label: "Prioritizing by risk impact",
            at: 26,
            output: "Priority order: 6.2.4 → 8.3 → A.5.7 → RS.CO-02",
        },
        {
            label: "Estimating engineering effort",
            at: 38,
            output: "Total: 21 engineer-days across 3 teams",
        },
        {
            label: "Assigning to teams",
            at: 52,
            tool: {
                name: "linear.create_issue",
                params: "team=['ai-gov','sec','secops'], priority='P1'",
                result: "✓ 4 issues created · LIN-2847 to LIN-2850",
            },
        },
        {
            label: "Drafting Slack notifications",
            at: 66,
            output: "Notifications drafted for #ai-governance, #security, #secops",
        },
        { label: "Awaiting human approval", at: 78 },
        { label: "Run complete", at: 90 },
    ],
    "Controls Agent": [
        {
            label: "Loading control definition",
            at: 1,
            tool: {
                name: "controls.get",
                params: "id='CC7.2'",
                result: "✓ Control loaded · 6 evidence requirements",
            },
        },
        {
            label: "Fetching evidence",
            at: 5,
            tool: {
                name: "evidence.fetch_for_control",
                params: "control='CC7.2'",
                result: "21 evidence items retrieved",
            },
        },
        {
            label: "Running validation checks",
            at: 12,
            output: "Coverage: 6/6 requirements · Recency: ≤ 30d · Quality: high",
        },
        {
            label: "Updating control status",
            at: 18,
            output: "Status: Passing · Last tested: 2026-05-20T14:24:08Z",
        },
        { label: "Run complete", at: 22 },
    ],
    "Director Agent": [
        { label: "Scoping work and identifying agents", at: 2 },
        { label: "Dispatching to specialist agents", at: 8 },
        { label: "Monitoring sub-agent progress", at: 14 },
        { label: "Synthesizing results", at: 24 },
        { label: "Run complete", at: 30 },
    ],
}

export function getScript(activity: Activity): RunStep[] {
    return AGENT_SCRIPTS[activity.agent] ?? AGENT_SCRIPTS["Director Agent"]
}

// ============ DEFAULT EXPORT (preview only) ============

export default function DashboardData() {
    return (
        <div
            style={{
                padding: 28,
                background: "#0A0A0F",
                color: "#FFFFFF",
                font: "400 14px/22px Inter, sans-serif",
                height: "100%",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    font: "600 18px/24px Inter, sans-serif",
                    letterSpacing: "-0.015em",
                    marginBottom: 6,
                }}
            >
                Dashboard Data
            </div>
            <div style={{ color: "rgba(255,255,255,0.68)", marginBottom: 24 }}>
                Types, fixture data, and agent scripts. Import named exports
                from this file.
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 12,
                }}
            >
                <DataStat label="Frameworks" value={FRAMEWORKS.length} />
                <DataStat label="Controls" value={CONTROLS.length} />
                <DataStat
                    label="Activity events"
                    value={ACTIVITY_SEED.length + ACTIVITY_POOL.length}
                />
                <DataStat
                    label="Agent scripts"
                    value={Object.keys(AGENT_SCRIPTS).length}
                />
                <DataStat
                    label="Sections"
                    value={Object.keys(SECTION_LABELS).length}
                />
                <DataStat
                    label="Frameworks indexed"
                    value={Object.keys(SECTION_ORDER).length}
                />
            </div>
        </div>
    )
}

function DataStat({ label, value }: { label: string; value: number }) {
    return (
        <div
            style={{
                padding: 14,
                background: "#14141E",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
            }}
        >
            <div
                style={{
                    font: "500 11px/14px Inter, sans-serif",
                    color: "rgba(255,255,255,0.42)",
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                    marginBottom: 6,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    font: "600 22px/26px Inter, sans-serif",
                    color: "#FFFFFF",
                    letterSpacing: "-0.02em",
                }}
            >
                {value}
            </div>
        </div>
    )
}
