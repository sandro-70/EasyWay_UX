import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Importa los archivos de traducción
import es from "./locals/es.json";
import en from "./locals/en.json";
import fr from "./locals/fr.json";
import ch from "./locals/ch.json";

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    fr: { translation: fr },
    ch: { translation: ch },
  },
  lng: "es", // Idioma por defecto
  fallbackLng: "en", // Idioma de respaldo
  interpolation: {
    escapeValue: false, // React ya escapa los valores
  },
});

export default i18n;
