import i18n from "i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

void i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en"],
    defaultNS: "translation",
    ns: ["translation"],
    backend: {
      loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/{{ns}}.json`,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "admin_lang",
    },
    interpolation: { escapeValue: false },
    returnNull: false,
    // Don't suspend the whole tree while JSON is fetching — render with each
    // call site's defaultValue until the file lands.
    react: { useSuspense: false },
  });

export default i18n;
