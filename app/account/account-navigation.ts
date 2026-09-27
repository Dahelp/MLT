/* Keep account sections addressable on static hosting without a router dependency. */
if (typeof window !== "undefined") {
  const path = window.location.pathname.replace(/\/+$/, "");
  const localePrefix = /^\/(ru|de|en)(?:\/|$)/.exec(path)?.[0].replace(/\/$/, "") ?? "";
  const targetIndex = path.endsWith("/journeys") ? 1 : path.endsWith("/profile") ? 2 : 0;
  window.setTimeout(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>(".client-side nav button");
    buttons[targetIndex]?.click();
  }, 0);
  window.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>(".client-side nav button");
    if (!button) return;
    const buttons = [...document.querySelectorAll<HTMLButtonElement>(".client-side nav button")];
    const index = buttons.indexOf(button);
    const destination = index === 1 ? `${localePrefix}/account/journeys/` : index === 2 ? `${localePrefix}/account/profile/` : `${localePrefix}/account/`;
    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
    const destinationPath = destination.replace(/\/+$/, "") || "/";
    if (currentPath !== destinationPath) window.location.assign(destination);
  });
}
