import type { Config } from "tailwindcss";
import { createThemes } from "tw-colors";
import colors from "tailwindcss/colors";

const baseColors = [
  "gray",
  "red",
  "yellow",
  "green",
  "blue",
  "indigo",
  "purple",
  "pink",
];

const shadeMapping = {
  "50": "900",
  "100": "800",
  "200": "700",
  "300": "600",
  "400": "500",
  "500": "400",
  "600": "300",
  "700": "200",
  "800": "100",
  "900": "50",
};

const generateThemeObject = (colors: any, mapping: any, invert = false) => {
  const theme: any = {};
  baseColors.forEach((color) => {
    theme[color] = {};
    Object.entries(mapping).forEach(([key, value]: any) => {
      const shadeKey = invert ? value : key;
      theme[color][key] = colors[color][shadeKey];
    });
  });
  return theme;
};

const lightTheme = generateThemeObject(colors, shadeMapping);
const darkTheme = generateThemeObject(colors, shadeMapping, true);

// Shadcn/ui color variables
const shadcnColors = {
  // Light theme
  light: {
    border: "hsl(214.3 31.8% 91.4%)",
    input: "hsl(214.3 31.8% 91.4%)",
    ring: "hsl(222.2 84% 4.9%)",
    background: "hsl(0 0% 100%)",
    foreground: "hsl(222.2 84% 4.9%)",
    primary: {
      DEFAULT: "hsl(222.2 47.4% 11.2%)",
      foreground: "hsl(210 40% 98%)",
    },
    secondary: {
      DEFAULT: "hsl(210 40% 96%)",
      foreground: "hsl(222.2 84% 4.9%)",
    },
    destructive: {
      DEFAULT: "hsl(0 72.2% 50.6%)",
      foreground: "hsl(210 40% 98%)",
    },
    muted: {
      DEFAULT: "hsl(210 40% 96%)",
      foreground: "hsl(215.4 16.3% 46.9%)",
    },
    accent: {
      DEFAULT: "hsl(210 40% 96%)",
      foreground: "hsl(222.2 84% 4.9%)",
    },
    popover: {
      DEFAULT: "hsl(0 0% 100%)",
      foreground: "hsl(222.2 84% 4.9%)",
    },
    card: {
      DEFAULT: "hsl(0 0% 100%)",
      foreground: "hsl(222.2 84% 4.9%)",
    },
  },
  // Dark theme
  dark: {
    border: "hsl(217.2 32.6% 17.5%)",
    input: "hsl(217.2 32.6% 17.5%)",
    ring: "hsl(212.7 26.8% 83.9%)",
    background: "hsl(222.2 84% 4.9%)",
    foreground: "hsl(210 40% 98%)",
    primary: {
      DEFAULT: "hsl(210 40% 98%)",
      foreground: "hsl(222.2 47.4% 11.2%)",
    },
    secondary: {
      DEFAULT: "hsl(217.2 32.6% 17.5%)",
      foreground: "hsl(210 40% 98%)",
    },
    destructive: {
      DEFAULT: "hsl(0 62.8% 30.6%)",
      foreground: "hsl(210 40% 98%)",
    },
    muted: {
      DEFAULT: "hsl(217.2 32.6% 17.5%)",
      foreground: "hsl(215 20.2% 65.1%)",
    },
    accent: {
      DEFAULT: "hsl(217.2 32.6% 17.5%)",
      foreground: "hsl(210 40% 98%)",
    },
    popover: {
      DEFAULT: "hsl(222.2 84% 4.9%)",
      foreground: "hsl(210 40% 98%)",
    },
    card: {
      DEFAULT: "hsl(222.2 84% 4.9%)",
      foreground: "hsl(210 40% 98%)",
    },
  },
};

const themes = {
  light: {
    ...lightTheme,
    ...shadcnColors.light,
    white: "#ffffff",
  },
  dark: {
    ...darkTheme,
    ...shadcnColors.dark,
    white: colors.gray["950"],
    black: colors.gray["50"],
  },
};

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      // Add CSS variables for shadcn/ui
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
    },
  },
  plugins: [createThemes(themes)],
};

export default config;