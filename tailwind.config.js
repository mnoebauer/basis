/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"SF Pro Display"', '"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
            },
            colors: {
                apple: {
                    gray: '#f5f5f7',
                    darkGray: '#1c1c1e',
                    border: '#e5e5ea',
                    blue: '#007aff',
                }
            },
            boxShadow: {
                'apple': '0 4px 14px 0 rgba(0,0,0,0.1)',
            }
        },
    },
    plugins: [],
}
