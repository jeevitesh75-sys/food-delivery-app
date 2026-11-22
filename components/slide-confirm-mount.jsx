import { createRoot } from "react-dom/client";
import SlideToConfirm from "./slide-confirm";
import confirmCss from "./slide-confirm.generated.css";

const BASE_CSS = `
  :host {
    display: block;
    width: 100%;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  *, *::before, *::after { box-sizing: border-box; }
  button { font: inherit; color: inherit; background: none; border: 0; padding: 0; }
  .slide-confirm-root { display: flex; justify-content: center; width: 100%; }
`;

let root = null;
let options = null;

function Island() {
  return <SlideToConfirm {...options} />;
}

function render() {
  if (root) {
    root.render(<Island />);
  }
}

export function mount(host, nextOptions) {
  if (!host) {
    return null;
  }
  options = nextOptions;

  if (root) {
    render();
    return api;
  }

  const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = BASE_CSS + confirmCss;
  shadow.appendChild(style);

  const container = document.createElement("div");
  container.className = "slide-confirm-root";
  shadow.appendChild(container);

  root = createRoot(container);
  render();
  return api;
}

export function setLabel(label) {
  options.label = label;
  render();
}

export function setDisabled(disabled) {
  options.disabled = disabled;
  render();
}

export function unmount() {
  root?.unmount();
  root = null;
  options = null;
}

const api = { mount, setLabel, setDisabled, unmount };
