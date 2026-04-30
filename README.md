# triageai-web

Angular 17 frontend for TriageAI — deployed on **Vercel**.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in [vercel.com](https://vercel.com) → **Add New Project**.
3. Vercel auto-detects Angular. Set one environment variable:

   | Variable | Value |
   |---|---|
   | `API_URL` | `https://your-railway-backend.up.railway.app` |

4. Deploy. The `prebuild` script injects `API_URL` before `ng build` runs.

The `vercel.json` handles SPA routing so page refreshes and direct URLs work correctly.

---

## Local Development

```bash
npm install
npm run dev    # http://localhost:4200 — proxies /api to localhost:3000
```

Requires the backend running on port 3000.

---

## Project Structure

```
triageai-web/
├── src/
│   ├── environments/
│   │   ├── environment.ts              # dev (apiUrl: '')
│   │   └── environment.production.ts   # prod (injected by replace-api-url.js)
│   ├── app/
│   │   ├── components/                 # Sidebar, Badge, Icon, MetricCard, …
│   │   ├── pages/                      # Dashboard, Triage, KnowledgeBase
│   │   ├── services/                   # ApiService, ToastService
│   │   └── models/                     # TypeScript interfaces
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── replace-api-url.js    # Prebuild: injects API_URL into environment.production.ts
├── vercel.json           # SPA rewrites for Vercel
├── proxy.conf.json       # Dev server proxy → localhost:3000
└── angular.json
```
