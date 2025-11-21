/**
 * Main Application Bootstrap
 *
 * Initializes the genealogy tree application:
 * - Sets up i18n
 * - Handles authentication
 * - Loads and renders family tree data
 */

import { onAuthChange, login, logout } from './services/auth.js';
import { fetchPeople } from './services/firestore.js';
import { toFamilyChartData, validateRelationships } from './adapters/toFamilyChartData.js';
import { renderChart, renderEmptyState } from './components/chart.js';
import {
  updateUIText,
  setupLanguageSwitch,
  showLoginModal,
  hideLoginModal,
  showLoginError,
  hideLoginError,
  updateAuthStatus,
  showLoading,
  hideLoading
} from './components/ui.js';

// Application state
let currentChartData = null;

/**
 * Initialize the application
 */
async function init() {
  // Set up initial UI text
  updateUIText();

  // Set up language switcher
  setupLanguageSwitch(async () => {
    // Re-render chart when language changes (for date formatting)
    if (currentChartData) {
      await renderTreeChart(currentChartData);
    }
  });

  // Set up authentication listeners
  setupAuthHandlers();

  // Set up auth state listener
  onAuthChange((user) => {
    updateAuthStatus(user);
    // Note: We don't need to reload data on auth change since tree is publicly readable
  });

  // Load and render the tree
  await loadAndRenderTree();
}

/**
 * Set up authentication UI handlers
 */
function setupAuthHandlers() {
  // Admin login button
  const adminLoginBtn = document.getElementById('admin-login-btn');
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', () => {
      showLoginModal();
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Logout failed:', error);
      }
    });
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideLoginError();

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        await login(email, password);
        hideLoginModal();
      } catch (error) {
        showLoginError();
      }
    });
  }

  // Login cancel button
  const loginCancelBtn = document.getElementById('login-cancel-btn');
  if (loginCancelBtn) {
    loginCancelBtn.addEventListener('click', () => {
      hideLoginModal();
    });
  }

  // Close modal on background click
  const loginModal = document.getElementById('login-modal');
  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) {
        hideLoginModal();
      }
    });
  }
}

/**
 * Load people data from Firestore and render the tree
 */
async function loadAndRenderTree() {
  showLoading();

  try {
    // Fetch people data
    const people = await fetchPeople();

    if (!people || people.length === 0) {
      // No data available
      hideLoading();
      const container = document.getElementById('chart-container');
      renderEmptyState(container);
      return;
    }

    // Convert to Family Chart format
    const chartData = toFamilyChartData(people);

    // Validate relationships (log errors but don't block rendering)
    const validationErrors = validateRelationships(chartData);
    if (validationErrors.length > 0) {
      console.warn('Relationship validation errors:', validationErrors);
    }

    // Store for re-rendering
    currentChartData = chartData;

    // Render the chart
    await renderTreeChart(chartData);

  } catch (error) {
    console.error('Error loading tree:', error);
    hideLoading();

    // Show error in container
    const container = document.getElementById('chart-container');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #e74c3c;">
          <h3>Error Loading Genealogy Data</h3>
          <p>${error.message || 'Please try again later.'}</p>
        </div>
      `;
    }
  }
}

/**
 * Render the family tree chart
 * @param {Array} chartData - Data in Family Chart format
 */
async function renderTreeChart(chartData) {
  hideLoading();

  const container = document.getElementById('chart-container');
  if (!container) {
    console.error('Chart container not found');
    return;
  }

  try {
    renderChart(container, chartData);
  } catch (error) {
    console.error('Error rendering chart:', error);
    renderEmptyState(container);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
