/* ============================================================
   MAIN.JS
   Client-side interactivity for the personal profile landing page.
   Handles:
     1. Mobile navigation toggle (hamburger menu open/close)
     2. Animated stat counters (triggered on scroll via IntersectionObserver)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Mobile Navigation Toggle ---------- */
  const toggleBtn = document.querySelector('.nav-toggle');
  const navLinks  = document.querySelector('.nav-links');
  const overlay   = document.querySelector('.nav-overlay');

  /**
   * Opens or closes the mobile navigation panel.
   * @param {boolean} forceOpen - If provided, forces open (true) or closed (false).
   */
  const toggleNav = (forceOpen) => {
    const isOpen = (forceOpen !== undefined)
      ? forceOpen
      : !navLinks.classList.contains('open');

    navLinks.classList.toggle('open', isOpen);
    toggleBtn.classList.toggle('active', isOpen);
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    overlay.hidden = !isOpen;

    // Prevent body scroll while menu is open
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  // Click hamburger to toggle
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => toggleNav());
  }

  // Click a nav link → close menu
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => toggleNav(false));
    });
  }

  // Click overlay → close menu
  if (overlay) {
    overlay.addEventListener('click', () => toggleNav(false));
  }

  /* ---------- 2. Animated Stat Counters ---------- */
  const counters = document.querySelectorAll('.stat-number');

  /**
   * Animates a counter element from 0 to its data-target value.
   * Uses requestAnimationFrame with ease-out cubic easing.
   * @param {HTMLElement} el - The element with data-target attribute.
   */
  const animateCounter = (el) => {
    const target  = Number(el.dataset.target);
    const startTime = performance.now();
    const duration  = 1500; // ms

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease-out cubic for smooth slowdown
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target; // ensure exact final value
      }
    };

    requestAnimationFrame(tick);
  };

  // Use IntersectionObserver to fire counters when the stats section becomes visible
  const statsSection = document.querySelector('.stats');
  if (statsSection && counters.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            counters.forEach(animateCounter);
            observer.unobserve(entry.target); // run only once
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(statsSection);
  }
});