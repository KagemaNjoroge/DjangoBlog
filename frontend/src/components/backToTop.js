/**

* Back to top component

* Replaces the original jQuery implementation

*/

export default () => ({
  // ==================== state ====================
  isVisible: false,
  isAnimating: false,

  // ==================== initialization ====================
  init() {
    // Initial check scroll position
    this.checkScroll();

    // Listen for scroll events (using debouncing)
    this.handleScroll = this.debounce(this.checkScroll.bind(this), 100);
    window.addEventListener("scroll", this.handleScroll);
  },

  // ==================== destroy ====================
  destroy() {
    window.removeEventListener("scroll", this.handleScroll);
  },

  // ==================== Check scroll position ====================
  checkScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.isVisible = scrollTop > 200;
  },

  // ==================== scroll to top ====================
  scrollToTop() {
    if (this.isAnimating) return;

    this.isAnimating = true;

    // Smooth scrolling using modern APIs
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Add rocket animation effects
    const rocket = this.$el;
    rocket.classList.add("move");

    setTimeout(() => {
      rocket.classList.remove("move");
      this.isAnimating = false;
    }, 800);
  },

  // ==================== Utility function ====================
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
});
