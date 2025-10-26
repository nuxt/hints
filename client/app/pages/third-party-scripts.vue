<template>
  <div
    class="p-4 space-y-4"
  >
    <div
      class="grid gap-3 md:grid-cols-5 grid-cols-2"
    >
      <n-card p-3>
        <div
          class="text-xs text-gray-500"
        >
          3rd-party scripts
        </div>
        <div
          class="text-2xl font-bold"
        >
          {{ total }}
        </div>
      </n-card>
      <n-card p-3>
        <div
          class="text-xs text-gray-500"
        >
          Loaded
        </div>
        <div
          class="text-2xl font-bold"
        >
          {{ loaded }}
        </div>
      </n-card>
      <n-card p-3>
        <div
          class="text-xs text-gray-500"
        >
          Slow network (>{{ thresholds.network }}ms)
        </div>
        <div
          class="text-2xl font-bold text-yellow-600"
        >
          {{ slowNetwork }}
        </div>
      </n-card>
      <n-card p-3>
        <div
          class="text-xs text-gray-500"
        >
          Long parse (>{{ thresholds.parse }}ms)
        </div>
        <div
          class="text-2xl font-bold text-orange-600"
        >
          {{ slowParse }}
        </div>
      </n-card>
      <n-card p-3>
        <div
          class="text-xs text-gray-500"
        >
          Render-blocking
        </div>
        <div
          class="text-2xl font-bold text-red-600"
        >
          {{ renderBlockingCount }}
        </div>
      </n-card>
    </div>

    <n-tip
      v-if="total > 0 && !isUsingNuxtScripts"
      n="yellow6"
    >
      Third-party scripts detected. Consider using @nuxt/scripts for best-practice loading and management.
    </n-tip>

    <div
      class="grid gap-3 md:grid-cols-2"
    >
      <n-card
        v-for="s in filtered"
        :key="s.url"
        p-3
      >
        <div
          class="flex items-start justify-between gap-3"
        >
          <div
            class="min-w-0"
          >
            <div
              class="text-xs text-gray-500"
            >
              {{ s.domain }}
            </div>
            <a
              :href="s.url"
              target="_blank"
              rel="noopener"
              class="block truncate text-sm text-blue-600"
            >
              {{ s.url }}
            </a>
          </div>
          <div
            class="flex items-center gap-2 shrink-0"
          >
            <n-tag
              :type="s.loaded ? 'success' : 'warning'"
              size="small"
            >
              {{ s.loaded ? 'Loaded' : 'Pending' }}
            </n-tag>
          </div>
        </div>

        <div
          class="mt-2 flex flex-wrap gap-2 text-[11px]"
        >
          <n-tag
            v-if="s.renderBlocking"
            type="error"
            size="small"
            title="In document head and not async/defer/module; blocks HTML parsing and delays first paint. Prefer defer or type=module."
          >
            render-blocking
          </n-tag>
          <n-tag
            v-if="s.isModule"
            size="small"
            title="Module scripts are deferred by default and don't block parsing; execution order differs from classic scripts."
          >
            module
          </n-tag>
          <n-tag
            v-if="s.async"
            size="small"
            title="Doesn't block parsing; executes as soon as it's downloaded. Order is not guaranteed."
          >
            async
          </n-tag>
          <n-tag
            v-if="s.defer"
            size="small"
            title="Doesn't block parsing; executes after document parsing, preserving script order."
          >
            defer
          </n-tag>
          <n-tag
            v-if="s.crossorigin"
            size="small"
            title="CORS mode for this script. Use 'anonymous' for cross-origin with SRI and better error reporting."
          >
            crossorigin={{ s.crossorigin }}
          </n-tag>
          <n-tag
            v-else
            type="warning"
            size="small"
            title="Cross-origin script without crossorigin. Add crossorigin='anonymous' for SRI and better error reporting."
          >
            missing crossorigin
          </n-tag>
          <n-tag
            v-if="s.integrity"
            size="small"
            title="Subresource Integrity: protects against CDN/script tampering."
          >
            sri
          </n-tag>
          <n-tag
            v-if="s.referrerPolicy"
            size="small"
            title="Referrer policy controls the Referer header for this request."
          >
            referrer={{ s.referrerPolicy }}
          </n-tag>
          <n-tag
            v-if="s.https === false"
            type="error"
            size="small"
            title="Loaded over HTTP; use HTTPS to avoid mixed content and security risks."
          >
            insecure http
          </n-tag>
        </div>

        <div
          class="mt-3 grid grid-cols-2 gap-2"
        >
          <div
            class="n-border-base border rounded p-2"
          >
            <div
              class="text-xs text-gray-500"
            >
              Total network
            </div>
            <div
              class="font-mono"
            >
              {{ fmt(s.totalNetworkTime) }}
            </div>
          </div>
          <div
            class="n-border-base border rounded p-2"
          >
            <div
              class="text-xs text-gray-500"
            >
              Parse + execute
            </div>
            <div
              class="font-mono"
            >
              {{ fmt(s.parseExecuteTime) }}
            </div>
          </div>
          <div
            class="n-border-base border rounded p-2"
          >
            <div
              class="text-xs text-gray-500"
            >
              Request
            </div>
            <div
              class="font-mono"
            >
              {{ fmt(s.requestTime) }}
            </div>
          </div>
          <div
            class="n-border-base border rounded p-2"
          >
            <div
              class="text-xs text-gray-500"
            >
              Download
            </div>
            <div
              class="font-mono"
            >
              {{ fmt(s.downloadTime) }}
            </div>
          </div>
        </div>

        <div
          class="mt-3 flex items-center gap-2"
        >
          <n-button
            @click="logToConsole(s.element)"
          >
            <Icon
              name="material-symbols:terminal"
              class="text-lg"
            />
            <span class="ml-1">Log element</span>
          </n-button>
          <n-button
            @click="copy(s.url)"
          >
            <Icon
              name="material-symbols:content-copy-outline"
              class="text-lg"
            />
            <span class="ml-1">Copy URL</span>
          </n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  title: 'Third-Party Scripts',
})

