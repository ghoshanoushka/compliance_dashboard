import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

// `base` is set for production builds so GitHub Pages serves assets from the
// repo's subpath. Dev mode keeps `/` so localhost URLs stay simple.
export default defineConfig(({ command }) => ({
    base: command === "build" ? "/compliance_dashboard/" : "/",
    plugins: [react()],
    server: {
        fs: {
            // Allow reading the parent directory where the source .tsx files live.
            allow: [path.resolve(__dirname, "..")],
        },
    },
}))
