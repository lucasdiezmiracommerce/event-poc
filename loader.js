<script>
(function () {
  if (window.__EVENT_POC_LOADER__) return;
  window.__EVENT_POC_LOADER__ = true;

  var ENABLE_LOGS = true;
  function log() {
    if (ENABLE_LOGS) console.log.apply(console, arguments);
  }

  var HOST_SELECTOR = 'div.group\\/product-detail-form';
  var CONTAINER_ID = 'event-poc-root';

  var mounted = false;
  var mounting = false;
  var container = null;
  var lastPath = null;

  /* =======================
     HYDRATION AWARE READY
  ======================= */
  function afterHydration(cb) {
    if (document.readyState !== "loading") {
      requestAnimationFrame(() => requestAnimationFrame(cb));
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        requestAnimationFrame(() => requestAnimationFrame(cb));
      });
    }
  }

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
     CONTAINER (OWNED NODE)
  ======================= */
  function ensureContainer() {
    var host = document.querySelector(HOST_SELECTOR);
    if (!host) return null;

    container = document.getElementById(CONTAINER_ID);
    if (container) return container;

    container = document.createElement("div");
    container.id = CONTAINER_ID;

    // Insert AFTER React-controlled node
    host.parentNode.insertBefore(container, host.nextSibling);

    log("[EventPOC] Container injected");
    return container;
  }

  /* =======================
     MOUNT / UNMOUNT
  ======================= */
  function unmount() {
    if (!mounted) return;

    try {
      window.EventPOC?.unmount?.(container);
    } catch (_) {}

    mounted = false;
    mounting = false;

    log("[EventPOC] Unmounted");
  }

  function mount(product) {
    if (mounted || mounting) return;

    container = ensureContainer();
    if (!container) return;

    mounting = true;

    ensureDeps().then(() => {
      if (mounted) return;

      window.EventPOC.mount(container, { product });

      mounted = true;
      mounting = false;

      log("[EventPOC] Mounted");
    });
  }

  /* =======================
     CORE EVALUATION
  ======================= */
  function evaluate() {
    var path = window.location.pathname;
    if (path === lastPath && mounted) return;
    lastPath = path;

    ensureContainer();

    fetchProduct(path).then(product => {
      if (!product || !product.sku?.startsWith("EVT_")) {
        unmount();
        return;
      }

      mount(product);
    });
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
     RESILIENCE (React RERENDER)
  ======================= */
  new MutationObserver(() => {
    if (mounted && !document.getElementById(CONTAINER_ID)) {
      log("[EventPOC] Container lost, re-injecting");
      mounted = false;
      evaluate();
    }
  }).observe(document.body, { childList: true, subtree: true });

  /* =======================
     BOOT
  ======================= */
  afterHydration(evaluate);

})();
</script>
