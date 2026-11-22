/** Tailwind config for the split nav island. Preflight is off so the
 *  generated CSS can live inside a shadow root without touching the app. */
module.exports = {
  content: [
    "./components/split-nav.jsx",
    "./components/split-nav-mount.jsx",
  ],
  darkMode: "class",
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
};
