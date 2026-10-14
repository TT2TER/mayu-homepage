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

The initial release uses the Netlify CLI with the existing account. GitHub stores the source. To enable publication after each push, import this repository in Netlify and use the supplied build settings.

For a manual update, run `node build.mjs 2>&1 | tee build.log`, then `netlify deploy --prod --no-build --dir dist 2>&1 | tee deploy.log`.

Custom domain target: `mayu.my`. The domain is registered with Porkbun and its DNS is managed by Cloudflare. Domain binding is configured separately from the initial Netlify deployment.

Netlify documentation: https://docs.netlify.com/start/quickstarts/deploy-from-repository/

## Content

Publication metadata follows the supplied BibTeX; preprint titles and author lists were also checked against arXiv. The Funding section lists the Beijing Natural Science Foundation Undergraduate "Qiyan" Program, with the role Grant Recipient and the period 2024–2026.
