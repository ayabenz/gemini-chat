# Gemini Style Multi-Gateway Chatbox

A full-featured AI chat application built with **Next.js** and **Tailwind CSS**, designed with an intuitive UI inspired by **Google Gemini**.

## Key Features:
1. **Gemini-Inspired UI:** Sleek dark mode design with sidebar chat history, responsive layout, and markdown rendering.
2. **Multi-Gateway / Multi-Endpoint Support:** Configure multiple AI API endpoints (OpenAI official, OpenRouter, Groq, local Ollama proxy, custom gateways) with individual API keys.
3. **Model Selection per Endpoint:** Easily switch between models configured under each gateway.
4. **Real-time Streaming Responses:** Built-in Server-Sent Events (SSE) streaming support for instant typewriter effects.
5. **CORS Handling via Server Proxy:** Uses a Next.js API route (`/api/chat`) to proxy requests securely, bypassing browser CORS restrictions.
6. **Vercel Ready:** One-click deployment to Vercel.

## Quick Start & Local Development:
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.
4. Click **Configure Gateways** to add your API base URLs, API keys, and models.

## Deploy to Vercel:
Push this project to a GitHub repository and import it into Vercel. No environment variables are required because API keys are managed directly within the UI and stored securely in your browser's LocalStorage.
