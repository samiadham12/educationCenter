# Production Deployment Checklist

## Environment

- [ ] Copy `.env.example` → production secrets store
- [ ] `AUTH_SECRET` — 32+ random chars
- [ ] `MONGODB_URI` — production MongoDB (replica set recommended)
- [ ] `REDIS_URL` — required for production cache/rate limits
- [ ] R2 credentials + CORS restricted to production domain
- [ ] `ADMIN_IP_WHITELIST` — optional for admin API routes
- [ ] `NEXT_PUBLIC_APP_URL` — production URL (https)

## Infrastructure

- [ ] MongoDB indexes: `npm run seed:indexes`
- [ ] Seed admin once: `npm run seed:admin`
- [ ] Academic data: `npm run seed:academic`
- [ ] ffmpeg installed on server for HLS transcoding (`FFMPEG_PATH`)

## R2 Bucket CORS

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## Security

- [ ] All API routes behind 10 layers (`withSecurityLayers`)
- [ ] No direct R2 URLs in client responses
- [ ] Stream tokens expire ≤ 15 minutes
- [ ] HTTPS only in production

## Stitch UI

1. Send `prompts/stitch/*.md` to Google Stitch
2. Copy output to `stitch-output/`
3. Wire `src/app/(stitch)/` shells per Appendix B in `plan.md`

## Commands

```bash
npm run build
npm run start
```
