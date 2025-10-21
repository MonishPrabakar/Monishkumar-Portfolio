// Enhanced interactivity: accessible nav, scrollspy, filters, accessible modal, contact handling
(() => {
  'use strict';

  // Utilities
  const qs = sel => document.querySelector(sel);
  const qsa = sel => Array.from(document.querySelectorAll(sel));
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fill current year
  const yearEl = qs('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  const navToggle = qs('#nav-toggle');
  const nav = qs('#site-nav');
  navToggle && navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    if (nav.style.display === 'block') {
      nav.style.display = '';
    } else {
      nav.style.display = 'block';
    }
  });

  // Close mobile nav when link clicked
  qsa('#site-nav a').forEach(a => {
    a.addEventListener('click', () => {
      if (window.innerWidth <= 980 && nav.style.display === 'block') {
        nav.style.display = '';
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Smooth scroll for anchors (respect reduced motion)
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (target) {
        ev.preventDefault();
        target.scrollIntoView({ behavior: isReducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  // Scrollspy (highlight nav link)
  const sections = qsa('main section[id]');
  const navLinks = qsa('.primary-nav a');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = navLinks.find(a => a.getAttribute('href') === `#${id}`);
      if (link) link.classList.toggle('active', entry.isIntersecting);
    });
  }, { root: null, threshold: 0.45 });

  sections.forEach(s => observer.observe(s));

  // Project filtering
  const filterButtons = qsa('.filter');
  const projects = qsa('.project');

  function applyFilter(filter) {
    projects.forEach(p => {
      const cat = p.dataset.category || '';
      if (filter === 'all' || cat === filter) {
        p.style.display = '';
        requestAnimationFrame(() => p.style.opacity = 1);
      } else {
        p.style.opacity = 0;
        setTimeout(() => p.style.display = 'none', 180);
      }
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });

  // Accessible project modal with focus-trap
  const modal = qs('#project-modal');
  const modalTitle = qs('#modal-title');
  const modalDesc = qs('#modal-desc');
  const modalImage = qs('#modal-image');
  const modalClose = qs('.modal-close');
  let lastFocused = null;

  function openModal({ title = '', desc = '', image = '' } = {}) {
    lastFocused = document.activeElement;
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    if (image) {
      modalImage.src = image;
      modalImage.alt = title;
      modalImage.style.display = '';
    } else {
      modalImage.style.display = 'none';
    }
    modal.setAttribute('aria-hidden', 'false');
    // trap focus to close button
    modalClose.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    document.body.style.overflow = '';
  }

  qsa('.open-project').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const t = btn.dataset.title || '';
      const d = btn.dataset.desc || '';
      const i = btn.dataset.image || '';
      openModal({ title: t, desc: d, image: i });
    });
  });

  modalClose && modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Keyboard handlers for modal (Escape to close, trap tab)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
    if (e.key === 'Tab' && modal.getAttribute('aria-hidden') === 'false') {
      // basic focus trap: only modalClose is focusable in this simple modal
      if (document.activeElement === modalClose && !e.shiftKey) {
        e.preventDefault();
        // cycle to description (no direct focus), move back to close
        modalClose.focus();
      }
    }
  });

  // Allow Enter on project cards to open first action
  projects.forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const btn = card.querySelector('.open-project');
        if (btn) btn.click();
      }
    });
  });

  // Contact form: client-side validation + Formspree handling + mailto fallback
  const form = qs('#contact-form');
  const status = qs('#form-status');
  const mailFallback = qs('#mail-fallback');

  if (mailFallback) {
    mailFallback.addEventListener('click', () => {
      const name = qs('#name').value.trim();
      const email = qs('#email').value.trim();
      const message = qs('#message').value.trim();
      const subject = encodeURIComponent(`Contact from ${name || 'Website'}`);
      const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
      window.location.href = `mailto:monishp2212@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = '';
      const name = qs('#name').value.trim();
      const email = qs('#email').value.trim();
      const message = qs('#message').value.trim();

      if (!name || !email || !message) {
        status.textContent = 'Please complete all fields.';
        status.style.color = 'tomato';
        return;
      }

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        status.textContent = 'Please enter a valid email address.';
        status.style.color = 'tomato';
        return;
      }

      // Try to submit to Formspree (if action is set). If not, fallback to mailto.
      const action = form.getAttribute('action') || '';
      if (action.includes('formspree.io')) {
        status.textContent = 'Sending...';
        status.style.color = 'var(--muted)';
        try {
          const formData = new FormData(form);
          const resp = await fetch(action, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
          if (resp.ok) {
            status.textContent = 'Thanks — message sent.';
            status.style.color = 'limegreen';
            form.reset();
          } else {
            const data = await resp.json().catch(() => null);
            status.textContent = (data && data.error) ? data.error : 'Submission failed — try the email fallback.';
            status.style.color = 'tomato';
          }
        } catch (err) {
          status.textContent = 'Network error — please use the email fallback.';
          status.style.color = 'tomato';
        }
      } else {
        // fallback to mailto
        const subject = encodeURIComponent(`Contact from ${name}`);
        const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
        window.location.href = `mailto:monishp2212@gmail.com?subject=${subject}&body=${body}`;
      }
    });
  }

  // Minimal performance: lazy-start animations unless reduced motion
  if (!isReducedMotion) {
    requestAnimationFrame(() => {
      qsa('.project').forEach((el, i) => {
        el.style.transitionDelay = `${i * 45}ms`;
        el.style.opacity = 1;
      });
    });
  }
})();