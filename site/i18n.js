/**
 * Internationalization (i18n) Module
 *
 * Supports three languages: English (default), French, and Vietnamese.
 * Language preference is persisted in localStorage.
 */

// Application state for current language
export const state = {
  language: localStorage.getItem('genealogy-lang') || 'en'
};

// Translation dictionaries
export const i18n = {
  translations: {
    en: {
      // General
      appTitle: 'Genealogy Tree',
      loading: 'Loading genealogy tree',
      footerText: 'Public genealogy tree - Admin authentication required for editing',

      // Auth
      adminLogin: 'Admin Login',
      login: 'Login',
      logout: 'Logout',
      cancel: 'Cancel',
      email: 'Email',
      password: 'Password',
      loggedInAs: 'Logged in as',
      loginError: 'Login failed. Please check your credentials.',

      // Data semantics (from genealogy-old-code)
      unknown: 'Unknown',
      none: 'None',
      notSpecified: 'Not specified',
      notApplicable: 'Not applicable',
      living: 'Living',

      // Genealogy terms
      father: 'Father',
      mother: 'Mother',
      spouse: 'Spouse',
      children: 'Children',
      siblings: 'Siblings',
      unionDate: 'Union Date',
      unionPlace: 'Union Place',
      birthDate: 'Birth Date',
      birthPlace: 'Birth Place',
      deathDate: 'Death Date',
      deathPlace: 'Death Place',
      biography: 'Biography',

      // Errors
      errorLoadingData: 'Error loading genealogy data. Please try again later.',
      noDataAvailable: 'No genealogy data available.'
    },

    fr: {
      // General
      appTitle: 'Arbre Généalogique',
      loading: 'Chargement de l\'arbre généalogique',
      footerText: 'Arbre généalogique public - Authentification administrateur requise pour la modification',

      // Auth
      adminLogin: 'Connexion Administrateur',
      login: 'Connexion',
      logout: 'Déconnexion',
      cancel: 'Annuler',
      email: 'Email',
      password: 'Mot de passe',
      loggedInAs: 'Connecté en tant que',
      loginError: 'Échec de la connexion. Veuillez vérifier vos identifiants.',

      // Data semantics
      unknown: 'Inconnu',
      none: 'Aucun',
      notSpecified: 'Non précisé',
      notApplicable: 'Non applicable',
      living: 'En vie',

      // Genealogy terms
      father: 'Père',
      mother: 'Mère',
      spouse: 'Conjoint(e)',
      children: 'Enfants',
      siblings: 'Frères et sœurs',
      unionDate: 'Date d\'union',
      unionPlace: 'Lieu d\'union',
      birthDate: 'Date de naissance',
      birthPlace: 'Lieu de naissance',
      deathDate: 'Date de décès',
      deathPlace: 'Lieu de décès',
      biography: 'Biographie',

      // Errors
      errorLoadingData: 'Erreur lors du chargement des données généalogiques. Veuillez réessayer plus tard.',
      noDataAvailable: 'Aucune donnée généalogique disponible.'
    },

    vi: {
      // General
      appTitle: 'Cây Gia Phả',
      loading: 'Đang tải cây gia phả',
      footerText: 'Cây gia phả công khai - Cần xác thực quản trị viên để chỉnh sửa',

      // Auth
      adminLogin: 'Đăng Nhập Quản Trị',
      login: 'Đăng nhập',
      logout: 'Đăng xuất',
      cancel: 'Hủy',
      email: 'Email',
      password: 'Mật khẩu',
      loggedInAs: 'Đã đăng nhập với',
      loginError: 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.',

      // Data semantics
      unknown: 'Không rõ',
      none: 'Không có',
      notSpecified: 'Chưa ghi',
      notApplicable: 'Không áp dụng',
      living: 'Còn sống',

      // Genealogy terms
      father: 'Cha',
      mother: 'Mẹ',
      spouse: 'Vợ/Chồng',
      children: 'Con cái',
      siblings: 'Anh chị em',
      unionDate: 'Ngày kết hôn',
      unionPlace: 'Nơi kết hôn',
      birthDate: 'Ngày sinh',
      birthPlace: 'Nơi sinh',
      deathDate: 'Ngày mất',
      deathPlace: 'Nơi mất',
      biography: 'Tiểu sử',

      // Errors
      errorLoadingData: 'Lỗi khi tải dữ liệu gia phả. Vui lòng thử lại sau.',
      noDataAvailable: 'Không có dữ liệu gia phả.'
    }
  }
};

/**
 * Get translation for a key in the current language
 * @param {string} key - Translation key
 * @returns {string} Translated string or key if not found
 */
export function t(key) {
  return i18n.translations[state.language][key] || key;
}

/**
 * Set the current language and persist to localStorage
 * @param {string} lang - Language code (en, fr, vi)
 */
export function setLang(lang) {
  if (i18n.translations[lang]) {
    state.language = lang;
    localStorage.setItem('genealogy-lang', lang);
  }
}

/**
 * Get locale code for date formatting based on current language
 * @returns {string} Locale code for Intl APIs
 */
export function getLocale() {
  const localeMap = {
    en: 'en-US',
    fr: 'fr-FR',
    vi: 'vi-VN'
  };
  return localeMap[state.language] || 'en-US';
}
