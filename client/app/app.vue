<script setup lang="ts">
import type { HydrationMismatchResponse, HydrationMismatchPayload, LocalHydrationMismatch } from '../../src/runtime/hydration/types'
import type { ComponentLazyLoadData } from '../../src/runtime/lazy-load/schema'
import { ComponentLazyLoadDataSchema } from '../../src/runtime/lazy-load/schema'
import type { HtmlValidateReport } from '../../src/runtime/html-validate/types'
import { CLIENT_RPC_NAMES, SERVER_RPC_NAMES } from '../../src/runtime/core/rpc-types'
import { useDevtoolsHost, useHintsRpc, type HintsRpc, type HostClient } from './composables/devtools'
import { parse } from 'valibot'

const host = useDevtoolsHost()
const rpc = useHintsRpc()
const connected = computed(() => Boolean(rpc.value && host.value))

const hydrationMismatches = ref<(HydrationMismatchPayload | LocalHydrationMismatch)[]>([])
const lazyLoadHints = ref<ComponentLazyLoadData[]>([])
const htmlValidateReports = ref<HtmlValidateReport[]>([])

const nuxtApp = useNuxtApp()
nuxtApp.provide('hydrationMismatches', hydrationMismatches)
nuxtApp.provide('lazyLoadHints', lazyLoadHints)
nuxtApp.provide('htmlValidateReports', htmlValidateReports)

// one-shot: `immediate` can fire synchronously, before a `stop` handle exists
let isSetUp = false
watch(connected, (isConnected) => {
  if (isSetUp || !isConnected || !rpc.value || !host.value) return
  isSetUp = true
  setup(rpc.value, host.value)
}, { immediate: true })

