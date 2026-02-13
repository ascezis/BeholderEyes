# Player Form Deploy (GitHub Pages)

## Local build

```bash
npm run build:player-form
```

Static files will be generated in:

- `dist/player-form`

## Local preview

```bash
npm run preview:player-form
```

## GitHub Pages

The workflow `.github/workflows/deploy-player-form.yml` deploys `dist/player-form`.

To enable:

1. Push branch to GitHub.
2. In repository settings, enable **Pages** with **GitHub Actions** source.
3. Push to `main` or run workflow manually.

After deploy, share the Pages URL with players.

