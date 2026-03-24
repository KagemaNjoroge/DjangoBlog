/**
* Image Lightbox Component
* Click on the image in the article to view a larger version.
 */
export default function imageLightbox() {
  return {
    showLightbox: false,
    currentImage: "",
    currentAlt: "",

    init() {
      // Add click events to all images in the article content
      this.$nextTick(() => {
        const images = document.querySelectorAll(".entry-content img");
        images.forEach((img) => {
          //Exclude badge images and small images (no need to view large images).
          const isBadge =
            img.src.includes("badge.svg") ||
            img.src.includes("shields.io") ||
            img.src.includes("/badge/") ||
            img.alt.toLowerCase().includes("badge");

          // Exclude images smaller than 200px
          const isSmallImage =
            img.naturalWidth < 200 || img.naturalHeight < 200;

          if (!isBadge && !isSmallImage) {
            img.addEventListener("click", (e) => {
              e.preventDefault();
              this.openLightbox(img.src, img.alt || "");
            });
          }
        });
      });
    },

    openLightbox(src, alt) {
      this.currentImage = src;
      this.currentAlt = alt;
      this.showLightbox = true;
      document.body.style.overflow = "hidden";
    },

    closeLightbox() {
      this.showLightbox = false;
      document.body.style.overflow = "";
    },

    handleKeydown(e) {
      if (e.key === "Escape") {
        this.closeLightbox();
      }
    },
  };
}
