/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                // Design System Tokens (CSS Variable based)
                background: "hsl(var(--ui-background))",
                foreground: "hsl(var(--ui-text))",
                surface: "hsl(var(--ui-surface))",
                surface2: "hsl(var(--ui-surface2))",
                border: "hsl(var(--ui-border))",
                input: "hsl(var(--ui-border))",
                ring: "hsl(var(--ui-ring))",
                primary: {
                    DEFAULT: "#5B7DCB",
                    foreground: "#FFFFFF",
                },
                secondary: {
                    DEFAULT: "#5BCBAB",
                    foreground: "#FFFFFF",
                },
                success: "hsl(var(--ui-success))",
                warning: "hsl(var(--ui-warning))",
                danger: "hsl(var(--ui-danger))",
                muted: {
                    DEFAULT: "hsl(var(--ui-muted))",
                    foreground: "hsl(var(--ui-muted-text))",
                },
                // Dark Tones from prompt
                tone: {
                    1: "#485651",
                    2: "#414659",
                }
            },
            borderRadius: {
                xl: "1rem",
                "2xl": "1.5rem",
                "3xl": "2rem",
                DEFAULT: "1rem",
            },
            boxShadow: {
                ui: "0 4px 12px rgba(0, 0, 0, 0.05)",
                "ui-hover": "0 8px 24px rgba(0, 0, 0, 0.1)",
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
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
