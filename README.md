# Ensalada — Frontend

Website for the Ensalada restaurant: branch picker, home, menu, contact page
and a chat assistant. Built with TanStack Start, React, Tailwind and shadcn/ui.
Talks to the Laravel API in the `Ensaladabackend` repo.

## Setup

```bash
npm install
cp .env.example .env     # then edit the values below
npm run dev
```

| Variable        | Purpose                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| `VITE_API_URL`  | Backend API base URL, must end in `/api` (e.g. `https://your-api.example.com/api`) |
| `VITE_SITE_URL` | Public URL of this site; used for canonical / og:url / og:image tags (optional)    |

The backend must list this site's URL in its `CORS_ALLOWED_ORIGINS`.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` / `npm run format`
