import type { NitroApp } from 'nitropack/types'

export default function (nitroApp: NitroApp) {
  nitroApp.hooks.hook('render:html', ({ head }) => {
    head.unshift(`
<script>
window.__hints_TPC_start_time = Date.now();

function __hints_TPC_saveTime(script, startTime) {
    script.__hints_TPC_end_time = Date.now();
    const scriptStartTime = startTime || script.__hints_TPC_start_time || window.__hints_TPC_start_time;
    
    const resourceEntries = performance.getEntriesByName(script.src)
    const scriptEntry = resourceEntries.find(entry => entry.name === script.src)

    if (scriptEntry) {
        // Calculate parse + execute time using modern API
        const navigationEntry = performance.getEntriesByType('navigation')[0]
        const navigationStart = navigationEntry ? performance.timeOrigin : performance.timeOrigin
        
        script.requestTime = (scriptEntry.responseStart - scriptEntry.requestStart);
        script.downloadTime = (scriptEntry.responseEnd - scriptEntry.responseStart);
        script.totalNetworkTime = (scriptEntry.responseEnd - scriptEntry.startTime);
        script.parseExecuteTime =  script.__hints_TPC_end_time - (navigationStart + scriptEntry.responseEnd);
        script.loaded = true;
        console.log('[@nuxt/hints]: 📊 Detailed timing for', script.src, {
            'Request': script.requestTime.toFixed(2) + 'ms',
            'Download': script.downloadTime.toFixed(2) + 'ms',
            'Total Network': script.totalNetworkTime.toFixed(2) + 'ms',
            'Parse + Execute': script.parseExecuteTime.toFixed(2) + 'ms'
        });
    }
}
</script>
`)

    head.push(`
<script>
for (const script of document.scripts) {
    if (script.src && !script.src.startsWith(window.location.origin)) {
        script.__hints_TPC_start_time = window.__hints_TPC_start_time || Date.now();
        script.onload = function(_) {
            __hints_TPC_saveTime(script, script.__hints_TPC_start_time);
        }
        __hints_TPC_saveTime(script, script.__hints_TPC_start_time);
    }
}
</script>
  `)
  })
}
