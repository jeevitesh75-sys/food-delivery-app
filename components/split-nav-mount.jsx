import { createRoot } from "react-dom/client";
import MorphicNavbar from "./split-nav";
import navCss from "./split-nav.generated.css";

const BASE_CSS = `
  :host {
    display: block;
    width: 100%;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  *, *::before, *::after { box-sizing: border-box; }
  button, a { font: inherit; color: inherit; background: none; border: 0; padding: 0; }
  a { text-decoration: none; }
  .split-nav-root { display: block; width: 100%; }
`;

let root = null;
let options = null;

function Island() {
  return <MorphicNavbar {...options} />;
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
  style.textContent = BASE_CSS + navCss;
  shadow.appendChild(style);

  const container = document.createElement("div");
  container.className = "split-nav-root";
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

const api = { mount, unmount };
