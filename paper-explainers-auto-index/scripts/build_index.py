#!/usr/bin/env python3
"""Rebuild the papers list on the home page from every */card.html.

Each explainer folder that contains a card.html gets a card on index.html,
newest first by the card's data-date. Relative links in a card are rewritten
to point into its folder. <style> blocks in a card are moved into the home
page's stylesheet. Run from anywhere: python3 scripts/build_index.py
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"

STYLE_RE = re.compile(r"<style[^>]*>(.*?)</style>", re.S)
COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
RELATIVE_LINK_RE = re.compile(r'\b(href|src)="(?!https?:|//|/|#|mailto:|data:)([^"]*)"')


def replace_between(text, start, end, new):
    i, j = text.find(start), text.find(end)
    if i < 0 or j < i:
        sys.exit(f"index.html is missing the markers {start} ... {end}")
    return text[: i + len(start)] + new + text[j:]


def main():
    cards = []
    for path in sorted(ROOT.glob("*/card.html")):
        folder = path.parent.name
        raw = path.read_text(encoding="utf-8")
        styles = [s.strip() for s in STYLE_RE.findall(raw)]
        body = COMMENT_RE.sub("", STYLE_RE.sub("", raw)).strip()
        body = RELATIVE_LINK_RE.sub(lambda m: f'{m.group(1)}="{folder}/{m.group(2)}"', body)
        date = re.search(r'data-date="([^"]+)"', body)
        cards.append((date.group(1) if date else "0000", folder, body, styles))
        print(f"  card: {folder} ({cards[-1][0]})")

    cards.sort(key=lambda c: (c[0], c[1]), reverse=True)

    html_cards = "\n"
    for _, folder, body, _ in cards:
        indented = "\n".join(("      " + line) if line else "" for line in body.splitlines())
        html_cards += f"\n      <!-- ===== {folder}/card.html ===== -->\n{indented}\n"
    html_cards += "\n      "

    css = "\n"
    for _, folder, _, styles in cards:
        for block in styles:
            css += f"/* from {folder}/card.html */\n{block}\n"

    text = INDEX.read_text(encoding="utf-8")
    new = replace_between(text, "<!-- CARDS:START -->", "<!-- CARDS:END -->", html_cards)
    new = replace_between(new, "/* CARD-STYLES:START */", "/* CARD-STYLES:END */", css)
    if new != text:
        INDEX.write_text(new, encoding="utf-8")
        print(f"Updated index.html with {len(cards)} cards.")
    else:
        print("index.html already up to date.")


if __name__ == "__main__":
    main()
