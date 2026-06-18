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

Posts live in `src/content/blog/`. Static assets live in `public/assets/`.

Each migrated post keeps a `legacyPath` frontmatter field so old Hexo URLs keep working, for example:

```yaml
legacyPath: "/2018/03/01/DUBBO的配置与使用手册/"
```

## Deployment

The project is a static Astro site and can be deployed on Vercel with the default settings:

- Framework Preset: Astro
- Build Command: `npm run build`
- Output Directory: `dist`
