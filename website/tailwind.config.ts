import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ["var(--font-rethink-sans)", "sans-serif"],
      serif: ["var(--font-junicode)", "serif"],
      display: ["var(--font-league-spartan)", "sans-serif"],
      calc: ["var(--font-calculatrix)", "monospace"],
    },

    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        breathe: {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 0px rgba(255, 255, 255, 0.7)",
            opacity: "0.5",
            // backgroundSize: "100% 100%",
            // backgroundPosition: "0% 0%",
          },
          "50%": {
            transform: "scale(1.2)",
            boxShadow: "0 0 0px rgba(150, 150, 150, 0.9)",
            opacity: "0.1",
          },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-500": "fade-in 0.5s ease-in",
        "fade-in-1000": "fade-in 1s ease-in",
        "fade-in-2000": "fade-in 2s ease-in",
        "fade-in-5000": "fade-in 5s ease-in",
        breathe: "breathe 8s infinite ease-in-out",
      },
    },
  },

  plugins: [
    // require("tailwindcss-animate"),
  ],
} satisfies Config;

export default config;
