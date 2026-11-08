# Issa Green Redesign

Static HTML site, migrating pieces to React where it makes sense.

## Pages
- `index.html` — homepage
- `about.html`
- `farmers.html`
- `location.html`
- `shop-tea.html`
- `tea-selection.html`
- `issa-tea-selection-beautiful.html`

## Deploys
- Pushes to `main` deploy to Production on Vercel.
- Pushes to any other branch get a Vercel Preview deployment ("dev").

## Workflow
1. Branch off `main`.
2. Commit changes, push — Vercel builds a preview.
3. Open a PR into `main`.
4. Merge — Vercel deploys to Production.
