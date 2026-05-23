import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
    plugins: [react()],
    server: {
        fs: {
            // Allow reading the parent directory where the source .tsx files live.
            allow: [path.resolve(__dirname, "..")],
        },
    },
})
