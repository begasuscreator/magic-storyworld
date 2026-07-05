# Magic Storyworld - Maya Springs Landing Page

This repository contains the bilingual landing page and CMS Admin Dashboard for the cross-platform project **Magic Storyworld** by author **Maya Springs**. It serves as a visual hub and conversion funnel connecting printed books, coloring files, video content, and instrumental tracks.

## 🚀 Key Features

- **Bilingual Support (ITA/ENG)**: Switch between Italian and English instantly.
- **Dynamic Content & Theming**: All texts, books, character bios, FAQs, and accent colors can be updated from the Admin Dashboard.
- **Responsive 3D Flipbook**: Interactive page-turning preview for books (displays as a 3D double-page spread on desktop and a mobile-friendly single-page swiper).
- **AEO-Optimized FAQ Section**: Preloaded with 30 bilingual FAQs structured using Schema.org semantic microdata to rank higher in AI search engines (Perplexity, ChatGPT, Gemini, etc.).
- **Newsletter Funnel (n8n & Airtable)**: Captured emails are sent to an n8n webhook, which logs subscribers in Airtable and emails them short.io download links.
- **Git-Based Admin Dashboard**: A client-side admin panel that saves changes and uploads images directly to the GitHub repository using the GitHub API (serverless, 100% free hosting).

---

## 🛠️ Local Development

To run this project locally on your computer:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. **Build for production**:
   ```bash
   npm run build
   ```
   The compiled static files will be located in the `dist/` directory.

---

## 🌎 Cloudflare Pages Deployment & CMS Setup

For a complete step-by-step guide on how to upload this project to GitHub, host it on Cloudflare Pages, and set up your personal access credentials for the Admin Dashboard, please refer to the **[Walkthrough & Deployment Guide](file:///C:/Users/cataw/.gemini/antigravity/brain/c82b78c9-bc33-40b4-99d8-93921ba033aa/walkthrough.md)**.
