import { t, getLocale } from '../i18n.js';

/**
 * Format a date value according to current locale and semantic rules
 * Preserves semantics from genealogy-old-code:
 * - null/undefined -> "Unknown"
 * - "" (empty string for death) -> "Living"
 * - "" (empty string for other dates) -> "Unknown" (aligned with old code)
 */
function formatDate(dateValue, isDeathDate = false) {
  // Handle null/undefined (truly unknown)
  if (dateValue === null || dateValue === undefined) {
    return t('unknown');
  }

  // Handle empty string
  const dateString = String(dateValue).trim();
  if (dateString === '') {
    return isDeathDate ? t('living') : t('unknown');
  }

  // If just a year (e.g., "1980")
  if (/^\d{4}$/.test(dateString)) {
    return dateString;
  }

  // Try full date parsing
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString(getLocale(), {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (e) {
    // Fall through to return original
  }

  // Return original string if parsing failed (e.g., "circa 1800")
  return dateString;
}

/**
 * Render the family tree chart
 * @param {HTMLElement} container - DOM element to render into
 * @param {Array} data - Family Chart formatted data
 * @returns {object} Chart instance
 */
export function renderChart(container, data) {
  if (!container || !Array.isArray(data)) {
    console.error('Invalid container or data for chart rendering');
    return null;
  }

  // Clear existing content
  container.innerHTML = '';

  try {
    // This 'f3' object comes from the script tag you added to index.html
    const chart = window.f3.createChart(container, data)
      .setTransitionTime(1000)
      .setCardXSpacing(250)
      .setCardYSpacing(150);

    // Configure SVG cards with display functions
    // IMPORTANT: card_display functions receive the full datum object { id, data, rels }
    chart.setCardSvg().setCardDisplay([
      // First line: name with nicknames
      (d) => {
        const data = d.data || {};
        let name = data.display_name || `${(data.first_name || '').trim()} ${(data.last_name || '').trim()}`.trim();
        if (Array.isArray(data.nicknames) && data.nicknames.length > 0) {
          name += ` [${data.nicknames.join(', ')}]`;
        }
        return name || 'Unknown';
      },
      // Second line: dates
      (d) => {
        const data = d.data || {};
        const birth = formatDate(data.birth_date);
        const deathRaw = data.death_date;

        // If death is empty/null/undefined, show only birth or "Unknown"
        if (deathRaw === '' || deathRaw === null || deathRaw === undefined) {
          return birth !== t('unknown') ? birth : t('unknown');
        }

        // Has death date, show range
        const death = formatDate(deathRaw, true);
        return `${birth} - ${death}`;
      }
    ]);

    // Render the tree
    chart.updateTree({ initial: true });

    return chart;
  } catch (error) {
    console.error('Error rendering chart:', error);
    container.innerHTML = `<p style="color: red; text-align: center;">${t('errorLoadingData')}</p>`;
    return null;
  }
}

/**
 * Create a simple placeholder chart for when no data is available
 * @param {HTMLElement} container - DOM element to render into
 */
export function renderEmptyState(container) {
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 3rem; color: #7f8c8d;">
      <h3>${t('noDataAvailable')}</h3>
    </div>
  `;
}
