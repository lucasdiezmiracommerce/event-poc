<script>
  (function () {

  if (window.__EVENTPOC_LOADED__) return;
  window.__EVENTPOC_LOADED__ = true;

  var ENABLE_LOGS = false;

  function log() {
    if (ENABLE_LOGS) console.log.apply(console, arguments);
  }

  log("[EventPOC] Loader start");

  var styleTag = document.createElement("style");
  styleTag.id = "eventpoc-style";
  styleTag.innerHTML = "section.productView-details.product-options { display: none !important; }";
  document.head.appendChild(styleTag);

  function loadScript(src, callback) {
    var script = document.createElement("script");
    script.src = src;
    script.onload = function () {
      callback && callback();
    };
    document.head.appendChild(script);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var productRoot = document.querySelector(".productView");
    if (!productRoot) return;

    log("[EventPOC] Product root found");

    var categoryAttr = productRoot.getAttribute("data-product-category") || "";
    var isEventProduct = categoryAttr.indexOf("Events") !== -1;

    if (!isEventProduct) {
      log("[EventPOC] Not an event product — restoring native options");
      var existingStyle = document.getElementById("eventpoc-style");
      if (existingStyle) existingStyle.remove();
      return;
    }

    log("[EventPOC] Event product detected — mounting React");

    var mountNode = document.createElement("div");
    mountNode.id = "rhw";
    productRoot.appendChild(mountNode);

    // REPLACE URL HERE
    const CDNurl = "https://cdn.jsdelivr.net/gh/lucasdiezmiracommerce/event-poc@main/index-min.js"
    // REPLACE URL HERE

    const rUrl = "https://unpkg.com/react@18/umd/react.production.min.js"
    const rdUrl = "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"

    loadScript(rUrl, function () {
      loadScript(rdUrl, function () {
        loadScript(CDNurl, function () {
          if (window.EventPOC && window.EventPOC.mount) {
            window.EventPOC.mount(mountNode);
            log("[EventPOC] Finished mounting");
          }
        });
      });
    });
  });
})();
  </script>
