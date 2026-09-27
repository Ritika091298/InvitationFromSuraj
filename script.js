/* =========================================================
   Suraj & Ritika — Wedding Invitation
   Countdown · Language toggle (EN/HI) · Fireworks
   ========================================================= */

(function () {
  "use strict";

  /* ---------------- Language toggle ---------------- */
  const langButtons = document.querySelectorAll(".lang-btn");
  const htmlEl = document.documentElement;

  function applyLanguage(lang) {
    htmlEl.setAttribute("lang", lang);
    document.querySelectorAll("[data-en]").forEach((el) => {
      const val = el.getAttribute("data-" + lang);
      if (val === null) return;
      // Buttons with icons keep their inner HTML text
      el.innerHTML = val;
    });
    langButtons.forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-lang") === lang)
    );
    try { localStorage.setItem("weddingLang", lang); } catch (e) {}
  }

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => applyLanguage(btn.getAttribute("data-lang")));
  });

  let savedLang = "en";
  try { savedLang = localStorage.getItem("weddingLang") || "en"; } catch (e) {}
  applyLanguage(savedLang);

  /* ---------------- Countdown to the wedding ---------------- */
  // 5th December 2026, 00:00 local time
  const weddingDate = new Date(2026, 11, 5, 0, 0, 0).getTime();

  const elDays = document.getElementById("cd-days");
  const elHours = document.getElementById("cd-hours");
  const elMins = document.getElementById("cd-mins");
  const elSecs = document.getElementById("cd-secs");
  const timerEl = document.getElementById("countdown-timer");
  const doneEl = document.getElementById("countdown-done");

  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const diff = weddingDate - Date.now();
    if (diff <= 0) {
      if (timerEl) timerEl.style.display = "none";
      if (doneEl) doneEl.hidden = false;
      launchFireworks(24);
      clearInterval(cdInterval);
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (elDays) elDays.textContent = pad(days);
    if (elHours) elHours.textContent = pad(hours);
    if (elMins) elMins.textContent = pad(mins);
    if (elSecs) elSecs.textContent = pad(secs);
  }
  tick();
  const cdInterval = setInterval(tick, 1000);

  /* ---------------- Reveal on scroll ---------------- */
  const revealTargets = document.querySelectorAll(
    ".section-title, .person, .event-card, .venue-card, .quote, .countdown"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => io.observe(el));

  /* ---------------- Full-invitation wedding music ---------------- */
  // Browsers generally require a user gesture before playing audio.
  // Once started, the instrumental keeps looping for the full invitation.
  const bgMusic = document.getElementById("bg-music");
  let musicStarted = false;
  let audioContext = null;
  let mediaSource = null;

  function enhanceMusicClarity() {
    if (!bgMusic || audioContext) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      audioContext = new AudioCtx();
      mediaSource = audioContext.createMediaElementSource(bgMusic);

      const lowShelf = audioContext.createBiquadFilter();
      lowShelf.type = "lowshelf";
      lowShelf.frequency.value = 180;
      lowShelf.gain.value = 0.5;

      const highShelf = audioContext.createBiquadFilter();
      highShelf.type = "highshelf";
      highShelf.frequency.value = 2600;
      highShelf.gain.value = 2.2;

      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 2;
      compressor.attack.value = 0.02;
      compressor.release.value = 0.22;

      mediaSource
        .connect(lowShelf)
        .connect(highShelf)
        .connect(compressor)
        .connect(audioContext.destination);
    } catch (e) {
      // Fall back to normal HTML audio if Web Audio is unavailable.
    }
  }

  function startWeddingMusic() {
    if (!bgMusic) return;

    enhanceMusicClarity();

    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    bgMusic.loop = true;
    bgMusic.volume = 0.58;

    if (!bgMusic.paused) {
      musicStarted = true;
      return;
    }

    const playPromise = bgMusic.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => { musicStarted = true; })
        .catch(() => {
          // A later tap/click will retry if autoplay was blocked.
        });
    } else {
      musicStarted = true;
    }
  }

  // Some browsers may allow this immediately; otherwise the envelope tap
  // below starts playback. Music is intentionally never stopped on entry.
  startWeddingMusic();

  /* ---------------- Envelope intro ---------------- */
  const overlay = document.getElementById("envelope-overlay");
  const envelope = document.getElementById("envelope");
  const envHint = document.getElementById("envelope-hint");
  const enterBtn = document.getElementById("enter-btn");
  let envelopeOpened = false;

  function openEnvelope() {
    if (envelopeOpened || !envelope) return;
    startWeddingMusic();
    envelopeOpened = true;
    envelope.classList.add("opening");
    if (envHint) envHint.classList.add("hide");
    setTimeout(() => {
      if (enterBtn) enterBtn.hidden = false;
    }, 1100);
  }

  function closeOverlay() {
    if (!overlay) return;
    startWeddingMusic();
    overlay.classList.add("open-done");
    document.body.style.overflow = "";
  }

  if (envelope) {
    document.body.style.overflow = "hidden"; // lock scroll until opened
    envelope.addEventListener("click", openEnvelope);
    envelope.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnvelope(); }
    });
  }
  if (enterBtn) enterBtn.addEventListener("click", closeOverlay);


  /* ---------------- Stop music only at the end of the page ---------------- */
  let endFadeStarted = false;

  function fadeMusicAtPageEnd(duration = 2200) {
    if (!bgMusic || bgMusic.paused || endFadeStarted) return;
    endFadeStarted = true;

    const startVolume = bgMusic.volume;
    const steps = 28;
    const stepTime = Math.max(30, Math.floor(duration / steps));
    let step = 0;

    const fadeTimer = setInterval(() => {
      step += 1;
      bgMusic.volume = Math.max(0, startVolume * (1 - step / steps));

      if (step >= steps) {
        clearInterval(fadeTimer);
        bgMusic.pause();
        bgMusic.volume = startVolume;
      }
    }, stepTime);
  }

  function checkForPageEnd() {
    if (!bgMusic || endFadeStarted) return;

    const scrollBottom = window.scrollY + window.innerHeight;
    const pageBottom = document.documentElement.scrollHeight;

    // Keep music playing through the footer. Fade only when the visitor
    // has genuinely reached the bottom edge of the invitation.
    if (scrollBottom >= pageBottom - 8) {
      fadeMusicAtPageEnd();
    }
  }

  window.addEventListener("scroll", checkForPageEnd, { passive: true });
  window.addEventListener("resize", checkForPageEnd);

  /* ---------------- Scratch card ---------------- */
  const scratchCanvas = document.getElementById("scratch-canvas");
  const scratchTip = document.getElementById("scratch-tip");
  if (scratchCanvas) {
    const sctx = scratchCanvas.getContext("2d", { willReadFrequently: true });
    let scratching = false;
    let scratchCleared = false;

    function paintCover() {
      const rect = scratchCanvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      scratchCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
      scratchCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Gold foil cover
      const grad = sctx.createLinearGradient(0, 0, rect.width, rect.height);
      grad.addColorStop(0, "#c9a24b");
      grad.addColorStop(0.4, "#e6c874");
      grad.addColorStop(0.6, "#b8892f");
      grad.addColorStop(1, "#e6c874");
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, rect.width, rect.height);

      // Sparkle texture
      sctx.fillStyle = "rgba(255,255,255,0.35)";
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        sctx.beginPath();
        sctx.arc(x, y, Math.random() * 1.6, 0, Math.PI * 2);
        sctx.fill();
      }

      // Label
      sctx.fillStyle = "#5c0f1b";
      sctx.font = "600 20px 'Cinzel', serif";
      sctx.textAlign = "center";
      sctx.textBaseline = "middle";
      sctx.fillText("\u2726  SCRATCH HERE  \u2726", rect.width / 2, rect.height / 2);
    }
    paintCover();
    window.addEventListener("resize", () => { if (!scratchCleared) paintCover(); });

    function pointerPos(e) {
      const rect = scratchCanvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    function scratchAt(x, y) {
      sctx.globalCompositeOperation = "destination-out";
      sctx.beginPath();
      sctx.arc(x, y, 22, 0, Math.PI * 2);
      sctx.fill();
      sctx.globalCompositeOperation = "source-over";
    }
    function checkCleared() {
      const img = sctx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height);
      let transparent = 0;
      let sampled = 0;
      // sample every 8th pixel for performance
      for (let i = 3; i < img.data.length; i += 32) {
        if (img.data[i] === 0) transparent++;
        sampled++;
      }
      if (transparent / sampled > 0.5) revealAll();
    }
    function revealAll() {
      if (scratchCleared) return;
      scratchCleared = true;
      scratchCanvas.classList.add("cleared");
      if (scratchTip) scratchTip.classList.add("hide");
      const countdownSection = document.getElementById("countdown");
      if (countdownSection) {
        countdownSection.classList.remove("locked");
        countdownSection.classList.add("reveal-in");
      }
      if (window.launchFireworks) window.launchFireworks(8);
    }

    function startScratch(e) { scratching = true; const p = pointerPos(e); scratchAt(p.x, p.y); }
    function moveScratch(e) {
      if (!scratching || scratchCleared) return;
      e.preventDefault();
      const p = pointerPos(e);
      scratchAt(p.x, p.y);
    }
    function endScratch() {
      if (!scratching) return;
      scratching = false;
      if (!scratchCleared) checkCleared();
    }

    scratchCanvas.addEventListener("mousedown", startScratch);
    scratchCanvas.addEventListener("mousemove", moveScratch);
    window.addEventListener("mouseup", endScratch);
    scratchCanvas.addEventListener("touchstart", startScratch, { passive: false });
    scratchCanvas.addEventListener("touchmove", moveScratch, { passive: false });
    scratchCanvas.addEventListener("touchend", endScratch);
  }

  /* ---------------- Fireworks ---------------- */
  const canvas = document.getElementById("fireworks");
  const ctx = canvas.getContext("2d");
  let particles = [];
  let animating = false;
  let animFrame = null;

  const GOLD = ["#c9a24b", "#e6c874", "#f2e2b8", "#ffd86b", "#fff2c0"];
  const FESTIVE = ["#ff6b6b", "#ffd93d", "#ff8fab", "#c9a24b", "#f9f871", "#ffb4a2"];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  function burst(x, y, palette) {
    const count = 60 + Math.floor(Math.random() * 40);
    const hueSet = palette || (Math.random() > 0.5 ? GOLD : FESTIVE);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 4.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        color: hueSet[Math.floor(Math.random() * hueSet.length)],
        size: 1.5 + Math.random() * 2,
      });
    }
  }

  function loop() {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "lighter";

    particles.forEach((p) => {
      p.vy += 0.03; // gravity
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    particles = particles.filter((p) => p.life > 0);
    ctx.globalAlpha = 1;

    if (particles.length > 0) {
      animFrame = requestAnimationFrame(loop);
    } else {
      animating = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animFrame);
    }
  }

  function launchFireworks(shots) {
    resize();
    const total = shots || 10;
    let fired = 0;
    if (!animating) { animating = true; loop(); }
    const iv = setInterval(() => {
      const x = canvas.width * (0.15 + Math.random() * 0.7);
      const y = canvas.height * (0.15 + Math.random() * 0.45);
      burst(x, y);
      fired++;
      if (fired >= total) clearInterval(iv);
    }, 320);
  }

  // Expose for countdown completion
  window.launchFireworks = launchFireworks;

  const receptionBtn = document.getElementById("reception-fireworks-btn");
  if (receptionBtn) receptionBtn.addEventListener("click", () => launchFireworks(14));
})();
