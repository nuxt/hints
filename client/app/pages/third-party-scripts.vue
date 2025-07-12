<template>
  <div class="p-4">
    <table
      class="overflow-x-auto w-full n-border-base border"
      text-gray-800
      dark:text-white
      text-center
    >
      <thead>
        <tr class="n-border-base border">
          <th>Script URL</th>
          <th>Loaded</th>
          <th>DNS Lookup Time</th>
          <th>TCP Connect Time</th>
          <th>Request Time</th>
          <th>Download Time</th>
          <th>Total network time</th>
          <th>Parse Execute Time</th>
          <th />
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="script in scripts"
          :key="script.element.src"
          class="n-border-base border"
        >
          <td>{{ script.element.src }}</td>
          <td>{{ script.loaded ? 'Yes' : 'No' }}</td>
          <td>{{ script.element.dnsLookupTime ? script.element.dnsLookupTime.toFixed(2) + ' ms' : 'N/A' }}</td>
          <td>{{ script.element.tcpConnectTime ? script.element.tcpConnectTime.toFixed(2) + ' ms' : 'N/A' }}</td>
          <td>{{ script.element.requestTime ? script.element.requestTime.toFixed(2) + ' ms' : 'N/A' }}</td>
          <td>{{ script.element.downloadTime ? script.element.downloadTime.toFixed(2) + ' ms' : 'N/A' }}</td>
          <td>{{ script.element.totalNetworkTime ? script.element.totalNetworkTime.toFixed(2) + ' ms' : 'N/A' }}</td>
          <td>{{ script.element.parseExecuteTime ? script.element.parseExecuteTime.toFixed(2) + ' ms' : 'N/A' }}</td>
          <td>
            <button
              title="log in console"
              @click="log(script.element)"
            >
              <Icon text-2xl name="material-symbols:terminal" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  title: 'Third-Party Scripts',
})

const { scripts } = useHostThirdPartyScripts()

function log(element: HTMLScriptElement) {
  console.log('[@nuxt/hints]: Third-party script element', element)
}
</script>

<style>
th {
    @apply py-2 px-4 text-sm;
}

td {
    @apply p-2 text-xs;
}
</style>
