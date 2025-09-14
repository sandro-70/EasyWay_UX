import React, { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return (
        localStorage.getItem("site-theme") ||
        (window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")
      );
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("site-theme", theme);
    } catch {}
  }, [theme]);

  // sincronizar entre pestañas
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "site-theme" && e.newValue) setTheme(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
