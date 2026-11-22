/** Tailwind config for the slide-to-confirm island. Preflight is off so the
 *  generated CSS can live inside a shadow root without touching the app. */
module.exports = {
  content: [
    "./components/slide-confirm.jsx",
    "./components/slide-confirm-mount.jsx",
  ],
  darkMode: "class",
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
};
