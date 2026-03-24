/**
* Emoji Reaction Picker Component
* Adds GitHub-style emoji reactions to comments.
 */

export default (commentId) => {
  return {
    // ==================== Status management ====================
    reactions: {},
    showPicker: false,
    isLoading: false,

    // ==================== initialization ====================
    init() {
      // Initial data (SSR) is read first from the data attribute.
      this.loadFromDataAttribute();
    },

    // ==================== Load (SSR data) from the data attribute====================
    loadFromDataAttribute() {
      try {
        const dataAttr = this.$el.dataset.reactions;
        if (dataAttr) {
          this.reactions = JSON.parse(dataAttr);
        } else {
          // If SSR data is unavailable, degrade to API loading.
          this.loadFromAPI();
        }
      } catch (error) {
        // Parsing failed, downgraded to API loading.
        this.loadFromAPI();
      }
    },

    // ==================== Loading from API (fallback solution)====================
    async loadFromAPI() {
      try {
        this.isLoading = true;
        const response = await fetch(`/comment/${commentId}/react`);

        if (!response.ok) {
          throw new Error("Failed to load reactions");
        }

        const data = await response.json();
        if (data.success) {
          this.reactions = data.reactions || {};
        }
      } catch (error) {
        this.reactions = {};
      } finally {
        this.isLoading = false;
      }
    },

    // ==================== Format user list ====================
    /**
     * Format the user list text for tooltip display.
     * @param {Array} users - Username array
     * @param {number} totalCount - Total number of likes
     * @returns {string} Formatted text
     */
    formatUsersText(users, totalCount) {
      if (!users || users.length === 0) {
        return "None yet";
      }

      if (users.length === totalCount) {
        // Show all users
        return users.join(", ");
      } else {
        // Display the top few users and indicate how many people are left.
        const displayUsers = users.slice(0, 5).join(", ");
        const remaining = totalCount - users.length;
        if (remaining > 0) {
          return `${displayUsers} and others ${remaining} people`;
        }
        return displayUsers;
      }
    },

    // ==================== Check login status ====================
    /**
     * Check if the user is logged in
     * @returns {boolean}
     */
    isAuthenticated() {
      return document.body.dataset.authenticated === "true";
    },

    // ==================== Show login prompt ====================
    showLoginPrompt() {
      const loginUrl = `/login/?next=${encodeURIComponent(window.location.pathname)}`;

      // Create attractive tooltips
      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in";
      modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
        <div class="flex items-center mb-4">
          <svg class="w-6 h-6 text-primary-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">需要登录</h3>
        </div>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          The "like" function requires you to log in. Do you want to go to the login page?
        </p>
        <div class="flex gap-3 justify-end">
          <button id="modal-cancel" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Cancel
          </button>
          <button id="modal-confirm" class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            Go to login
          </button>
        </div>
      </div>
    `;

      document.body.appendChild(modal);

      // Binding events
      const cancelBtn = modal.querySelector("#modal-cancel");
      const confirmBtn = modal.querySelector("#modal-confirm");

      cancelBtn.addEventListener("click", () => {
        modal.classList.add("animate-fade-out");
        setTimeout(() => modal.remove(), 200);
      });

      confirmBtn.addEventListener("click", () => {
        window.location.href = loginUrl;
      });

      // Click on the background to close
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.add("animate-fade-out");
          setTimeout(() => modal.remove(), 200);
        }
      });
    },

    // ==================== Switch Reaction ====================
    /**
     * Switch Reaction (Add or delete)
     * @param {string} emoji - emoji 字符
     */
    async toggleReaction(emoji) {
      // Check login status
      if (!this.isAuthenticated()) {
        this.showLoginPrompt();
        return;
      }

      try {
        // Get CSRF token
        const csrfToken = this.getCsrfToken();

        if (!csrfToken) {
          this.showNotification(
            "Unable to obtain security token, please refresh the page and try again.",
            "error",
          );
          return;
        }

        // Send request
        const formData = new FormData();
        formData.append("reaction_type", emoji);
        formData.append("csrfmiddlewaretoken", csrfToken);

        const response = await fetch(`/comment/${commentId}/react`, {
          method: "POST",
          body: formData,
          headers: {
            "X-CSRFToken": csrfToken,
          },
        });

        if (!response.ok) {
           // Handling 401 Unauthorized Error
          if (response.status === 401) {
            this.showNotification(
              "Your login has expired. Please log in again.",
              "error",
            );
            setTimeout(() => {
              window.location.href = `/login/?next=${encodeURIComponent(window.location.pathname)}`;
            }, 1500);
            return;
          }
          throw new Error("Failed to toggle reaction");
        }

        const data = await response.json();

        if (data.success) {
          // Update local reactions data
          this.reactions = data.reactions;
          this.showPicker = false;
        } else {
          throw new Error(data.error || "Operation failed");
        }
      } catch (error) {
        this.showNotification("Operation failed, please try again.", "error");
      }
    },

    // ==================== Show notification ====================
    /**
     * Displaying aesthetically pleasing notification messages
     * @param {string} message - Message content
     * @param {string} type - Message type：success, error, info
     */
    showNotification(message, type = "info") {
      const colors = {
        success: "bg-green-500",
        error: "bg-red-500",
        info: "bg-blue-500",
      };

      const icons = {
        success:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>',
        error:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>',
        info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
      };

      const notification = document.createElement("div");
      notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-in-right max-w-md`;
      notification.innerHTML = `
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${icons[type]}
      </svg>
      <span>${message}</span>
    `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.add("animate-fade-out");
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },

    // ==================== Utility function ====================
    /**
     * Retrieve CSRF token from cookie
     * @returns {string|null} CSRF token
     */
    getCsrfToken() {
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
  };
};
