/* =========================================================
   LA FLAMA RESTAURANT — script.js
   Lenis smooth scroll · GSAP scroll reveals & parallax ·
   Swiper galleries · nav · mobile menu · menu tabs · counters
   ========================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky nav solidify ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (window.scrollY > 60) nav.classList.add("is-solid");
    else nav.classList.remove("is-solid");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile overlay menu ---------- */
  const toggle = document.getElementById("navToggle");
  const overlay = document.getElementById("overlayMenu");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    overlay.classList.toggle("is-open", open);
    overlay.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setMenu(!overlay.classList.contains("is-open")));
  overlay.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) setMenu(false);
  });

  /* ---------- Menu tabs ---------- */
  const tabs = Array.from(document.querySelectorAll(".menu__tab"));
  const panels = document.querySelectorAll(".menu__panel");
  const activateTab = (tab, focus) => {
    const target = tab.dataset.tab;
    tabs.forEach((t) => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === target));
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => activateTab(tab, false));
    tab.addEventListener("keydown", (e) => {
      let next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); activateTab(next, true); }
    });
  });

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (!prefersReduced && typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* Anchor links -> use Lenis (or native) and account for nav height */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id === "#" || id === "#top") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -70 });
      else el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  /* ---------- GSAP setup ---------- */
  const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);

    // Keep ScrollTrigger in sync with Lenis
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    if (!prefersReduced) {
      /* Hero headline lines rise in */
      gsap.from(".hero__title .line", {
        yPercent: 115, opacity: 0, duration: 1.1, ease: "power4.out",
        stagger: 0.12, delay: 0.15
      });
      gsap.from(".hero__eyebrow, .hero__tagline, .hero__cta", {
        y: 24, opacity: 0, duration: 1, ease: "power3.out",
        stagger: 0.12, delay: 0.5
      });

      /* Hero Ken-Burns + parallax */
      gsap.to(".hero__img", {
        scale: 1.16, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
      gsap.to(".hero__media", {
        yPercent: 14, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });

      /* Parallax bands */
      document.querySelectorAll("[data-parallax] img, [data-parallax]").forEach((el) => {
        if (el.closest(".hero")) return;
        gsap.to(el, {
          yPercent: 12, ease: "none",
          scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true }
        });
      });
    }
  }

  /* ---------- Reveal on scroll (IntersectionObserver, robust fallback) ---------- */
  const reveals = document.querySelectorAll("[data-reveal]");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- Animated stat counters ---------- */
  const counters = document.querySelectorAll(".stat__num[data-count]");
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const isYear = target > 1900 && decimals === 0; // year: no thousands sep
    if (prefersReduced) {
      el.textContent = (decimals ? target.toFixed(decimals) : target.toLocaleString()) + suffix;
      return;
    }
    const dur = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      let out;
      if (decimals) out = val.toFixed(decimals);
      else if (isYear) out = Math.round(val).toString();
      else out = Math.round(val).toLocaleString();
      el.textContent = out + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { runCounter(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- Swiper: Gallery ---------- */
  if (typeof Swiper !== "undefined") {
    new Swiper(".gallerySwiper", {
      slidesPerView: "auto",
      spaceBetween: 22,
      grabCursor: true,
      centeredSlides: false,
      navigation: { nextEl: ".gallerySwiper .swiper-button-next", prevEl: ".gallerySwiper .swiper-button-prev" },
      pagination: { el: ".gallerySwiper .swiper-pagination", clickable: true },
      breakpoints: { 320: { spaceBetween: 14 }, 768: { spaceBetween: 22 } }
    });

    /* ---------- Swiper: Reviews ---------- */
    new Swiper(".reviewsSwiper", {
      slidesPerView: 1,
      loop: true,
      autoplay: prefersReduced ? false : { delay: 5500, disableOnInteraction: false },
      pagination: { el: ".reviewsSwiper .swiper-pagination", clickable: true },
      a11y: { enabled: true }
    });
  }
})();
