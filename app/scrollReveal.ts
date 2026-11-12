type RevealOptions = { selector: string; enabledClass: string; visibleClass: string; rootMargin: string; threshold: number };

/** Enhance off-screen content without hiding anything already painted by the server. */
export function enableScrollReveal(root: HTMLElement | null, options: RevealOptions) {
  if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const items = Array.from(root.querySelectorAll<HTMLElement>(options.selector));
  const initialItems = new Set(items.filter(item => item.getBoundingClientRect().top < window.innerHeight));
  initialItems.forEach(item => item.classList.add(options.visibleClass));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add(options.visibleClass);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: options.rootMargin, threshold: options.threshold });
  root.classList.add(options.enabledClass);
  items.forEach(item => { if (!initialItems.has(item)) observer.observe(item); });
  return () => { observer.disconnect(); root.classList.remove(options.enabledClass); };
}
