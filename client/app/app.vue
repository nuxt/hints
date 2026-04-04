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
  const rpc = client.devtools.extendClientRpc<HintsServerFunctions, HintsClientFunctions>(RPC_NAMESPACE, {
    onHydrationMismatch(mismatch: HydrationMismatchPayload) {
      if (!hydrationMismatches.value.some(existing => existing.id === mismatch.id)) {
        hydrationMismatches.value.push(mismatch)
      }
    },
    onHydrationCleared(ids: string[]) {
      hydrationMismatches.value = hydrationMismatches.value.filter(m => !ids.includes(m.id))
    },
    onLazyLoadReport(data: ComponentLazyLoadData) {
      try {
        const validated = parse(ComponentLazyLoadDataSchema, data)
        if (!lazyLoadHints.value.some(existing => existing.id === validated.id)) {
          lazyLoadHints.value.push(validated)
        }
      }
      catch {
        console.warn('[hints] Ignoring malformed lazy-load report', data)
      }
    },
    onLazyLoadCleared(id: string) {
      lazyLoadHints.value = lazyLoadHints.value.filter(entry => entry.id !== id)
    },
    onHtmlValidateReport(report: HtmlValidateReport) {
      if (!htmlValidateReports.value.some(existing => existing.id === report.id)) {
        htmlValidateReports.value = [...htmlValidateReports.value, report]
      }
    },
    onHtmlValidateDeleted(id: string) {
      htmlValidateReports.value = htmlValidateReports.value.filter(report => report.id !== id)
    },
  })

  // Hydration: seed from host payload and fetch from server via RPC
  if (useHintsFeature('hydration')) {
    hydrationMismatches.value = [...client.host.nuxt.payload.__hints.hydration]
    rpc.getHydrationMismatches().then((data) => {
      hydrationMismatches.value = [
        ...hydrationMismatches.value,
        ...data.mismatches.filter(m => !hydrationMismatches.value.some(existing => existing.id === m.id)),
      ]
    })
  }

  // Lazy load: fetch from server via RPC
  if (useHintsFeature('lazyLoad')) {
    rpc.getLazyLoadHints().then((data) => {
      lazyLoadHints.value = [
        ...lazyLoadHints.value,
        ...(data ?? []).filter(d => !lazyLoadHints.value.some(existing => existing.id === d.id)),
      ]
    })
  }

  // HTML validate: fetch from server via RPC
  if (useHintsFeature('htmlValidate')) {
    rpc.getHtmlValidateReports().then((data) => {
      htmlValidateReports.value = [
        ...htmlValidateReports.value,
        ...(data ?? []).filter(d => !htmlValidateReports.value.some(existing => existing.id === d.id)),
      ]
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
