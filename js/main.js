/* ============================================================
   MAIN.JS
   Client-side interactivity for the personal profile landing page.
   Handles:
     1. Mobile navigation toggle (hamburger menu open/close)
     2. Animated stat counters (triggered on scroll via IntersectionObserver)
     3. Contact form validation (UI/UX only — no email sending)
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

  /* ---------- 3. Contact Form Validation (UI/UX only) ---------- */
  const form          = document.getElementById('contact-form');
  const nameInput     = document.getElementById('contact-name');
  const emailInput    = document.getElementById('contact-email');
  const messageInput  = document.getElementById('contact-message');
  const nameError     = document.getElementById('name-error');
  const emailError    = document.getElementById('email-error');
  const messageError  = document.getElementById('message-error');
  const formStatus    = document.getElementById('form-status');

  // Valid email pattern: local@domain.tld
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Sets the visual validity state of a field.
   * @param {HTMLElement} input     - The input/textarea element.
   * @param {HTMLElement} errorEl   - The associated error message element.
   * @param {boolean} isValid       - Whether the field is valid.
   * @param {string}   errorMessage - Message to display when invalid.
   */
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

  /**
   * Validates the name field.
   * @returns {boolean} True when the name is valid.
   */
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

  /**
   * Validates the email field using a proper email pattern.
   * @returns {boolean} True when the email is valid.
   */
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

  /**
   * Validates the message field.
   * @returns {boolean} True when the message is valid.
   */
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

  /**
   * Clears the inline error message and invalid styling for a field.
   * Used when the user starts typing again after an error.
   * @param {HTMLElement} input   - The input/textarea element.
   * @param {HTMLElement} errorEl - The associated error message element.
   */
  const clearFieldState = (input, errorEl) => {
    input.classList.remove('invalid', 'valid');
    errorEl.textContent = '';
  };

  // Validate each field when the user leaves it (blur)
  if (nameInput)    nameInput.addEventListener('blur', validateName);
  if (emailInput)   emailInput.addEventListener('blur', validateEmail);
  if (messageInput) messageInput.addEventListener('blur', validateMessage);

  // Clear a field's error state while the user is typing
  if (nameInput)    nameInput.addEventListener('input', () => clearFieldState(nameInput, nameError));
  if (emailInput)   emailInput.addEventListener('input', () => clearFieldState(emailInput, emailError));
  if (messageInput) messageInput.addEventListener('input', () => clearFieldState(messageInput, messageError));

  // Handle form submission — UI/UX only, no email/backend/API
  if (form) {
    form.addEventListener('submit', (event) => {
      // Prevent the page from reloading (no backend exists)
      event.preventDefault();

      // Re-validate all fields
      const isNameValid    = validateName();
      const isEmailValid   = validateEmail();
      const isMessageValid = validateMessage();
      const isFormValid    = isNameValid && isEmailValid && isMessageValid;

      if (isFormValid) {
        // All fields valid — show success feedback only (no email is sent)
        formStatus.textContent = 'Your message is ready to send! Email delivery coming soon.';
        formStatus.className = 'form-status success';
      } else {
        // Some fields invalid — show a clear error summary
        formStatus.textContent = 'Please fix the highlighted fields above.';
        formStatus.className = 'form-status error';
      }
    });
  }
});