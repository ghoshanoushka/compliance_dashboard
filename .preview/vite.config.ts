import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

// Map Framer URL imports to local copies via source rewriting.
const FRAMER_URL_MAP: Record<string, string> = {
    "https://framer.com/m/DashboardLib-1-xD05ae.js":
        path.resolve(__dirname, "../DashboardLib_1.tsx"),
    "https://framer.com/m/DashboardData-6dyjDj.js":
        path.resolve(__dirname, "../DashboardData.tsx"),
    "https://framer.com/m/AddControlModal-PLACEHOLDER.js":
        path.resolve(__dirname, "../AddControlModal.tsx"),
    "https://framer.com/m/ExportModal-PLACEHOLDER.js":
        path.resolve(__dirname, "../ExportModal.tsx"),
    "https://framer.com/m/SettingsModal-PLACEHOLDER.js":
        path.resolve(__dirname, "../SettingsModal.tsx"),
    "https://framer.com/m/TrustCenterModal-PLACEHOLDER.js":
        path.resolve(__dirname, "../TrustCenterModal.tsx"),
    "https://framer.com/m/ControlDetailPanel-PLACEHOLDER.js":
        path.resolve(__dirname, "../ControlDetailPanel.tsx"),
    "https://framer.com/m/AgentChat-PLACEHOLDER.js":
        path.resolve(__dirname, "../AgentChat.tsx"),
}

export default defineConfig({
    plugins: [
        {
            name: "framer-url-rewrite",
            enforce: "pre",
            transform(code, id) {
                if (!id.endsWith(".tsx") && !id.endsWith(".ts")) return null
                let out = code
                let changed = false
                for (const [url, local] of Object.entries(FRAMER_URL_MAP)) {
                    if (out.includes(url)) {
                        out = out.split(url).join(local)
                        changed = true
                    }
                }
                return changed ? { code: out, map: null } : null
            },
        },
        react(),
    ],
    resolve: {
        alias: {
            framer: path.resolve(__dirname, "src/framer-shim.ts"),
        },
    },
    server: {
        fs: {
            // Allow reading the parent directory where the source .tsx files live.
            allow: [path.resolve(__dirname, "..")],
        },
    },
})
