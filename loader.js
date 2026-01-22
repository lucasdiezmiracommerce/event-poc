<script>
(function () {
  if (window.__EVENT_POC_LOADER__) {
    console.log("[EventPOC] Loader already initialized, skipping");
    return;
  }
  window.__EVENT_POC_LOADER__ = true;

  var ENABLE_LOGS = true;
  function log() {
    if (ENABLE_LOGS) console.log.apply(console, arguments);
  }

  log("[EventPOC] Loader started");

  /* =======================
     CONFIG / STATE
  ======================= */
  var HOST_SELECTOR = 'div.group\\/product-detail-form';

  var mounted = false;
  var mounting = false;
  var mountNode = null;
  var lastPath = null;

  /* =======================
     HYDRATION-SAFE READY
  ======================= */
  function afterHydration(fn) {
    if (document.readyState !== "loading") {
      requestAnimationFrame(() => {
        requestAnimationFrame(fn);
      });
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(fn);
        });
      });
    }
  }

  /* =======================
     GRAPHQL
  ======================= */
  function fetchProduct(path) {
    log("[EventPOC] Fetching product for path:", path);

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
      .then(j => {
        var product = j?.data?.site?.route?.node || null;
        log("[EventPOC] GraphQL response:", product);
        return product;
      })
      .catch(err => {
        log("[EventPOC] GraphQL error", err);
        return null;
      });
  }

  /* =======================
     SCRIPT LOADER
  ======================= */
  function loadScript(src) {
    log("[EventPOC] Loading script:", src);

    return new Promise(resolve => {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => {
        log("[EventPOC] Script loaded:", src);
        resolve();
      };
      document.head.appendChild(s);
    });
  }

  function ensureDeps() {
    if (window.React && window.ReactDOM && window.EventPOC) {
      log("[EventPOC] Dependencies already available");
      return Promise.resolve();
    }

    log("[EventPOC] Ensuring dependencies");

    return loadScript("https://unpkg.com/react@18/umd/react.production.min.js")
      .then(() => loadScript("https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"))
      .then(() => loadScript("https://cdn.jsdelivr.net/gh/lucasdiezmiracommerce/event-poc@main/index-min.js"));
  }

  /* =======================
     MOUNT / UNMOUNT
  ======================= */
  function unmount() {
    if (!mounted) {
      log("[EventPOC] Unmount skipped (not mounted)");
      return;
    }

    log("[EventPOC] Unmounting");

    try {
      window.EventPOC?.unmount?.(mountNode);
    } catch (e) {
      log("[EventPOC] Unmount error", e);
    }

    mountNode?.remove();

    mounted = false;
    mounting = false;
    mountNode = null;
  }

  function mount(host, product) {
    if (mounted || mounting) {
      log("[EventPOC] Mount skipped (mounted or mounting)");
      return;
    }

    mounting = true;
    log("[EventPOC] Mounting into host:", host);

    ensureDeps().then(() => {
      if (mounted) return;

      mountNode = document.createElement("div");
      mountNode.setAttribute("data-event-poc-root", "true");

      host.appendChild(mountNode);

      log("[EventPOC] Calling EventPOC.mount");
      window.EventPOC.mount(mountNode, { product });

      mounted = true;
      mounting = false;

      log("[EventPOC] Mounted successfully");
    });
  }

  /* =======================
     CORE EVALUATION
  ======================= */
  function evaluate(reason) {
    var path = window.location.pathname;

    log("[EventPOC] Evaluate triggered", {
      reason,
      path,
      mounted
    });

    var host = document.querySelector(HOST_SELECTOR);
    if (!host) {
      log("[EventPOC] Host not found yet");
      return;
    }

    if (path === lastPath && mounted) {
      log("[EventPOC] Same path and already mounted, skipping");
      return;
    }

    lastPath = path;

    fetchProduct(path).then(product => {
      if (!product || !product.sku || !product.sku.startsWith("EVT_")) {
        log("[EventPOC] Not an EVT product, unmounting");
        unmount();
        return;
      }

      mount(host, product);
    });
  }

  /* =======================
     SPA NAVIGATION
  ======================= */
  function hookHistory(method) {
    var original = history[method];
    history[method] = function () {
      var ret = original.apply(this, arguments);
      log("[EventPOC] history." + method + " called");
      setTimeout(() => evaluate(method), 0);
      return ret;
    };
  }

  hookHistory("pushState");
  hookHistory("replaceState");
  window.addEventListener("popstate", () => {
    log("[EventPOC] popstate");
    evaluate("popstate");
  });

  /* =======================
     REACT RERENDER DETECTION
  ======================= */
  new MutationObserver(() => {
    if (mounted && !document.contains(mountNode)) {
      log("[EventPOC] Mount node removed by React, remounting");
      mounted = false;
      evaluate("mutation-remount");
    }
  }).observe(document.body, {
    childList: true,
    subtree: true
  });

  /* =======================
     BOOT
  ======================= */
  afterHydration(() => {
    log("[EventPOC] After hydration");
    evaluate("initial");
  });

})();
</script>
