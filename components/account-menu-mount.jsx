import {
  LifeBuoy,
  MapPin,
  Pencil,
  ReceiptText,
  User,
} from "lucide-react";
import { createRoot } from "react-dom/client";
import ProfileDropdown from "./account-menu";
import menuCss from "./account-menu.generated.css";

const BASE_CSS = `
  :host {
    display: block;
    width: 100%;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
    color: #0a0a0a;
    -webkit-font-smoothing: antialiased;
  }
  *, *::before, *::after { box-sizing: border-box; }
  button { font: inherit; color: inherit; background: none; border: 0; padding: 0; }
  a { color: inherit; text-decoration: none; }
  fieldset { margin: 0; padding: 0; border: 0; }
  .account-menu-root { display: flex; justify-content: center; width: 100%; }
  .account-menu-root.dark { color-scheme: dark; }
`;

let root = null;
let options = null;
let currentTheme = "light";
let containerEl = null;

function resolveTheme(theme) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

function applyDark(theme) {
  containerEl?.classList.toggle("dark", resolveTheme(theme) === "dark");
}

function buildItems(opts) {
  return [
    {
      label: "Profile details",
      icon: <User className="size-4" />,
      onSelect: () => opts.onNavigate?.("profile"),
    },
    {
      label: "Edit profile",
      icon: <Pencil className="size-4" />,
      onSelect: () => opts.onEdit?.(),
    },
    {
      label: "Recent orders",
      icon: <ReceiptText className="size-4" />,
      onSelect: () => opts.onNavigate?.("orders"),
    },
    {
      label: "Addresses",
      icon: <MapPin className="size-4" />,
      onSelect: () => opts.onNavigate?.("addresses"),
    },
    {
      label: "Customer care",
      icon: <LifeBuoy className="size-4" />,
      onSelect: () => opts.onNavigate?.("support"),
    },
  ];
}

function AccountMenu({ opts }) {
  const accounts = opts.account ? [opts.account] : [];
  return (
    <ProfileDropdown
      accounts={accounts}
      defaultAccountId={opts.account?.id}
      defaultStatus={opts.defaultStatus}
      defaultTheme={currentTheme}
      items={buildItems(opts)}
      onSignOut={opts.onSignOut}
      onStatusChange={opts.onStatusChange}
      onThemeChange={(theme) => {
        currentTheme = theme;
        applyDark(theme);
        opts.onThemeChange?.(theme);
      }}
      theme={currentTheme}
    />
  );
}

function render() {
  if (!(root && options)) {
    return;
  }
  root.render(<AccountMenu opts={options} />);
}

export function setTheme(theme) {
  currentTheme = theme;
  applyDark(theme);
  render();
}

export function refresh() {
  render();
}

export function mount(host, nextOptions) {
  if (!host) {
    return null;
  }
  options = nextOptions;
  currentTheme = nextOptions.theme || nextOptions.defaultTheme || "light";

  if (root) {
    applyDark(currentTheme);
    render();
    return api;
  }

  const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = BASE_CSS + menuCss;
  shadow.appendChild(style);

  const container = document.createElement("div");
  container.className = "account-menu-root";
  shadow.appendChild(container);
  containerEl = container;

  root = createRoot(container);
  applyDark(currentTheme);
  render();
  return api;
}

export function unmount() {
  root?.unmount();
  root = null;
  options = null;
  containerEl = null;
}

const api = { mount, refresh, setTheme, unmount };
