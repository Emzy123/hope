import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          dark:    'hsl(var(--primary-dark) / <alpha-value>)',
          light:   'hsl(var(--primary-light) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          light:   'hsl(var(--accent-light) / <alpha-value>)',
        },
        neutral: {
          900: 'hsl(var(--neutral-900) / <alpha-value>)',
          600: 'hsl(var(--neutral-600) / <alpha-value>)',
          200: 'hsl(var(--neutral-200) / <alpha-value>)',
          50:  'hsl(var(--neutral-50) / <alpha-value>)',
        },
        danger:  'hsl(var(--danger) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      borderRadius: {
        'xl': '12px',
        'lg': '8px',
        'md': '6px',
      },
    },
  },
  plugins: [],
};
export default config;

