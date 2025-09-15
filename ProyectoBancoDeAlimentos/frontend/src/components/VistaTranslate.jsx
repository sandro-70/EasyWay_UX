import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../components/VistaTranslate.css";

const LANGS = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ch", label: "中文", flag: "🇨🇳" },
];

function VistaTranslate() {
  const { t, i18n } = useTranslation();
  const initial = i18n?.language || localStorage.getItem("i18nextLng") || "es";
  const [lang, setLang] = useState(initial);
  const [theme, setTheme] = useState("light");

  // cambio de idioma
  useEffect(() => {
    if (!lang) return;
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem("i18nextLng", lang);
    } catch {}
  }, [lang, i18n]);

  // cargar tema
  useEffect(() => {
    try {
      const saved = localStorage.getItem("site-theme");
      if (saved) setTheme(saved);
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = saved || (prefersDark ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", initial);
    } catch {}
  }, []);

  // aplicar tema
  useEffect(() => {
    try {
      if (theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("site-theme", theme);
      }
    } catch {}
  }, [theme]);

  return (
    <div className="vt-container">
      <div className="vt-card vt-grid">
        {/* Columna izquierda */}
        <div className="vt-left">
          <header className="vt-header">
            <h1>🌐 {t("translation_panel_title") || "Cambiar idioma"}</h1>
            <p className="vt-sub">
              {t("translation_panel_sub") ||
                "Selecciona el idioma de la interfaz"}
            </p>
          </header>

          <section className="vt-controls">
            <label htmlFor="vt-select" className="vt-label">
              {t("select_language") || "Idioma"}
            </label>

            <div className="vt-selector-row">
              <select
                id="vt-select"
                className="vt-select"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>

              <div className="vt-buttons">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    className={`vt-lang-button ${
                      lang === l.code ? "vt-active" : ""
                    }`}
                    onClick={() => setLang(l.code)}
                  >
                    {l.flag}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="vt-preview">
            <h2>{t("preview") || "Vista previa"}</h2>
            <p className="vt-preview-text">{t("welcome")}</p>
            <p className="vt-preview-text small">{t("sample_text")}</p>
            <button className="vt-sample-btn">{t("sample_button")}</button>
            <p className="vt-note">{t("note_translations")}</p>

            <div className="vt-vocab">
              <h3 className="vt-vocab-title">{t("vocab_title")}</h3>
              <table className="vt-vocab-table">
                <thead>
                  <tr>
                    <th>US</th>
                    <th>ES</th>
                    <th>{LANGS.find((l) => l.code === lang)?.label}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    "welcome",
                    "login",
                    "logout",
                    "history",
                    "checkout",
                    "support",
                  ].map((key) => (
                    <tr key={key}>
                      <td className="vt-key">{key}</td>
                      <td>
                        {i18n.getResource("es", "translation", key) || key}
                      </td>
                      <td>
                        {i18n.getResource(lang, "translation", key) ||
                          i18n.t(key)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Columna derecha */}
        <div className="vt-right">
          <h2>{t("theme") || "Tema"}</h2>
          <p>{t("theme_description") || "Seleccione un tema"}</p>
          <div className="vt-theme-toggle">
            <span>☀️</span>
            <label className="vt-switch">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
              />
              <span className="vt-slider"></span>
            </label>
            <span>🌙</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VistaTranslate;
