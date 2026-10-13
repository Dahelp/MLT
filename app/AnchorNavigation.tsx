"use client";

import { useEffect } from "react";

/** Scroll the window, never a clipped page section, for same-page anchor links. */
export default function AnchorNavigation() {
  useEffect(() => {
    const scrollToAnchor = (hash: string) => {
      const id = decodeURIComponent(hash.slice(1));
      const target = id && document.getElementById(id);
      if (!target) return false;
      window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY), behavior: "instant" });
      return true;
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target && anchor.target !== "_self") return;
      const destination = new URL(anchor.href, window.location.href);
      if (!destination.hash || destination.pathname !== window.location.pathname || destination.search !== window.location.search) return;
      if (!scrollToAnchor(destination.hash)) return;
      event.preventDefault();
      history.replaceState(history.state, "", window.location.pathname + window.location.search);
    };
    document.addEventListener("click", onClick);
    if (window.location.hash && scrollToAnchor(window.location.hash)) {
      history.replaceState(history.state, "", window.location.pathname + window.location.search);
    }
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
