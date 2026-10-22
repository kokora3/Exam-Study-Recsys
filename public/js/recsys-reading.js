/* ==========================================================================
   RECSYS & CS EXAM ATLAS: READER CONTROLS CONTROLLER
   Manages Theme, Font, Sizing, and Layout Preferences with localStorage
   ========================================================================== */
(() => {
  'use strict';

  const STORAGE_KEYS = {
    THEME: 'cs_atlas_theme',
    FONT: 'cs_atlas_font',
    SIZE: 'cs_atlas_font_size',
    WIDTH: 'cs_atlas_reading_width'
  };

  const DEFAULTS = {
    THEME: 'midnight',
    FONT: 'noto',
    SIZE: 'md',
    WIDTH: 'focus'
  };

  // Immediate pre-render application to prevent flash of unstyled content
  function getPref(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }

  function setPref(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {
      console.warn('Could not save reader preference', e);
    }
  }

  // Apply preferences to <html> root
  const root = document.documentElement;
  const currentTheme = getPref(STORAGE_KEYS.THEME, DEFAULTS.THEME);
  const currentFont = getPref(STORAGE_KEYS.FONT, DEFAULTS.FONT);
  const currentSize = getPref(STORAGE_KEYS.SIZE, DEFAULTS.SIZE);
  const currentWidth = getPref(STORAGE_KEYS.WIDTH, DEFAULTS.WIDTH);

  root.setAttribute('data-theme', currentTheme);
  root.setAttribute('data-font', currentFont);
  root.setAttribute('data-font-size', currentSize);
  root.setAttribute('data-reading-width', currentWidth);

  // Initialize UI once DOM is ready
  function initReaderUI() {
    const settingsBtn = document.getElementById('readerSettingsBtn');
    const popover = document.getElementById('readerPopover');
    if (!settingsBtn || !popover) return;

    // Toggle popover
    function togglePopover(show) {
      const willShow = typeof show === 'boolean' ? show : popover.hidden;
      popover.hidden = !willShow;
      settingsBtn.setAttribute('aria-expanded', String(willShow));
      if (willShow) {
        settingsBtn.classList.add('active');
      } else {
        settingsBtn.classList.remove('active');
      }
    }

    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePopover();
    });

    // Close on click outside or Escape
    document.addEventListener('click', (e) => {
      if (!popover.hidden && !popover.contains(e.target) && e.target !== settingsBtn) {
        togglePopover(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !popover.hidden) {
        togglePopover(false);
        settingsBtn.focus();
      }
    });

    // Sync button states
    function syncButtonState(containerId, dataAttr, currentVal) {
      const container = document.getElementById(containerId);
      if (!container) return;
      const btns = container.querySelectorAll(`[data-${dataAttr}]`);
      btns.forEach(btn => {
        const val = btn.getAttribute(`data-${dataAttr}`);
        if (val === currentVal) {
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed', 'false');
        }
      });
    }

    // 1. Theme controls
    const themeRow = document.getElementById('themeOptions');
    if (themeRow) {
      syncButtonState('themeOptions', 'theme-val', root.getAttribute('data-theme'));
      themeRow.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-theme-val]');
        if (!btn) return;
        const val = btn.getAttribute('data-theme-val');
        root.setAttribute('data-theme', val);
        setPref(STORAGE_KEYS.THEME, val);
        syncButtonState('themeOptions', 'theme-val', val);
        window.setAccent?.(window.currentSubject || 'recsys');
      });
    }

    // 2. Font controls
    const fontRow = document.getElementById('fontOptions');
    if (fontRow) {
      syncButtonState('fontOptions', 'font-val', root.getAttribute('data-font'));
      fontRow.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-font-val]');
        if (!btn) return;
        const val = btn.getAttribute('data-font-val');
        root.setAttribute('data-font', val);
        setPref(STORAGE_KEYS.FONT, val);
        syncButtonState('fontOptions', 'font-val', val);
      });
    }

    // 3. Font Size controls
    const sizeRow = document.getElementById('fontSizeOptions');
    if (sizeRow) {
      syncButtonState('fontSizeOptions', 'size-val', root.getAttribute('data-font-size'));
      sizeRow.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-size-val]');
        if (!btn) return;
        const val = btn.getAttribute('data-size-val');
        root.setAttribute('data-font-size', val);
        setPref(STORAGE_KEYS.SIZE, val);
        syncButtonState('fontSizeOptions', 'size-val', val);
      });
    }

    // 4. Width controls
    const widthRow = document.getElementById('widthOptions');
    if (widthRow) {
      syncButtonState('widthOptions', 'width-val', root.getAttribute('data-reading-width'));
      widthRow.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-width-val]');
        if (!btn) return;
        const val = btn.getAttribute('data-width-val');
        root.setAttribute('data-reading-width', val);
        setPref(STORAGE_KEYS.WIDTH, val);
        syncButtonState('widthOptions', 'width-val', val);
      });
    }

    window.setAccent?.(window.currentSubject || 'recsys');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReaderUI);
  } else {
    initReaderUI();
  }
})();
