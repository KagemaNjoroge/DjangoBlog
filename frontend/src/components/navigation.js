/**
* Navigation bar component
* Handles mobile menus, search, and other interactions
 */

export default () => ({
  // ==================== state ====================
  menuOpen: false,
  windowWidth: window.innerWidth,
  isSearchOpen: false,
  searchQuery: "",

  // ==================== initialization ====================
  init() {
    // Listen for changes in window size
    window.addEventListener("resize", () => {
      this.windowWidth = window.innerWidth;
      if (window.innerWidth >= 768 && this.menuOpen) {
        this.menuOpen = false;
        document.body.style.overflow = "";
      }
    });

    // Listen for HMX navigation events and automatically close the mobile menu.
    document.body.addEventListener("htmx:beforeRequest", (event) => {
      // If the request is triggered by a navigation link and the device is in mobile mode, then close the menu.
      if (this.windowWidth < 768 && this.menuOpen) {
        this.closeMobileMenu();
      }
    });
  },

  // ==================== Mobile menu ====================
  toggleMenu() {
    this.menuOpen = !this.menuOpen;

    // Preventing background scrolling on mobile devices
    if (this.windowWidth < 768) {
      if (this.menuOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  },

  closeMobileMenu() {
    this.menuOpen = false;
    document.body.style.overflow = "";
  },

  // ==================== Search function ====================
  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;

    if (this.isSearchOpen) {
      // Focus on the search box
      this.$nextTick(() => {
        this.$refs.searchInput?.focus();
      });
    }
  },

  submitSearch() {
    if (this.searchQuery.trim()) {
      window.location.href = `/search/?q=${encodeURIComponent(this.searchQuery)}`;
    }
  },

  // ==================== Theme switching (in conjunction with the dark_mode plugin) ====================
  toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  },
});
