/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                deep: '#050505',
                glass: {
                    border: 'rgba(255, 255, 255, 0.08)',
                    surface: 'rgba(255, 255, 255, 0.03)',
                    highlight: 'rgba(255, 255, 255, 0.15)',
                    hover: 'rgba(255, 255, 255, 0.06)',
                },
                neon: {
                    cyan: '#4facfe', // Liquid Blue-Cyan
                    blue: '#00f2fe',
                    pink: '#f093fb', // Liquid Pink-Red
                    red: '#f5576c',
                    accent: '#42FFD5',
                }
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'blob-pulse': 'blob 10s infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                blob: {
                    '0%': {
                        transform: 'translate(0px, 0px) scale(1)',
                    },
                    '33%': {
                        transform: 'translate(30px, -50px) scale(1.1)',
                    },
                    '66%': {
                        transform: 'translate(-20px, 20px) scale(0.9)',
                    },
                    '100%': {
                        transform: 'translate(0px, 0px) scale(1)',
                    },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                }
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'neon': '0 0 10px rgba(79, 172, 254, 0.5)',
                'neon-pink': '0 0 10px rgba(245, 87, 108, 0.5)',
            }
        },
    },
    plugins: [],
}
