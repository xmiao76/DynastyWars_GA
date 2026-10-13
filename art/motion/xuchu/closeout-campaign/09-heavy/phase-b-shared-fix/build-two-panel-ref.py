"""Deterministic two-panel reference for the Phase B ONE shared heavy length fix.

Places the final registered/retouched cell2 (left) and cell3 (right) cells
side-by-side at ONE identical pack scale 0.6875 (=11/16; 1024x768 -> 704x528)
on a 1536x1024 transparent canvas with a clear 64px transparent separation
column (no labels, no drawn separator/guide lines). Rerunning must reproduce
the same PNG bytes (PIL LANCZOS resize + alpha composite only).
"""
import hashlib, json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
C2 = HERE.parent / "phase-b/cell2-retouched.png"
C3 = HERE.parent / "phase-b-cell3/cell3-retouched.png"
OUT = HERE / "two-panel-ref.png"
META = HERE / "two-panel-ref.json"

CANVAS = (1536, 1024)
PACK = 0.6875                      # 11/16, identical for both panels
PANEL = (704, 528)                 # 1024*11/16, 768*11/16 (exact integers)
LEFT = (32, 248)                   # margin 32; vertically centred (1024-528)/2=248
RIGHT = (800, 248)                 # 32+704+64=800; separation column x in [736,800)
GAP = 64

# Gate scale from phase-b/gate.py: U = 124/477 u per registered px.
U_PER_REG_PX = 124 / 477
REG_PX_PER_U = 477 / 124
TARGET_U = 130.79
# Final gate measures (phase-b/gate.json, phase-b-cell3/gate.json `final.measure`).
C2_REG = {"pxLen": 620.2, "u": 161.23, "angDeg": 10.29, "butt": [242.78, 522.19], "tip": [853, 633]}
C3_REG = {"pxLen": 606.64, "u": 157.70, "angDeg": 15.66, "butt": [273.88, 482.27], "tip": [858, 646]}


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def panel_coords(reg, off):
    f = lambda pt: [round(pt[0] * PACK + off[0], 2), round(pt[1] * PACK + off[1], 2)]
    return {"butt": f(reg["butt"]), "tip": f(reg["tip"]),
            "pxLen": round(reg["pxLen"] * PACK, 2)}


def main():
    assert (1024 * PACK, 768 * PACK) == PANEL
    c2, c3 = Image.open(C2).convert("RGBA"), Image.open(C3).convert("RGBA")
    assert c2.size == c3.size == (1024, 768), (c2.size, c3.size)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    p2 = c2.resize(PANEL, Image.LANCZOS)
    p3 = c3.resize(PANEL, Image.LANCZOS)
    canvas.alpha_composite(p2, LEFT)
    canvas.alpha_composite(p3, RIGHT)
    canvas.save(OUT)
    target_reg_px = TARGET_U * REG_PX_PER_U
    target_native_px = target_reg_px * PACK
    meta = {
        "work": "cmr15a-heavy-shared-fix-generate (COMPLETION CAMPAIGN Phase B ONE shared fix, generation only)",
        "zeroGeneration": True,
        "builder": "phase-b-shared-fix/build-two-panel-ref.py (deterministic: PIL LANCZOS resize to one pack scale + alpha composite; double-run byte-identical required)",
        "canvas": {"size": list(CANVAS), "fill": "transparent (alpha 0)",
                   "separation": f"clear {GAP}px transparent column x in [{LEFT[0]+PANEL[0]},{RIGHT[0]}); no labels, no drawn separator/guide lines"},
        "packScale": PACK,
        "panelSize": list(PANEL),
        "panels": [
            {"side": "LEFT", "cell": "cell2-crushing-chop final (phase-b gate final, FAIL length-only)",
             "sourcePath": "art/motion/xuchu/closeout-campaign/09-heavy/phase-b/cell2-retouched.png",
             "sourceSha256": sha(C2), "sourceSize": [1024, 768], "offset": list(LEFT),
             "registered": C2_REG, "panelNative": panel_coords(C2_REG, LEFT)},
            {"side": "RIGHT", "cell": "cell3-follow-through final (phase-b-cell3 gate final, FAIL length-only)",
             "sourcePath": "art/motion/xuchu/closeout-campaign/09-heavy/phase-b-cell3/cell3-retouched.png",
             "sourceSha256": sha(C3), "sourceSize": [1024, 768], "offset": list(RIGHT),
             "registered": C3_REG, "panelNative": panel_coords(C3_REG, RIGHT)},
        ],
        "gateScale": {"uPerRegisteredPx": U_PER_REG_PX, "registeredPxPerU": round(REG_PX_PER_U, 6),
                      "source": "phase-b/gate.py U = 124/477"},
        "weaponTarget": {
            "targetU": TARGET_U,
            "targetRegisteredPx": round(target_reg_px, 2),
            "derivationRegistered": "130.79u x 477/124 registered px per u = 503.12 registered px (frozen band [124.41,137.50]u = 479-529 registered px)",
            "targetNativePanelPx": round(target_native_px, 2),
            "derivationNative": "503.12 registered px x pack scale 0.6875 = 345.89 native px on the 1536x1024 two-panel canvas (same for both panels)",
            "cell2": {"fromU": 161.23, "fromRegisteredPx": 620.2, "fromNativePanelPx": round(620.2 * PACK, 2),
                      "factor": round(TARGET_U / 161.23, 4), "shorterPct": round((1 - TARGET_U / 161.23) * 100, 2), "axisDeg": 10.29},
            "cell3": {"fromU": 157.70, "fromRegisteredPx": 606.64, "fromNativePanelPx": round(606.64 * PACK, 2),
                      "factor": round(TARGET_U / 157.70, 4), "shorterPct": round((1 - TARGET_U / 157.70) * 100, 2), "axisDeg": 15.66},
        },
        "twoPanelReference": {"path": "art/motion/xuchu/closeout-campaign/09-heavy/phase-b-shared-fix/two-panel-ref.png",
                              "sha256": sha(OUT), "bytes": OUT.stat().st_size, "size": list(CANVAS), "sent": "reference 1 (EDIT target)"},
    }
    META.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(OUT.name, meta["twoPanelReference"]["sha256"], meta["twoPanelReference"]["bytes"])


if __name__ == "__main__":
    main()
