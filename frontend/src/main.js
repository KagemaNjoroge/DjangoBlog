/**

* Main entry file for the Django Blog frontend

* Modern server-side rendering using Alpine.js + HTMX

*/
// Import style files (required for Vite development mode)
import "./styles/main.css";

import collapse from "@alpinejs/collapse";
import focus from "@alpinejs/focus";
import intersect from "@alpinejs/intersect";
import Alpine from "alpinejs";
import htmx from "htmx.org";

// Import Dark Mode (will automatically initialize anti-flicker)
import { initDarkMode } from "./features/darkMode.js";

// Register Alpine plugin
Alpine.plugin(focus);
Alpine.plugin(intersect);
Alpine.plugin(collapse);

//Import components
import backToTop from "./components/backToTop.js";
import commentSystem from "./components/commentSystem.js";
import imageLightbox from "./components/imageLightbox.js";
import navigation from "./components/navigation.js";
import reactionPicker from "./components/reactionPicker.js";
// Register global Alpine data components
Alpine.data("commentSystem", commentSystem);
Alpine.data("backToTop", backToTop);
Alpine.data("navigation", navigation);
Alpine.data("imageLightbox", imageLightbox);
Alpine.data("reactionPicker", reactionPicker);

// Global utility functions
window.Alpine = Alpine;
window.htmx = htmx;

// Start Alpine
Alpine.start();

// Initialize Dark Mode
initDarkMode();

// HTMX Configuration
htmx.config.defaultSwapStyle = "innerHTML";
htmx.config.defaultSwapDelay = 0;
htmx.config.defaultSettleDelay = 20;

// HTMX boost configuration: Automatically extract #main content
document.body.addEventListener("htmx:beforeSwap", function (evt) {
  // For Boost requests, ensure that the content is retrieved correctly.
  if (evt.detail.boosted && evt.detail.target.id === "main") {
    // console.log("HTMX boost navigation:", evt.detail.pathInfo.requestPath);
  }
});

//After HTMX loads, reinitialize the Alpine components.
document.body.addEventListener("htmx:afterSwap", function (evt) {
  // Alpine automatically detects new DOM elements and initializes them.

  // Scroll to top (optional)）
  if (evt.detail.boosted) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// NProgress page loading progress bar (original functionality retained)
import NProgress from "./utils/nprogress.js";
NProgress.configure({ showSpinner: false });

// Progress bar during page loading
NProgress.start();
NProgress.set(0.4);

const interval = setInterval(() => {
  NProgress.inc();
}, 1000);

window.addEventListener("DOMContentLoaded", () => {
  NProgress.done();
  clearInterval(interval);
});

// Progress bar during page navigation
window.addEventListener("beforeunload", () => {
  NProgress.start();
});

// HTMX event listeners - in conjunction with NProgress
document.body.addEventListener("htmx:beforeRequest", () => {
  NProgress.start();
});

document.body.addEventListener("htmx:afterRequest", () => {
  NProgress.done();
});
