import * as React from "react"
import { createRoot } from "react-dom/client"
import ComplianceDashboard from "../../ComplianceDashboard"

// StrictMode intentionally disabled · matches the Framer canvas runtime, which
// doesn't double-invoke effects in dev.
const root = createRoot(document.getElementById("root")!)
root.render(
    <div style={{ width: "100vw", height: "100vh" }}>
        <ComplianceDashboard />
    </div>
)
