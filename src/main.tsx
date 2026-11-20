import { createRoot } from "react-dom/client"
import ComplianceDashboard from "./dashboard/ComplianceDashboard"
import "./index.css"

// StrictMode is off so effects run once in dev, the same as in production.
const root = createRoot(document.getElementById("root")!)
root.render(
    <div style={{ width: "100vw", height: "100vh" }}>
        <ComplianceDashboard />
    </div>
)
