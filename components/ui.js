/**
 * UI Component Module
 *
 * Handles UI updates for language switching, auth status, and modals.
 */

import { t, setLang, state } from '../i18n.js';

/**
 * Update all translatable UI text elements
 */
export function updateUIText() {
  // Update main title
  const titleElement = document.getElementById('app-title');
  if (titleElement) {
    titleElement.textContent = t('appTitle');
  }

  // Update footer
  const footerElement = document.getElementById('footer-text');
  if (footerElement) {
    footerElement.textContent = t('footerText');
  }

  // Update loading text
  const loadingElement = document.getElementById('loading-indicator');
  if (loadingElement) {
    loadingElement.textContent = t('loading');
  }

  // Update auth buttons
  const adminLoginBtn = document.getElementById('admin-login-btn');
  if (adminLoginBtn) {
    adminLoginBtn.textContent = t('adminLogin');
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.textContent = t('logout');
  }

  // Update login modal
  const loginTitle = document.getElementById('login-title');
  if (loginTitle) {
    loginTitle.textContent = t('adminLogin');
  }

  const loginEmail = document.getElementById('login-email');
  if (loginEmail) {
    loginEmail.placeholder = t('email');
  }

  const loginPassword = document.getElementById('login-password');
  if (loginPassword) {
    loginPassword.placeholder = t('password');
  }

  const loginSubmitBtn = document.getElementById('login-submit-btn');
  if (loginSubmitBtn) {
    loginSubmitBtn.textContent = t('login');
  }

  const loginCancelBtn = document.getElementById('login-cancel-btn');
  if (loginCancelBtn) {
    loginCancelBtn.textContent = t('cancel');
  }
}

/**
 * Setup language switch buttons
 * @param {Function} onLanguageChange - Callback when language changes
 */
export function setupLanguageSwitch(onLanguageChange) {
  const langButtons = document.querySelectorAll('.lang-switch button');

  // Set initial active state
  langButtons.forEach(btn => {
    if (btn.dataset.lang === state.language) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Add click handlers
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const newLang = btn.dataset.lang;
      setLang(newLang);

      // Update button states
      langButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update UI text
      updateUIText();

      // Notify callback
      if (typeof onLanguageChange === 'function') {
        onLanguageChange(newLang);
      }
    });
  });
}

/**
 * Show the login modal
 */
export function showLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.style.display = 'flex';

    // Focus on email input
    const emailInput = document.getElementById('login-email');
    if (emailInput) {
      setTimeout(() => emailInput.focus(), 100);
    }
  }
}

/**
 * Hide the login modal
 */
export function hideLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.style.display = 'none';

    // Clear form
    const form = document.getElementById('login-form');
    if (form) {
      form.reset();
    }

    // Clear error
    hideLoginError();
  }
}

/**
 * Show login error message
 * @param {string} message - Error message to display
 */
export function showLoginError(message) {
  const errorElement = document.getElementById('login-error');
  if (errorElement) {
    errorElement.textContent = message || t('loginError');
    errorElement.classList.add('visible');
  }
}

/**
 * Hide login error message
 */
export function hideLoginError() {
  const errorElement = document.getElementById('login-error');
  if (errorElement) {
    errorElement.classList.remove('visible');
    errorElement.textContent = '';
  }
}

/**
 * Update auth status display
 * @param {object|null} user - Current user object or null
 */
export function updateAuthStatus(user) {
  const userInfo = document.getElementById('user-info');
  const adminLoginBtn = document.getElementById('admin-login-btn');
  const logoutBtn = document.getElementById('logout-btn');

  if (user) {
    // User is logged in
    if (userInfo) {
      userInfo.textContent = `${t('loggedInAs')}: ${user.email}`;
    }
    if (adminLoginBtn) {
      adminLoginBtn.style.display = 'none';
    }
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
    }
  } else {
    // User is logged out
    if (userInfo) {
      userInfo.textContent = '';
    }
    if (adminLoginBtn) {
      adminLoginBtn.style.display = 'inline-block';
    }
    if (logoutBtn) {
      logoutBtn.style.display = 'none';
    }
  }
}

/**
 * Show loading indicator
 */
export function showLoading() {
  const loadingElement = document.getElementById('loading-indicator');
  if (loadingElement) {
    loadingElement.style.display = 'block';
  }
}

/**
 * Hide loading indicator
 */
export function hideLoading() {
  const loadingElement = document.getElementById('loading-indicator');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}
