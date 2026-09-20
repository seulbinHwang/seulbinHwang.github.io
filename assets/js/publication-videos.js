(function () {
  const states = Array.from(document.querySelectorAll(".publication-visual video"), function (video) {
    // Set the live properties as well as HTML attributes before requesting playback.
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    return { video, pending: false, blocked: false, userPaused: false, suspended: false, started: !video.paused };
  });

  function visible(video) {
    const rect = video.getBoundingClientRect();
    return !document.hidden && rect.bottom > 0 && rect.top < window.innerHeight &&
      rect.right > 0 && rect.left < window.innerWidth;
  }

  function play(state) {
    if (!visible(state.video) || state.userPaused || state.pending || !state.video.paused) return;
    state.suspended = false;
    state.pending = true;
    const request = state.video.play();
    Promise.resolve(request).then(function () {
      state.pending = false;
      state.blocked = false;
    }, function (error) {
      state.pending = false;
      state.blocked = error.name === "NotAllowedError";
      // Native controls remain available when Safari requires a user gesture.
    });
  }

  function sync(state) {
    if (visible(state.video)) {
      play(state);
    } else {
      state.suspended = true;
      state.video.pause();
    }
  }

  states.forEach(function (state) {
    const video = state.video;
    video.addEventListener("play", function () {
      state.started = true;
      state.userPaused = false;
      state.blocked = false;
    });
    video.addEventListener("pause", function () {
      if (state.started && !state.suspended && visible(video) && !video.ended) {
        state.userPaused = true;
      }
    });
    video.addEventListener("loadeddata", function () { play(state); });
    video.addEventListener("canplay", function () { play(state); });
    video.addEventListener("ended", function () {
      // Fallback for browsers that reach ended despite the native loop property.
      state.userPaused = false;
      video.currentTime = 0;
      play(state);
    });
    sync(state);
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        sync(states.find(function (state) { return state.video === entry.target; }));
      });
    });
    states.forEach(function (state) { observer.observe(state.video); });
  } else {
    window.addEventListener("scroll", function () { states.forEach(sync); }, { passive: true });
  }

  document.addEventListener("visibilitychange", function () { states.forEach(sync); });
  window.addEventListener("pageshow", function () { states.forEach(sync); });
  ["pointerup", "touchend", "keydown"].forEach(function (eventName) {
    document.addEventListener(eventName, function (event) {
      if (event.target.closest && event.target.closest("video")) return;
      states.forEach(function (state) { if (state.blocked) play(state); });
    }, { passive: true });
  });
})();
