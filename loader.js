(function () {
  var ENABLE_LOGS = true;
  function log() {
    if (ENABLE_LOGS) console.log.apply(console, arguments);
  }

  var SLOT_SELECTOR = '[data-mfe-slot="event-poc"]';
  var mounted = false;
  var currentMountNode = null;
  var lastPath = null;

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
    .then(r => r.json())
    .then(j => j?.data?.site?.route?.node || null)
    .catch(() => null);
  }

  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = src;
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

  function unmount() {
    if (!mounted) return;
    try {
      window.EventPOC?.unmount?.(currentMountNode);
    } catch (_) {}
    if (currentMountNode) currentMountNode.remove();
    mounted = false;
    currentMountNode = null;
    log("[EventPOC] Unmounted");
  }

  function evaluate() {
    var path = window.location.pathname;
    if (path === lastPath) return;
    lastPath = path;

    var slot = document.querySelector(SLOT_SELECTOR);
    if (!slot) {
      unmount();
      return;
    }

    fetchProduct(path).then(function (product) {
      if (!product || !product.sku || !product.sku.startsWith("EVT_")) {
        unmount();
        return;
      }

      if (mounted) return;

      ensureDeps().then(function () {
        currentMountNode = document.createElement("div");
        slot.appendChild(currentMountNode);
        window.EventPOC.mount(currentMountNode, { product: product });
        mounted = true;
        log("[EventPOC] Mounted on EVT product");
      });
    });
  }

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

  document.addEventListener("DOMContentLoaded", evaluate);
})();
