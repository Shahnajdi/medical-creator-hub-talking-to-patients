/*
 * Talking to Patients — progressive enhancement layer.
 * Everything here is optional: the page is a complete, working sales page
 * with plain <a href> purchase links even if this file fails to load or
 * throws. Nothing in here may block navigation or the CTAs.
 */
(function () {
  "use strict";

  /* ---------------- Analytics (fail-safe, vendor-agnostic) ---------------- */
  // Pushes GA4-style events to window.dataLayer if present. If no analytics
  // vendor is installed, this is a harmless no-op. Wire up GA4 / Meta Pixel
  // by adding their snippet to <head> — no changes needed here.
  function track(eventName, data) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: eventName }, data || {}));
    } catch (e) {
      /* analytics must never break the page */
    }
  }

  function bindCtaTracking() {
    try {
      document.querySelectorAll("[data-analytics-event]").forEach(function (el) {
        el.addEventListener("click", function () {
          var eventName = el.getAttribute("data-analytics-event");
          track(eventName, { cta: el.getAttribute("data-cta"), href: el.href });
          track("checkout_outbound", { href: el.href });
        });
      });
    } catch (e) {}
  }

  /* ---------------- Footer year ---------------- */
  function setYear() {
    try {
      var y = document.getElementById("year");
      if (y) y.textContent = String(new Date().getFullYear());
    } catch (e) {}
  }

  /* ---------------- Sticky mobile CTA ---------------- */
  function initStickyCta() {
    try {
      var sticky = document.getElementById("sticky-cta");
      var hero = document.getElementById("hero");
      if (!sticky || !hero || !("IntersectionObserver" in window)) return;

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            sticky.hidden = entry.isIntersecting;
          });
        },
        { rootMargin: "-10% 0px 0px 0px" }
      );
      observer.observe(hero);
    } catch (e) {}
  }

  /* ---------------- Reveal on scroll ---------------- */
  function initReveal() {
    try {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (!("IntersectionObserver" in window)) return;

      var targets = document.querySelectorAll(
        ".recognition__resolve, .insight__resolve, .page-card, .learn-item, .author__inner, .offer__inner"
      );
      targets.forEach(function (el) { el.setAttribute("data-reveal", ""); });

      var observer = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      targets.forEach(function (el) { observer.observe(el); });
    } catch (e) {}
  }

  /* ---------------- Look Inside lightbox ---------------- */
  function initLightbox() {
    try {
      var gallery = document.getElementById("page-gallery");
      var lightbox = document.getElementById("lightbox");
      if (!gallery || !lightbox) return;

      var cards = Array.prototype.slice.call(gallery.querySelectorAll(".page-card"));
      var lightboxImage = document.getElementById("lightbox-image");
      var lightboxCaption = document.getElementById("lightbox-caption");
      var currentIndex = 0;
      var lastFocused = null;

      function dataFor(card) {
        var img = card.querySelector("img");
        var title = card.querySelector(".page-card__title");
        var caption = card.querySelector(".page-card__caption");
        // Use the largest srcset candidate for a crisp lightbox view.
        var srcset = img.getAttribute("srcset") || "";
        var candidates = srcset.split(",").map(function (s) { return s.trim(); });
        var largest = candidates[candidates.length - 1];
        var src = largest ? largest.split(" ")[0] : img.src;
        return {
          src: src,
          alt: img.alt,
          text: (title ? title.textContent + " — " : "") + (caption ? caption.textContent : ""),
        };
      }

      function open(index) {
        currentIndex = (index + cards.length) % cards.length;
        var d = dataFor(cards[currentIndex]);
        lightboxImage.src = d.src;
        lightboxImage.alt = d.alt;
        lightboxCaption.textContent = d.text;
        lastFocused = document.activeElement;
        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
        lightbox.querySelector(".lightbox__close").focus();
        track("preview_open", { index: currentIndex });
      }

      function close() {
        lightbox.hidden = true;
        document.body.style.overflow = "";
        if (lastFocused && lastFocused.focus) lastFocused.focus();
      }

      function step(delta) {
        open(currentIndex + delta);
        track("preview_navigation", { index: currentIndex, direction: delta > 0 ? "next" : "prev" });
      }

      cards.forEach(function (card, index) {
        var btn = card.querySelector(".page-card__btn");
        if (btn) btn.addEventListener("click", function () { open(index); });
      });

      lightbox.querySelectorAll("[data-lightbox-close]").forEach(function (el) {
        el.addEventListener("click", close);
      });
      lightbox.querySelector("[data-lightbox-prev]").addEventListener("click", function () { step(-1); });
      lightbox.querySelector("[data-lightbox-next]").addEventListener("click", function () { step(1); });

      document.addEventListener("keydown", function (e) {
        if (lightbox.hidden) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
        if (e.key === "Tab") {
          // simple focus trap within the dialog
          var focusables = lightbox.querySelectorAll("button");
          var first = focusables[0];
          var last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      });
    } catch (e) {}
  }

  function init() {
    bindCtaTracking();
    setYear();
    initStickyCta();
    initReveal();
    initLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
