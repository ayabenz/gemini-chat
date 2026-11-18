import "./globals.css";

export const metadata = {
  title: "Gemini Style Multi-Gateway Chatbox",
  description: "Chat interface with multi-endpoint support, API keys, model selection, and streaming.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#131314] text-[#e3e3e3] h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
