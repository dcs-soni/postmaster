# Postmaster

A lightweight API testing tool with a built-in CORS proxy server. Test HTTP endpoints directly from your browser without CORS restrictions.

## Architecture

```
postmaster/
├── apps/
│   ├── api/     # Express proxy server (Bun runtime)
│   └── web/     # React frontend (Vite + TypeScript)
└── package.json # Monorepo root
```

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Radix UI  
**Backend:** Express, Bun, Axios, Zod, Pino

## Features

- Send HTTP requests (GET, POST, PUT, PATCH, DELETE)
- Custom headers and query parameters
- JSON body editor
- Request history
- Optional CORS proxy bypass

## Environment Variables

| Variable         | App | Default                           | Description    |
| ---------------- | --- | --------------------------------- | -------------- |
| `PORT`           | API | `3000`                            | Server port    |
| `VITE_PROXY_URL` | Web | `http://localhost:3000/api/proxy` | Proxy endpoint |

## API Endpoints

```
POST /api/proxy
```

**Request Body:**

```json
{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": { "Authorization": "Bearer token" },
  "data": {}
}
```

## Security

The proxy server includes SSRF protection:

- Blocks localhost, private IPs, and cloud metadata endpoints
- Blocks IPv4-mapped IPv6 addresses
- Disables redirect following
- Request timeout (30s) and size limits (10MB)
