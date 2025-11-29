/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                peach: {
                    DEFAULT: '#FFB4A2',
                    light: '#FFD4C8',
                    dark: '#FF9580',
                },
                mint: {
                    DEFAULT: '#B5EAD7',
                    light: '#D4F4E8',
                    dark: '#96D9C3',
                },
                coral: {
                    DEFAULT: '#FF9AA2',
                    light: '#FFC4C9',
                    dark: '#FF7680',
                },
                cream: {
                    DEFAULT: '#FFF8F0',
                    light: '#FFFCF7',
                    dark: '#FFF0E0',
                },
                warmGray: {
                    DEFAULT: '#6B5B5B',
                    light: '#8A7A7A',
                    dark: '#4C3C3C',
                },
                teal: {
                    light: '#A8E6CF',
                },
                softOrange: '#FFD3B6',
            },
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
                display: ['Quicksand', 'sans-serif'],
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
            boxShadow: {
                'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
                'soft-lg': '0 8px 30px rgba(0, 0, 0, 0.12)',
                'soft-xl': '0 12px 40px rgba(0, 0, 0, 0.15)',
            },
        },
    },
    plugins: [],
}
