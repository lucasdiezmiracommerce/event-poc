(function () {
  /* =======================
     SAFETY / DEBUG
  ======================= */
  if (window.__EVENT_POC_LOADER__) return;
  window.__EVENT_POC_LOADER__ = true;

  var ENABLE_LOGS = true;
  function log() {
    if (ENABLE_LOGS) console.log.apply(console, arguments);
  }

  log("[EventPOC] Loader initialized");

  /* =======================
     CONSTANTS / STATE
  ======================= */
  var SLOT_SELECTOR = 'div.group\\/product-detail-form';
  var mounted = false;
  var mounting = false;
  var currentMountNode = null;
  var lastPath = null;

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
        variables: { path: path }
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (j) { return j?.data?.site?.route?.node || null; })
      .catch(function () { return null; });
  }

  /* =======================
     SCRIPT LOADER
  ======================= */
  function loadScript(src) {
    return new Promise(function (resolve) {
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
      .then(function () {
        return loadScript("https://unpkg.com/react-dom@18/umd/react-dom.production.min.js");
      })
      .then(function () {
        return loadScript("https://cdn.jsdelivr.net/gh/lucasdiezmiracommerce/event-poc@main/index-min.js");
      });
  }

  /* =======================
     MOUNT / UNMOUNT
  ======================= */
  function unmount() {
    if (!mounted) return;

    try {
      window.EventPOC?.unmount?.(currentMountNode);
    } catch (_) {}

    if (currentMountNode && currentMountNode.parentNode) {
      currentMountNode.parentNode.removeChild(currentMountNode);
    }

    mounted = false;
    mounting = false;
    currentMountNode = null;

    log("[EventPOC] Unmounted");
  }

  function mount(slot, product) {
    if (mounted || mounting) return;
    mounting = true;

    ensureDeps().then(function () {
      if (mounted) return;

      currentMountNode = document.createElement("div");
      slot.appendChild(currentMountNode);

      window.EventPOC.mount(currentMountNode, {
        product: product
      });

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

    log("[EventPOC] Evaluating", path);

    var slot = document.querySelector(SLOT_SELECTOR);
    if (!slot) {
      log("[EventPOC] Slot not found yet");
      return;
    }

    fetchProduct(path).then(function (product) {
      log("[EventPOC] Product fetched", product);

      if (!product || !product.sku || !product.sku.startsWith("EVT_")) {
        unmount();
        return;
      }

      mount(slot, product);
    });
  }

  /* =======================
     SPA NAVIGATION HOOKS
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
     MAKESWIFT HYDRATION WATCH
  ======================= */
  var observer = new MutationObserver(function () {
    if (!mounted) evaluate();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  /* =======================
     BOOT
  ======================= */
  onReady(evaluate);

})();
