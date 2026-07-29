/* ==========================================================
   KORENA HEAD SPA — SCRIPT
   Loader, smooth scroll, scroll-reveal animation,
   navigation behavior, journey rail, and modal system.
========================================================== */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DARK_SECTIONS = ['home', 'instagram', 'cta'];

  /* ---------------------------------------------------------
     LOADER
  --------------------------------------------------------- */
  function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    const hide = () => {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 500ms ease';
      loader.style.pointerEvents = 'none';
      setTimeout(() => loader.remove(), 550);
    };
    window.setTimeout(hide, reduceMotion ? 200 : 1200);
  }

  /* ---------------------------------------------------------
     SMOOTH SCROLL (Lenis)
  --------------------------------------------------------- */
  let lenis = null;
  function initSmoothScroll() {
    if (reduceMotion || typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  function scrollToTarget(hash) {
    const el = document.querySelector(hash);
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: -70, duration: 1.2 });
    } else {
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  /* ---------------------------------------------------------
     NAVIGATION SCROLL STATE
  --------------------------------------------------------- */
  function initNavScrollState() {
    const nav = document.getElementById('siteNav');
    if (!nav) return;
    const update = () => {
      if (window.scrollY > 40) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ---------------------------------------------------------
     ANCHOR / DATA-SCROLL LINKS
  --------------------------------------------------------- */
  function initAnchorLinks() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      link.addEventListener('click', (e) => {
        const target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        scrollToTarget(hash);
        closeMobileMenu();
      });
    });
  }

  /* ---------------------------------------------------------
     MOBILE MENU
  --------------------------------------------------------- */
  const mobileMenu = document.getElementById('mobileMenu');
  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');

  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuToggle && menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuToggle && menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function initMobileMenu() {
    if (menuToggle) menuToggle.addEventListener('click', openMobileMenu);
    if (menuClose) menuClose.addEventListener('click', closeMobileMenu);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    });
  }

  /* ---------------------------------------------------------
     JOURNEY RAIL
  --------------------------------------------------------- */
  function initJourneyRail() {
    const rail = document.querySelector('.journey-rail');
    const sections = document.querySelectorAll('[data-stage]');
    if (!rail || !sections.length) return;
    const items = rail.querySelectorAll('li');

    const setActive = (stage, sectionId) => {
      items.forEach((li) => {
        li.classList.toggle('is-active', li.dataset.stage === stage);
      });
      rail.classList.toggle('on-dark', DARK_SECTIONS.includes(sectionId));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        let best = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
          }
        });
        if (best) setActive(best.target.dataset.stage, best.target.id);
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: '-35% 0px -35% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
  }

  /* ---------------------------------------------------------
     SCROLL REVEAL ANIMATIONS (GSAP)
  --------------------------------------------------------- */
  function initReveal() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    if (reduceMotion) return; // content is visible by default; skip motion

    gsap.utils.toArray('.reveal-up').forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power2.out',
          delay: Math.min((i % 4) * 0.06, 0.18),
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        }
      );
    });

    gsap.utils.toArray('.reveal-img').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, scale: 1.06 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.3,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        }
      );
    });

    // Hero entrance sequence
    gsap.timeline({ delay: reduceMotion ? 0 : 0.9 }).from('.hero-content .reveal-up', {
      opacity: 0,
      y: 24,
      duration: 1.1,
      ease: 'power2.out',
      stagger: 0.12,
    });
  }

  /* ---------------------------------------------------------
     SHARED MODAL
  --------------------------------------------------------- */
  function initModal() {
    const overlay = document.getElementById('modalOverlay');
    const box = overlay ? overlay.querySelector('.modal-box') : null;
    const titleEl = document.getElementById('modalTitle');
    const textEl = document.getElementById('modalText');
    const closeBtn = document.getElementById('modalClose');
    if (!overlay || !box) return;

    let lastFocused = null;

    function openModal(title, text) {
      titleEl.textContent = title;
      textEl.textContent = text;
      lastFocused = document.activeElement;
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      box.focus();
    }

    function closeModal() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('[data-modal-title]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        openModal(trigger.dataset.modalTitle, trigger.dataset.modalText);
      });
    });

    closeBtn && closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
    });
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initSmoothScroll();
    initNavScrollState();
    initAnchorLinks();
    initMobileMenu();
    initJourneyRail();
    initReveal();
    initModal();
  });
})();
