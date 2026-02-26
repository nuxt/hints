export function useHintsConfig() {
    const hostNuxt = useHostNuxt()

    return hostNuxt.hints.config
}
