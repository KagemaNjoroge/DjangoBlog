/**
 * MathJax 智能加载器
 * 检测页面是否包含数学公式，如果有则动态加载和配置MathJax
 */
(function () {
  "use strict";

  /**
   * 检测页面是否包含数学公式
   * @returns {boolean} 是否包含数学公式
   */
  function hasMathFormulas() {
    const content = document.body.textContent || document.body.innerText || "";
    // 检测常见的数学公式语法
    return /\$.*?\$|\$\$.*?\$\$|\\begin\{.*?\}|\\end\{.*?\}|\\[a-zA-Z]+\{/.test(
      content,
    );
  }

  /**
   * 配置MathJax
   */
  function configureMathJax() {
    window.MathJax = {
      tex: {
        // 行内公式和块级公式分隔符
        inlineMath: [["$", "$"]],
        displayMath: [["$$", "$$"]],
        // 处理转义字符和LaTeX环境
        processEscapes: true,
        processEnvironments: true,
        // 自动换行
        tags: "ams",
      },
      options: {
        // 跳过这些HTML标签，避免处理代码块等
        skipHtmlTags: [
          "script",
          "noscript",
          "style",
          "textarea",
          "pre",
          "code",
          "a",
        ],
        // CSS类控制
        ignoreHtmlClass: "tex2jax_ignore",
        processHtmlClass: "tex2jax_process",
      },
      // 启动配置
      startup: {
        ready() {
          MathJax.startup.defaultReady();

          // 处理特定区域的数学公式
          const contentEl = document.getElementById("content");
          const commentsEl = document.getElementById("comments");

          const promises = [];
          if (contentEl) {
            promises.push(MathJax.typesetPromise([contentEl]));
          }
          if (commentsEl) {
            promises.push(MathJax.typesetPromise([commentsEl]));
          }

          // 等待所有渲染完成
          Promise.all(promises)
            .then(() => {
              // 触发自定义事件，通知其他脚本MathJax已就绪
              document.dispatchEvent(new CustomEvent("mathjaxReady"));
            })
            .catch((error) => {
              console.error("MathJax Error:", error);
            });
        },
      },
      // 输出配置
      chtml: {
        scale: 1,
        minScale: 0.5,
        matchFontHeight: false,
        displayAlign: "center",
        displayIndent: "0",
      },
    };
  }

  /**
   * 加载MathJax库
   */
  function loadMathJax() {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    script.async = true;
    script.defer = true;

    script.onerror = function () {
      // if mathjax jsdelivr CDN fails, load from cdn.mathjax.org
      const fallbackScript = document.createElement("script");
      fallbackScript.src =
        "https://polyfill.io/v3/polyfill.min.js?features=es6";
      fallbackScript.onload = function () {
        const mathJaxScript = document.createElement("script");
        mathJaxScript.src =
          "https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-MML-AM_CHTML";
        mathJaxScript.async = true;
        document.head.appendChild(mathJaxScript);
      };
      document.head.appendChild(fallbackScript);
    };

    document.head.appendChild(script);
  }

  /**
   * 初始化函数
   */
  function init() {
    // 等待DOM完全加载
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
      return;
    }

    // 检测是否需要加载MathJax
    if (hasMathFormulas()) {
      // 先配置，再加载
      configureMathJax();
      loadMathJax();
    } else {
      console.log("MathJax: No math formulas detected, skipping load.");
    }
  }

  // 提供重新渲染的全局方法，供动态内容使用
  window.rerenderMathJax = function (element) {
    if (window.MathJax && window.MathJax.typesetPromise) {
      const target = element || document.body;
      return window.MathJax.typesetPromise([target]);
    }
    return Promise.resolve();
  };

  // 启动初始化
  init();
})();
