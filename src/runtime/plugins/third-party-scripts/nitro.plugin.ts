/// <reference types="nuxt" />
import type { NitroAppPlugin } from 'nitropack/types'

export default <NitroAppPlugin> function (nitroApp) {
  nitroApp.hooks.hook('render:html', ({ head }) => {
    head.unshift(`
<script>
window.__hints_TPC_start_time = Date.now();

function __hints_TPC_saveTime(e, startTime) {
    this.__hints_TPC_end_time = Date.now();
    const scriptStartTime = startTime || this.__hints_TPC_start_time || window.__hints_TPC_start_time;
    
    const resourceEntries = performance.getEntriesByType('resource')
    const scriptEntry = resourceEntries.find(entry => entry.name === this.src)
    
    if (scriptEntry) {
        // Calculate parse + execute time using modern API
        const navigationEntry = performance.getEntriesByType('navigation')[0]
        const navigationStart = navigationEntry ? performance.timeOrigin : performance.timeOrigin
        const parseExecuteTime = this.__hints_TPC_end_time - (navigationStart + scriptEntry.responseEnd)
        
        console.log('[@nuxt/hints]: 📊 Detailed timing for', this.src, {
            'DNS Lookup': (scriptEntry.domainLookupEnd - scriptEntry.domainLookupStart).toFixed(5) + 'ms',
            'TCP Connect': (scriptEntry.connectEnd - scriptEntry.connectStart).toFixed(5) + 'ms',
            'Request': (scriptEntry.responseStart - scriptEntry.requestStart).toFixed(5) + 'ms',
            'Download': (scriptEntry.responseEnd - scriptEntry.responseStart).toFixed(5) + 'ms',
            'Total Network': (scriptEntry.responseEnd - scriptEntry.startTime).toFixed(5) + 'ms',
            'Parse + Execute': parseExecuteTime.toFixed(5) + 'ms'
        })
    }
}
</script>`)
  })
}
