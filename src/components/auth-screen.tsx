"use client";

import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { stitchAuthMarkup } from "@/components/stitch-auth-markup";
import { attachMobileMenu } from "@/components/stitch-mobile-nav";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
});

const TAB_ACTIVE =
  "w-1/2 rounded-md bg-primary-container py-2 text-center font-headline-sm text-body-sm font-semibold text-on-primary-container shadow-md transition-all";
const TAB_IDLE =
  "w-1/2 rounded-md py-2 text-center font-headline-sm text-body-sm font-semibold text-on-surface-variant hover:text-on-surface transition-all";

const SNIPPET = `import { ImagelabClient } from '@imagelab/sdk';
const imagelab = new ImagelabClient({ apiKey: 'sk_live_edge_9892cf', zone: 'global-acceleration' });
const optimizedUrl = imagelab.transform({ src: 'assets/product_hero.raw', format: 'avif', width: 1280, smartCrop: true });`;

type AuthMode = "login" | "register";

function showMessage(root: HTMLElement, message: string) {
  const alert = root.querySelector<HTMLElement>("#auth-error");
  if (!alert) return;
  alert.textContent = message;
  alert.classList.toggle("hidden", message.length === 0);
}

function applyMode(root: HTMLElement, mode: AuthMode) {
  const tabLogin = root.querySelector("#tab-login");
  const tabRegister = root.querySelector("#tab-register");
  const fieldName = root.querySelector("#field-name");
  const nameInput = root.querySelector<HTMLInputElement>("#input-fullname");
  const password = root.querySelector<HTMLInputElement>("#input-password");
  const strength = root.querySelector("#password-strength-container");
  const terms = root.querySelector("#terms-container");
  const title = root.querySelector("#auth-title");
  const subtitle = root.querySelector("#auth-subtitle");
  const submitText = root.querySelector("#btn-submit-text");
  const prompt = root.querySelector("#switch-prompt");
  const switchLink = root.querySelector("#switch-link");
  const forgot = root.querySelector("#link-forgot-pass");

  const login = mode === "login";
  if (tabLogin) tabLogin.className = login ? TAB_ACTIVE : TAB_IDLE;
  if (tabRegister) tabRegister.className = login ? TAB_IDLE : TAB_ACTIVE;
  fieldName?.classList.toggle("hidden", login);
  strength?.classList.toggle("hidden", login);
  terms?.classList.toggle("hidden", login);
  forgot?.classList.toggle("hidden", !login);
  if (nameInput) {
    nameInput.disabled = login;
    nameInput.required = !login;
  }
  if (password) password.autocomplete = login ? "current-password" : "new-password";
  if (title) title.textContent = login ? "Sign in to Imagelab Console" : "Create your developer account";
  if (subtitle) {
    subtitle.textContent = login
      ? "Access your live API credentials, CDN telemetry, and usage quotas."
      : "Start engineering with 25 GB free storage & limitless transforms.";
  }
  if (submitText) submitText.textContent = login ? "Sign in to Imagelab" : "Create Free Developer Account";
  if (prompt) prompt.textContent = login ? "Don't have a developer account?" : "Already have an active workspace?";
  if (switchLink) switchLink.textContent = login ? "Register for free" : "Sign in now";
}

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { login, register } = useAuth();
  const router = useRouter();

  useLayoutEffect(() => {
    const id = "material-symbols-outlined";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap";
      document.head.appendChild(link);
    }

    const root = rootRef.current;
    if (!root) return;
    applyMode(root, mode);

    const cleanups: Array<() => void> = [];
    const on = (el: Element | null, type: string, fn: EventListener) => {
      if (!el) return;
      el.addEventListener(type, fn);
      cleanups.push(() => el.removeEventListener(type, fn));
    };

    root.querySelector('[data-path="overview"]')?.setAttribute("href", "/");
    root.querySelector('[data-path="sign-in"]')?.setAttribute("href", "/login");
    root.querySelector('[data-path="start-free"]')?.setAttribute("href", "/register");
    root.querySelector('[data-path="account"]')?.setAttribute("href", mode === "login" ? "/login" : "/register");
    root.querySelectorAll<HTMLElement>("[data-path]").forEach((el) => {
      const path = el.getAttribute("data-path");
      if (path === "docs-and-api" || path === "documentation" || path?.startsWith("sdk-")) el.setAttribute("href", "/docs");
      if (path === "pricing") el.setAttribute("href", "/#pricing");
      if (
        path === "products" ||
        path === "image-cdn" ||
        path === "video-api" ||
        path === "ai-transformations" ||
        path === "digital-asset-management" ||
        path === "showcase"
      ) {
        el.setAttribute("href", "/#playground");
      }
    });

    const go = (next: AuthMode) => {
      if (next !== mode) router.push(next === "login" ? "/login" : "/register");
    };
    on(root.querySelector("#tab-login"), "click", () => go("login"));
    on(root.querySelector("#tab-register"), "click", () => go("register"));
    on(root.querySelector("#switch-link"), "click", () => go(mode === "login" ? "register" : "login"));

    on(root.querySelector("#toggle-password"), "click", () => {
      const input = root.querySelector<HTMLInputElement>("#input-password");
      const icon = root.querySelector("#eye-icon");
      if (!input || !icon) return;
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      icon.textContent = visible ? "visibility" : "visibility_off";
    });

    on(root.querySelector("#input-password"), "input", () => {
      const input = root.querySelector<HTMLInputElement>("#input-password");
      const password = input?.value ?? "";
      const score = password.length >= 14 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : password.length > 0 ? 1 : 0;
      const labels = ["Enter a password", "Weak", "Okay", "Strong", "Strong (14+ characters)"];
      for (let index = 1; index <= 4; index += 1) {
        const bar = root.querySelector(`#meter-bar-${index}`);
        if (!bar) continue;
        bar.className = `h-full w-1/4 rounded-full transition-all duration-300 ${index <= score ? "bg-tertiary" : "bg-surface-container"}`;
      }
      const label = root.querySelector("#strength-label");
      if (label) {
        label.textContent = labels[score];
        label.className = score >= 3 ? "text-tertiary font-bold" : score >= 2 ? "text-secondary font-bold" : "text-syntax-orange font-bold";
      }
    });

    on(root.querySelector("#copy-snippet-btn"), "click", () => {
      const button = root.querySelector("#copy-snippet-btn");
      if (!button) return;
      void navigator.clipboard.writeText(SNIPPET).then(() => {
        const previous = button.innerHTML;
        button.innerHTML =
          '<span class="material-symbols-outlined text-[16px] text-tertiary">check</span><span class="font-code-base text-label-badge text-tertiary">copied!</span>';
        window.setTimeout(() => {
          button.innerHTML = previous;
        }, 1600);
      });
    });

    root.querySelectorAll("button").forEach((button) => {
      const label = button.textContent ?? "";
      if (!label.includes("Continue with")) return;
      on(button, "click", () => {
        showMessage(root, "Google and GitHub sign-in are not available yet. Use email.");
      });
    });

    on(root.querySelector("#link-forgot-pass"), "click", (event) => {
      event.preventDefault();
      showMessage(root, "Password reset is not available yet.");
    });

    on(root.querySelector("#auth-form"), "submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      const data = new FormData(form);
      const email = String(data.get("email") ?? "");
      const password = String(data.get("password") ?? "");
      const name = String(data.get("name") ?? "");
      const terms = root.querySelector<HTMLInputElement>("#terms-checkbox");
      const submit = root.querySelector<HTMLButtonElement>("#btn-submit");
      const submitText = root.querySelector("#btn-submit-text");
      if (mode === "register" && terms && !terms.checked) {
        showMessage(root, "Accept the terms to create an account.");
        return;
      }
      showMessage(root, "");
      if (submit) submit.disabled = true;
      if (submitText) submitText.textContent = mode === "login" ? "Signing in..." : "Creating account...";

      const action =
        mode === "login" ? login(email, password) : register(name, email, password);

      void action
        .then(() => router.push("/dashboard"))
        .catch((err: unknown) => {
          showMessage(root, err instanceof Error ? err.message : mode === "login" ? "Login failed" : "Registration failed");
          if (submit) submit.disabled = false;
          if (submitText) submitText.textContent = mode === "login" ? "Sign in to Imagelab" : "Create Free Developer Account";
        });
    });

    const detachMenu = attachMobileMenu(root);

    return () => {
      detachMenu();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [login, mode, register, router]);

  return (
    <div
      ref={rootRef}
      className={`il-stitch ${jakarta.variable} ${inter.variable} ${mono.variable} min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased`}
      dangerouslySetInnerHTML={{ __html: stitchAuthMarkup }}
    />
  );
}
