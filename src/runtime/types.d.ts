declare global {
  interface Window {
    __hints_TPC_start_time: number
    __hints_TPC_saveTime: (script: HTMLScriptElement, startTime?: number) => void
  }
  interface HTMLScriptElement {
    __hints_TPC_start_time?: number
    __hints_TPC_end_time?: number
    dnsLookupTime?: number
    tcpConnectTime?: number
    requestTime?: number
    downloadTime?: number
    totalNetworkTime?: number
    parseExecuteTime?: number
    loaded?: boolean
  }
}
declare module '#app' {
  interface RuntimeNuxtHooks {
    'hints:scripts:added': (script: HTMLScriptElement) => void
    'hints:scripts:loaded': (script: HTMLScriptElement) => void
  }

  interface NuxtApp {
    __hints_tpc: Ref<{ element: HTMLScriptElement, loaded: boolean }[]>
  }
}

export {}
