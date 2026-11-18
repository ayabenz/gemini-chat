/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gemini: {
          bg: "#131314",
          sidebar: "#1e1f20",
          card: "#282a2c",
          hover: "#333538",
          border: "#3c4043",
          text: "#e3e3e3",
          muted: "#8e918f",
          accent: "#8ab4f8",
        }
      }
    },
  },
  plugins: [],
};
