/* ============================================================
   AJ GAMING — SHARED UTILITIES
   Toast, Modal, Navigation, Sound & Auth helpers
   ============================================================ */

const AJ = (() => {

  /* ── Toast Notification System ────────────────────────────── */
  const Toast = (() => {
    let container = null;
    let toastEl = null;
    let hideTimer = null;

    function init() {
      if (container) return;
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');

      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      container.appendChild(toastEl);
      document.body.appendChild(container);
    }

    function show(message, durationMs = 2500) {
      init();
      clearTimeout(hideTimer);
      toastEl.textContent = message;
      toastEl.classList.add('is-visible');
      hideTimer = setTimeout(() => {
        toastEl.classList.remove('is-visible');
      }, durationMs);
    }

    return { show };
  })();


  /* ── Modal System ─────────────────────────────────────────── */
  const Modal = (() => {
    /**
     * Creates and shows a modal overlay.
     * Returns a reference for programmatic close.
     *
     * @param {Object} opts
     * @param {string}  opts.title
     * @param {string}  opts.body   – HTML string for modal body
     * @param {Array}   opts.buttons – [{ label, className, onClick }]
     * @param {boolean} opts.closeOnBackdrop – default true
     * @returns {{ close: Function, el: Element }}
     */
    function create(opts = {}) {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.tabIndex = -1;

      const content = document.createElement('div');
      content.className = 'modal-content';
      content.setAttribute('role', 'dialog');
      content.setAttribute('aria-modal', 'true');

      let html = '';
      if (opts.title) html += `<div class="modal-title">${opts.title}</div>`;
      if (opts.body)  html += `<div class="modal-text">${opts.body}</div>`;

      if (opts.buttons && opts.buttons.length) {
        html += '<div class="modal-actions">';
        opts.buttons.forEach((b, i) => {
          html += `<button class="${b.className || 'btn btn--primary'}" data-modal-btn="${i}">${b.label}</button>`;
        });
        html += '</div>';
      }

      content.innerHTML = html;
      overlay.appendChild(content);
      document.body.appendChild(overlay);

      // Animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => overlay.classList.add('is-open'));
      });

      // Wire button clicks
      if (opts.buttons) {
        opts.buttons.forEach((b, i) => {
          const btnEl = content.querySelector(`[data-modal-btn="${i}"]`);
          if (btnEl && b.onClick) {
            btnEl.addEventListener('click', () => b.onClick(api));
          }
        });
      }

      // Close on backdrop click
      if (opts.closeOnBackdrop !== false) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) api.close();
        });
      }

      // Escape key close
      function handleEsc(e) {
        if (e.key === 'Escape') api.close();
      }
      document.addEventListener('keydown', handleEsc);

      const api = {
        el: overlay,
        close() {
          overlay.classList.remove('is-open');
          document.removeEventListener('keydown', handleEsc);
          setTimeout(() => overlay.remove(), 300);
        }
      };

      return api;
    }

    return { create };
  })();


  /* ── Navigation Helper ────────────────────────────────────── */
  const Nav = (() => {
    /**
     * Injects the shared navbar into the page.
     * Call once in each page's <body>.
     *
     * @param {Object} opts
     * @param {string} opts.backHref  – URL for back button (hub)
     * @param {string} opts.backLabel – label text
     * @param {Array}  opts.actions   – [{ label, className, id, href, onClick }]
     */
    function inject(opts = {}) {
      const nav = document.createElement('nav');
      nav.className = 'navbar';
      nav.setAttribute('aria-label', 'Primary');

      const brand = document.createElement('a');
      brand.className = 'navbar__brand';
      brand.href = opts.backHref || 'games.html';
      brand.innerHTML = `<span class="navbar__brand-icon">🎮</span> AJ Gaming`;

      const actions = document.createElement('div');
      actions.className = 'navbar__actions';

      if (opts.backHref) {
        const backBtn = document.createElement('a');
        backBtn.href = opts.backHref;
        backBtn.className = 'btn btn--ghost btn--sm';
        backBtn.textContent = opts.backLabel || '← Back to Hub';
        actions.appendChild(backBtn);
      }

      if (opts.actions && opts.actions.length) {
        opts.actions.forEach(a => {
          const el = a.href ? document.createElement('a') : document.createElement('button');
          el.className = a.className || 'btn btn--ghost btn--sm';
          el.textContent = a.label;
          if (a.id) el.id = a.id;
          if (a.href) el.href = a.href;
          if (a.onClick) el.addEventListener('click', a.onClick);
          actions.appendChild(el);
        });
      }

      nav.appendChild(brand);
      nav.appendChild(actions);

      // Insert as first child of body
      document.body.insertBefore(nav, document.body.firstChild);
    }

    return { inject };
  })();


  /* ── Sound Manager (stub for future SFX) ──────────────────── */
  const Sound = (() => {
    let muted = false;
    let audioCtx = null;

    function getCtx() {
      if (!audioCtx) {
        try {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { /* no audio support */ }
      }
      return audioCtx;
    }

    /** Play a simple synthesized blip */
    function playTone(freq = 440, duration = 0.1, type = 'sine') {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    }

    /**
     * Predefined sound effects.
     * Extend this map as you add more sounds.
     */
    const SFX = {
      click:    () => playTone(600,  0.08, 'sine'),
      success:  () => { playTone(523, 0.1); setTimeout(() => playTone(659, 0.1), 100); setTimeout(() => playTone(784, 0.15), 200); },
      error:    () => playTone(200, 0.2, 'sawtooth'),
      loot:     () => { playTone(880, 0.06); setTimeout(() => playTone(1100, 0.1), 60); },
      laser:    () => playTone(150, 0.3, 'square'),
      place:    () => playTone(500, 0.06, 'triangle'),
      win:      () => { playTone(523, 0.12); setTimeout(() => playTone(659, 0.12), 120); setTimeout(() => playTone(784, 0.12), 240); setTimeout(() => playTone(1047, 0.2), 360); },
      draw:     () => { playTone(400, 0.15); setTimeout(() => playTone(350, 0.2), 150); },
      spooky:   () => playTone(120, 0.5, 'sawtooth'),
    };

    function play(name) {
      if (SFX[name]) SFX[name]();
    }

    function toggleMute() {
      muted = !muted;
      return muted;
    }

    function isMuted() { return muted; }

    return { play, toggleMute, isMuted, playTone };
  })();


  /* ── Score Persistence ────────────────────────────────────── */
  const Score = (() => {
    function get(key, defaultVal = 0) {
      try { return JSON.parse(localStorage.getItem(`aj_${key}`)) || defaultVal; }
      catch { return defaultVal; }
    }
    function set(key, value) {
      try { localStorage.setItem(`aj_${key}`, JSON.stringify(value)); }
      catch { /* storage full or unavailable */ }
    }
    function clear(key) {
      try { localStorage.removeItem(`aj_${key}`); }
      catch { /* noop */ }
    }
    return { get, set, clear };
  })();


  /* ── Keyboard Detection (for focus outlines) ──────────────── */
  (function detectTabbing() {
    function onTab(e) {
      if (e.key === 'Tab') {
        document.body.classList.add('user-is-tabbing');
        window.removeEventListener('keydown', onTab);
        window.addEventListener('mousedown', onMouse);
      }
    }
    function onMouse() {
      document.body.classList.remove('user-is-tabbing');
      window.removeEventListener('mousedown', onMouse);
      window.addEventListener('keydown', onTab);
    }
    window.addEventListener('keydown', onTab);
  })();


  /* ── Firebase Auth Wrapper ────────────────────────────────── */
  const Auth = (() => {
    /**
     * TODO: Replace these placeholder values with your real Firebase config.
     * See: https://firebase.google.com/docs/web/setup
     */
    const firebaseConfig = {
      apiKey:            "YOUR_API_KEY",             // TODO: Add your API key
      authDomain:        "your-project.firebaseapp.com", // TODO: Add your auth domain
      projectId:         "your-project-id",          // TODO: Add your project ID
      storageBucket:     "your-project.appspot.com", // TODO: Add your storage bucket
      messagingSenderId: "YOUR_SENDER_ID",           // TODO: Add your sender ID
      appId:             "YOUR_APP_ID",              // TODO: Add your app ID
    };

    let initialized = false;

    /**
     * Initializes Firebase if the SDK is loaded.
     * Returns true if Firebase is ready, false otherwise.
     */
    function init() {
      if (initialized) return true;
      if (typeof firebase === 'undefined' || !firebase.initializeApp) {
        console.warn('[AJ Auth] Firebase SDK not loaded. Auth features disabled.');
        return false;
      }
      // Prevent double-init
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      initialized = true;
      return true;
    }

    /** Login with email/password (returns Promise) */
    function login(email, password) {
      if (!init()) return Promise.reject(new Error('Firebase not available'));
      return firebase.auth().signInWithEmailAndPassword(email, password);
    }

    /** Register with email/password (returns Promise) */
    function register(email, password) {
      if (!init()) return Promise.reject(new Error('Firebase not available'));
      return firebase.auth().createUserWithEmailAndPassword(email, password);
    }

    /** Sign out (returns Promise) */
    function logout() {
      if (!init()) return Promise.reject(new Error('Firebase not available'));
      return firebase.auth().signOut();
    }

    /** Get current user (or null) */
    function currentUser() {
      if (!init()) return null;
      return firebase.auth().currentUser;
    }

    /**
     * Checks if Firebase is configured with real keys.
     * Returns false if placeholder values are still in use.
     */
    function isConfigured() {
      return firebaseConfig.apiKey !== 'YOUR_API_KEY';
    }

    return { init, login, register, logout, currentUser, isConfigured };
  })();


  /* ── Particle Effects ─────────────────────────────────────── */
  const Particles = (() => {
    function spawn(x, y, count = 8, colors = ['#ffd76b','#ff9f1c','#ffd1dc','#fff59d']) {
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.style.cssText = `
          position: fixed; width: 6px; height: 6px; border-radius: 50%;
          left: ${x}px; top: ${y}px; pointer-events: none; z-index: 9999;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
        `;
        const angle = Math.random() * Math.PI * 2;
        const dist  = 20 + Math.random() * 40;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;

        document.body.appendChild(p);

        p.animate([
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${tx}px, ${ty}px) scale(0.3)`, opacity: 0 }
        ], { duration: 500 + Math.random() * 200, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' })
        .onfinish = () => p.remove();
      }
    }

    /** Spawn particles centered on a DOM element */
    function spawnAtElement(el, count, colors) {
      const rect = el.getBoundingClientRect();
      spawn(rect.left + rect.width / 2, rect.top + rect.height / 2, count, colors);
    }

    return { spawn, spawnAtElement };
  })();


  /* ── Public API ───────────────────────────────────────────── */
  return { Toast, Modal, Nav, Sound, Score, Auth, Particles };

})();
