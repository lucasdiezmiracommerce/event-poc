(function () {
  if (window.__EVENT_POC_LOADER__) return;
  window.__EVENT_POC_LOADER__ = true;

  var ENABLE_LOGS = true;
  function log() {
    if (ENABLE_LOGS) console.log.apply(console, arguments);
  }

  log("[EventPOC] Loader start");

  var SLOT_SELECTOR = 'div.group\\/product-detail-form';

  var mounted = false;
  var mounting = false;
  var currentMountNode = null;
  var lastPath = null;
  var retryTimer = null;

  /* =======================
     GRAPHQL
  ======================= */
  function fetchProduct(path) {
    return fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query ($path: String!) {
            site {
              route(path: $path) {
                node {
                  ... on Product {
                    entityId
                    sku
                  }
                }
              }
            }
          }
        `,
        variables: { path }
      })
    })
      .then(r => r.json())
      .then(j => j?.data?.site?.route?.node || null)
      .catch(() => null);
  }

  /* =======================
     SCRIPT LOADER
  ======================= */
  function loadScript(src) {
    return new Promise(resolve => {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  function ensureDeps() {
    if (window.React && window.ReactDOM && window.EventPOC) {
      return Promise.resolve();
    }

    return loadScript("https://unpkg.com/react@18/umd/react.production.min.js")
      .then(() => loadScript("https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"))
      .then(() => loadScript("https://cdn.jsdelivr.net/gh/lucasdiezmiracommerce/event-poc@main/index-min.js"));
  }

  /* =======================
     MOUNT / UNMOUNT
  ======================= */
  function unmount() {
    if (!mounted) return;

    try {
      window.EventPOC?.unmount?.(currentMountNode);
    } catch (_) {}

    currentMountNode?.remove();

    mounted = false;
    mounting = false;
    currentMountNode = null;

    log("[EventPOC] Unmounted");
  }

  function mount(slot, product) {
    if (mounted || mounting) return;

    mounting = true;

    ensureDeps().then(() => {
      if (mounted) return;

      currentMountNode = document.createElement("div");
      slot.appendChild(currentMountNode);

      window.EventPOC.mount(currentMountNode, { product });

      mounted = true;
      mounting = false;

      stopRetry();
      log("[EventPOC] Mounted");
    });
  }

  /* =======================
     CORE EVALUATION
  ======================= */
  function evaluate() {
    var path = window.location.pathname;

    var slot = document.querySelector(SLOT_SELECTOR);
    if (!slot) {
      startRetry();
      return;
    }

    if (path === lastPath && mounted) return;
    lastPath = path;

    fetchProduct(path).then(product => {
      if (!product || !product.sku?.startsWith("EVT_")) {
        unmount();
        return;
      }

      mount(slot, product);
    });
  }

  /* =======================
     RETRY LOOP (refresh fix)
  ======================= */
  function startRetry() {
    if (retryTimer || mounted) return;

    retryTimer = setInterval(evaluate, 300);
    log("[EventPOC] Retry loop started");
  }

  function stopRetry() {
    if (!retryTimer) return;

    clearInterval(retryTimer);
    retryTimer = null;
    log("[EventPOC] Retry loop stopped");
  }

  /* =======================
     SPA NAVIGATION
  ======================= */
  function hookHistory(method) {
    var original = history[method];
    history[method] = function () {
      var ret = original.apply(this, arguments);
      setTimeout(evaluate, 0);
      return ret;
    };
  }

  hookHistory("pushState");
  hookHistory("replaceState");
  window.addEventListener("popstate", evaluate);

  /* =======================
     DOM READY
  ======================= */
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* =======================
     MAKESWIFT HYDRATION
  ======================= */
  new MutationObserver(evaluate).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  /* =======================
     BOOT
  ======================= */
  onReady(evaluate);

})();
