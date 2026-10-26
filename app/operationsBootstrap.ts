// Runs in <head>, before static operations markup can paint. No DOM rewriting:
// React hydrates its original HTML, while CSS already uses saved preferences.
export const operationsBootstrapScript = `(()=>{if(!/^\\/(admin|concierge|manager|sales)(\\/|$)/.test(location.pathname))return;try{const root=document.documentElement,value=localStorage.getItem("mlt-operations-locale");root.dataset.operationsLocale=value==="ru"||value==="de"?value:"en";root.dataset.operationsCollapsed=String(localStorage.getItem("mlt-operations-collapsed")==="true")}catch{}})();`;
