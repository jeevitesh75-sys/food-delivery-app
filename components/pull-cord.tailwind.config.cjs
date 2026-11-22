/** Tailwind config for the pull-cord island. Preflight is off so the
 *  generated CSS can live inside a shadow root without touching the app. */
module.exports = {
  content: [
    "./components/pull-cord.jsx",
    "./components/pull-cord-mount.jsx",
  ],
  darkMode: "class",
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
};
