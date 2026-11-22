import { UtensilsCrossed } from "lucide-react";
import { createRoot } from "react-dom/client";
import CardStack from "./cart-deck";
import deckCss from "./cart-deck.generated.css";

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
  .cart-deck-root { width: 100%; }
`;

let root = null;
let options = null;

function inr(value) {
  const n = Number(value) || 0;
  return "₹" + n.toLocaleString("en-IN");
}

function FoodArt({ src, alt }) {
  return (
    <span className="relative block size-full overflow-hidden bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100">
      <span className="absolute inset-0 flex items-center justify-center text-orange-300">
        <UtensilsCrossed className="size-10" strokeWidth={1.5} />
      </span>
      {src ? (
        <img
          alt={alt}
          className="absolute inset-0 size-full object-cover"
          draggable={false}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          src={src}
        />
      ) : null}
    </span>
  );
}

function CartDeck({ items, accent, onAction }) {
  const cards = items.map((item, index) => ({
    id: `${item.name}-${index}`,
    title: item.name,
    subtitle: `${inr(item.price)} each`,
    art: <FoodArt alt={item.name} src={item.image} />,
    description:
      item.description ||
      "Freshly prepared and packed with care. Swipe through your cart, add one more, or continue to checkout.",
    specs: [
      { label: "Qty", value: String(item.qty) },
      { label: "Each", value: inr(item.price) },
      { label: "Total", value: inr(item.price * item.qty) },
    ],
    price: inr(item.price * item.qty),
    cartIndex: index,
  }));

  return (
    <CardStack
      accent={accent}
      actionLabel="Add one more"
      cards={cards}
      onAction={onAction}
    />
  );
}

export function refresh() {
  if (!(root && options)) {
    return;
  }
  const items = options.getItems() || [];
  root.render(
    <CartDeck
      accent={options.accent || "#f97316"}
      items={items}
      onAction={options.onAction}
    />
  );
}

export function mount(host, nextOptions) {
  if (!host) {
    return null;
  }
  options = nextOptions;
  if (root) {
    refresh();
    return api;
  }

  const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = BASE_CSS + deckCss;
  shadow.appendChild(style);

  const container = document.createElement("div");
  container.className = "cart-deck-root";
  shadow.appendChild(container);

  root = createRoot(container);
  refresh();
  return api;
}

export function unmount() {
  root?.unmount();
  root = null;
  options = null;
}

const api = { mount, refresh, unmount };
