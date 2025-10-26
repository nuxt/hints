import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import { openElementSourceComponent } from './vue-tracer'

let overlay: HTMLDivElement | null = null

// Get the parent window where the actual app is running
function getTargetWindow() {
  try {
    // The devtools client iframe structure is: parent -> devtools iframe -> client iframe
    // We need to access the parent window (the actual app window)
    return window.parent?.parent || window.parent || window
  }
  catch {
    return window
  }
}

function createOverlay() {
  if (overlay)
    return overlay

  const targetWindow = getTargetWindow()
  const targetDocument = targetWindow.document

  overlay = targetDocument.createElement('div')
  overlay.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 999999;
    background: rgba(104, 182, 255, 0.3);
    border: 2px solid rgb(104, 182, 255);
    border-radius: 4px;
    transition: all 0.1s ease;
  `
  targetDocument.body.appendChild(overlay)
  return overlay
}

function removeOverlay() {
  if (overlay) {
    overlay.remove()
    overlay = null
  }
}

export function useElementHighlighter() {
  const client = useDevtoolsClient()

  const highlightElement = (element: HTMLElement | undefined) => {
    if (!element) {
      removeOverlay()
      return
    }

    const targetWindow = getTargetWindow()
    const rect = element.getBoundingClientRect()
    const overlayEl = createOverlay()

    // Account for scroll position in the target window
    overlayEl.style.left = `${rect.left + targetWindow.scrollX}px`
    overlayEl.style.top = `${rect.top + targetWindow.scrollY}px`
    overlayEl.style.width = `${rect.width}px`
    overlayEl.style.height = `${rect.height}px`
    overlayEl.style.display = 'block'
  }

  const clearHighlight = () => {
    if (overlay) {
      overlay.style.display = 'none'
    }
  }

  const inspectElementInEditor = async (element: HTMLElement | undefined) => {
    if (!element)
      return

    const clientValue = client.value
    if (!clientValue)
      return

    // Use devtools inspector to open element in editor
    try {
      // Prefer Nuxt tracer to resolve the component file and open it in editor
      openElementSourceComponent(element)
    }
    catch (error) {
      console.warn('Failed to inspect element:', error)
    }
  }

  return {
    highlightElement,
    clearHighlight,
    inspectElementInEditor,
  }
}
