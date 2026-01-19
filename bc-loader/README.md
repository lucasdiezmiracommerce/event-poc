# event-poc

A lightweight React proof-of-concept for injecting a custom React UI into a BigCommerce product page using a CDN-hosted bundle.

This project demonstrates how to dynamically replace or extend BigCommerce’s native product option UI without modifying theme source files directly.

---

## Overview

The integration works by:

1. Loading React and ReactDOM dynamically.
2. Creating a mount node inside the BigCommerce product container.
3. Loading a compiled JavaScript bundle from a CDN.
4. Calling a global `mount()` function from that bundle to render the React application.

---

## Installation Workflow

1. Build your React bundle into a single JavaScript file (for example `index-min.js`).
2. Upload that file to your preferred CDN.
3. Copy the public CDN URL.
4. Insert that URL into your BigCommerce script loader.
5. Add the loader to BigCommerce using Script Manager or directly in the theme.

---

## Bundle Contract

Deployed bundle must expose a global object named in this case `EventPOC` on the `window` object.

Example structure:

    window.EventPOC = {
      mount: function (el) {
        ReactDOM.createRoot(el).render(React.createElement(HelloWorld));
      }
    };

---

## Requirements

- The object name must be exactly `EventPOC` for this specific scenario, it can be whatever you want.
- The object must contain a `mount()` method.
- The `mount()` method receives the DOM element where the React app will render.
- Your React component must exist in the same bundle.
- React and ReactDOM are loaded before your bundle runs.

---

## Runtime Behavior

When the loader runs on the storefront:

1. A script gets created with the loader and attached to the Head of the BC Site for detection of Event Product
2. Detection happens by looking for the following Custom Field: `_product-type` : `event`
2. If ok, it proceeds.
2. The native BigCommerce product options section is hidden.
2. A mount node is created inside the product container.
3. Your CDN-hosted bundle is loaded.
4. The loader calls `window.EventPOC.mount(mountNode)`.
5. Your React UI renders in place of the default product options.

---

## Purpose

This repository demonstrates:

- Injecting React apps into BigCommerce
- Hosting React bundles on a CDN
- Overriding BigCommerce product option rendering
- Keeping storefront logic separate from theme source code

---
