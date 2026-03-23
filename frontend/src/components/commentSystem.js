/**
 * 评论系统组件
 * 使用Alpine.js重构，替代原有的jQuery实现
 */

export default () => ({
  // ==================== 状态管理 ====================
  comments: [],
  replyingTo: null,
  replyContent: "",
  isLoading: false,
  error: null,
  articleId: null,

  // ==================== 初始化 ====================
  init() {
    // 从DOM中获取文章ID
    this.articleId = this.$el.dataset.articleId;

    if (this.articleId) {
      this.loadComments();
    }
  },

  // ==================== 加载评论 ====================
  async loadComments() {
    this.isLoading = true;
    this.error = null;

    try {
      // 如果需要通过API加载，取消注释以下代码
      // const response = await fetch(`/api/comments/?article_id=${this.articleId}`);
      // if (!response.ok) throw new Error('Failed to load comments');
      // this.comments = await response.json();
      // 目前评论由Django模板渲染，这里只是占位
    } catch (err) {
      this.error = err.message;
    } finally {
      this.isLoading = false;
    }
  },

  // ==================== 回复评论 ====================
  startReply(commentId) {
    this.replyingTo = commentId;
    this.replyContent = "";

    // 等待DOM更新后聚焦到textarea
    this.$nextTick(() => {
      const textarea = document.querySelector(`#reply-textarea-${commentId}`);
      if (textarea) {
        textarea.focus();
      }
    });
  },

  cancelReply() {
    this.replyingTo = null;
    this.replyContent = "";
  },

  // ==================== 提交回复 ====================
  async submitReply(commentId) {
    if (!this.replyContent.trim()) {
      alert("The reply content cannot be empty.");
      return;
    }

    // 使用HTMX提交表单，不会导致整页刷新
    const form = document.getElementById("commentform");
    if (!form) {
      alert("Comment form not found, please refresh the page and try again.");
      return;
    }

    // 设置父评论ID
    const parentField = document.getElementById("id_parent_comment_id");
    if (parentField) {
      parentField.value = commentId;
    }

    // 设置评论内容
    const bodyField = document.querySelector('[name="body"]');
    if (bodyField) {
      bodyField.value = this.replyContent;
    }

    // 触发HTMX提交（表单上已有hx-post属性）

    window.htmx.trigger(form, "submit");
  },

  // ==================== 发布新评论 ====================
  async submitComment() {
    if (!this.replyContent.trim()) {
      alert("Comment content cannot be empty.");
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const csrfToken = this.getCsrfToken();

      const response = await fetch("/api/comments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          article_id: this.articleId,
          content: this.replyContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit comment");
      }

      const data = await response.json();

      // 重新加载评论列表
      await this.loadComments();

      // 清空表单
      this.replyContent = "";

      // 提示成功
      this.showNotification("Comment successful!");
    } catch (err) {
      this.error = err.message;

      alert("Failed to submit comment:" + err.message);
    } finally {
      this.isLoading = false;
    }
  },

  // ==================== 工具函数 ====================
  getCsrfToken() {
    // 从cookie中获取CSRF token
    const name = "csrftoken";
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  },

  showNotification(message) {
    // 简单的通知实现，可以后续优化
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add(
        "opacity-0",
        "transition-opacity",
        "duration-300",
      );
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  // ==================== 判断方法 ====================
  isReplying(commentId) {
    return this.replyingTo === commentId;
  },

  canReply() {
    return !this.isLoading;
  },
});
