import { defineNuxtPlugin, ref, useNuxtApp } from '#imports'

export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp()

  const scripts = nuxtApp.__hints_tpc = ref<{ element: HTMLScriptElement, loaded: boolean }[]>([])

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
      console.warn(`[@nuxt/hints]: Script loaded event received for a script not tracked: ${script.src}. Please open an issue with a minimal reproduction if you think this is a bug.`)
      scripts.value.push({ element: script, loaded: true })
    }
  })

  nuxtApp.hooks.hookOnce('app:mounted', () => {
    let hasThirdPartyScript = false
    for (const script of document.scripts) {
      if (script.src && !script.src.startsWith(window.location.origin)) {
        hasThirdPartyScript = true
        onScriptAdded(script)
      }
    }
    if (hasThirdPartyScript && !isUsingNuxtScripts) {
      console.info('ℹ️ [@nuxt/hints]: Third-party scripts detected on page load: consider using @nuxt/scripts')
    }
  })

  // MutationObserver to catch dynamically added scripts
  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (isScript(node) && node.src && !node.src.startsWith(window.location.origin)) {
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
    if (script.src.startsWith('chrome-extension')) {
      return
    }
    if (!script.crossOrigin) {
      console.warn(`[@nuxt/hints]: Third-party script "${script.src}" is missing crossorigin attribute. Consider adding crossorigin="anonymous" for better security and error reporting.`)
    }
    nuxtApp.callHook('hints:scripts:added', script)
      .then(() => {
        if (!script.loaded) {
          script.onload = () => {
            window.__hints_TPC_saveTime(script, script.__hints_TPC_start_time)
            nuxtApp.callHook('hints:scripts:loaded', script)
          }
        }
        else {
          window.__hints_TPC_saveTime(script, script.__hints_TPC_start_time)

          nuxtApp.callHook('hints:scripts:loaded', script)
        }
      })

    console.info(`ℹ️ [@nuxt/hints]: Dynamically added third-party script detected: ${script.src}`)
  }
})

function isScript(node: Node): node is HTMLScriptElement {
  return node.nodeName === 'SCRIPT'
}
