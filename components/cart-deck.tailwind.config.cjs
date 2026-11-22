/** Tailwind config for the cart deck island. Preflight is off so the
 *  generated CSS can live inside a shadow root without touching the app. */
module.exports = {
  content: ["./components/**/*.jsx"],
  darkMode: "class",
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
};
