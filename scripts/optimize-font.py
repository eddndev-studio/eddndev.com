"""Build the site's upright variable font with fonttools[woff].

Run from the repository root: python3 scripts/optimize-font.py
The original stays available for future italic designs. Every glyph and the
full weight/width ranges are retained; only the unused italic axis is fixed.
"""

from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/fonts/Mona-Sans.var.woff2"
DESTINATION = ROOT / "public/fonts/Mona-Sans-upright.var.woff2"


def main():
    original = TTFont(SOURCE, recalcTimestamp=False)
    characters = original.getBestCmap()
    ranges = {
        axis.axisTag: (axis.minValue, axis.defaultValue, axis.maxValue)
        for axis in original["fvar"].axes
        if axis.axisTag != "ital"
    }
    upright = instantiateVariableFont(original, {"ital": 0}, inplace=False)
    assert upright.getBestCmap() == characters
    assert {
        axis.axisTag: (axis.minValue, axis.defaultValue, axis.maxValue)
        for axis in upright["fvar"].axes
    } == ranges
    upright.flavor = "woff2"
    upright.save(DESTINATION)
    print(f"{SOURCE.stat().st_size:,} → {DESTINATION.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
