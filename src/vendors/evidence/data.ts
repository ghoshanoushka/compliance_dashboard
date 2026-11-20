// Mock evidence dataset for the Twilio assessment. Models the Evidence
// Collection step: automated search results, identified gaps, vendor outreach
// rounds, and reassessment ingestion.

export type Status = "resolved" | "review" | "pending" | "blocked"

export type EventKind = "ai" | "analyst" | "vendor" | "system"

export interface ThreadEvent {
    id: string
    kind: EventKind
    round: number
    time: string
    body: string
    citation?: { label: string; url: string }
    attachment?: { name: string; meta: string }
}

// A single section of the questionnaire (e.g. Access Control). Sourced from
// one or more pieces of evidence; the rest needs the vendor.
export interface CoverageSection {
    name: string
    filled: number
    total: number
    sources: string[]
}

export interface EvidenceItem {
    id: string
    title: string
    category: "Certification" | "Audit Report" | "Document" | "Questionnaire" | "Insurance"
    status: Status
    round: number
    source: string
    summary: string
    confidence: number | null
    questions?: { total: number; filled: number }
    // For questionnaire-style composites only: per-section fill + source map.
    // Other items are atomic and don't need this.
    coverage?: {
        sources: { label: string; count: number; categories?: string }[]
        sections: CoverageSection[]
    }
    thread: ThreadEvent[]
    // Compressed views of the thread. `latestAnswer` is the bottom-line shown
    // at the top of the drawer. `milestones` are the 3-5 pivotal events worth
    // surfacing as a digest. `roundSummaries[n]` is a one-line synthesis of
    // what happened in round n (used when the full conversation is expanded).
    // `outstanding` is what's still blocking a final answer.
    latestAnswer?: string
    milestones?: { round: number; text: string; tone?: "vendor" | "analyst" | "agent" | "system" }[]
    roundSummaries?: Record<number, string>
    outstanding?: string[]
}

export const VENDOR = {
    name: "Twilio",
    domain: "twilio.com",
    type: "SaaS · Communications API",
    tier: "Tier 3 · Low",
    trustCenter: "twilio.com/en-us/trust-center",
    avgResponseDays: 5,
    priorAssessments: 12,
}

// Summary of completed prior steps in this assessment. Surfaced as click-to-peek
// popovers on the topbar step pills so analysts don't lose context (or scroll
// position) to recall *why* this assessment was scoped and tiered the way it was.
export type StepSummary = {
    completedBy: string
    completedAt: string
    fields: { label: string; value: string }[]
    rationale?: string
}

export const STEP_SUMMARIES: Record<"Intake" | "Risk tiering", StepSummary> = {
    Intake: {
        completedBy: "Maya Lin · Procurement",
        completedAt: "Mar 12, 2025",
        fields: [
            { label: "Requester", value: "Marketing Ops (Sarah Chen)" },
            { label: "Business purpose", value: "Transactional SMS + WhatsApp for order notifications" },
            { label: "Services in scope", value: "Programmable SMS, WhatsApp Business API, Verify" },
            { label: "Data shared", value: "Customer phone numbers, order IDs (no PII beyond contact)" },
            { label: "Expected annual spend", value: "$240K" },
            { label: "Contract type", value: "MSA + Order Form · 3-year term" },
        ],
        rationale: "Existing approved vendor (12 prior assessments). Net-new scope: WhatsApp Business API previously not covered.",
    },
    "Risk tiering": {
        completedBy: "Agent · confirmed by Jane Doe",
        completedAt: "Mar 13, 2025",
        fields: [
            { label: "Assigned tier", value: "Tier 3 · Low" },
            { label: "Data classification", value: "Confidential (contact data only, no PHI / PCI)" },
            { label: "Business criticality", value: "Moderate · revenue-adjacent, degradation tolerable < 4h" },
            { label: "Regulatory scope", value: "GDPR, CCPA, TCPA" },
            { label: "Inherent risk score", value: "42 / 100" },
        ],
        rationale: "Tiered 3 because data scope is limited to contact identifiers and Twilio is a public, SOC 2-audited platform. Tier 1/2 thresholds (PHI handling, > $1M spend, customer-facing critical path) not met.",
    },
}

