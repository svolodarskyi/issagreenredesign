# Issa Green Redesign

Static HTML site, migrating pieces to React where it makes sense.

## Pages
- `index.html` — homepage
- `about.html`
- `farmers.html`
- `location.html`
- `shop-tea.html`
- `tea-ware.html`
- `events.html`
- `products/*.html` — product detail pages (data in `window.PDP`, behaviour in `pdp.js`)
- `order-confirmation.html` — Wix checkout return page (`?order=NUMBER` = confirmed)
- `404.html`
- `cart.js` / `cart.css` — cart drawer (localStorage for now; swap `store` and set `ISSA_CHECKOUT_URL` for Wix)
- `workshops/wholelife-go-jan-9-1230.html`
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
