"use client"

import Script from "next/script"
import React from "react"

// replace later
const LOADER_SRC =
  "https://cdn.jsdelivr.net/gh/lucasdiezmiracommerce/event-poc@c27782e/loader.js"

export function EventPOC() {
  return (
    <Script
      id="eventpoc-loader"
      src={LOADER_SRC}
      strategy="afterInteractive"
    />
  )
}