export type Variant = "success" | "warning" | "info" | "destructive" | "primary"

export const STATUS_META: Record<Status, { label: string; variant: Variant; icon: string; group: string; groupHint: string }> = {
    review: { label: "Needs review", variant: "info", icon: "eye", group: "New from vendor", groupHint: "Vendor responded · awaiting your review" },
    pending: { label: "Awaiting vendor", variant: "warning", icon: "clock", group: "Open gaps", groupHint: "Requested · waiting on Twilio" },
    blocked: { label: "Action required", variant: "destructive", icon: "lock", group: "Open gaps", groupHint: "Requested · waiting on Twilio" },
    resolved: { label: "Verified", variant: "success", icon: "circle-check", group: "Collected", groupHint: "Found, ingested, and verified" },
}

// Display order of status groups in the board.
export const GROUP_ORDER = ["New from vendor", "Open gaps", "Collected"] as const

// Agentic collection pipeline stages · how the evidence was sourced. These are
// the primary grouping of the board; status is used as a filter within them.
export type CollectionStage = "external-scan" | "trust-center" | "registry-screening" | "questionnaire"

export const COLLECTION_STAGES: { id: CollectionStage; name: string; desc: string; icon: string; elapsed: string; note?: string }[] = [
    { id: "external-scan", name: "External security scan", desc: "BitSight, SecurityScorecard, and Shodan scans", icon: "world-search", elapsed: "2s" },
    { id: "trust-center", name: "Trust center discovery", desc: "Public trust center, certifications, and compliance docs", icon: "certificate", elapsed: "2s" },
    { id: "registry-screening", name: "Public registry & screening", desc: "SEC EDGAR, sanctions, adverse media, incident history", icon: "scale", elapsed: "2s", note: "Clear · 1 historical incident (remediated)" },
    { id: "questionnaire", name: "Pre-filling questionnaire", desc: "Mapping evidence to controls and auto-filling answers", icon: "list-check", elapsed: "3s" },
]

// Which collection stage each evidence item belongs to.
export const STAGE_OF: Record<string, CollectionStage> = {
    bitsight: "external-scan",
    securityscorecard: "external-scan",
    soc2: "trust-center",
    iso: "trust-center",
    pci: "trust-center",
    subproc: "trust-center",
    hipaa: "trust-center",
    pentest: "trust-center",
    bcdr: "trust-center",
    cyberins: "trust-center",
    vulnscan: "trust-center",
    screening: "registry-screening",
    questionnaire: "questionnaire",
}

