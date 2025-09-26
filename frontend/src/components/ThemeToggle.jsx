import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => (localStorage.getItem("theme") || "light") === "dark");

  useEffect(() => {
    const theme = dark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [dark]);

  return (
    <label className="theme-toggle" title={dark ? "Passer en clair" : "Passer en sombre"}>
      <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} style={{ display: "none" }} />
      <span> {dark ? "Clair" : "Sombre"} </span>
    </label>
  );
}
