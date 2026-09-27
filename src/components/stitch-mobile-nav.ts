export function attachMobileMenu(root: HTMLElement) {
  const header = root.querySelector("header");
  const nav = header?.querySelector("nav");
  if (!header || !nav || root.querySelector("[data-il-menu='toggle']")) return () => undefined;

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.ilMenu = "toggle";
  button.className = "il-menu-toggle";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "Open menu");
  button.innerHTML = '<span class="material-symbols-outlined text-[22px]">menu</span>';

  const panel = document.createElement("div");
  panel.dataset.ilMenu = "panel";
  panel.hidden = true;
  panel.className = "il-menu-panel";

  const clone = nav.cloneNode(true) as HTMLElement;
  clone.className = "il-menu-list";
  clone.querySelectorAll<HTMLElement>(".hidden, .absolute").forEach((node) => {
    node.classList.remove("hidden", "absolute", "left-0", "top-full", "group-hover:block");
    node.classList.add("static");
  });
  panel.appendChild(clone);

  const actions = header.querySelector(":scope > div > .shrink-0");
  (actions ?? header).append(button);
  header.appendChild(panel);

  const setOpen = (open: boolean) => {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", open ? "true" : "false");
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    const icon = button.querySelector("span");
    if (icon) icon.textContent = open ? "close" : "menu";
  };

  const onToggle = () => setOpen(panel.hidden);
  const onNavigate = () => setOpen(false);
  button.addEventListener("click", onToggle);
  panel.querySelectorAll("a").forEach((link) => link.addEventListener("click", onNavigate));

  return () => {
    button.removeEventListener("click", onToggle);
    panel.querySelectorAll("a").forEach((link) => link.removeEventListener("click", onNavigate));
    button.remove();
    panel.remove();
  };
}
