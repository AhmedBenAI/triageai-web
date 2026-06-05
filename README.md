# triageai-web

> Angular 17 frontend for TriageAI — submit support tickets, view AI-generated triage results, browse the knowledge base, and track pipeline metrics.

Deployed on **Vercel**. Backend repo: [triageai-backend](https://github.com/PotatoUser69/triageai-backend) (Railway).

Live: [triageai.ahmed-ai.com](https://triageai.ahmed-ai.com)

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in [vercel.com](https://vercel.com) → **Add New Project**.
3. Vercel auto-detects Angular. Optionally set:

   | Variable | Value |
   |---|---|
   | `API_URL` | Your Railway backend URL (overrides the hardcoded default) |

4. Deploy. The `prebuild` script injects `API_URL` into the Angular environment file before `ng build` runs. If `API_URL` is not set, the value already in `environment.production.ts` is used.

The `vercel.json` handles SPA routing so page refreshes and direct URLs work correctly.

---

## Local Development

```bash
npm install
npm run dev    # http://localhost:4200 — proxies /api to localhost:3000
```

Requires the backend running on port 3000.

---

## Stack

| Layer | Technology |
|---|---|
| **Framework** | Angular 17, standalone components |
| **HTTP** | Angular `HttpClient` |
| **Styling** | Tailwind CSS |
| **Charts** | Chart.js |

---

## Project Structure

```
triageai-web/
├── src/
│   ├── environments/
│   │   ├── environment.ts              # dev  (apiUrl: '' — proxied)
│   │   └── environment.production.ts   # prod (apiUrl: Railway URL)
│   ├── app/
│   │   ├── components/                 # Sidebar, Badge, Icon, MetricCard, …
│   │   ├── pages/                      # Dashboard, Triage, KnowledgeBase
│   │   ├── services/                   # ApiService, ToastService
│   │   └── models/                     # TypeScript interfaces
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── replace-api-url.js    # Prebuild: injects API_URL into environment.production.ts
├── vercel.json           # Build command + SPA rewrites
├── proxy.conf.json       # Dev server proxy → localhost:3000
└── angular.json
```
