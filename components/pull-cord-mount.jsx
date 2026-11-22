import { createRoot } from "react-dom/client";
import PullCord from "./pull-cord";
import cordCss from "./pull-cord.generated.css";

const BASE_CSS = `
  :host {
    display: block;
    width: 100%;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  *, *::before, *::after { box-sizing: border-box; }
  button { font: inherit; color: inherit; background: none; border: 0; padding: 0; }
  .pull-cord-root { display: flex; justify-content: center; width: 100%; }
`;

let root = null;
let options = null;
let checked = true;

function Island() {
  return (
    <PullCord
      checked={checked}
      label={options.label || "Lights"}
      onCheckedChange={(next) => {
        checked = next;
        options.onCheckedChange?.(next);
        render();
      }}
    />
  );
}

function render() {
  if (root) {
    root.render(<Island />);
  }
}

export function setChecked(next) {
  checked = next;
  render();
}

export function mount(host, nextOptions) {
  if (!host) {
    return null;
  }
  options = nextOptions;
  checked = nextOptions.checked ?? true;

  if (root) {
    render();
    return api;
  }

  const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = BASE_CSS + cordCss;
  shadow.appendChild(style);

  const container = document.createElement("div");
  container.className = "pull-cord-root";
  shadow.appendChild(container);

  root = createRoot(container);
  render();
  return api;
}

export function unmount() {
  root?.unmount();
  root = null;
  options = null;
}

const api = { mount, setChecked, unmount };
