# CineVault Server

This simple Express server issues short-lived S3 signed URLs for protected movie downloads.

## Setup
1. Copy `.env.example` to `.env` and set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `S3_BUCKET`.
2. Optionally set `SERVER_API_KEY` to require an API key for download requests.

## Start
cd server && npm install
npm run dev

## Notes
- Movie mappings are stored in `server/data/movies.json`. Replace with a DB in production.
- If `SERVER_API_KEY` is set, requests to `/api/download/:movieId` must include header `x-api-key` with that value (or `?api_key=` query param).
- To allow unauthenticated public downloads (only for movies with `downloadable: true`), set `ALLOW_PUBLIC_DOWNLOADS=1` in your `.env`.
- To force all movies to be downloadable regardless of the `downloadable` flag, set `FORCE_ALL_DOWNLOADS=1` in your `.env`.
- Admin: you can update the `downloadable` flag for all movies with the endpoint `POST /api/admin/movies/downloadable` (requires server API key or authenticated admin token) with body `{ "downloadable": true }`.
- Signed URLs expire after 60 seconds by default.

Troubleshooting "Failed to fetch":
- Ensure the server is running and accessible (check `PORT` and `VITE_SERVER_URL` client env).
- If the client is served over HTTPS and your server is HTTP, the browser may block the request (mixed content).
- Check browser DevTools Console / Network tab for CORS errors or blocked requests; the server logs a `[download]` line for each attempt with origin and IP to help debugging.
- Confirm AWS credentials and `S3_BUCKET` are configured; server logs detailed errors when signed URL generation fails.
