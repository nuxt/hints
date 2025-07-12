export function getScriptTime(script: HTMLScriptElement): {
  startTime: number
  endTime?: number
  dnsLookupTime?: number
  tcpConnectTime?: number
  requestTime?: number
  downloadTime?: number
  totalNetworkTime?: number
  parseExecuteTime?: number
} {
  const startTime = script.__hints_TPC_start_time || window.__hints_TPC_start_time || Date.now()
  const endTime = script.__hints_TPC_end_time || Date.now()

  return {
    startTime,
    endTime,
    dnsLookupTime: script.dnsLookupTime,
    tcpConnectTime: script.tcpConnectTime,
    requestTime: script.requestTime,
    downloadTime: script.downloadTime,
    totalNetworkTime: script.totalNetworkTime,
    parseExecuteTime: script.parseExecuteTime,
  }
}
