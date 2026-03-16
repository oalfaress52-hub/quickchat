(function initI18n() {
  const LANG_KEY = "kite-language";
  const SUPPORTED = new Set(["en", "sv"]);
  const translations = { en: {} };

  function getLanguage() {
    const lang = (localStorage.getItem(LANG_KEY) || "en").toLowerCase();
    return SUPPORTED.has(lang) ? lang : "en";
  }

  function setLanguage(lang) {
    const normalized = SUPPORTED.has(String(lang).toLowerCase()) ? String(lang).toLowerCase() : "en";
    localStorage.setItem(LANG_KEY, normalized);
    document.documentElement.setAttribute("lang", normalized === "sv" ? "sv" : "en");
    return normalized;
  }

  function parseTranslationText(txt) {
    const map = {};
    String(txt || "").split(/\r?\n/).forEach((line) => {
      const cleaned = line.trim();
      if (!cleaned || cleaned.startsWith("#")) return;
      const idx = cleaned.indexOf("=");
      if (idx < 0) return;
      const key = cleaned.slice(0, idx).trim();
      const val = cleaned.slice(idx + 1).trim();
      if (key) map[key] = val;
    });
    return map;
  }

  async function ensureLanguageLoaded(lang) {
    if (lang === "en" || translations[lang]) return;
    const response = await fetch(`translations/${lang}.txt`);
    if (!response.ok) {
      translations[lang] = {};
      return;
    }
    translations[lang] = parseTranslationText(await response.text());
  }

  function t(key, fallback = "") {
    const lang = getLanguage();
    if (lang === "en") return fallback || key;
    return (translations[lang] && translations[lang][key]) || fallback || key;
  }

  async function applyLanguage(root = document) {
    const lang = setLanguage(getLanguage());
    await ensureLanguageLoaded(lang);

    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const fallback = el.getAttribute("data-i18n-default") || el.textContent.trim();
      el.textContent = t(key, fallback);
    });

    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const fallback = el.getAttribute("placeholder") || "";
      el.setAttribute("placeholder", t(key, fallback));
    });
  }

  async function setAndApply(lang) {
    setLanguage(lang);
    await applyLanguage(document);
  }

  window.KITE_I18N = {
    getLanguage,
    setLanguage,
    applyLanguage,
    setAndApply,
    t
  };
})();
