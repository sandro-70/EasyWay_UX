import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../components/VistaTranslate.css";

const LANGS = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ch", label: "Chinois", flag: "🇨🇳" },
  // Puedes añadir más idiomas aquí, por ejemplo: { code: 'fr', label: 'Français', flag: '🇫🇷' }
];

function VistaTranslate() {
  const { t, i18n } = useTranslation();
  const initial = i18n?.language || localStorage.getItem("i18nextLng") || "es";
  const [lang, setLang] = useState(initial);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (!lang) return;
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem("i18nextLng", lang);
    } catch {}
  }, [lang, i18n]);

  // Cargar preferencia de tema desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("site-theme");
      if (saved) setTheme(saved);
      // aplicar incluso si no hay saved: preferencia del sistema
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = saved || (prefersDark ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", initial);
    } catch (e) {
      // ignore
    }
  }, []);

  // Aplicar y persistir el tema cuando cambie
  useEffect(() => {
    try {
      if (theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("site-theme", theme);
      }
    } catch (e) {}
  }, [theme]);

  return (
    <div className="vt-container">
      <div className="vt-card">
        <header className="vt-header">
          <h1>{t("translation_panel_title") || "Cambiar idioma"}</h1>
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
              aria-label={t("select_language") || "Seleccionar idioma"}
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
                  aria-pressed={lang === l.code}
                >
                  {l.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="vt-preview">
          <h2>{t("preview") || "Vista previa"}</h2>
          <p className="vt-preview-text">{t("welcome")}</p>
          <p className="vt-preview-text small">{t("sample_text")}</p>
          <div style={{ marginTop: 10 }}>
            <button className="vt-sample-btn">{t("sample_button")}</button>
          </div>
          <p className="vt-note">{t("note_translations")}</p>
          {/* Lista de vocabulario: clave | español | traducción seleccionada */}
          <div className="vt-vocab">
            <h3 className="vt-vocab-title">
              {t("vocab_title") || "Vocabulario"}
            </h3>
            <table className="vt-vocab-table" role="table">
              <thead>
                <tr>
                  <th>US</th>
                  <th>ES</th>
                  <th>{LANGS.find((l) => l.code === lang)?.label || lang}</th>
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
                    <td>{i18n.getResource("es", "translation", key) || key}</td>
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

      <div
        className="vt-card"
        style={{
          display: "block",
          marginLeft: "50px",
          fontSize: "18px",
        }}
      >
        <h2>{t("theme") || "Tema"}</h2>
        <span>{t("theme_description") || "Seleccione un tema"}</span>
        <div className="vt-theme-selector">
          <button
            type="button"
            className={`vt-theme-button ${
              theme === "light" ? "vt-active" : ""
            }`}
            onClick={() => setTheme("light")}
            aria-pressed={theme === "light"}
          >
            {t("light_theme") || "Tema claro"}
          </button>
          <button
            type="button"
            className={`vt-theme-button ${theme === "dark" ? "vt-active" : ""}`}
            onClick={() => setTheme("dark")}
            aria-pressed={theme === "dark"}
          >
            {t("dark_theme") || "Tema oscuro"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VistaTranslate;
