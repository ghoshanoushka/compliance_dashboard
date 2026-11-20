/** @type {import('tailwindcss').Config} */
export default {
    // The dashboard root carries .theme-light / .theme-dark; key dark: variants
    // off that instead of <html>.
    darkMode: ["class", ".theme-dark"],
    // Preflight is off so Tailwind never restyles the inline-styled dashboard.
    // The vendor workspace gets a scoped reset in index.css instead.
    corePlugins: { preflight: false },
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        container: { center: true, padding: "2rem" },
        extend: {
            fontFamily: {
                sans: ["Inter var", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
                serif: ["Newsreader", "Iowan Old Style", "Georgia", "serif"],
                mono: ["JetBrains Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                cta: {
                    DEFAULT: "hsl(var(--cta))",
                    foreground: "hsl(var(--cta-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                success: {
                    DEFAULT: "hsl(var(--success))",
                    foreground: "hsl(var(--success-foreground))",
                },
                warning: {
                    DEFAULT: "hsl(var(--warning))",
                    foreground: "hsl(var(--warning-foreground))",
                },
                info: {
                    DEFAULT: "hsl(var(--info))",
                    foreground: "hsl(var(--info-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "slide-in-right": {
                    from: { transform: "translateX(24px)", opacity: "0" },
                    to: { transform: "translateX(0)", opacity: "1" },
                },
                "fade-in": {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
            },
            animation: {
                "slide-in-right": "slide-in-right 0.26s cubic-bezier(.16,1,.3,1)",
                "fade-in": "fade-in 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
