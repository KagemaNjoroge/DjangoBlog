/**

* Dark Mode core functionality

* Enables theme switching, persistent storage, and system theme following

*/

const STORAGE_KEY = "dark-mode-enabled";
const THEME_ATTR = "data-theme";
const ENABLE_SYSTEM = true;

/**

* Get preferred theme

*/
function getPreferredTheme() {
// 1. Prioritize user-saved preferences
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    return saved === "dark" ? "dark" : "light";
  }

 // 2. If System Preferences Follow is enabled, check system settings.
  if (ENABLE_SYSTEM && window.matchMedia) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }

  // 3. default theme
  return "light";
}

/**
 * Apply theme
 */
function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute(THEME_ATTR, "dark");
    document.body.setAttribute(THEME_ATTR, "dark");
  } else {
    document.documentElement.removeAttribute(THEME_ATTR);
    document.body.removeAttribute(THEME_ATTR);
  }
}

/**
 * Get the current topic
 */
function getCurrentTheme() {
  return document.documentElement.getAttribute(THEME_ATTR) || "light";
}

/**
 * Set theme
 */
function setTheme(theme) {
  const validTheme = theme === "dark" ? "dark" : "light";

  // Apply theme
  applyTheme(validTheme);

  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, validTheme);

  // Trigger custom event
  const event = new CustomEvent("themeChanged", {
    detail: { theme: validTheme },
  });
  document.dispatchEvent(event);

  return validTheme;
}

/**
 * switch theme
 */
function toggleTheme() {
  const current = getCurrentTheme();
  const next = current === "dark" ? "light" : "dark";
  return setTheme(next);
}

/**

* Initialization (anti-flicker)

* Must be executed before DOM rendering

*/
function initTheme() {
  const theme = getPreferredTheme();
  applyTheme(theme);
}

/**
 * Set keyboard shortcuts
 */
function setupKeyboardShortcut() {
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "D") {
      e.preventDefault();
      toggleTheme();
    }
  });
}

/**
 * Monitoring system topic changes
 */
function setupSystemThemeListener() {
  if (!ENABLE_SYSTEM || !window.matchMedia) return;

  const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const listener = function (e) {
    // Follows the system only if the user does not manually set it.
    if (localStorage.getItem(STORAGE_KEY) === null) {
      setTheme(e.matches ? "dark" : "light");
    }
  };

  if (darkModeQuery.addEventListener) {
    darkModeQuery.addEventListener("change", listener);
  } else if (darkModeQuery.addListener) {
    darkModeQuery.addListener(listener);
  }
}

/**
 * Initialize Dark Mode
 */
export function initDarkMode() {
  // Set global API
  window.DarkMode = {
    getCurrentTheme,
    setTheme,
    toggle: toggleTheme,
  };

  // Set keyboard shortcuts
  setupKeyboardShortcut();

  // Monitoring system topic changes
  setupSystemThemeListener();
}

// Perform anti-flicker initialization immediately (when the module loads).
initTheme();
