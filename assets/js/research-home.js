(function () {
  const video = document.querySelector(".featured-media video");
  if (!video) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function syncMotionPreference() {
    if (reducedMotion.matches) {
      video.removeAttribute("autoplay");
      video.pause();
      return;
    }

    if (video.getBoundingClientRect().top < window.innerHeight &&
        video.getBoundingClientRect().bottom > 0) {
      video.play().catch(function () {
        // The poster and native controls remain available when autoplay is blocked.
      });
    }
  }

  const observer = new IntersectionObserver(function (entries) {
    const entry = entries[0];
    if (reducedMotion.matches || !entry.isIntersecting) {
      video.pause();
    } else {
      video.play().catch(function () {});
    }
  }, { threshold: 0.22 });

  observer.observe(video);
  syncMotionPreference();

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", syncMotionPreference);
  }
})();
