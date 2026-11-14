/** Prime every loop copy together once the carousel approaches the viewport. */
export function observeCarouselImages(root: HTMLElement | null) {
  if (!root) return;
  const load = () => {
    root.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach(image => {
      image.loading = "eager";
    });
  };
  if (typeof IntersectionObserver === "undefined") {
    load();
    return;
  }
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    load();
    observer.disconnect();
  }, { rootMargin: "300px 0px" });
  observer.observe(root);
  return () => observer.disconnect();
}
