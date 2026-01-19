# EventPOC BigCommerce Loader

This script dynamically detects **event products** on a BigCommerce store and mounts a React application, while hiding native product options for event products.

## Features

* Hides default product options for event products.
* Dynamically loads React and ReactDOM from a CDN.
* Mounts a custom React component from a specified CDN URL.
* Logs internal operations (optional).

## Installation

1. Copy the content from bc-loader.js.
2. Go to your **BigCommerce theme** Script Manager
3. Create a new `<script>` into the head.
4. Copy and paste script.
    -  ONCE READY FOR PRODUCTION: Replace the `CDNurl` constant with the URL of your CDN React app bundle
5. Save script.

```javascript
const CDNurl = "https://cdn.jsdelivr.net/gh/lucasdiezmiracommerce/event-poc@main/index-min.js"
```

3. Optionally, enable logs for debugging:

```javascript
var ENABLE_LOGS = true;
```

## How It Works

1. **Style Injection**: Adds a `<style>` tag to hide `.productView-details.product-options`.
2. **DOM Detection**: Waits for the DOM to load and finds the `.productView` element.
3. **Product Category Check**: Checks if the product belongs to the "Events" category.
4. **React Mounting**:

   * Creates a `<div>` with `id="rhw"` as the mount point.
   * Dynamically loads React and ReactDOM from a CDN.
   * Loads the custom EventPOC React bundle and mounts it on the page.
5. **Fallback**: If the product is **not an event**, the original options are restored.

## Dependencies

* React 18
* ReactDOM 18

These are dynamically loaded via:

```javascript
const rUrl = "https://unpkg.com/react@18/umd/react.production.min.js"
const rdUrl = "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
```