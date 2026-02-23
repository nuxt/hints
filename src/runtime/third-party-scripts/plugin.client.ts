import { defineNuxtPlugin, ref, useNuxtApp } from '#imports'
import { defu } from 'defu'
import { logger } from '../logger'

const EXTENSIONS_SCHEMES_RE = /^(chrome-extension|moz-extension|safari-extension|ms-browser-extension):/

function isExtensionScript(src: string) {
  try {
    const url = new URL(src, window.location.origin)
    return EXTENSIONS_SCHEMES_RE.test(url.protocol)
  }
  catch {
    return false
  }
}

function isSameOriginScript(src: string) {
  try {
    const url = new URL(src, window.location.origin)
    return url.origin === window.location.origin
  }
  catch {
    return false
  }
}

function isIgnoredScript(src: string) {
  return isSameOriginScript(src) || isExtensionScript(src)
}

export default defineNuxtPlugin({
  name: 'nuxt-hints:third-party-scripts',
  setup() {
    const nuxtApp = useNuxtApp()

    nuxtApp.payload.__hints = defu(nuxtApp.payload.__hints, {
      thirdPartyScripts: ref<{ element: HTMLScriptElement, loaded: boolean }[]>([]),
    })
    const scripts = nuxtApp.payload.__hints.thirdPartyScripts

    const isUsingNuxtScripts = !!nuxtApp.$scripts

    nuxtApp.hook('hints:scripts:added', (script: HTMLScriptElement) => {
      scripts.value.push({ element: script, loaded: false })
    })

    nuxtApp.hook('hints:scripts:loaded', (script: HTMLScriptElement) => {
      const existingScript = scripts.value.find(s => s.element === script)
      if (existingScript) {
        existingScript.loaded = true
      }
      else {
        logger.warn(`Script loaded event received for a script not tracked: ${script.src}. Please open an issue with a minimal reproduction if you think this is a bug.`)
        scripts.value.push({ element: script, loaded: true })
      }
    })

    nuxtApp.hooks.hookOnce('app:mounted', () => {
      let hasThirdPartyScript = false
      for (const script of document.scripts) {
        if (script.src && !isIgnoredScript(script.src)) {
          hasThirdPartyScript = true
          onScriptAdded(script)
        }
      }
      if (hasThirdPartyScript && !isUsingNuxtScripts) {
        logger.info('Third-party scripts detected on page load: consider using @nuxt/scripts')
      }
    })

    // MutationObserver to catch dynamically added scripts
    const observer = new MutationObserver((mutations: MutationRecord[]) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (isScript(node) && node.src && !isIgnoredScript(node.src)) {
              onScriptAdded(node)
            }
          }
        }
      }
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    function onScriptAdded(script: HTMLScriptElement) {
      if (!script.crossOrigin) {
        logger.warn(`Third-party script "${script.src}" is missing crossorigin attribute. Consider adding crossorigin="anonymous" for better security and error reporting.`)
      }
      nuxtApp.callHook('hints:scripts:added', script)
        .then(() => {
          if (!script.loaded) {
            script.addEventListener('load', () => {
              window.__hints_TPC_saveTime(script, script.__hints_TPC_start_time)
              nuxtApp.callHook('hints:scripts:loaded', script)
            })
          }
          else {
            window.__hints_TPC_saveTime(script, script.__hints_TPC_start_time)

            nuxtApp.callHook('hints:scripts:loaded', script)
          }
        })

      logger.info(`Dynamically added third-party script detected: ${script.src}`)
    }
  },
})

function isScript(node: Node): node is HTMLScriptElement {
  return node.nodeName === 'SCRIPT'
}
