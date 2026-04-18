# Deploy Shabong (static client)

The app is a **static Vite build** (`dist/`). Deploy `dist/` with any static host (Cloud Storage + CDN, Netlify, Vercel, nginx, etc.).

## Build

```bash
npm ci
npm run build
```

Upload or serve the contents of `dist/`.

## Docker (optional)

The repo `Dockerfile` builds the client and serves `dist/` with a small static server on port **8080** (suitable for Cloud Run).

```bash
docker build -t shabong:test .
docker run --rm -p 8080:8080 shabong:test
```

Open `http://localhost:8080`.

## Cloud Run

Point the service at the container image built from this Dockerfile. You do **not** need Redis, WebSockets, or `CLIENT_ORIGIN` for this single-page build.
