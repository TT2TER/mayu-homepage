# mayu.my Academic Homepage

Static academic homepage for Yu Ma. The page is in English with a bilingual name and contains About, Research, Publications, and Funding sections.

## Files

- `index.html`: biography, research interests, publications, funding, and profile links.
- `style.css`: responsive typography and layout, based on https://dythuhu.cn/.
- `build.mjs`: copies the website files into `dist/` for publication.
- `netlify.toml`: Netlify build and publication configuration.

## Hosting

GitHub repository: https://github.com/TT2TER/mayu-homepage

Netlify: https://mayu-homepage.netlify.app/

Build command: `node build.mjs`. Publish directory: `dist`.

The existing Netlify project is connected to `TT2TER/mayu-homepage`. Commits pushed to `main`, including edits committed through the GitHub website, automatically trigger a Netlify build and production deployment. The build runs `node build.mjs` and publishes `dist/`.

For a manual update, run `node build.mjs 2>&1 | tee build.log`, then `netlify deploy --prod --no-build --dir dist 2>&1 | tee deploy.log`.

Primary custom domain: https://mayu.my/ . The domain is registered with Porkbun and its DNS is managed by Cloudflare. Both the primary domain and `www.mayu.my` use the Cloudflare proxy. Netlify redirects `www.mayu.my` to the primary domain and has issued a certificate covering both hostnames. The Powered by Netlify badge is disabled.

Netlify documentation: https://docs.netlify.com/start/quickstarts/deploy-from-repository/

## Content

Publication metadata follows the supplied BibTeX; preprint titles and author lists were also checked against arXiv. The Funding section lists the Beijing Natural Science Foundation Undergraduate "Qiyan" Program, with the role Grant Recipient and the period 2024–2026.

## Maintenance

See `progress.md` for deployment and verification receipts, and `PLAN_NEXT.md` for the maintenance workflow. Fetch the remote branch before editing to account for updates made through the GitHub website.
