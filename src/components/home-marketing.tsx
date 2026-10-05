"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { stitchHomeMarkup } from "@/components/stitch-home-markup";
import { attachMobileMenu } from "@/components/stitch-mobile-nav";
import { bindStitchThemeToggle, useTheme } from "@/components/theme-provider";

const TAB_ACTIVE =
  "px-5 py-2.5 rounded-lg font-headline-sm text-body-sm font-semibold transition-all bg-primary-container text-on-primary-container shadow-md";
const TAB_IDLE =
  "px-5 py-2.5 rounded-lg font-headline-sm text-body-sm font-semibold transition-all text-on-surface-variant hover:text-on-surface";
const BILLING_ACTIVE =
  "px-4 py-1.5 rounded-full font-headline-sm text-body-sm font-semibold transition-colors bg-surface-variant text-on-surface";
const BILLING_IDLE =
  "px-4 py-1.5 rounded-full font-headline-sm text-body-sm font-semibold transition-colors text-on-surface-variant hover:text-on-surface";

export function HomeMarketing() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { user, ready, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const signedIn = ready && Boolean(user);

  useEffect(() => {
    const id = "material-symbols-outlined";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cleanups: Array<() => void> = [];
    const on = (el: Element | null, type: string, fn: EventListener) => {
      if (!el) return;
      el.addEventListener(type, fn);
      cleanups.push(() => el.removeEventListener(type, fn));
    };

    const signIn = root.querySelector('[data-path="sign-in"]');
    if (signIn) {
      signIn.setAttribute("href", signedIn ? "/dashboard" : "/login");
      signIn.textContent = signedIn ? "Dashboard" : "Sign In";
    }

    const start = root.querySelector('[data-path="start-free"]');
    if (start) {
      start.setAttribute("href", signedIn ? "/dashboard" : "/register");
      const long = start.querySelector(".il-cta-long");
      const short = start.querySelector(".il-cta-short");
      if (long && short) {
        long.textContent = signedIn ? "Open dashboard" : "Start Free — 25 GB Included";
        short.textContent = signedIn ? "Dashboard" : "Start free";
      } else {
        start.textContent = signedIn ? "Open dashboard" : "Start Free — 25 GB Included";
      }
    }

    root.querySelector('[data-path="account"]')?.setAttribute("href", signedIn ? "/dashboard" : "/login");
    root.querySelector('[data-path="overview"]')?.setAttribute("href", "/");

    root.querySelectorAll<HTMLElement>("[data-path]").forEach((el) => {
      const path = el.getAttribute("data-path");
      if (path === "docs-and-api" || path === "documentation" || path?.startsWith("sdk-")) {
        el.setAttribute("href", "/docs");
      }
      if (path === "pricing") el.setAttribute("href", "#pricing");
      if (
        path === "products" ||
        path === "image-cdn" ||
        path === "video-api" ||
        path === "ai-transformations" ||
        path === "digital-asset-management" ||
        path === "showcase"
      ) {
        el.setAttribute("href", "#playground");
      }
      if (
        path === "solutions" ||
        path === "solutions-ecommerce" ||
        path === "solutions-media-publishing" ||
        path === "solutions-mobile-apps"
      ) {
        el.setAttribute("href", "#pricing");
      }
    });

    let logoutBtn: HTMLButtonElement | null = null;
    if (signedIn && start?.parentElement) {
      logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.textContent = "Log out";
      logoutBtn.className = "text-on-surface-variant hover:text-on-surface font-body-md text-body-md hidden sm:inline";
      logoutBtn.addEventListener("click", () => {
        void logout();
      });
      start.parentElement.insertBefore(logoutBtn, start);
    }

    const switchTab = (tabId: string) => {
      for (const tab of ["url", "ai", "video"]) {
        const content = root.querySelector(`#tab-content-${tab}`);
        const button = root.querySelector(`#tab-btn-${tab}`);
        if (!content || !button) continue;
        if (tab === tabId) {
          content.classList.remove("hidden");
          button.className = TAB_ACTIVE;
        } else {
          content.classList.add("hidden");
          button.className = TAB_IDLE;
        }
      }
    };

    for (const tab of ["url", "ai", "video"]) {
      on(root.querySelector(`#tab-btn-${tab}`), "click", () => switchTab(tab));
    }

    const setBilling = (cycle: "monthly" | "annual") => {
      const monthlyBtn = root.querySelector("#billing-monthly");
      const annualBtn = root.querySelector("#billing-annual");
      const pricePro = root.querySelector("#price-pro");
      const priceScale = root.querySelector("#price-scale");
      if (!monthlyBtn || !annualBtn || !pricePro || !priceScale) return;
      if (cycle === "annual") {
        monthlyBtn.className = BILLING_IDLE;
        annualBtn.className = `${BILLING_ACTIVE} flex items-center gap-1.5`;
        pricePro.textContent = "$39";
        priceScale.textContent = "$159";
      } else {
        monthlyBtn.className = BILLING_ACTIVE;
        annualBtn.className = `${BILLING_IDLE} flex items-center gap-1.5`;
        pricePro.textContent = "$49";
        priceScale.textContent = "$199";
      }
    };

    on(root.querySelector("#billing-monthly"), "click", () => setBilling("monthly"));
    on(root.querySelector("#billing-annual"), "click", () => setBilling("annual"));

    on(root.querySelector("#copy-demo-url"), "click", () => {
      const label = root.querySelector("#copy-demo-url span:last-child");
      void navigator.clipboard.writeText(
        "https://cdn.imagelab.io/v1/demo/w_800,q_auto,f_avif,bg_remove,e_sharpen/sneaker.jpg",
      );
      if (!label) return;
      const previous = label.textContent;
      label.textContent = "Copied!";
      window.setTimeout(() => {
        label.textContent = previous;
      }, 1600);
    });

    root.querySelectorAll<HTMLElement>("[data-preview-filter]").forEach((button) => {
      on(button, "click", () => {
        const image = root.querySelector<HTMLImageElement>("#playground-preview-img");
        if (image) image.style.filter = button.dataset.previewFilter || "none";
      });
    });

    on(root.querySelector("#home-cta-form"), "submit", (event) => {
      event.preventDefault();
      router.push(signedIn ? "/dashboard" : "/register");
    });

    root.querySelectorAll<HTMLAnchorElement>('a[href="#cta"]').forEach((link) => {
      on(link, "click", (event) => {
        if (!signedIn) return;
        event.preventDefault();
        router.push("/dashboard");
      });
    });

    const detachMenu = attachMobileMenu(root);
    const detachTheme = bindStitchThemeToggle(root, toggleTheme, theme);
    if (signedIn) {
      const list = root.querySelector(".il-menu-list");
      const item = document.createElement("button");
      item.type = "button";
      item.textContent = "Log out";
      item.addEventListener("click", () => {
        void logout();
      });
      list?.appendChild(item);
    }

    return () => {
      detachMenu();
      detachTheme();
      logoutBtn?.remove();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [logout, router, signedIn, theme, toggleTheme]);

  return (
    <div
      ref={rootRef}
      className="il-stitch min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased"
      dangerouslySetInnerHTML={{ __html: stitchHomeMarkup }}
    />
  );
}
