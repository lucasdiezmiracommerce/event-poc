// src/EventPOC.tsx
import Script from "next/script";
import { jsx } from "react/jsx-runtime";
var LOADER_SRC = "https://cdn.jsdelivr.net/gh/lucasdiezmiracommerce/event-poc@c27782e/loader.js";
function EventPOC() {
  return /* @__PURE__ */ jsx(
    Script,
    {
      id: "eventpoc-loader",
      src: LOADER_SRC,
      strategy: "afterInteractive"
    }
  );
}
export {
  EventPOC
};
