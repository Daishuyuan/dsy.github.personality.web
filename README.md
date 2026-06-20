# dsy.github.personality.web

Personal technical blog migrated from Hexo to Astro.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Content

Posts are loaded from MongoDB through the CMS repository. Each article keeps a
`legacyPath` so old Hexo URLs keep working, for example:

```yaml
legacyPath: "/2018/03/01/DUBBO的配置与使用手册/"
```

Images uploaded from the admin page are stored in Supabase Storage.

## CMS Environment

Required server-side variables:

- `MONGODB_URI`
- `MONGODB_DB`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`

Required browser-safe auth variables for `/admin` Google login:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `CMS_OWNER_EMAILS`

`PUBLIC_SUPABASE_ANON_KEY` must be the Supabase anon public key. Do not expose
`SUPABASE_SERVICE_ROLE_KEY` to the browser.

`ADMIN_TOKEN` is only a local fallback when Supabase public auth variables are
not configured.

## Deployment

The project uses Astro server output on Vercel:

- Framework Preset: Astro
- Build Command: `npm run build`
- Output Directory: `dist`