function setup(rpc: HintsRpc, host: HostClient) {
  const hydrationTombstones = new Set<string>()
  const lazyLoadTombstones = new Set<string>()
  const htmlValidateTombstones = new Set<string>()

  let hydrationInitialSyncDone = !useHintsFeature('hydration')
  let lazyLoadInitialSyncDone = !useHintsFeature('lazyLoad')
  let htmlValidateInitialSyncDone = !useHintsFeature('htmlValidate')

  const bufferedHydrationMismatches: HydrationMismatchPayload[] = []
  const bufferedLazyLoadHints: ComponentLazyLoadData[] = []
  const bufferedHtmlValidateReports: HtmlValidateReport[] = []

  const applyHydrationMismatch = (mismatch: HydrationMismatchPayload | LocalHydrationMismatch) => {
    if (hydrationTombstones.has(mismatch.id)) {
      return
    }
    if (!hydrationMismatches.value.some(existing => existing.id === mismatch.id)) {
      hydrationMismatches.value.push(mismatch)
    }
  }

  const applyLazyLoadHint = (entry: ComponentLazyLoadData) => {
    if (lazyLoadTombstones.has(entry.id)) {
      return
    }
    if (!lazyLoadHints.value.some(existing => existing.id === entry.id)) {
      lazyLoadHints.value.push(entry)
    }
  }

  const applyHtmlValidateReport = (report: HtmlValidateReport) => {
    if (htmlValidateTombstones.has(report.id)) {
      return
    }
    if (!htmlValidateReports.value.some(existing => existing.id === report.id)) {
      htmlValidateReports.value = [...htmlValidateReports.value, report]
    }
  }

  // Broadcasts from the Nuxt process, registered as `nuxt-hints:on-*` client events
  rpc.register({
    name: CLIENT_RPC_NAMES.onHydrationMismatch,
    type: 'event',
    handler(mismatch: HydrationMismatchPayload) {
      if (!hydrationInitialSyncDone) {
        bufferedHydrationMismatches.push(mismatch)
        return
      }
      applyHydrationMismatch(mismatch)
    },
  })
  rpc.register({
    name: CLIENT_RPC_NAMES.onHydrationCleared,
    type: 'event',
    handler(ids: string[]) {
      ids.forEach(id => hydrationTombstones.add(id))
      hydrationMismatches.value = hydrationMismatches.value.filter(m => !ids.includes(m.id))
    },
  })
  rpc.register({
    name: CLIENT_RPC_NAMES.onLazyLoadReport,
    type: 'event',
    handler(data: ComponentLazyLoadData) {
      try {
        const validated = parse(ComponentLazyLoadDataSchema, data)
        if (!lazyLoadInitialSyncDone) {
          bufferedLazyLoadHints.push(validated)
          return
        }
        applyLazyLoadHint(validated)
      }
      catch {
        console.warn('[hints] Ignoring malformed lazy-load report', data)
      }
    },
  })
  rpc.register({
    name: CLIENT_RPC_NAMES.onLazyLoadCleared,
    type: 'event',
    handler(id: string) {
      lazyLoadTombstones.add(id)
      lazyLoadHints.value = lazyLoadHints.value.filter(entry => entry.id !== id)
    },
  })
  rpc.register({
    name: CLIENT_RPC_NAMES.onHtmlValidateReport,
    type: 'event',
    handler(report: HtmlValidateReport) {
      if (!htmlValidateInitialSyncDone) {
        bufferedHtmlValidateReports.push(report)
        return
      }
      applyHtmlValidateReport(report)
    },
  })
  rpc.register({
    name: CLIENT_RPC_NAMES.onHtmlValidateDeleted,
    type: 'event',
    handler(id: string) {
      htmlValidateTombstones.add(id)
      htmlValidateReports.value = htmlValidateReports.value.filter(report => report.id !== id)
    },
  })

  // Hydration: seed from host payload and fetch from server via RPC
  if (useHintsFeature('hydration')) {
    if (host.nuxt?.payload?.__hints?.hydration) {
      hydrationMismatches.value = host.nuxt.payload.__hints.hydration
        .filter(mismatch => !hydrationTombstones.has(mismatch.id))
    }
    rpc.call(SERVER_RPC_NAMES.getHydrationMismatches).then((data: HydrationMismatchResponse) => {
      data.mismatches
        .filter(mismatch => !hydrationTombstones.has(mismatch.id))
        .forEach(mismatch => applyHydrationMismatch(mismatch))
    }).catch((error) => {
      console.warn('[hints] Failed to fetch hydration mismatches', error)
    }).finally(() => {
      hydrationInitialSyncDone = true
      bufferedHydrationMismatches.forEach(mismatch => applyHydrationMismatch(mismatch))
      bufferedHydrationMismatches.length = 0
    })
  }

  // Lazy load: fetch from server via RPC
  if (useHintsFeature('lazyLoad')) {
    rpc.call(SERVER_RPC_NAMES.getLazyLoadHints).then((data: ComponentLazyLoadData[] | undefined) => {
      ;(data ?? [])
        .filter(entry => !lazyLoadTombstones.has(entry.id))
        .forEach(entry => applyLazyLoadHint(entry))
    }).catch((error) => {
      console.warn('[hints] Failed to fetch lazy-load hints', error)
    }).finally(() => {
      lazyLoadInitialSyncDone = true
      bufferedLazyLoadHints.forEach(entry => applyLazyLoadHint(entry))
      bufferedLazyLoadHints.length = 0
    })
  }

  // HTML validate: fetch from server via RPC
  if (useHintsFeature('htmlValidate')) {
    rpc.call(SERVER_RPC_NAMES.getHtmlValidateReports).then((data: HtmlValidateReport[] | undefined) => {
      ;(data ?? [])
        .filter(report => !htmlValidateTombstones.has(report.id))
        .forEach(report => applyHtmlValidateReport(report))
    }).catch((error) => {
      console.warn('[hints] Failed to fetch html-validate reports', error)
    }).finally(() => {
      htmlValidateInitialSyncDone = true
      bufferedHtmlValidateReports.forEach(report => applyHtmlValidateReport(report))
      bufferedHtmlValidateReports.length = 0
    })
  }
}
</script>

<template>
  <div>
    <NuxtLayout v-if="connected">
      <NuxtPage />
    </NuxtLayout>
    <NLoading v-else />
  </div>
</template>
