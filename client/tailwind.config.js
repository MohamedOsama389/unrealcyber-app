/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Semantic Tokens (Mapped to CSS Variables)
                app: 'var(--bg)',
                panel: 'var(--card)',
                primary: 'var(--text)',
                secondary: 'var(--muted)',
                border: 'var(--border)',
                accent: 'var(--accent)',

                // Legacy / Brand Colors
                cyber: {
                    900: '#0f172a', // Slate 900
                    800: '#1e293b', // Slate 800
                    accent: '#06b6d4', // Cyan 500
                    purple: '#8b5cf6', // Violet 500
                },
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
            }
        },
    },
    plugins: [],
}
