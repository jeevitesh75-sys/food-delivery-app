/** Tailwind config for the account menu island. Preflight is off so the
 *  generated CSS can live inside a shadow root without touching the app. */
module.exports = {
  content: [
    "./components/account-menu.jsx",
    "./components/account-menu-mount.jsx",
  ],
  darkMode: "class",
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
};
