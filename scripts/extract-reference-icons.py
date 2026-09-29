"""Copy the three header SVGs from the saved PC Palace response.

Run from the theme repository root. These are presentation assets only; cart,
account and wishlist behavior remains bound to Salla.
"""

from pathlib import Path
from bs4 import BeautifulSoup

root = Path(__file__).resolve().parents[1]
source = root.parent / "pcpalace-theme" / "index.html"
target = root / "src" / "assets" / "images"
soup = BeautifulSoup(source.read_text(encoding="utf-8"), "html.parser")
selectors = {
    "palace-heart.svg": 'a[href="/account-wishlist"] svg',
    "palace-cart.svg": "a.mini-cart-icon svg",
    "palace-user.svg": "button.accordion-button svg",
}
for filename, selector in selectors.items():
    svg = soup.select_one(selector)
    if svg is None:
        raise RuntimeError(f"Missing original icon: {selector}")
    (target / filename).write_text(str(svg), encoding="utf-8")
    print(filename)
