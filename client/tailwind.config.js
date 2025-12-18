/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cyber: {
                    900: '#0f172a', // Slate 900
                    800: '#1e293b', // Slate 800
                    accent: '#06b6d4', // Cyan 500
                    purple: '#8b5cf6', // Violet 500
                }
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
            }
        },
    },
    plugins: [],
}
