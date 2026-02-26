<script setup lang="ts">
import type { ComponentLazyLoadData, DirectImportInfo } from '../../../src/runtime/lazy-load/schema'
import { LAZY_LOAD_ROUTE } from '../../../src/runtime/lazy-load/utils'

definePageMeta({
  title: 'Component Lazy Load',
  middleware: 'feature-gate',
  feature: 'lazyLoad',
})

const nuxtApp = useNuxtApp()

const entries = computed(() =>
  nuxtApp.$lazyLoadHints.value.filter(
    (e: ComponentLazyLoadData) => e.state.directImports.some((i: DirectImportInfo) => !i.rendered),
  ),
)

async function dismiss(id: string) {
  nuxtApp.$lazyLoadHints.value = nuxtApp.$lazyLoadHints.value.filter((e: ComponentLazyLoadData) => e.id !== id)
  $fetch(new URL(`${LAZY_LOAD_ROUTE}/${id}`, window.location.origin).href, { method: 'DELETE' })
}
</script>

<template>
  <div
    grid
    gap-4
    p-4
  >
    <n-tip type="info">
      These components are statically imported but were not rendered during SSR or initial hydration. Consider using
      the <code>Lazy</code> prefix or <code>defineAsyncComponent</code> to reduce the initial bundle size.
    </n-tip>

    <template v-if="entries.length > 0">
      <n-card
        v-for="entry in entries"
        :key="entry.id"
        class="p4"
      >
        <header class="flex items-center justify-between">
          <span class="text-sm font-semibold">{{ entry.route }}</span>
          <n-button
            title="Remove"
            size="small"
            quaternary
            @click="dismiss(entry.id)"
          >
            <Icon
              name="material-symbols:delete-outline"
              class="text-lg"
            />
          </n-button>
        </header>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700 text-left text-neutral-500 dark:text-neutral-400">
              <th class="pb-2 font-medium">
                Component
              </th>
              <th class="pb-2 font-medium">
                Import Source
              </th>
              <th class="pb-2 font-medium">
                Imported By
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="imp in entry.state.directImports.filter((i: DirectImportInfo) => !i.rendered)"
              :key="imp.componentName"
              class="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
            >
              <td class="py-2">
                <code class="text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                  {{ imp.componentName }}
                </code>
                <span class="text-xs text-neutral-400 ml-1">→ Lazy{{ imp.componentName }}</span>
              </td>
              <td class="py-2 text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-48">
                {{ imp.importSource }}
              </td>
              <td class="py-2 text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-48">
                {{ imp.importedBy }}
              </td>
            </tr>
          </tbody>
        </table>
      </n-card>
    </template>

    <div
      v-else
      class="text-neutral-500 dark:text-neutral-400"
    >
      No lazy-load suggestions found. Navigate pages in your app to collect data.
    </div>
  </div>
</template>
