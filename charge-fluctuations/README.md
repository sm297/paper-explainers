# When an ion’s charge flickers, heat moves

An interactive explainer of our paper

> R. A. Baggott, S. J. Rose and S. P. D. Mangles, “Temperature Equilibration Due to Charge State Fluctuations in Dense Plasmas,” *Phys. Rev. Lett.* **127**, 035002 (2021). [doi:10.1103/PhysRevLett.127.035002](https://doi.org/10.1103/PhysRevLett.127.035002), preprint [arXiv:2103.03616](https://arxiv.org/abs/2103.03616)

In this paper we show that the constant ionization and recombination of ions in a dense plasma opens a channel for energy exchange between electrons and ions, and that it can be as fast as direct electron–ion collisions. This page walks through the argument with an animation and four interactive figures.

## What’s on the page

- **Hero animation**: a central ion whose charge flickers between C²⁺ and C³⁺, pushing its neighbours outward when its charge rises.
- **Random telegraph charge**: a stochastic simulation of one hydrogen ion switching between H and H⁺. Its autocorrelation is checked against the analytic result from our paper.
- **Frequency matching**: schematic electron, ion and charge-fluctuation spectra, showing why charge fluctuations couple well to ion motion when their rate is close to the ion plasma frequency.
- **Detailed-balance factor**: the coth bracket from the rate equation in our paper, which sets the direction of energy flow.
- **Carbon lab**: a toy carbon plasma model that runs in the browser. It computes charge-state populations, the relaxation modes of the charge random walk, a coupling figure of merit and a Monte Carlo trace, with sliders for electron temperature, density and pressure ionization.

## Important caveat

All plots are computed live from simplified models written for this explainer. They follow the reasoning in our paper and reproduce its qualitative trends, but they are **not** the code we used for the paper or its published numbers. In particular, the carbon model uses Saha populations without statistical weights, Lotz-type ionization rates, recombination from detailed balance, and a scaled ion-sphere ionization-potential depression instead of the full Stewart–Pyatt model. The spectra in the frequency-matching figure are schematic shapes. For quantitative results, see the paper.

## Running locally

No build step. From the root of the `paper-explainers` repository, serve the folder and open the explainer:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/charge-fluctuations/
```

An internet connection is needed for the web fonts (Google Fonts) and equation rendering (MathJax 3.2.2 from jsDelivr). Without it, the page still works but equations show as raw LaTeX.

This explainer is part of the site at https://sm297.github.io/paper-explainers/ and is published at https://sm297.github.io/paper-explainers/charge-fluctuations/.

## Files

```
index.html         page content and text
assets/style.css   styles, including light and dark themes
assets/app.js      plotting, physics models and the hero animation
LICENSE            MIT licence
```

The JavaScript has no dependencies: plots are drawn with a small built-in SVG helper.

## Credits

Physics and results: Baggott, Rose and Mangles (2021). The paper’s text and figures are not reproduced here; the explanations are rewritten for a general audience and the plots are independent illustrations.

This explainer page, including its text, interactive models and code, was produced with the help of [Claude](https://claude.ai), an AI model made by Anthropic.

## Licence

The code in this repository is released under the [MIT Licence](LICENSE).
