# httpsmurphy.co.uk

Personal link-in-bio page. Single static `index.html` — no build step, no dependencies, edit by hand and push.

## Edit

Open `index.html`. Sections are clearly marked (Tools / Bots / Cook Groups). Each link is an `<a class="link">` block with an emoji, name, and one-line sub. Add/remove/reorder freely.

Colour tweaks are at the top in `:root { --accent: #ff8a2b; ... }`.

## Deploy

Two equally good options. Both free.

### A) Cloudflare Pages (already where your domain lives)

1. Push this folder to a GitHub repo (`gh repo create httpsmurphy/site --public --source=. --push`)
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo
3. **Build command:** _(leave blank)_
4. **Output directory:** _(leave blank — root)_
5. Deploy. You'll get a `*.pages.dev` URL within ~30s.
6. Pages → your project → Custom domains → Add `httpsmurphy.co.uk`. Cloudflare auto-creates the DNS record since the domain's on Cloudflare.

### B) Vercel

1. Push to GitHub as above
2. https://vercel.com/new → import the repo → Deploy (no config needed)
3. Project Settings → Domains → Add `httpsmurphy.co.uk`
4. Cloudflare DNS dashboard → add the CNAME/A record Vercel gives you (toggle the orange cloud OFF for the domain, set to "DNS only")

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
