"use client";

import { useEffect } from "react";

/** Service Worker-ді тіркейді (PWA — телефонға орнату мүмкіндігі үшін) */
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* тіркеу сәтсіз болса — елемейміз */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