const { scripts, isUsingNuxtScripts } = useHostThirdPartyScripts()

const thresholds = {
  network: 300,
  parse: 200,
}

// Controls removed per request

type ScriptItem = {
  element: HTMLScriptElement
  url: string
  domain: string
  https: boolean | undefined
  loaded: boolean
  renderBlocking: boolean
  requestTime?: number
  downloadTime?: number
  totalNetworkTime?: number
  parseExecuteTime?: number
  crossorigin?: string | null
  integrity?: string | null
  referrerPolicy?: string | null
  async: boolean
  defer: boolean
  isModule: boolean
}

const normalized = computed<ScriptItem[]>(() => {
  const list = scripts.value || []
  return list.map((s) => {
    const el = s.element
    const url = el.src
    const u = new URL(url, location.href)
    const inHead = Boolean(el.ownerDocument && el.ownerDocument.head && el.ownerDocument.head.contains(el))
    const renderBlocking = inHead && !el.async && !el.defer && el.type !== 'module'
    return {
      element: el,
      url,
      domain: u.host,
      https: u.protocol === 'https:',
      loaded: s.loaded,
      renderBlocking,
      requestTime: el.requestTime,
      downloadTime: el.downloadTime,
      totalNetworkTime: el.totalNetworkTime,
      parseExecuteTime: el.parseExecuteTime,
      crossorigin: el.getAttribute('crossorigin'),
      integrity: el.getAttribute('integrity'),
      referrerPolicy: el.getAttribute('referrerpolicy'),
      async: el.async,
      defer: el.defer,
      isModule: el.type === 'module',
    }
  })
})

const filtered = computed(() => {
  return normalized.value.slice().sort((a, b) => {
    const ai = (a.totalNetworkTime || 0) + (a.parseExecuteTime || 0)
    const bi = (b.totalNetworkTime || 0) + (b.parseExecuteTime || 0)
    return bi - ai
  })
})

const total = computed(() => normalized.value.length)
const loaded = computed(() => normalized.value.filter(s => s.loaded).length)
const slowNetwork = computed(() => normalized.value.filter(s => (s.totalNetworkTime || 0) > thresholds.network).length)
const slowParse = computed(() => normalized.value.filter(s => (s.parseExecuteTime || 0) > thresholds.parse).length)
const renderBlockingCount = computed(() => normalized.value.filter(s => s.renderBlocking).length)

function fmt(n?: number) {
  return typeof n === 'number' ? `${n.toFixed(0)}ms` : 'N/A'
}

function logToConsole(element: HTMLScriptElement) {
  console.log('[@nuxt/hints]: Third-party script element', element)
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  }
  catch {
    // ignore
  }
}
</script>

<style>
/* no-op */
</style>
