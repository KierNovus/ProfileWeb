/* ============================================================
   MAIN.JS
   Client-side interactivity for the personal profile landing page.
   Handles:
     1. Seamless MP4 loop (two-video crossfade)
     2. Bottom navigation scroll-spy (auto-highlight active section)
     3. Background scene dimming on scroll
     4. Animated stat counters (triggered on scroll via IntersectionObserver)
     5. Contact form validation (UI/UX only — no email sending)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================
     1. SEAMLESS MP4 LOOP
     Two <video> elements share the same source. When the
     currently-visible video nears its end, we crossfade into
     the other video which is starting from frame 0. This masks
     any mismatch between the final and first frame so the
     motion reads as one continuous flow instead of a jumpy
     restart (no 1-second freeze, no blank frame).
     ========================================================== */
  const videoA = document.getElementById('bg-video-a');
  const videoB = document.getElementById('bg-video-b');
  const videos = [videoA, videoB].filter(Boolean);

  // Crossfade window (seconds before the end of the video).
  // Must be ≥ the CSS transition duration (--video-fade: 0.85s).
  const FADE_WINDOW = 1.0;

  // Which video is currently visible (A starts visible).
  let activeIndex = 0;

  if (videos.length === 2) {
    // Start with A visible, B hidden but preloaded.
    videoA.classList.add('is-visible');
    videoB.classList.remove('is-visible');

    // Pause B until it's needed (saves CPU).
    videoB.pause();

    // Slow the motion to ~0.6x for a calm, cinematic feel.
    videos.forEach((v) => {
      v.playbackRate = 0.6;
    });

    const swap = () => {
      const nextIndex = activeIndex === 0 ? 1 : 0;
      const current = videos[activeIndex];
      const next = videos[nextIndex];

      // Restart the incoming video from the beginning.
      next.currentTime = 0;
      next.play().catch(() => {});

      // Crossfade: incoming fades in, outgoing fades out.
      next.classList.add('is-visible');
      current.classList.remove('is-visible');

      activeIndex = nextIndex;
    };

    // When the visible video is within FADE_WINDOW of its end,
    // trigger the crossfade into the other video.
    const checkLoop = () => {
      const current = videos[activeIndex];
      if (current && !current.paused && !current.ended) {
        const remaining = current.duration - current.currentTime;
        if (remaining <= FADE_WINDOW) {
          swap();
        }
      }
    };

    // Poll a few times per second — cheap and reliable.
    setInterval(checkLoop, 150);

    // Also handle the edge case where the video ends before
    // the interval fires (e.g. slow device).
    videos.forEach((v) => {
      v.addEventListener('ended', () => {
        if (v === videos[activeIndex]) swap();
      });
    });
  } else if (videos.length === 1) {
    // Fallback: single video with native loop.
    videos[0].classList.add('is-visible');
  }

  /* ==========================================================
     2. BOTTOM NAVIGATION SCROLL-SPY
     ========================================================== */
  const navLinks = document.querySelectorAll('.bottom-nav-link');
  const sections = document.querySelectorAll('section[id]');

  const updateActiveNav = () => {
    const scrollPos = window.scrollY + window.innerHeight * 0.35;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;

      if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
        const id = section.getAttribute('id');
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.dataset.section === id);
        });
      }
    });
  };

  /* ==========================================================
     3. BACKGROUND SCENE DIMMING ON SCROLL
     The whole .bg-scene (video + overlays) dims together as
     the user scrolls. At the top it's clearly visible; deeper
     sections become subtle but never fully hidden.
     ========================================================== */
  const bgScene = document.querySelector('.bg-scene');

  // Fixed blurred state applied to ALL sections below Home.
  const LOWER_OPACITY = 0.35;
  const LOWER_BLUR    = 7;   // px — subtle but slightly stronger than before

  const updateBackgroundEffect = () => {
    const hero = document.getElementById('home');
    const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : window.innerHeight;

    // Home: clear + high visibility. Below Home: fixed blurred state.
    const isHome = window.scrollY < heroBottom - window.innerHeight * 0.5;

    if (bgScene) {
      if (isHome) {
        bgScene.style.opacity = '1';
        bgScene.style.filter = 'blur(0px)';
      } else {
        bgScene.style.opacity = String(LOWER_OPACITY);
        bgScene.style.filter = `blur(${LOWER_BLUR}px)`;
      }
    }
  };

  // Throttle scroll handling with requestAnimationFrame
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateActiveNav();
        updateBackgroundEffect();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Set initial state on page load
  updateActiveNav();
  updateBackgroundEffect();

  /* ==========================================================
     4. ANIMATED STAT COUNTERS
     ========================================================== */
  const counters = document.querySelectorAll('.stat-number');

  const animateCounter = (el) => {
    const target  = Number(el.dataset.target);
    const startTime = performance.now();
    const duration  = 1500; // ms

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    };

    requestAnimationFrame(tick);
  };

  const statsSection = document.querySelector('.stats');
  if (statsSection && counters.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            counters.forEach(animateCounter);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(statsSection);
  }

  /* ==========================================================
     5. CONTACT FORM VALIDATION (UI/UX only)
     ========================================================== */
  const form          = document.getElementById('contact-form');
  const nameInput     = document.getElementById('contact-name');
  const emailInput    = document.getElementById('contact-email');
  const messageInput  = document.getElementById('contact-message');
  const nameError     = document.getElementById('name-error');
  const emailError    = document.getElementById('email-error');
  const messageError  = document.getElementById('message-error');
  const formStatus    = document.getElementById('form-status');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setFieldState = (input, errorEl, isValid, errorMessage) => {
    if (isValid) {
      input.classList.remove('invalid');
      input.classList.add('valid');
      errorEl.textContent = '';
    } else {
      input.classList.remove('valid');
      input.classList.add('invalid');
      errorEl.textContent = errorMessage;
    }
    return isValid;
  };

  const validateName = () => {
    const value = nameInput.value.trim();
    if (!value) {
      return setFieldState(nameInput, nameError, false, 'Please enter your name.');
    }
    if (value.length < 2) {
      return setFieldState(nameInput, nameError, false, 'Name must be at least 2 characters.');
    }
    return setFieldState(nameInput, nameError, true);
  };

  const validateEmail = () => {
    const value = emailInput.value.trim();
    if (!value) {
      return setFieldState(emailInput, emailError, false, 'Please enter your email address.');
    }
    if (!EMAIL_REGEX.test(value)) {
      return setFieldState(emailInput, emailError, false, 'Please enter a valid email address (e.g. you@example.com).');
    }
    return setFieldState(emailInput, emailError, true);
  };

  const validateMessage = () => {
    const value = messageInput.value.trim();
    if (!value) {
      return setFieldState(messageInput, messageError, false, 'Please enter your message.');
    }
    if (value.length < 10) {
      return setFieldState(messageInput, messageError, false, 'Message must be at least 10 characters.');
    }
    return setFieldState(messageInput, messageError, true);
  };

  const clearFieldState = (input, errorEl) => {
    input.classList.remove('invalid', 'valid');
    errorEl.textContent = '';
  };

  if (nameInput)    nameInput.addEventListener('blur', validateName);
  if (emailInput)   emailInput.addEventListener('blur', validateEmail);
  if (messageInput) messageInput.addEventListener('blur', validateMessage);

  if (nameInput)    nameInput.addEventListener('input', () => clearFieldState(nameInput, nameError));
  if (emailInput)   emailInput.addEventListener('input', () => clearFieldState(emailInput, emailError));
  if (messageInput) messageInput.addEventListener('input', () => clearFieldState(messageInput, messageError));

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const isNameValid    = validateName();
      const isEmailValid   = validateEmail();
      const isMessageValid = validateMessage();
      const isFormValid    = isNameValid && isEmailValid && isMessageValid;

      if (isFormValid) {
        formStatus.textContent = 'Your message is ready to send! Email delivery coming soon.';
        formStatus.className = 'form-status success';
      } else {
        formStatus.textContent = 'Please fix the highlighted fields above.';
        formStatus.className = 'form-status error';
      }
    });
  }
});