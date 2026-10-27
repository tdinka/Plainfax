import type { Config } from "tailwindcss";

// Plainfax look: cool office paper, dark ink, one green for "send" actions.
// Green (signal) is only for actions and success; red (alert) only for problems.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: "#F3F5F6", 50: "#FAFBFB", 200: "#E6EAEC" },
        ink: { DEFAULT: "#15202B", soft: "#4A5864", faint: "#7A8691" },
        line: "#D6DCE0",
        signal: { DEFAULT: "#0B7A52", dark: "#085E3F", 50: "#E5F3EC" },
        alert: { DEFAULT: "#B42318", 50: "#FDECEA" },
        toner: { DEFAULT: "#C2891B", 50: "#FBF2DF" },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
