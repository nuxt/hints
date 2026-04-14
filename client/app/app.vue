<script setup lang="ts">
import { useDevtoolsClient, onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import type { HintsClientFunctions, HintsServerFunctions } from '../../src/runtime/core/rpc-types'
import { RPC_NAMESPACE } from '../../src/runtime/core/rpc-types'
import type { HydrationMismatchPayload, LocalHydrationMismatch } from '../../src/runtime/hydration/types'
import type { ComponentLazyLoadData } from '../../src/runtime/lazy-load/schema'
import { ComponentLazyLoadDataSchema } from '../../src/runtime/lazy-load/schema'
import type { HtmlValidateReport } from '../../src/runtime/html-validate/types'
import { parse } from 'valibot'

const client = useDevtoolsClient()

const hydrationMismatches = ref<(HydrationMismatchPayload | LocalHydrationMismatch)[]>([])
const lazyLoadHints = ref<ComponentLazyLoadData[]>([])
const htmlValidateReports = ref<HtmlValidateReport[]>([])

const nuxtApp = useNuxtApp()
nuxtApp.provide('hydrationMismatches', hydrationMismatches)
nuxtApp.provide('lazyLoadHints', lazyLoadHints)
nuxtApp.provide('htmlValidateReports', htmlValidateReports)

onDevtoolsClientConnected((client) => {
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

  const rpc = client.devtools.extendClientRpc<HintsServerFunctions, HintsClientFunctions>(RPC_NAMESPACE, {
    onHydrationMismatch(mismatch: HydrationMismatchPayload) {
      if (!hydrationInitialSyncDone) {
        bufferedHydrationMismatches.push(mismatch)
        return
      }
      applyHydrationMismatch(mismatch)
    },
    onHydrationCleared(ids: string[]) {
      ids.forEach(id => hydrationTombstones.add(id))
      hydrationMismatches.value = hydrationMismatches.value.filter(m => !ids.includes(m.id))
    },
    onLazyLoadReport(data: ComponentLazyLoadData) {
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
    onLazyLoadCleared(id: string) {
      lazyLoadTombstones.add(id)
      lazyLoadHints.value = lazyLoadHints.value.filter(entry => entry.id !== id)
    },
    onHtmlValidateReport(report: HtmlValidateReport) {
      if (!htmlValidateInitialSyncDone) {
        bufferedHtmlValidateReports.push(report)
        return
      }
      applyHtmlValidateReport(report)
    },
    onHtmlValidateDeleted(id: string) {
      htmlValidateTombstones.add(id)
      htmlValidateReports.value = htmlValidateReports.value.filter(report => report.id !== id)
    },
  })

  // Hydration: seed from host payload and fetch from server via RPC
  if (useHintsFeature('hydration')) {
    if (client.host?.nuxt?.payload?.__hints?.hydration) {
      hydrationMismatches.value = client.host.nuxt.payload.__hints.hydration
        .filter(mismatch => !hydrationTombstones.has(mismatch.id))
    }
    rpc.getHydrationMismatches().then((data) => {
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
    rpc.getLazyLoadHints().then((data) => {
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
    rpc.getHtmlValidateReports().then((data) => {
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
})
</script>

<template>
  <div>
    <NuxtLayout v-if="client">
      <NuxtPage />
    </NuxtLayout>
    <NLoading v-else />
  </div>
</template>
