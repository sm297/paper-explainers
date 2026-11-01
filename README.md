# Research, explained

Interactive explainers for papers I've been involved in, published with GitHub Pages.

## Structure

```
index.html                 home page listing all papers
radiation-reaction/        Los et al., Nature Communications 17, 1157 (2026)
  index.html               introduction and links to the three simulations
  radiation-reaction-simulator.html
  figure3-hits-and-nulls.html
  figure4-fitting-one-shot.html
```

## Adding a new paper

1. Create a new folder for it (e.g. `my-next-paper/`) with its own `index.html`.
2. In the top-level `index.html`, copy the commented-out template card, uncomment it, and fill in the details, pointing the "Explore" link at the new folder's `index.html` (e.g. `my-next-paper/index.html`), so links also work when the files are opened locally.
3. Optionally add a `← All papers` link (`href="../index.html"`) at the top of the paper's own index page.

## Publishing

Upload the contents of this folder to the root of the repository, then go to **Settings → Pages** and serve from the main branch, `/ (root)`. Naming the repository `<your-username>.github.io` makes the site appear at `https://<your-username>.github.io/`.

Pages are self-contained HTML. The only external resources are Plotly.js 2.35.2 (jsDelivr) and Google Fonts.

## Disclaimer

The explainers are independent educational toy models, not the original authors' code or data; their numbers are illustrative.
