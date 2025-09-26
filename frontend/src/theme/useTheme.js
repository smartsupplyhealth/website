import { useEffect, useState } from "react";

export function useTheme() {
  const getInitial = () => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  };

  const [theme, setTheme] = useState(getInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Si l’utilisateur change le thème de l’OS
  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = e => {
      if (!localStorage.getItem("theme")) setTheme(e.matches ? "dark" : "light");
    };
    m.addEventListener ? m.addEventListener("change", handler) : m.addListener(handler);
    return () => {
      m.removeEventListener ? m.removeEventListener("change", handler) : m.removeListener(handler);
    };
  }, []);

  return { theme, setTheme, toggle: () => setTheme(t => (t === "dark" ? "light" : "dark")) };
}
