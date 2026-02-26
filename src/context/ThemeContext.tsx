"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "black";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark" || savedTheme === "black");
      document.documentElement.classList.toggle("black", savedTheme === "black");
      document.documentElement.style.setProperty("color-scheme", savedTheme === "light" ? "light" : "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
      document.documentElement.style.setProperty("color-scheme", "dark");
    } else {
      document.documentElement.style.setProperty("color-scheme", "light");
    }
  }, []);

  const toggleTheme = () => {
    let newTheme: Theme;
    if (theme === "light") newTheme = "dark";
    else if (theme === "dark") newTheme = "black";
    else newTheme = "light";

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Si es dark o black, añadimos la clase 'dark' para compatibilidad general
    document.documentElement.classList.toggle("dark", newTheme === "dark" || newTheme === "black");
    // Añadimos la clase 'black' específicamente para el modo OLED
    document.documentElement.classList.toggle("black", newTheme === "black");
    
    document.documentElement.style.setProperty("color-scheme", newTheme === "light" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