export const ITEMS: EvidenceItem[] = [
    {
        id: "soc2",
        title: "SOC 2 Type II",
        category: "Audit Report",
        status: "resolved",
        round: 0,
        source: "Trust Center",
        summary: "Bridge Letter covering Oct–Dec 2024. Clean opinion, no exceptions.",
        confidence: 98,
        latestAnswer: "Verified. Schellman-audited SOC 2 Type II bridge letter (Oct–Dec 2024) with an unqualified opinion and no exceptions. Mapped 64 of 186 questionnaire controls directly from this report.",
        thread: [
            { id: "soc2-1", kind: "system", round: 0, time: "2d ago", body: "Automated search started across trust center, SEC filings, and public registries." },
            { id: "soc2-2", kind: "ai", round: 0, time: "2d ago", body: "Located SOC 2 Type II report on Twilio's trust center. Auditor: Schellman. Period: Oct 1 – Dec 31, 2024 (bridge letter). Opinion is unqualified with no exceptions noted.", citation: { label: "twilio.com/trust-center", url: "#" }, attachment: { name: "Twilio_SOC2_TypeII_BridgeLetter.pdf", meta: "PDF · 2.4 MB · 48 pages" } },
            { id: "soc2-3", kind: "ai", round: 0, time: "2d ago", body: "Mapped 64 of 186 questionnaire controls directly from this report. Trust Services Criteria covered: Security, Availability, Confidentiality." },
            { id: "soc2-4", kind: "analyst", round: 0, time: "2d ago", body: "Verified period covers our assessment window. Accepting as primary control evidence." },
        ],
    },
    {
        id: "iso",
        title: "ISO 27001 Certificate",
        category: "Certification",
        status: "resolved",
        round: 0,
        source: "Trust Center · BSI",
        summary: "Issued by BSI. Valid through 2026. Scope covers core platform.",
        confidence: 97,
        latestAnswer: "Verified. BSI-issued ISO 27001 certificate, valid through March 2026, scope covers the core messaging platform. Cross-checked against BSI's public registry, active.",
        thread: [
            { id: "iso-1", kind: "ai", round: 0, time: "2d ago", body: "Found ISO 27001 certificate issued by BSI. Certificate valid through March 2026. Cross-checked certificate number against the BSI public verification registry, confirmed active.", citation: { label: "BSI verified registry", url: "#" }, attachment: { name: "Twilio_ISO27001_BSI.pdf", meta: "PDF · 1.1 MB" } },
            { id: "iso-2", kind: "analyst", round: 0, time: "2d ago", body: "Scope statement covers the messaging platform. Accepted." },
        ],
    },
    {
        id: "pci",
        title: "PCI DSS AOC",
        category: "Certification",
        status: "resolved",
        round: 0,
        source: "Trust Center",
        summary: "Attestation of Compliance, Level 1 Service Provider.",
        confidence: 95,
        latestAnswer: "Verified. Twilio is a PCI DSS Level 1 Service Provider with a current Attestation of Compliance dated within the last 12 months.",
        thread: [
            { id: "pci-1", kind: "ai", round: 0, time: "2d ago", body: "Retrieved PCI DSS Attestation of Compliance. Twilio is a Level 1 Service Provider. AOC dated within the last 12 months.", citation: { label: "twilio.com/trust-center", url: "#" }, attachment: { name: "Twilio_PCI_AOC.pdf", meta: "PDF · 880 KB" } },
        ],
    },
    {
        id: "subproc",
        title: "Sub-processor List",
        category: "Document",
        status: "resolved",
        round: 0,
        source: "Trust Center",
        summary: "AWS, GCP, and Salesforce named as primary sub-processors.",
        confidence: 92,
        latestAnswer: "Verified. Primary sub-processors: AWS (us-east, eu-west), Google Cloud, Salesforce. AWS concentration risk noted but acceptable for Tier 3.",
        thread: [
            { id: "subproc-1", kind: "ai", round: 0, time: "2d ago", body: "Parsed the public sub-processor list. Primary infrastructure sub-processors: AWS (us-east, eu-west), Google Cloud, Salesforce. Concentration risk flagged: AWS hosts the majority of workloads.", citation: { label: "twilio.com/trust-center", url: "#" } },
            { id: "subproc-2", kind: "analyst", round: 0, time: "1d ago", body: "Noted AWS concentration. Acceptable for Tier 3." },
        ],
    },
    {
        id: "hipaa",
        title: "HIPAA BAA Template",
        category: "Document",
        status: "review",
        round: 7,
        source: "Vendor · Round 7",
        summary: "Vendor sent executed BAA template. Liability cap clause needs review.",
        confidence: 88,
        latestAnswer: "Twilio's final BAA offer: $5M aggregate cap (up from 12 months of fees) with carve-outs for willful breach and PHI loss. Still below your $10M standard, but aligned with their cap for all Tier 3 customers. Recommend analyst decision: accept with risk acceptance memo, or escalate to Legal.",
        outstanding: [
            "Do we accept the $5M cap with a documented risk acceptance, or escalate?",
            "Legal's prior guidance on sub-$10M caps for Tier 3 vendors",
        ],
        milestones: [
            { round: 1, text: "Vendor sent standard BAA template with 12-month fee cap", tone: "vendor" },
            { round: 2, text: "You requested $10M aggregate cap aligned with internal standard", tone: "analyst" },
            { round: 3, text: "Twilio Legal countered: $2M cap is their published max for Tier 3", tone: "vendor" },
            { round: 5, text: "Escalated to Twilio Director of Compliance via account team", tone: "analyst" },
            { round: 6, text: "Twilio offered $5M with PHI-loss and willful-breach carve-outs", tone: "vendor" },
            { round: 7, text: "Final terms received in revised BAA v6, awaiting your decision", tone: "vendor" },
        ],
        roundSummaries: {
            0: "Discovered via trust center, no executable template publicly available.",
            1: "Vendor responded with standard BAA template (12-month fee cap).",
            2: "Analyst pushed back on cap; cited internal $10M Tier 3 standard.",
            3: "Vendor declined; published Tier 3 cap is $2M with no negotiation.",
            4: "Analyst requested justification and exception path.",
            5: "Escalated to Twilio Director of Compliance via account team.",
            6: "Vendor returned with $5M offer + carve-outs for willful breach / PHI loss.",
            7: "Final BAA v6 received with revised terms, awaiting analyst decision.",
        },
        thread: [
            { id: "hipaa-1", kind: "ai", round: 0, time: "8d ago", body: "Only a marketing reference to HIPAA support was found on the trust center, no executable BAA template available publicly. Adding to follow-up bundle." },
            { id: "hipaa-2", kind: "system", round: 1, time: "7d ago", body: "Follow-up request sent to Twilio (Round 1). Item: HIPAA BAA template." },
            { id: "hipaa-3", kind: "vendor", round: 1, time: "6d ago", body: "Twilio Security (trust@twilio.com) responded and attached the standard executed BAA template.", attachment: { name: "Twilio_BAA_Template_v1.pdf", meta: "PDF · 320 KB · received Round 1" } },
            { id: "hipaa-4", kind: "ai", round: 1, time: "6d ago", body: "Ingested the BAA. Covers breach notification (60-day) and PHI handling. Flag: liability cap set at 12 months of fees (~$240K), which is below your $10M standard. Recommend pushing back." },
            { id: "hipaa-5", kind: "analyst", round: 2, time: "6d ago", body: "Drafted response asking Twilio to raise cap to $10M aggregate, aligned with our standard for Tier 3 SaaS vendors handling regulated data." },
            { id: "hipaa-6", kind: "system", round: 2, time: "6d ago", body: "Counter-proposal sent (Round 2)." },
            { id: "hipaa-7", kind: "vendor", round: 3, time: "5d ago", body: "Twilio Legal (legal@twilio.com): 'Our published maximum aggregate liability for Tier 3 service is $2M. This is non-negotiable per our standard contracting policy. We're happy to proceed at $2M or you can escalate via your account team.'" },
            { id: "hipaa-8", kind: "ai", round: 3, time: "5d ago", body: "Twilio cited a published policy ceiling, which means Round 2 ask was unrealistic. Suggested path: ask for justification on the $2M figure and request an exception process if one exists." },
            { id: "hipaa-9", kind: "analyst", round: 4, time: "5d ago", body: "Asked Twilio to share rationale for the $2M cap and whether enterprise customers have negotiated exceptions." },
            { id: "hipaa-10", kind: "system", round: 4, time: "5d ago", body: "Clarification request sent (Round 4)." },
            { id: "hipaa-11", kind: "vendor", round: 4, time: "4d ago", body: "Twilio: '$2M is based on actuarial modeling of average customer exposure in Tier 3. Exceptions require Director of Compliance approval and are typically granted only for healthcare customers handling PHI at volume. Your use case is contact data only, so an exception is unlikely.'" },
            { id: "hipaa-12", kind: "analyst", round: 5, time: "4d ago", body: "Looped in Twilio account exec (Sarah Marquez) and asked her to route this to the Director of Compliance directly. Provided context on our annual spend trajectory and renewal value." },
            { id: "hipaa-13", kind: "system", round: 5, time: "4d ago", body: "Escalation routed via account team (Round 5)." },
            { id: "hipaa-14", kind: "vendor", round: 5, time: "3d ago", body: "Sarah Marquez (account exec): 'I've raised this internally. Director of Compliance will review this week. I'll get back to you Friday.'" },
            { id: "hipaa-15", kind: "vendor", round: 6, time: "2d ago", body: "Twilio Director of Compliance: 'We can offer $5M aggregate cap as a one-time exception, with carve-outs for willful breach, gross negligence, and any PHI-related breach. This is our best and final offer.'" },
            { id: "hipaa-16", kind: "ai", round: 6, time: "2d ago", body: "Significant movement: $5M is 2.5x the standard. Carve-outs are favorable, willful breach and gross negligence are common exception triggers, and PHI carve-out is unlimited. Still 50% of your $10M standard. Recommend assessing risk-adjusted exposure before deciding." },
            { id: "hipaa-17", kind: "analyst", round: 6, time: "2d ago", body: "Asked Twilio to send revised BAA reflecting the new terms." },
            { id: "hipaa-18", kind: "vendor", round: 7, time: "5h ago", body: "Twilio Legal: 'Attached, please find the revised Business Associate Agreement (v6) reflecting the agreed exception. Please countersign within 14 days.'", attachment: { name: "Twilio_BAA_Template_v6_FINAL.pdf", meta: "PDF · 340 KB · received Round 7" } },
            { id: "hipaa-19", kind: "ai", round: 7, time: "4h ago", body: "Reviewed v6. Confirmed: $5M aggregate cap, willful breach carve-out, gross negligence carve-out, PHI breach carve-out (uncapped). All other terms (60-day breach notification, PHI handling, sub-processor obligations) unchanged from v1. This is the final negotiated state, awaiting your decision to accept or escalate to Legal." },
        ],
    },
    {
        id: "pentest",
        title: "Penetration Test Report",
        category: "Audit Report",
        status: "blocked",
        round: 1,
        source: "Trust Center · NDA-gated",
        summary: "Available behind a mutual NDA. Access request pending signature.",
        confidence: null,
        latestAnswer: "Blocked on a mutual NDA. Twilio's DocuSign envelope is sitting in your authorized signer's queue, once signed, the report releases in 1–2 business days.",
        outstanding: ["Authorized signer to execute the NDA in DocuSign"],
        thread: [
            { id: "pentest-1", kind: "ai", round: 0, time: "2d ago", body: "A penetration test summary exists on the trust center but is gated behind a mutual NDA. Could not retrieve automatically." },
            { id: "pentest-2", kind: "ai", round: 0, time: "2d ago", body: "Drafted access path: request via trust center → sign mutual NDA in DocuSign → report released in 1–2 business days." },
            { id: "pentest-3", kind: "system", round: 1, time: "1d ago", body: "NDA access request sent (Round 1). Awaiting Twilio counter-signature." },
            { id: "pentest-4", kind: "vendor", round: 1, time: "6h ago", body: "DocuSign envelope received from Twilio Legal. Mutual NDA awaiting your authorized signer." },
        ],
    },
    {
        id: "bcdr",
        title: "BC/DR Test Report",
        category: "Audit Report",
        status: "pending",
        round: 1,
        source: "Gap · requested",
        summary: "BCP referenced in SOC 2 but no standalone DR test evidence found.",
        confidence: null,
        latestAnswer: "Requested from Twilio in Round 1. Awaiting their DR test results (RTO/RPO measurements). Vendor avg. turnaround: 5 days.",
        outstanding: ["Latest DR test results with RTO / RPO measurements"],
        thread: [
            { id: "bcdr-1", kind: "ai", round: 0, time: "2d ago", body: "SOC 2 references a Business Continuity Plan, but no standalone Disaster Recovery test report or RTO/RPO results were found in any public source." },
            { id: "bcdr-2", kind: "analyst", round: 0, time: "1d ago", body: "We need the most recent DR test results. Adding to the follow-up bundle." },
            { id: "bcdr-3", kind: "system", round: 1, time: "1d ago", body: "Request sent to Twilio (Round 1). Awaiting response. Vendor avg. turnaround: 5 days." },
        ],
    },
    {
        id: "vulnscan",
        title: "Vulnerability Scan Results",
        category: "Audit Report",
        status: "pending",
        round: 2,
        source: "Gap · Round 2",
        summary: "Round 1 reply lacked severity breakdown. Re-requested with specifics.",
        confidence: null,
        latestAnswer: "Round 1 reply was a policy statement, not evidence. Re-requested with specifics (scan date, tool, critical/high severity counts, remediation SLAs). Awaiting Round 2 response.",
        outstanding: ["Latest scan summary with severity breakdown", "Remediation SLAs for critical / high findings"],
        thread: [
            { id: "vuln-1", kind: "ai", round: 0, time: "2d ago", body: "SOC 2 references quarterly vulnerability scans, but no standalone scan report was provided." },
            { id: "vuln-2", kind: "system", round: 1, time: "1d ago", body: "Request sent (Round 1)." },
            { id: "vuln-3", kind: "vendor", round: 1, time: "10h ago", body: "Twilio replied: 'We run quarterly scans via a third party and remediate per policy.' No artifact attached." },
            { id: "vuln-4", kind: "ai", round: 1, time: "9h ago", body: "Response is a policy statement, not evidence. Missing: scan date, tool, and critical/high severity counts. Recommend re-requesting with specifics." },
            { id: "vuln-5", kind: "analyst", round: 2, time: "8h ago", body: "Agreed. Re-requested the latest scan summary with severity breakdown and remediation SLAs." },
            { id: "vuln-6", kind: "system", round: 2, time: "8h ago", body: "Follow-up sent (Round 2). Awaiting Twilio response." },
        ],
    },
    {
        id: "cyberins",
        title: "Cyber Insurance Certificate",
        category: "Insurance",
        status: "pending",
        round: 1,
        source: "Gap · requested",
        summary: "Not available on trust center or SEC filings. Requested from vendor.",
        confidence: null,
        latestAnswer: "Not publicly available. Requested certificate of insurance directly from Twilio in Round 1. Awaiting their reply.",
        outstanding: ["Cyber liability certificate confirming minimum coverage limits"],
        thread: [
            { id: "cyber-1", kind: "ai", round: 0, time: "2d ago", body: "No cyber liability insurance certificate found on the trust center or in SEC filings. Required to confirm minimum coverage limits." },
            { id: "cyber-2", kind: "system", round: 1, time: "1d ago", body: "Request sent to Twilio (Round 1). Awaiting certificate of insurance." },
        ],
    },
    {
        id: "questionnaire",
        title: "Security Questionnaire (SIG)",
        category: "Questionnaire",
        status: "review",
        round: 1,
        source: "Auto-filled + Round 1",
        summary: "186 questions · 142 auto-filled from evidence. 44 sent to Twilio.",
        confidence: 76,
        questions: { total: 186, filled: 142 },
        latestAnswer: "Now 93% complete (173 of 186). Twilio answered 31 of 44 open questions in Round 1. 13 remain, mostly key rotation cadence and sub-processor audit rights. Review new answers before drafting Round 2.",
        outstanding: ["13 open questions on key rotation cadence and sub-processor audit rights"],
        coverage: {
            sources: [
                { label: "SOC 2 Type II", count: 89, categories: "Access Control, Data Protection, Incident Response" },
                { label: "Trust center docs", count: 31, categories: "Encryption, BCP, Network Security" },
                { label: "External scans", count: 22, categories: "Vulnerability Mgmt, Infrastructure" },
            ],
            sections: [
                { name: "Access Control", filled: 20, total: 24, sources: ["SOC 2"] },
                { name: "Data Protection", filled: 19, total: 22, sources: ["SOC 2", "ISO 27001"] },
                { name: "Incident Response", filled: 14, total: 18, sources: ["SOC 2"] },
                { name: "Business Continuity", filled: 10, total: 16, sources: ["SOC 2 (referenced)"] },
                { name: "Network Security", filled: 18, total: 20, sources: ["Trust center", "BitSight"] },
                { name: "Vulnerability Mgmt", filled: 16, total: 18, sources: ["External scans", "SecurityScorecard"] },
                { name: "HR Security", filled: 6, total: 14, sources: ["Trust center (partial)"] },
                { name: "Vendor Management", filled: 10, total: 12, sources: ["Sub-processor list"] },
                { name: "Physical Security", filled: 4, total: 10, sources: ["SOC 2 (referenced)"] },
                { name: "Change Management", filled: 13, total: 16, sources: ["SOC 2"] },
                { name: "Compliance", filled: 12, total: 16, sources: ["ISO 27001", "PCI AOC"] },
            ],
        },
        thread: [
            { id: "q-1", kind: "ai", round: 0, time: "2d ago", body: "Mapped collected evidence to the SIG questionnaire. Auto-filled 142 of 186 questions (76%) from the SOC 2, ISO 27001, PCI AOC, and external scans. Each answer is linked to its source artifact." },
            { id: "q-2", kind: "ai", round: 0, time: "2d ago", body: "44 questions could not be answered from evidence, mostly access management specifics, encryption key rotation, and incident response timelines. Bundled for the vendor." },
            { id: "q-3", kind: "system", round: 1, time: "1d ago", body: "44-question follow-up sent to Twilio (Round 1)." },
            { id: "q-4", kind: "vendor", round: 1, time: "5h ago", body: "Twilio returned answers for 31 of 44 questions. 13 remain unanswered (key rotation cadence, sub-processor audit rights)." },
            { id: "q-5", kind: "ai", round: 1, time: "5h ago", body: "Ingested 31 answers; questionnaire now 93% complete (173/186). 13 open questions are candidates for Round 2. Review the new answers before I draft the next round." },
        ],
    },
    {
        id: "bitsight",
        title: "BitSight Security Rating",
        category: "Audit Report",
        status: "resolved",
        round: 0,
        source: "External scan",
        summary: "Rating 780 (Advanced). No critical findings in the last 90 days.",
        confidence: 94,
        latestAnswer: "Verified. BitSight rating 780 (Advanced tier), no critical or high findings in the trailing 90 days. Patching cadence and TLS config rated strong.",
        thread: [
            { id: "bit-1", kind: "system", round: 0, time: "2d ago", body: "Pulled external posture from BitSight, SecurityScorecard, and Shodan." },
            { id: "bit-2", kind: "ai", round: 0, time: "2d ago", body: "BitSight rating 780 (Advanced tier). No critical or high findings in the trailing 90 days. Patching cadence and TLS config rated strong.", citation: { label: "BitSight report", url: "#" } },
        ],
    },
    {
        id: "securityscorecard",
        title: "SecurityScorecard",
        category: "Audit Report",
        status: "resolved",
        round: 0,
        source: "External scan",
        summary: "Overall grade A. One informational finding on a legacy subdomain.",
        confidence: 91,
        latestAnswer: "Verified. SecurityScorecard overall grade A. One informational finding (a legacy subdomain with an expiring certificate). No exploitable exposure found via Shodan.",
        thread: [
            { id: "ss-1", kind: "ai", round: 0, time: "2d ago", body: "SecurityScorecard overall grade A. One informational finding: a legacy subdomain with an expiring certificate. No exploitable exposure found via Shodan.", citation: { label: "SecurityScorecard", url: "#" } },
        ],
    },
    {
        id: "screening",
        title: "Registry & sanctions screening",
        category: "Document",
        status: "resolved",
        round: 0,
        source: "SEC EDGAR · OFAC · media",
        summary: "Clear across sanctions and adverse media. 1 historical 2022 incident, remediated.",
        confidence: 96,
        latestAnswer: "Clear. No sanctions hits or adverse media. One historical 2022 social-engineering incident surfaced, Twilio's public disclosures confirm remediation and customer notification.",
        thread: [
            { id: "scr-1", kind: "ai", round: 0, time: "2d ago", body: "Screened SEC EDGAR filings, OFAC and global sanctions lists, and adverse media. No sanctions hits. Twilio is publicly traded (NYSE: TWLO), filings current.", citation: { label: "SEC EDGAR", url: "#" } },
            { id: "scr-2", kind: "ai", round: 0, time: "2d ago", body: "One historical incident surfaced (2022 social-engineering breach). Public disclosures confirm remediation and customer notification. No open regulatory actions." },
            { id: "scr-3", kind: "analyst", round: 0, time: "1d ago", body: "Reviewed the 2022 incident write-up. Remediation acceptable for Tier 3. Cleared." },
        ],
    },
]
