import { useEffect, useRef, type RefObject } from "react"

// A small "that worked" moment for primary actions: the element pops, a
// ring ripples out from its edge, and a few particles scatter. Plain DOM so
// both the inline-styled dashboard and the Tailwind workspace can use it.
// Styles live in index.css (.zwin-*). Honors prefers-reduced-motion.

const PARTICLES = 14

export function celebrate(el: HTMLElement | null) {
    if (!el) return
    el.classList.remove("zwin-pop")
    void el.offsetWidth // restart the animation if it's already applied
    el.classList.add("zwin-pop")
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

    const r = el.getBoundingClientRect()
    const host = document.createElement("div")
    host.className = "zwin-burst"
    host.setAttribute("aria-hidden", "true")
    host.style.left = `${r.left + r.width / 2}px`
    host.style.top = `${r.top + r.height / 2}px`
    host.style.setProperty("--w", `${r.width}px`)
    host.style.setProperty("--h", `${r.height}px`)
    host.style.setProperty("--radius", getComputedStyle(el).borderRadius || "8px")

    const ring = document.createElement("span")
    ring.className = "zwin-ring"
    host.appendChild(ring)

    const reach = Math.min(Math.max(r.width, r.height) / 2 + 22, 120)
    for (let i = 0; i < PARTICLES; i++) {
        const p = document.createElement("span")
        p.className = i % 3 === 0 ? "zwin-p zwin-p-dash" : "zwin-p"
        const angle = (360 / PARTICLES) * i + (Math.random() * 16 - 8)
        p.style.setProperty("--a", `${angle}deg`)
        p.style.setProperty("--d", `${reach * (0.75 + Math.random() * 0.4)}px`)
        p.style.animationDelay = `${Math.random() * 60}ms`
        host.appendChild(p)
    }
    document.body.appendChild(host)
    window.setTimeout(() => host.remove(), 950)
}

// Fires celebrate() on the ref'd element when `busy` flips true → false and
// the outcome was a success (e.g. a control test that came back passing).
export function useWinOnFinish(busy: boolean, succeeded: boolean, ref: RefObject<HTMLElement>) {
    const wasBusy = useRef(busy)
    useEffect(() => {
        if (wasBusy.current && !busy && succeeded) celebrate(ref.current)
        wasBusy.current = busy
    }, [busy, succeeded, ref])
}
