/**
* Comment system component
* Refactored using Alpine.js, replacing the original jQuery implementation
 */

export default () => ({
  // ==================== Status management ====================
  comments: [],
  replyingTo: null,
  replyContent: "",
  isLoading: false,
  error: null,
  articleId: null,

  // ==================== initialization ====================
  init() {
    // Retrieve Article ID from DOM
    this.articleId = this.$el.dataset.articleId;

    if (this.articleId) {
      this.loadComments();
    }
  },

  // ==================== Loading comments ====================
  async loadComments() {
    this.isLoading = true;
    this.error = null;

    try {
      // If you need to load comments via API, uncomment the following code:
      // const response = await fetch(`/api/comments/?article_id=${this.articleId}`);
      // if (!response.ok) throw new Error('Failed to load comments');
      // this.comments = await response.json();
      // Currently, comments are rendered using Django templates; this is just a placeholder.
    } catch (err) {
      this.error = err.message;
    } finally {
      this.isLoading = false;
    }
  },

  // ==================== Reply to comment ====================
  startReply(commentId) {
    this.replyingTo = commentId;
    this.replyContent = "";

    //Focus on the textarea after the DOM is updated.
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

  // ==================== Submit reply ====================
  async submitReply(commentId) {
    if (!this.replyContent.trim()) {
      alert("The reply content cannot be empty.");
      return;
    }

    // Submitting a form using HTMX will not cause a full page refresh.
    const form = document.getElementById("commentform");
    if (!form) {
      alert("Comment form not found, please refresh the page and try again.");
      return;
    }

    // Set parent comment ID
    const parentField = document.getElementById("id_parent_comment_id");
    if (parentField) {
      parentField.value = commentId;
    }

    // Set comment content
    const bodyField = document.querySelector('[name="body"]');
    if (bodyField) {
      bodyField.value = this.replyContent;
    }

    // Trigger HTMX submission (the form already has the hx-post attribute)

    window.htmx.trigger(form, "submit");
  },

  // ==================== Post a new comment ====================
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

      // Reload the comment list
      await this.loadComments();

      // Clear form
      this.replyContent = "";

      // Prompt success
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
    //Retrieve CSRF token from cookie
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
    // The notification implementation is simple and can be optimized later.
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

  // ==================== Judgment method ====================
  isReplying(commentId) {
    return this.replyingTo === commentId;
  },

  canReply() {
    return !this.isLoading;
  },
});
