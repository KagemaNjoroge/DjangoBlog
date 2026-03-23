/**
 * 回到顶部组件
 * 替代原有的jQuery实现
 */

export default () => ({
  // ==================== 状态 ====================
  isVisible: false,
  isAnimating: false,

  // ==================== 初始化 ====================
  init() {
    // 初始检查滚动位置
    this.checkScroll();

    // 监听滚动事件（使用防抖）
    this.handleScroll = this.debounce(this.checkScroll.bind(this), 100);
    window.addEventListener("scroll", this.handleScroll);
  },

  // ==================== 销毁 ====================
  destroy() {
    window.removeEventListener("scroll", this.handleScroll);
  },

  // ==================== 检查滚动位置 ====================
  checkScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.isVisible = scrollTop > 200;
  },

  // ==================== 滚动到顶部 ====================
  scrollToTop() {
    if (this.isAnimating) return;

    this.isAnimating = true;

    // 使用现代API平滑滚动
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // 添加火箭动画效果
    const rocket = this.$el;
    rocket.classList.add("move");

    setTimeout(() => {
      rocket.classList.remove("move");
      this.isAnimating = false;
    }, 800);
  },

  // ==================== 工具函数 ====================
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
