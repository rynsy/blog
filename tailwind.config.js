/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./content/**/*.{md,mdx}",
    "./node_modules/@headlessui/react/**/*.{js,ts,jsx,tsx}", // Include Headless UI
    "./node_modules/@heroicons/react/**/*.{js,ts,jsx,tsx}", // Include Heroicons
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["Crimson Pro", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
        display: ["Crimson Pro", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'display-sm': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'heading-lg': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'heading-md': ['2rem', { lineHeight: '1.3', letterSpacing: '-0.005em' }],
        'heading-sm': ['1.75rem', { lineHeight: '1.4', letterSpacing: '0em' }],
        'body-lg': ['1.25rem', { lineHeight: '1.7', letterSpacing: '0.01em' }],
        'body-md': ['1.125rem', { lineHeight: '1.7', letterSpacing: '0.005em' }],
        'body-sm': ['1rem', { lineHeight: '1.6', letterSpacing: '0.005em' }],
        'caption': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
      },
      spacing: {
        'section': '4rem',
        'section-sm': '3rem',
        'component': '2rem',
        'component-sm': '1.5rem',
        'element': '1rem',
        'element-sm': '0.75rem',
        'element-xs': '0.5rem',
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
