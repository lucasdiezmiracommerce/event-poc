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
  var CONTAINER_ID = 'event-poc-root';

  var mounted = false;
  var mounting = false;
  var container = null;
  var lastPath = null;

  /* =======================
     HYDRATION-SAFE READY
  ======================= */
  function afterHydration(fn) {
    if (document.readyState !== "loading") {
      requestAnimationFrame(() => requestAnimationFrame(fn));
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        requestAnimationFrame(() => requestAnimationFrame(fn));
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
     CONTAINER (OWNED NODE)
  ======================= */
  function ensureContainer() {
    var host = document.querySelector(HOST_SELECTOR);
    if (!host) {
      log("[EventPOC] Host not found");
      return null;
    }

    container = document.getElementById(CONTAINER_ID);
    if (container) return container;

    container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.setAttribute("data-event-poc-container", "true");

    host.parentNode.insertBefore(container, host.nextSibling);

    log("[EventPOC] Container injected as sibling");
    return container;
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
      window.EventPOC?.unmount?.(container);
    } catch (e) {
      log("[EventPOC] Unmount error", e);
    }

    mounted = false;
    mounting = false;
  }

  function mount(product) {
    if (mounted || mounting) {
      log("[EventPOC] Mount skipped (mounted or mounting)");
      return;
    }

    container = ensureContainer();
    if (!container) return;

    mounting = true;
    log("[EventPOC] Mounting into owned container");

    ensureDeps().then(() => {
      if (mounted) return;

      window.EventPOC.mount(container, { product });

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

    log("[EventPOC] Evaluate", {
      reason,
      path,
      mounted
    });

    if (path === lastPath && mounted) return;
    lastPath = path;

    ensureContainer();

    fetchProduct(path).then(product => {
      if (!product || !product.sku || !product.sku.startsWith("EVT_")) {
        log("[EventPOC] Not an EVT product, unmounting");
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
      log("[EventPOC] history." + method);
      setTimeout(() => evaluate(method), 0);
      return ret;
    };
  }

  hookHistory("pushState");
  hookHistory("replaceState");
  window.addEventListener("popstate", () => evaluate("popstate"));

  /* =======================
     CONTAINER RESILIENCE
  ======================= */
  new MutationObserver(() => {
    if (mounted && !document.getElementById(CONTAINER_ID)) {
      log("[EventPOC] Container removed, remounting");
      mounted = false;
      evaluate("container-lost");
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
