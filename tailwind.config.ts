import type { Config } from "tailwindcss";

export default {
  content: [
    //"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    //"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    //"./src/app/**/*.{js,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
     "!./node_modules/**/*",
     "!./.next/**/*",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)", 
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
} satisfies Config;
