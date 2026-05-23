// Minimal shim for the `framer` package so the source files can run outside Framer.
// addPropertyControls is a no-op in this sandbox.
export function addPropertyControls(_component: unknown, _controls: unknown) {
    // intentionally empty
}
export const ControlType = new Proxy(
    {},
    { get: () => "string" }
) as Record<string, string>
