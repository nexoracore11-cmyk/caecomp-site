"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "./icons";

const themeEvent = "caecomp-theme-change";

function subscribe(onChange: () => void) {
  window.addEventListener(themeEvent, onChange);
  return () => window.removeEventListener(themeEvent, onChange);
}

function currentTheme() {
  return document.documentElement.dataset.theme === "dark";
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, currentTheme, () => false);

  function toggle() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("caecomp-theme", next ? "dark" : "light");
    window.dispatchEvent(new Event(themeEvent));
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Usar modo claro" : "Usar modo escuro"}
      title={dark ? "Modo claro" : "Modo escuro"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
