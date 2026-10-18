"""Draw the sample vocab pictures (vocab/images/*.svg): simple flat icons in the brand colors.

    python vocab/tools/draw_icons.py

Original drawings, so there's no image license to worry about, and they work offline
(Wikimedia Commons is blocked in some places). Replace any of them with your own picture:
keep the file name, or change the `image` column in data/vocab.csv.
"""

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "images"
NAVY, BLUE, TURQ, ORANGE, SKY, INK = "#003477", "#0087ff", "#14d7cd", "#ff8c0f", "#ebf7fd", "#1F2933"
STONE, STONE_DK, SEA, GRASS, RED, GOLD, WHITE = "#e8dcc4", "#c9b48f", "#7cc7f0", "#8cc472", "#d9483b", "#f2b630", "#ffffff"


def svg(body, bg=SKY):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180">'
            f'<rect width="240" height="180" rx="14" fill="{bg}"/>{body}</svg>\n')


def person(x, y, color=NAVY, s=1.0, arm_up=False, toga=None):
    """A simple figure standing at (x, y) = feet."""
    h = 46 * s
    head = f'<circle cx="{x}" cy="{y - h}" r="{7 * s}" fill="{color}"/>'
    body = f'<path d="M{x - 9 * s},{y} L{x - 7 * s},{y - h + 10 * s} Q{x},{y - h + 6 * s} {x + 7 * s},{y - h + 10 * s} L{x + 9 * s},{y} Z" fill="{toga or color}"/>'
    arm = (f'<line x1="{x + 6 * s}" y1="{y - h + 14 * s}" x2="{x + 13 * s}" y2="{y - h - 6 * s}" stroke="{color}" stroke-width="{4 * s}" stroke-linecap="round"/>'
           if arm_up else "")
    return head + body + arm


def columns_row(x0, x1, top, bottom, n, color=WHITE, stroke=STONE_DK):
    w = (x1 - x0) / (2 * n - 1)
    return "".join(f'<rect x="{x0 + i * 2 * w:.1f}" y="{top}" width="{w:.1f}" height="{bottom - top}" fill="{color}" stroke="{stroke}" stroke-width="1.5"/>'
                   for i in range(n))


def temple(x0=40, x1=200, base=150, top=78, n=6):
    return (f'<rect x="{x0 - 10}" y="{base}" width="{x1 - x0 + 20}" height="10" fill="{STONE_DK}"/>'
            f'<rect x="{x0 - 5}" y="{base - 6}" width="{x1 - x0 + 10}" height="8" fill="{STONE}"/>'
            + columns_row(x0, x1, top, base - 6, n, STONE) +
            f'<rect x="{x0 - 8}" y="{top - 10}" width="{x1 - x0 + 16}" height="12" fill="{STONE}" stroke="{STONE_DK}"/>'
            f'<polygon points="{x0 - 10},{top - 10} {(x0 + x1) / 2},{top - 38} {x1 + 10},{top - 10}" fill="{STONE}" stroke="{STONE_DK}" stroke-width="1.5"/>')


def arches(x0, x1, base, top, n, fill=STONE, line=STONE_DK):
    w = (x1 - x0) / n
    out = f'<rect x="{x0}" y="{top}" width="{x1 - x0}" height="{base - top}" fill="{fill}" stroke="{line}" stroke-width="1.5"/>'
    r = w * 0.32
    for i in range(n):
        cx = x0 + w * (i + 0.5)
        out += f'<path d="M{cx - r},{base} L{cx - r},{top + r + 6} A{r},{r} 0 0 1 {cx + r},{top + r + 6} L{cx + r},{base} Z" fill="{SKY}"/>'
    return out


def crown(x, y, s=1.0, color=GOLD, line=ORANGE):
    """A crown whose base sits at (x, y)."""
    return (f'<path d="M{x - 18 * s},{y} L{x - 18 * s},{y - 20 * s} L{x - 9 * s},{y - 8 * s} '
            f'L{x},{y - 25 * s} L{x + 9 * s},{y - 8 * s} L{x + 18 * s},{y - 20 * s} L{x + 18 * s},{y} Z" '
            f'fill="{color}" stroke="{line}" stroke-width="1.8"/>'
            f'<rect x="{x - 18 * s}" y="{y - 6 * s}" width="{36 * s}" height="{6 * s}" fill="{line}"/>')


def tablet(x, y, w=62, h=46, color=STONE, line=STONE_DK):
    """A clay tablet with wedge writing; its top-left corner is (x, y)."""
    out = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{color}" stroke="{line}" stroke-width="2.5"/>'
    for i in range(4):
        yy = y + 11 + i * (h - 18) / 3
        out += "".join(f'<polygon points="{x + 11 + j * 15:.0f},{yy + 6:.0f} {x + 16 + j * 15:.0f},{yy:.0f} '
                       f'{x + 19 + j * 15:.0f},{yy + 6:.0f}" fill="{line}"/>' for j in range(3))
    return out


def scroll(x, y, w=54, h=68, color=WHITE, line=NAVY):
    """A written sheet; its top-left corner is (x, y)."""
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{color}" stroke="{line}" stroke-width="2.5"/>'
            + "".join(f'<line x1="{x + 8}" y1="{y + 15 + i * 13}" x2="{x + w - 8}" y2="{y + 15 + i * 13}" '
                      f'stroke="{line}" stroke-width="3"/>' for i in range(4)))


def no_sign(x, y, r=14, color=RED):
    """A red circle with a slash: 'not allowed'."""
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="{color}" stroke-width="4"/>'
            f'<line x1="{x - r * 0.72:.1f}" y1="{y - r * 0.72:.1f}" x2="{x + r * 0.72:.1f}" y2="{y + r * 0.72:.1f}" '
            f'stroke="{color}" stroke-width="4" stroke-linecap="round"/>')


def eye(x, y, color=NAVY):
    """A simple eye glyph centred on (x, y)."""
    return (f'<ellipse cx="{x}" cy="{y}" rx="17" ry="11" fill="{WHITE}" stroke="{color}" stroke-width="3"/>'
            f'<circle cx="{x}" cy="{y}" r="5" fill="{color}"/>')


def caption(text, x=120, y=26, size=12, color=NAVY):
    """A short bold label across the top of an icon."""
    return (f'<text x="{x}" y="{y}" text-anchor="middle" font-family="sans-serif" font-size="{size}" '
            f'font-weight="700" fill="{color}">{text}</text>')


def sun(x, y, r=13, color=GOLD, line=ORANGE):
    """A sun with rays."""
    out = f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}"/>'
    return out + "".join(f'<line x1="{x}" y1="{y - r - 3}" x2="{x}" y2="{y - r - 9}" stroke="{line}" stroke-width="3" '
                         f'stroke-linecap="round" transform="rotate({a} {x} {y})"/>' for a in range(0, 360, 45))


def sprout(x, y, h=26, color="#5f9a4b"):
    """A small seedling growing up from (x, y)."""
    return (f'<line x1="{x}" y1="{y}" x2="{x}" y2="{y - h}" stroke="{color}" stroke-width="3"/>'
            f'<path d="M{x},{y - h * 0.55:.0f} q-10,-3 -12,-14" fill="none" stroke="{color}" stroke-width="3"/>'
            f'<path d="M{x},{y - h * 0.35:.0f} q10,-3 11,-13" fill="none" stroke="{color}" stroke-width="3"/>')


ICONS = {
    # ------------------------------------------------------------------
    # Unit 1 — Ancient River Civilizations
    # ------------------------------------------------------------------
    "RIV-001": svg(  # civilization: cities, government, writing, specialised jobs
        "".join(f'<rect x="{x}" y="{y}" width="100" height="64" rx="8" fill="{WHITE}" stroke="{BLUE}" stroke-width="2"/>'
                for x, y in ((12, 16), (128, 16), (12, 88), (128, 88))) +
        # cities
        f'<polygon points="24,68 24,52 38,42 52,52 52,68" fill="{STONE}" stroke="{STONE_DK}" stroke-width="1.5"/>'
        f'<rect x="56" y="50" width="30" height="18" fill="{STONE}" stroke="{STONE_DK}" stroke-width="1.5"/>'
        f'<polygon points="54,50 71,40 88,50" fill="{RED}" stroke="{STONE_DK}" stroke-width="1.5"/>'
        f'<line x1="16" y1="68" x2="108" y2="68" stroke="{STONE_DK}" stroke-width="3"/>'
        # government
        + crown(176, 56, 0.8) +
        f'<line x1="202" y1="72" x2="202" y2="42" stroke="{NAVY}" stroke-width="4"/>'
        f'<circle cx="202" cy="38" r="6" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>'
        # writing
        + tablet(28, 96, 68, 46) +
        # specialised jobs: a potter at the wheel
        f'<rect x="148" y="132" width="56" height="7" fill="{STONE_DK}"/>'
        f'<line x1="176" y1="139" x2="176" y2="152" stroke="{STONE_DK}" stroke-width="5"/>'
        f'<path d="M161,132 q-3,-24 15,-24 q18,0 15,24 Z" fill="{ORANGE}" stroke="{STONE_DK}" stroke-width="2"/>'),
    "RIV-002": svg(  # silt: the fertile mud a flood leaves behind
        f'<path d="M0,34 H52 Q46,100 52,176 H0 Z" fill="{SEA}"/>'
        f'<rect x="46" y="112" width="194" height="64" fill="{GRASS}"/>'
        f'<path d="M46,112 Q118,96 240,104 L240,122 Q118,114 46,130 Z" fill="#a87f47" stroke="#7d5c31" stroke-width="1.5"/>'
        f'<line x1="58" y1="66" x2="230" y2="66" stroke="{NAVY}" stroke-width="2.5" stroke-dasharray="8 6"/>'
        f'<text x="60" y="60" font-family="sans-serif" font-size="12" font-weight="700" fill="{NAVY}">old flood level</text>'
        + "".join(sprout(x, 128, 28) for x in (78, 150, 212)) +
        f'<path d="M14,80 q9,-6 18,0 M14,120 q9,-6 18,0" fill="none" stroke="{NAVY}" stroke-width="2.5" stroke-opacity="0.55"/>'
        + caption("fertile mud left behind")),
    "RIV-003": svg(  # irrigation: canals carry river water to dry fields
        f'<path d="M0,34 H44 Q58,100 32,176 H0 Z" fill="{SEA}"/>'
        + "".join(f'<rect x="{30}" y="{y}" width="180" height="12" fill="{BLUE}"/>' for y in (56, 100, 144)) +
        "".join(f'<path d="M{66 + i * 58},{82} h44" stroke="{GRASS}" stroke-width="5" stroke-dasharray="10 7"/>' for i in range(3)) +
        "".join(f'<path d="M{66 + i * 58},{126} h44" stroke="{GRASS}" stroke-width="5" stroke-dasharray="10 7"/>' for i in range(3)) +
        f'<polygon points="206,52 220,62 206,72" fill="{NAVY}"/>'
        f'<text x="16" y="112" font-family="sans-serif" font-size="12" font-weight="700" fill="{NAVY}" transform="rotate(-90 16 112)">river</text>'
        + caption("canals carry water to fields"),
        bg=STONE),
    "RIV-004": svg(  # surplus: more grain than the village needs right now
        f'<rect x="0" y="142" width="240" height="38" fill="{STONE}"/>'
        f'<path d="M58,142 q-32,-24 -12,-58 q8,-16 26,-16 q18,0 26,16 q20,34 -12,58 Z" fill="{ORANGE}" stroke="{STONE_DK}" stroke-width="3"/>'
        + "".join(f'<circle cx="{x}" cy="{y}" r="4" fill="{GOLD}"/>' for x, y in
                  [(70, 120), (84, 128), (76, 108), (94, 118), (66, 132)]) +
        f'<path d="M58,72 q26,-14 52,0 q-26,14 -52,0 Z" fill="{GOLD}"/>'
        f'<path d="M126,142 q28,-48 56,0 Z" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>'
        f'<text x="154" y="112" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{NAVY}">extra!</text>'
        + caption("more food than the village needs")),
    "RIV-005": svg(  # division of labour: different people, different jobs
        f'<rect x="0" y="140" width="240" height="40" fill="{STONE}"/>'
        + "".join(person(44 + i * 52, 140, c, 0.9) for i, c in enumerate((BLUE, ORANGE, TURQ, RED))) +
        # job badges: farmer, potter, scribe, soldier
        f'<circle cx="44" cy="56" r="17" fill="{WHITE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<line x1="44" y1="68" x2="44" y2="46" stroke="#5f9a4b" stroke-width="3"/>'
        f'<path d="M44,58 q-9,-3 -11,-13" fill="none" stroke="#5f9a4b" stroke-width="3"/>'
        f'<path d="M44,54 q9,-3 11,-12" fill="none" stroke="#5f9a4b" stroke-width="3"/>'
        f'<circle cx="96" cy="56" r="17" fill="{WHITE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<path d="M84,68 q-4,-20 12,-20 q16,0 12,20 Z" fill="{ORANGE}"/>'
        f'<circle cx="148" cy="56" r="17" fill="{WHITE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<rect x="137" y="45" width="22" height="21" rx="3" fill="{STONE}" stroke="{STONE_DK}" stroke-width="1.5"/>'
        f'<line x1="140" y1="51" x2="156" y2="51" stroke="{STONE_DK}" stroke-width="1.5"/>'
        f'<line x1="140" y1="56" x2="156" y2="56" stroke="{STONE_DK}" stroke-width="1.5"/>'
        f'<line x1="140" y1="61" x2="152" y2="61" stroke="{STONE_DK}" stroke-width="1.5"/>'
        f'<circle cx="200" cy="56" r="17" fill="{WHITE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<path d="M189,44 h22 v9 q0,11 -11,17 q-11,-6 -11,-17 Z" fill="{RED}"/>'
        + caption("different jobs, one village")),
    "RIV-006": svg(  # cultural diffusion: ideas moving between two cultures
        f'<circle cx="58" cy="104" r="42" fill="{BLUE}" fill-opacity="0.5"/>'
        f'<circle cx="182" cy="104" r="42" fill="{ORANGE}" fill-opacity="0.5"/>'
        + "".join(f'<circle cx="{x}" cy="{y}" r="23" fill="{WHITE}" stroke="{NAVY}" stroke-width="2.5"/>'
                  for x, y in ((34, 108), (78, 74), (120, 60), (162, 74), (206, 108))) +
        sun(34, 108, 8, GOLD, ORANGE) +
        f'<path d="M85,66 a10,10 0 1 0 0,20 a12,12 0 1 1 0,-20 Z" fill="{GOLD}"/>'
        f'<polygon points="124,48 112,68 120,68 113,79 129,58 121,58" fill="{GOLD}"/>'
        f'<path d="M150,74 q7,-6 14,0 q7,6 14,0 M150,84 q7,-6 14,0 q7,6 14,0" fill="none" stroke="{BLUE}" stroke-width="3.5"/>'
        f'<polygon points="206,92 210,104 222,104 212,112 216,124 206,116 196,124 200,112 190,104 202,104" fill="{GOLD}"/>'
        f'<text x="58" y="110" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{WHITE}">A</text>'
        f'<text x="182" y="110" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{WHITE}">B</text>'
        + caption("ideas travel both ways")),
    "RIV-007": svg(  # primary source: made at the time of the event
        f'<line x1="18" y1="140" x2="222" y2="140" stroke="{NAVY}" stroke-width="4"/>'
        f'<circle cx="120" cy="140" r="11" fill="{RED}"/>'
        f'<text x="120" y="162" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{NAVY}">the event</text>'
        + tablet(88, 62, 64, 46) +
        f'<line x1="196" y1="42" x2="156" y2="70" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>'
        f'<polygon points="146,73 161,62 165,80" fill="{INK}"/>'
        f'<line x1="120" y1="110" x2="120" y2="128" stroke="{NAVY}" stroke-width="3" stroke-dasharray="5 4"/>'
        + caption("made at the time")),
    "RIV-008": svg(  # secondary source: written later, by someone not there
        f'<line x1="16" y1="142" x2="224" y2="142" stroke="{NAVY}" stroke-width="4"/>'
        f'<circle cx="50" cy="142" r="11" fill="{RED}"/>'
        f'<text x="50" y="164" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{NAVY}">the event</text>'
        + scroll(118, 56, 76, 66) +
        f'<path d="M112,122 q-28,4 -46,16" fill="none" stroke="{NAVY}" stroke-width="3" stroke-dasharray="7 5"/>'
        f'<polygon points="60,132 72,140 56,146" fill="{NAVY}"/>'
        + caption("written later")),
    "RIV-009": svg(  # Fertile Crescent: an arc of rich farmland
        f'<path d="M0,180 H66 Q62,150 24,144 Q8,142 0,136 Z" fill="{SEA}"/>'
        f'<path d="M240,180 H192 Q204,136 240,124 Z" fill="{SEA}"/>'
        f'<path d="M48,148 Q34,58 154,42 Q212,60 200,110" fill="none" stroke="{GRASS}" stroke-width="30" stroke-linecap="round"/>'
        f'<circle cx="86" cy="110" r="5" fill="{NAVY}"/><circle cx="170" cy="80" r="5" fill="{NAVY}"/>'
        + caption("arc of rich farmland", 120, 26, 13),
        bg=STONE),
    "RIV-010": svg(  # Mesopotamia: the land between two rivers
        f'<path d="M56,36 Q78,104 66,176" fill="none" stroke="{SEA}" stroke-width="26" stroke-linecap="round"/>'
        f'<path d="M180,36 Q158,104 172,176" fill="none" stroke="{SEA}" stroke-width="26" stroke-linecap="round"/>'
        f'<path d="M78,42 Q106,108 94,176 L148,176 Q136,108 158,42 Z" fill="{GRASS}"/>'
        f'<text x="58" y="176" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="{NAVY}">Euphrates</text>'
        f'<text x="182" y="176" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="{NAVY}">Tigris</text>'
        + caption("the land between two rivers", 120, 26, 13),
        bg=STONE),
    "RIV-011": svg(  # dynasty: rulers from one family, one after another
        f'<line x1="36" y1="146" x2="204" y2="146" stroke="{NAVY}" stroke-width="4"/>'
        + "".join(crown(x, 140, 1.25) for x in (62, 120, 178)) +
        f'<text x="120" y="168" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{NAVY}">one family</text>'
        + caption("a line of rulers from one family")),
    "RIV-012": svg(  # polytheism: belief in many gods and goddesses
        "".join(f'<circle cx="{x}" cy="{y}" r="23" fill="{WHITE}" stroke="{NAVY}" stroke-width="2.5"/>'
                for x, y in ((34, 108), (78, 74), (120, 60), (162, 74), (206, 108))) +
        sun(34, 108, 8, GOLD, ORANGE) +
        f'<path d="M85,66 a10,10 0 1 0 0,20 a12,12 0 1 1 0,-20 Z" fill="{GOLD}"/>'
        f'<polygon points="124,48 112,68 120,68 113,79 129,58 121,58" fill="{GOLD}"/>'
        f'<path d="M150,74 q7,-6 14,0 q7,6 14,0 M150,84 q7,-6 14,0 q7,6 14,0" fill="none" stroke="{BLUE}" stroke-width="3.5"/>'
        f'<polygon points="206,92 210,104 222,104 212,112 216,124 206,116 196,124 200,112 190,104 202,104" fill="{GOLD}"/>'
        + caption("belief in many gods")),
    "RIV-013": svg(  # ziggurat: a stepped mud-brick temple tower
        f'<rect x="0" y="150" width="240" height="30" fill="{STONE}"/>'
        f'<rect x="34" y="122" width="172" height="28" fill="{STONE}" stroke="{STONE_DK}" stroke-width="2"/>'
        f'<rect x="52" y="94" width="136" height="28" fill="{STONE}" stroke="{STONE_DK}" stroke-width="2"/>'
        f'<rect x="70" y="66" width="100" height="28" fill="{STONE}" stroke="{STONE_DK}" stroke-width="2"/>'
        f'<polygon points="106,150 134,150 124,68 116,68" fill="{STONE_DK}" fill-opacity="0.5"/>'
        f'<rect x="88" y="42" width="64" height="26" fill="{WHITE}" stroke="{STONE_DK}" stroke-width="2"/>'
        f'<polygon points="102,42 120,28 138,42" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>'
        + person(26, 176, NAVY, 0.85) +
        caption("stepped temple tower")),
    "RIV-014": svg(  # cuneiform: wedge marks pressed into wet clay
        tablet(22, 42, 86, 92) +
        f'<line x1="200" y1="34" x2="150" y2="90" stroke="{INK}" stroke-width="10" stroke-linecap="round"/>'
        f'<polygon points="137,98 154,86 160,104" fill="{INK}"/>'
        + caption("wedge writing on clay")),
    "RIV-015": svg(  # Code of Hammurabi: laws carved on a stone stele
        f'<path d="M74,172 V54 q0,-28 46,-28 q46,0 46,28 v118 Z" fill="{STONE}" stroke="{STONE_DK}" stroke-width="3"/>'
        + person(100, 88, NAVY, 0.55, arm_up=True) + person(138, 88, ORANGE, 0.8) +
        f'<line x1="82" y1="94" x2="158" y2="94" stroke="{STONE_DK}" stroke-width="2.5"/>'
        + "".join(f'<line x1="84" y1="{106 + i * 8}" x2="156" y2="{106 + i * 8}" stroke="{STONE_DK}" stroke-width="2.5"/>'
                  for i in range(8))
        + caption("282 laws, carved in stone")),
    "RIV-016": svg(  # cataract: rocky rapids that stop boats
        f'<rect x="0" y="40" width="240" height="140" fill="{SEA}"/>'
        + "".join(f'<path d="M{x - 19},{y + 6} q9,-7 18,0 q9,7 18,0" fill="none" stroke="{WHITE}" stroke-width="4"/>'
                for x, y in ((44, 62), (104, 52), (170, 54), (206, 72), (58, 150), (150, 156)))
        + "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{STONE_DK}" stroke="{INK}" stroke-width="2"/>'
                  for x, y, r in ((74, 100, 21), (118, 130, 17), (158, 96, 22), (198, 128, 18)))
        + caption("rocky rapids, boats must stop")),
    "RIV-017": svg(  # delta: a fan of channels where the river meets the sea
        f'<rect x="0" y="142" width="240" height="38" fill="{SEA}"/>'
        f'<path d="M120,34 v108" stroke="{BLUE}" stroke-width="22" stroke-linecap="round"/>'
        f'<path d="M120,142 Q70,150 22,180 L218,180 Q170,150 120,142 Z" fill="{GRASS}"/>'
        f'<path d="M120,148 q-28,10 -46,34" fill="none" stroke="{BLUE}" stroke-width="9" stroke-linecap="round"/>'
        f'<path d="M120,148 q28,10 46,34" fill="none" stroke="{BLUE}" stroke-width="9" stroke-linecap="round"/>'
        f'<path d="M120,152 v28" fill="none" stroke="{BLUE}" stroke-width="9" stroke-linecap="round"/>'
        + caption("fan of marsh at the river mouth")),
    "RIV-018": svg(  # pharaoh: Egypt's king, honoured as a living god
        f'<path d="M76,154 Q70,58 120,48 Q170,58 164,154 L146,154 Q152,104 120,104 Q88,104 94,154 Z" '
        f'fill="{BLUE}" stroke="{NAVY}" stroke-width="3"/>'
        f'<path d="M97,66 h46 v32 q0,32 -23,42 q-23,-10 -23,-42 Z" fill="{STONE}" stroke="{STONE_DK}" stroke-width="2.5"/>'
        f'<circle cx="109" cy="84" r="3.5" fill="{INK}"/><circle cx="131" cy="84" r="3.5" fill="{INK}"/>'
        f'<path d="M113,102 q7,6 14,0" fill="none" stroke="{INK}" stroke-width="2.5"/>'
        f'<path d="M114,44 q-4,-16 8,-18 q10,2 4,16 Z" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>'
        f'<rect x="115" y="132" width="10" height="22" rx="4" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>'
        + caption("king, honoured as a god")),
    "RIV-019": svg(  # theocracy: religious leaders hold the power
        sun(120, 50, 14) +
        f'<line x1="120" y1="68" x2="120" y2="82" stroke="{ORANGE}" stroke-width="4"/>'
        f'<polygon points="112,80 128,80 120,92" fill="{ORANGE}"/>'
        + crown(120, 118, 0.85) +
        f'<line x1="120" y1="122" x2="120" y2="134" stroke="{ORANGE}" stroke-width="4"/>'
        f'<polygon points="112,132 128,132 120,144" fill="{ORANGE}"/>'
        f'<rect x="64" y="144" width="112" height="10" rx="3" fill="{STONE}" stroke="{STONE_DK}" stroke-width="1.5"/>'
        + columns_row(74, 166, 154, 176, 5, WHITE) +
        caption("religious leaders hold power")),
    "RIV-020": svg(  # ka: the life force that lives on after death
        f'<circle cx="88" cy="48" r="27" fill="{TURQ}" fill-opacity="0.16"/>'
        + person(88, 86, TURQ, 0.9, arm_up=True) +
        f'<path d="M62,176 V102 q0,-18 26,-18 q26,0 26,18 v74 Z" fill="{STONE}" stroke="{STONE_DK}" stroke-width="3"/>'
        f'<circle cx="88" cy="114" r="9" fill="{STONE_DK}"/>'
        f'<line x1="78" y1="142" x2="98" y2="142" stroke="{STONE_DK}" stroke-width="3"/>'
        f'<line x1="78" y1="156" x2="98" y2="156" stroke="{STONE_DK}" stroke-width="3"/>'
        + caption("the life force that lives on")),
    "RIV-021": svg(  # mummification: dried, then wrapped in linen
        f'<rect x="30" y="86" width="146" height="50" rx="24" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        f'<circle cx="50" cy="111" r="25" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        f'<circle cx="42" cy="106" r="3" fill="{NAVY}"/><circle cx="60" cy="106" r="3" fill="{NAVY}"/>'
        f'<path d="M28,100 q36,10 78,0 q34,-8 72,4" fill="none" stroke="{NAVY}" stroke-width="3"/>'
        + "".join(f'<line x1="{x}" y1="90" x2="{x}" y2="132" stroke="{NAVY}" stroke-width="2.5"/>' for x in (92, 112, 132, 152))
        + caption("dried, then wrapped in linen")),
    "RIV-022": svg(  # pyramid: a monumental royal tomb
        sun(202, 54, 14) +
        f'<rect x="0" y="146" width="240" height="34" fill="{STONE}"/>'
        f'<polygon points="120,42 214,146 26,146" fill="{STONE}" stroke="{STONE_DK}" stroke-width="3"/>'
        f'<polygon points="120,42 168,102 72,102" fill="{WHITE}" fill-opacity="0.28"/>'
        f'<rect x="106" y="124" width="28" height="22" fill="{INK}"/>'
        + person(26, 176, NAVY, 0.8) +
        caption("a monumental royal tomb")),
    "RIV-023": svg(  # hieroglyphics: writing made of pictures
        f'<rect x="16" y="38" width="208" height="116" rx="8" fill="{STONE}" stroke="{STONE_DK}" stroke-width="3"/>'
        + sun(56, 74, 12) +
        f'<ellipse cx="104" cy="63" rx="9" ry="11" fill="none" stroke="{GOLD}" stroke-width="5"/>'
        f'<line x1="104" y1="74" x2="104" y2="94" stroke="{GOLD}" stroke-width="5"/>'
        f'<line x1="92" y1="82" x2="116" y2="82" stroke="{GOLD}" stroke-width="5"/>'
        f'<path d="M136,68 q7,-6 14,0 q7,6 14,0 M136,80 q7,-6 14,0 q7,6 14,0" fill="none" stroke="{BLUE}" stroke-width="4"/>'
        + eye(190, 74) +
        f'<line x1="56" y1="142" x2="56" y2="112" stroke="#5f9a4b" stroke-width="5"/>'
        f'<path d="M56,116 q11,-4 13,-15" fill="none" stroke="#5f9a4b" stroke-width="5"/>'
        f'<path d="M92,146 q-5,-28 16,-28 q21,0 16,28 Z" fill="{ORANGE}" stroke="{STONE_DK}" stroke-width="2.5"/>'
        f'<path d="M138,146 l11,-20 l11,11 l13,-15 l5,24 Z" fill="{RED}"/>'
        + caption("writing made of pictures")),
    "RIV-024": svg(  # papyrus: a writing sheet made from river reeds
        f'<rect x="98" y="40" width="120" height="116" rx="5" fill="{WHITE}" stroke="{STONE_DK}" stroke-width="3"/>'
        + "".join(f'<line x1="{x}" y1="42" x2="{x}" y2="154" stroke="{STONE}" stroke-width="3"/>' for x in (116, 134, 152, 170, 188, 206)) +
        "".join(f'<line x1="100" y1="{y}" x2="216" y2="{y}" stroke="{STONE}" stroke-width="3"/>' for y in (58, 76, 94, 112, 130, 148)) +
        "".join(f'<line x1="{x}" y1="176" x2="{x + d}" y2="{86 + i * 7}" stroke="#5f9a4b" stroke-width="5" stroke-linecap="round"/>'
                for i, (x, d) in enumerate(((30, 9), (47, 0), (64, -9))))
        + "".join(f'<ellipse cx="{x + d + (9 if d >= 0 else -9)}" cy="{86 + i * 7}" rx="9" ry="3.5" fill="#5f9a4b"/>'
                  for i, (x, d) in enumerate(((30, 9), (47, 0), (64, -9))))
        + caption("a sheet made from reeds")),
    "RIV-025": svg(  # Rosetta Stone: one message cut in three scripts
        f'<path d="M42,176 V66 Q42,34 120,34 Q198,34 198,66 v110 Z" fill="{STONE_DK}" stroke="{INK}" stroke-width="3"/>'
        + "".join(f'<line x1="60" y1="{y}" x2="180" y2="{y}" stroke="{INK}" stroke-width="3" stroke-opacity="0.6"/>'
                  for y in (54, 66, 78, 90)) +
        "".join(f'<line x1="60" y1="{y}" x2="180" y2="{y}" stroke="{INK}" stroke-width="2.5" stroke-opacity="0.5" stroke-dasharray="7 6"/>'
                  for y in (106, 118, 130)) +
        "".join(f'<line x1="60" y1="{y}" x2="180" y2="{y}" stroke="{INK}" stroke-width="2.5" stroke-opacity="0.45"/>'
                  for y in (146, 158, 170)) +
        caption("three scripts, one message")),
    "RIV-026": svg(  # subcontinent: a big landmass fenced off by mountains
        f'<rect x="0" y="40" width="240" height="140" fill="{STONE}"/>'
        f'<path d="M54,180 Q34,116 72,72 Q108,30 170,36 Q216,46 212,102 Q208,152 188,180 Z" fill="{GRASS}"/>'
        + "".join(f'<polygon points="{x - 24},{y + 38} {x},{y} {x + 24},{y + 38}" fill="{STONE_DK}" stroke="{INK}" stroke-width="2"/>'
                  for x, y in ((80, 46), (124, 38), (168, 56))) +
        caption("set apart from the rest by mountains")),
    "RIV-027": svg(  # monsoon: winds that reverse with the season
        f'<rect x="12" y="44" width="100" height="112" rx="10" fill="{WHITE}" stroke="{BLUE}" stroke-width="2.5"/>'
        f'<rect x="128" y="44" width="100" height="112" rx="10" fill="{WHITE}" stroke="{BLUE}" stroke-width="2.5"/>'
        + sun(62, 78, 14) +
        f'<line x1="32" y1="118" x2="80" y2="118" stroke="{ORANGE}" stroke-width="4" stroke-linecap="round"/>'
        f'<polygon points="74,110 90,118 74,126" fill="{ORANGE}"/>'
        f'<text x="62" y="144" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{NAVY}">winter: dry</text>'
        f'<ellipse cx="178" cy="78" rx="30" ry="19" fill="{NAVY}" fill-opacity="0.7"/>'
        + "".join(f'<line x1="{x}" y1="100" x2="{x - 3}" y2="114" stroke="{BLUE}" stroke-width="4" stroke-linecap="round"/>' for x in (166, 178, 190)) +
        f'<line x1="212" y1="130" x2="158" y2="130" stroke="{BLUE}" stroke-width="4" stroke-linecap="round"/>'
        f'<polygon points="162,122 146,130 162,138" fill="{BLUE}"/>'
        f'<text x="178" y="148" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{NAVY}">summer: rain</text>'
        + caption("winds reverse with the season")),
    "RIV-028": svg(  # Harappan civilization: cities laid out on a plan
        f'<rect x="14" y="42" width="212" height="114" rx="8" fill="{GRASS}"/>'
        + "".join(f'<line x1="{x}" y1="42" x2="{x}" y2="156" stroke="{STONE}" stroke-width="9"/>' for x in (68, 122, 176)) +
        "".join(f'<line x1="14" y1="{y}" x2="226" y2="{y}" stroke="{STONE}" stroke-width="9"/>' for y in (80, 118)) +
        f'<rect x="22" y="50" width="40" height="24" rx="4" fill="{STONE_DK}" stroke="{INK}" stroke-width="2"/>'
        + "".join(f'<rect x="{x}" y="{y}" width="22" height="16" rx="3" fill="{STONE}" stroke="{STONE_DK}" stroke-width="1.5"/>'
                  for x, y in ((76, 50), (130, 50), (184, 50), (76, 88), (130, 88), (184, 88), (76, 126), (130, 126), (184, 126)))
        + caption("cities laid out on a plan")),
    "RIV-029": svg(  # Indo-Gangetic Plain: flat, green, fed by two rivers
        f'<rect x="0" y="94" width="240" height="86" fill="{GRASS}"/>'
        + "".join(f'<polygon points="{x - 24},{96} {x},{48} {x + 24},{96}" fill="{STONE_DK}" stroke="{INK}" stroke-width="2"/>'
                  for x in (26, 74, 122, 170, 218))
        + f'<path d="M74,94 Q82,132 64,176" fill="none" stroke="{BLUE}" stroke-width="15" stroke-linecap="round"/>'
        f'<path d="M166,94 Q158,132 178,176" fill="none" stroke="{BLUE}" stroke-width="15" stroke-linecap="round"/>'
        f'<text x="70" y="128" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{NAVY}">Indus</text>'
        f'<text x="178" y="128" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{NAVY}">Ganges</text>'
        + caption("a flat, well-watered plain", 120, 26, 13)),
    "RIV-030": svg(  # citadel: the high, walled platform in an Indus city
        f'<rect x="0" y="150" width="240" height="30" fill="{STONE}"/>'
        f'<rect x="10" y="132" width="22" height="18" fill="{STONE}" stroke="{STONE_DK}" stroke-width="1.5"/>'
        f'<rect x="208" y="132" width="22" height="18" fill="{STONE}" stroke="{STONE_DK}" stroke-width="1.5"/>'
        f'<path d="M28,150 L52,80 H188 L212,150 Z" fill="{STONE_DK}" stroke="{INK}" stroke-width="2"/>'
        + "".join(f'<rect x="{56 + i * 17}" y="66" width="12" height="16" fill="{STONE}" stroke="{INK}" stroke-width="1.5"/>' for i in range(8))
        + f'<rect x="68" y="94" width="30" height="24" fill="{WHITE}" stroke="{NAVY}" stroke-width="2"/>'
        f'<rect x="110" y="86" width="34" height="32" fill="{WHITE}" stroke="{NAVY}" stroke-width="2"/>'
        f'<polygon points="106,86 127,70 148,86" fill="{RED}" stroke="{NAVY}" stroke-width="2"/>'
        + caption("raised, walled, above the city")),
    "RIV-031": svg(  # grid system: straight streets crossing at right angles
        f'<rect x="16" y="42" width="208" height="116" rx="6" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        + "".join(f'<line x1="{x}" y1="42" x2="{x}" y2="158" stroke="{BLUE}" stroke-width="7"/>' for x in (68, 120, 172))
        + "".join(f'<line x1="16" y1="{y}" x2="224" y2="{y}" stroke="{BLUE}" stroke-width="7"/>' for y in (81, 119))
        + f'<path d="M16,64 h18 v18" fill="none" stroke="{ORANGE}" stroke-width="5"/>'
        + caption("streets cross at right angles")),
    "RIV-032": svg(  # Harappan seals: carved stamps used by merchants
        f'<rect x="16" y="44" width="86" height="88" rx="6" fill="{STONE}" stroke="{STONE_DK}" stroke-width="3"/>'
        + "".join(f'<path d="M{x},60 v9 M{x - 4},60 h8" stroke="{INK}" stroke-width="2.5" fill="none"/>' for x in (38, 60, 84))
        + f'<rect x="36" y="84" width="46" height="22" rx="6" fill="{INK}"/>'
        f'<circle cx="86" cy="86" r="12" fill="{INK}"/>'
        f'<path d="M92,76 q11,-11 13,2" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
        f'<rect x="40" y="106" width="7" height="14" fill="{INK}"/><rect x="74" y="106" width="7" height="14" fill="{INK}"/>'
        f'<rect x="138" y="44" width="86" height="88" rx="6" fill="{WHITE}" stroke="{BLUE}" stroke-width="3"/>'
        + "".join(f'<path d="M{x},60 v9 M{x - 4},60 h8" stroke="{BLUE}" stroke-width="2.5" fill="none"/>' for x in (160, 182, 206))
        + f'<rect x="158" y="84" width="46" height="22" rx="6" fill="{BLUE}" fill-opacity="0.85"/>'
        f'<circle cx="154" cy="86" r="12" fill="{BLUE}" fill-opacity="0.85"/>'
        f'<rect x="161" y="106" width="7" height="14" fill="{BLUE}" fill-opacity="0.85"/><rect x="195" y="106" width="7" height="14" fill="{BLUE}" fill-opacity="0.85"/>'
        + caption("a stamp and the mark it leaves")),
    "RIV-033": svg(  # hydraulic empire: power that rests on the waterworks
        f'<rect x="0" y="130" width="240" height="50" fill="{GRASS}"/>'
        f'<rect x="16" y="64" width="86" height="34" fill="{SEA}" fill-opacity="0.55"/>'
        f'<rect x="16" y="98" width="208" height="14" rx="3" fill="{STONE}" stroke="{STONE_DK}" stroke-width="2"/>'
        f'<rect x="104" y="86" width="30" height="34" fill="{BLUE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<rect x="42" y="112" width="15" height="56" fill="{BLUE}"/>'
        f'<rect x="112" y="112" width="15" height="56" fill="{BLUE}"/>'
        f'<rect x="182" y="112" width="15" height="56" fill="{BLUE}"/>'
        + crown(120, 66, 0.9)
        + f'<line x1="120" y1="74" x2="120" y2="84" stroke="{ORANGE}" stroke-width="4"/>'
        f'<polygon points="112,82 128,82 120,94" fill="{ORANGE}"/>'
        + "".join(sprout(x, 172, 24) for x in (76, 148, 212))
        + caption("power built on the waterworks", 120, 26, 11)),
    "RIV-034": svg(  # corvee labour: forced, unpaid work for the state
        f'<rect x="0" y="138" width="240" height="42" fill="{STONE}"/>'
        f'<path d="M0,138 V104 Q120,90 240,106 V138 Z" fill="{STONE_DK}" stroke="{INK}" stroke-width="2"/>'
        + "".join(person(x, 138, c, 1.0) for x, c in ((64, BLUE), (120, ORANGE), (176, TURQ)))
        + "".join(f'<path d="M{x - 14},{80} h28 l-5,14 h-18 Z" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>' for x in (64, 120, 176))
        + no_sign(206, 50, 15)
        + f'<circle cx="206" cy="50" r="9" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>'
        + caption("forced work, no pay")),
    "RIV-035": svg(  # lex talionis: the punishment matches the injury
        f'<line x1="120" y1="42" x2="120" y2="150" stroke="{NAVY}" stroke-width="5"/>'
        f'<rect x="92" y="146" width="56" height="10" rx="4" fill="{NAVY}"/>'
        f'<line x1="54" y1="68" x2="186" y2="68" stroke="{ORANGE}" stroke-width="4" stroke-linecap="round"/>'
        f'<path d="M54,68 L34,112 H74 Z" fill="none" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<path d="M30,112 Q54,128 78,112 Z" fill="{BLUE}" fill-opacity="0.9"/>'
        f'<path d="M186,68 L166,112 H206 Z" fill="none" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<path d="M162,112 Q186,128 210,112 Z" fill="{BLUE}" fill-opacity="0.9"/>'
        + eye(54, 106) + eye(186, 106)
        + caption("an eye for an eye")),
    "RIV-036": svg(  # continuity: what carries on through long stretches of time
        f'<line x1="20" y1="118" x2="220" y2="118" stroke="{NAVY}" stroke-width="5"/>'
        + "".join(f'<circle cx="{x}" cy="118" r="10" fill="{ORANGE}" stroke="{WHITE}" stroke-width="3"/>' for x in (44, 96, 148, 200))
        + "".join(f'<text x="{x}" y="146" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{NAVY}">{t}</text>'
                  for x, t in ((44, "past"), (96, "then"), (148, "now"), (200, "next")))
        + f'<rect x="16" y="66" width="208" height="18" rx="9" fill="{TURQ}"/>'
        + caption("the same thing all the way through")),
    "GRC-001": svg(  # peninsula: land with water on three sides
        f'<rect x="10" y="10" width="220" height="160" rx="10" fill="{SEA}"/>'
        f'<path d="M10,10 H230 V52 Q190,60 170,78 Q150,96 150,120 Q148,150 124,160 Q104,166 98,146 Q92,120 80,100 Q60,70 10,62 Z" fill="{GRASS}"/>'
        f'<path d="M118,150 l6,-14 l8,10" fill="none" stroke="#5f9a4b" stroke-width="3"/>'
        f'<text x="30" y="150" font-family="sans-serif" font-size="16" fill="{NAVY}" font-weight="700">sea</text>'
        f'<text x="182" y="140" font-family="sans-serif" font-size="16" fill="{NAVY}" font-weight="700">sea</text>'
        f'<text x="98" y="45" font-family="sans-serif" font-size="16" fill="{INK}" font-weight="700">land</text>'),
    "GRC-002": svg(  # city-state: walled city on a hill with fields
        f'<rect x="0" y="120" width="240" height="60" rx="14" fill="{GRASS}"/>'
        f'<path d="M20,128 h60 M30,140 h50 M150,132 h70 M160,146 h60" stroke="#5f9a4b" stroke-width="4"/>'
        f'<path d="M60,125 Q120,40 180,125 Z" fill="{STONE_DK}"/>'
        f'<rect x="72" y="96" width="96" height="24" fill="{STONE}" stroke="{STONE_DK}"/>'
        + "".join(f'<rect x="{72 + i * 12}" y="90" width="8" height="8" fill="{STONE}" stroke="{STONE_DK}"/>' for i in range(9)) +
        f'<polygon points="96,70 120,56 144,70" fill="{WHITE}" stroke="{STONE_DK}"/><rect x="98" y="70" width="44" height="22" fill="{WHITE}" stroke="{STONE_DK}"/>'),
    "GRC-003": svg(  # democracy: citizens raising hands
        "".join(person(30 + i * 30, 160, [NAVY, BLUE, NAVY, TURQ, NAVY, BLUE, NAVY][i], 1.0, arm_up=i % 3 != 1) for i in range(7))
        + f'<text x="120" y="40" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700" fill="{NAVY}">✋ = 1 vote</text>'),
    "GRC-004": svg(  # citizen: one figure in a toga with a laurel
        person(120, 165, NAVY, 2.2, toga=WHITE) +
        f'<path d="M104,50 q16,-14 32,0" fill="none" stroke="{GRASS}" stroke-width="5"/>'
        f'<rect x="150" y="96" width="44" height="30" rx="4" fill="{WHITE}" stroke="{NAVY}" stroke-width="2"/>'
        f'<path d="M158,106 h28 M158,116 h20" stroke="{NAVY}" stroke-width="3"/>'),
    "GRC-005": svg(  # assembly: speaker on a platform, citizens around
        f'<path d="M20,170 A100,60 0 0 1 220,170" fill="{STONE}" stroke="{STONE_DK}" stroke-width="2"/>'
        f'<rect x="104" y="128" width="32" height="14" fill="{STONE_DK}"/>' + person(120, 128, ORANGE, 0.9, arm_up=True) +
        "".join(person(x, y, NAVY, 0.6) for x, y in [(40, 160), (66, 140), (96, 122), (144, 122), (174, 140), (200, 160)])),
    "GRC-006": svg(  # vote: pebble dropping into a jar
        f'<path d="M86,70 h68 l-6,12 q22,20 18,56 q-4,26 -46,28 q-42,-2 -46,-28 q-4,-36 18,-56 Z" fill="{ORANGE}"/>'
        f'<path d="M92,110 h56" stroke="{NAVY}" stroke-width="4"/>'
        f'<circle cx="120" cy="40" r="9" fill="{INK}"/><path d="M120,52 v10" stroke="{INK}" stroke-width="3" stroke-dasharray="3 3"/>'
        f'<circle cx="110" cy="140" r="6" fill="{INK}"/><circle cx="126" cy="146" r="6" fill="{WHITE}"/><circle cx="134" cy="134" r="6" fill="{INK}"/>'),
    "GRC-007": svg(  # Olympic Games: runner and laurel wreath
        f'<circle cx="80" cy="50" r="10" fill="{NAVY}"/>'
        f'<path d="M78,62 L92,100 M86,78 L60,74 M86,76 L110,62 M92,100 L72,130 M92,100 L118,116 L112,140" stroke="{NAVY}" stroke-width="9" stroke-linecap="round" fill="none"/>'
        f'<path d="M150,120 q-14,-36 16,-58 M210,120 q14,-36 -16,-58" fill="none" stroke="{GRASS}" stroke-width="7"/>'
        + "".join(f'<ellipse cx="{x}" cy="{y}" rx="7" ry="4" fill="{GRASS}" transform="rotate({r} {x} {y})"/>' for x, y, r in
                  [(150, 108, -60), (152, 90, -40), (160, 74, -20), (210, 108, 60), (208, 90, 40), (200, 74, 20)]) +
        f'<line x1="30" y1="150" x2="210" y2="150" stroke="{ORANGE}" stroke-width="4" stroke-dasharray="10 8"/>'),
    "GRC-008": svg(  # myth: Zeus's lightning bolt from a cloud
        f'<ellipse cx="120" cy="58" rx="70" ry="26" fill="{WHITE}"/><ellipse cx="90" cy="48" rx="34" ry="24" fill="{WHITE}"/><ellipse cx="150" cy="46" rx="30" ry="22" fill="{WHITE}"/>'
        f'<polygon points="122,70 96,120 118,120 100,166 150,106 126,106 142,70" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>'),
    "GRC-009": svg(  # philosopher: bearded thinker asking a question
        f'<circle cx="90" cy="88" r="30" fill="{STONE}"/><path d="M62,92 q28,58 56,0 q-10,22 -28,22 q-18,0 -28,-22" fill="{WHITE}" stroke="{STONE_DK}"/>'
        f'<circle cx="80" cy="82" r="3" fill="{INK}"/><circle cx="100" cy="82" r="3" fill="{INK}"/>'
        f'<path d="M60,160 q30,-30 60,0" fill="{WHITE}" stroke="{STONE_DK}"/>'
        f'<path d="M140,30 h70 a10,10 0 0 1 10,10 v40 a10,10 0 0 1 -10,10 h-46 l-16,16 v-16 h-8 a10,10 0 0 1 -10,-10 v-40 a10,10 0 0 1 10,-10 Z" fill="{WHITE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<text x="180" y="78" text-anchor="middle" font-family="serif" font-size="44" font-weight="700" fill="{ORANGE}">?</text>'),
    "GRC-010": svg(temple()),
    "GRC-011": svg(  # column: Doric, Ionic, Corinthian
        "".join(f'<rect x="{x}" y="50" width="30" height="100" fill="{WHITE}" stroke="{STONE_DK}" stroke-width="2"/>'
                f'<path d="M{x + 8},54 v92 M{x + 15},54 v92 M{x + 22},54 v92" stroke="{STONE}" stroke-width="2"/>'
                f'<rect x="{x - 6}" y="150" width="42" height="10" fill="{STONE}"/>' for x in (40, 105, 170)) +
        f'<rect x="34" y="40" width="42" height="10" fill="{STONE}" stroke="{STONE_DK}"/>'
        f'<rect x="99" y="40" width="42" height="10" fill="{STONE}" stroke="{STONE_DK}"/><circle cx="101" cy="45" r="7" fill="none" stroke="{STONE_DK}" stroke-width="3"/><circle cx="139" cy="45" r="7" fill="none" stroke="{STONE_DK}" stroke-width="3"/>'
        f'<path d="M164,50 q-2,-26 21,-26 q23,0 21,26 Z" fill="{GRASS}"/><path d="M175,50 q-6,-16 10,-22 q16,6 10,22" fill="#5f9a4b"/>'
        + "".join(f'<text x="{x}" y="174" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{NAVY}">{t}</text>'
                  for x, t in ((55, "Doric"), (120, "Ionic"), (185, "Corinthian")))),
    "GRC-012": svg(  # theater: half-circle seats and a mask
        "".join(f'<path d="M{120 - r},150 A{r},{r * 0.8} 0 0 1 {120 + r},150" fill="none" stroke="{STONE_DK if i % 2 else STONE}" stroke-width="12"/>'
                for i, r in enumerate(range(100, 40, -14))) +
        f'<ellipse cx="120" cy="158" rx="30" ry="8" fill="{STONE_DK}"/>'
        f'<path d="M98,62 q22,-10 44,0 q2,40 -22,50 q-24,-10 -22,-50 Z" fill="{WHITE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<path d="M106,76 q6,-5 12,0 M122,76 q6,-5 12,0" stroke="{NAVY}" stroke-width="3" fill="none"/><path d="M108,94 q12,12 24,0" stroke="{NAVY}" stroke-width="3" fill="none"/>'),
    "GRC-013": svg(  # colony: a ship sailing to a new town over the sea
        f'<rect x="10" y="100" width="220" height="70" rx="10" fill="{SEA}"/>'
        f'<path d="M150,100 q30,-44 80,-30 v30 Z" fill="{GRASS}"/><rect x="186" y="66" width="16" height="14" fill="{WHITE}" stroke="{STONE_DK}"/><polygon points="184,66 194,58 204,66" fill="{RED}"/>'
        f'<path d="M40,112 h76 l-12,18 h-52 Z" fill="{ORANGE}"/><line x1="78" y1="112" x2="78" y2="52" stroke="{INK}" stroke-width="3"/>'
        f'<path d="M80,56 q30,22 0,52 Z" fill="{WHITE}" stroke="{STONE_DK}"/>'
        f'<path d="M124,124 q14,-8 28,0" stroke="{NAVY}" stroke-width="3" fill="none" stroke-dasharray="6 5"/>'
        f'<polygon points="150,118 160,124 150,130" fill="{NAVY}"/>'),
    "GRC-014": svg(  # direct democracy: everyone votes on the law themselves
        "".join(person(30 + i * 26, 152, c, 0.75, arm_up=True) for i, c in
                enumerate((NAVY, BLUE, NAVY, TURQ, NAVY, BLUE, NAVY)))
        + f'<line x1="120" y1="96" x2="120" y2="76" stroke="{ORANGE}" stroke-width="4" stroke-linecap="round"/>'
        f'<polygon points="112,78 128,78 120,68" fill="{ORANGE}"/>'
        f'<rect x="70" y="44" width="100" height="30" rx="6" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        f'<text x="120" y="65" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="700" fill="{NAVY}">THE LAW</text>'
        + caption("everyone votes, no one stands in")),
    "GRC-015": svg(  # oligarchy: a small, rich group holds the power
        f'<rect x="0" y="150" width="240" height="30" fill="{STONE}"/>'
        f'<rect x="36" y="146" width="168" height="10" rx="3" fill="{STONE_DK}"/>'
        + "".join(person(x, 146, c, 1.15, toga=WHITE) for x, c in ((70, RED), (120, ORANGE), (170, GOLD)))
        + "".join(person(x, 166, STONE_DK, 0.45) for x in (46, 66, 86, 106, 126, 146, 166, 186, 206))
        + caption("a few rich leaders, many people")),
    "GRC-016": svg(  # helot: a farm worker tied to Spartan land
        f'<rect x="0" y="128" width="240" height="52" fill="{GRASS}"/>'
        + "".join(sprout(x, 170, 22) for x in (58, 100, 142, 184, 214))
        + person(92, 140, BLUE, 1.05)
        + f'<line x1="104" y1="112" x2="126" y2="72" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        f'<polygon points="118,86 132,60 142,92" fill="{STONE_DK}" stroke="{INK}" stroke-width="2"/>'
        f'<rect x="150" y="40" width="66" height="30" rx="6" fill="{WHITE}" stroke="{RED}" stroke-width="3"/>'
        f'<text x="183" y="60" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{RED}">Sparta</text>'
        f'<path d="M138,96 q18,14 34,10" fill="none" stroke="{RED}" stroke-width="3" stroke-dasharray="6 5"/>'
        + caption("cannot leave the land")),
    "GRC-017": svg(  # social hierarchy: ranked levels of power
        f'<polygon points="120,40 84,74 156,74" fill="{RED}" stroke="{NAVY}" stroke-width="2"/>'
        f'<rect x="80" y="80" width="80" height="26" fill="{ORANGE}" stroke="{NAVY}" stroke-width="2"/>'
        f'<rect x="70" y="112" width="100" height="26" fill="{GOLD}" stroke="{NAVY}" stroke-width="2"/>'
        f'<rect x="60" y="144" width="120" height="26" fill="{STONE_DK}" stroke="{NAVY}" stroke-width="2"/>'
        f'<text x="120" y="66" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{WHITE}">rulers</text>'
        f'<text x="120" y="98" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{WHITE}">soldiers</text>'
        f'<text x="120" y="130" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{INK}">farmers</text>'
        f'<text x="120" y="162" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{INK}">enslaved</text>'),
    "GRC-018": svg(  # metic: a foreign resident who pays tax but cannot vote
        f'<rect x="0" y="150" width="240" height="30" fill="{STONE}"/>'
        + person(78, 150, BLUE, 1.15)
        + f'<path d="M92,112 q16,-8 22,6 q-16,10 -22,-6 Z" fill="{ORANGE}" stroke="{STONE_DK}" stroke-width="2"/>'
        f'<circle cx="60" cy="126" r="9" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>'
        f'<circle cx="46" cy="138" r="9" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>'
        f'<text x="120" y="132" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{NAVY}">pays tax</text>'
        f'<rect x="140" y="60" width="76" height="52" rx="6" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        f'<path d="M164,86 h28" stroke="{NAVY}" stroke-width="4" stroke-linecap="round"/>'
        f'<path d="M152,72 q26,26 52,0" fill="none" stroke="{RED}" stroke-width="5" stroke-linecap="round"/>'
        + no_sign(178, 88, 22)
        + caption("lives there, pays tax, cannot vote")),
    "GRC-019": svg(  # Hellenistic civilization: Greek culture blended with others
        f'<circle cx="96" cy="96" r="46" fill="{BLUE}" fill-opacity="0.55"/>'
        f'<circle cx="144" cy="96" r="46" fill="{ORANGE}" fill-opacity="0.55"/>'
        f'<circle cx="120" cy="66" r="30" fill="{TURQ}" fill-opacity="0.55"/>'
        f'<text x="70" y="102" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{WHITE}">Greek</text>'
        f'<text x="170" y="102" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{WHITE}">Persian</text>'
        f'<text x="120" y="70" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{WHITE}">Egypt</text>'
        f'<text x="120" y="150" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{NAVY}">blended</text>'
        + caption("one blended culture after Alexander")),
    "ROM-001": svg(  # republic: SPQR standard
        f'<line x1="120" y1="24" x2="120" y2="146" stroke="{INK}" stroke-width="5"/>'
        f'<rect x="76" y="50" width="88" height="62" fill="{RED}" stroke="{GOLD}" stroke-width="4"/>'
        f'<text x="120" y="92" text-anchor="middle" font-family="serif" font-size="26" font-weight="700" fill="{GOLD}">SPQR</text>'
        f'<circle cx="120" cy="26" r="9" fill="{GOLD}"/>'
        f'<text x="120" y="166" text-anchor="middle" font-family="sans-serif" font-size="12" fill="{NAVY}" font-weight="700">"The Senate and People of Rome"</text>'),
    "ROM-002": svg(  # senate: rows of seated senators in white togas
        f'<rect x="16" y="20" width="208" height="150" rx="10" fill="{STONE}"/>' + "".join(f'<rect x="{30 + j * 4}" y="{70 + j * 30}" width="{180 - j * 8}" height="10" fill="{STONE_DK}"/>' for j in range(3)) +
        "".join(person(46 + i * 30 + j * 4, 70 + j * 30, NAVY, 0.55, toga=WHITE) for j in range(3) for i in range(6))),
    "ROM-003": svg(  # consul: two leaders, one year
        person(80, 160, NAVY, 1.7, toga=WHITE) + person(160, 160, NAVY, 1.7, toga=WHITE) +
        f'<rect x="96" y="20" width="48" height="40" rx="4" fill="{WHITE}" stroke="{RED}" stroke-width="3"/><rect x="96" y="20" width="48" height="12" fill="{RED}"/>'
        f'<text x="120" y="54" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="700" fill="{INK}">1 yr</text>'
        f'<text x="120" y="120" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="700" fill="{ORANGE}">2</text>'),
    "ROM-004": svg(  # emperor: laurel-crowned head on a gold coin
        f'<circle cx="120" cy="90" r="66" fill="{GOLD}" stroke="{ORANGE}" stroke-width="5"/><circle cx="120" cy="90" r="56" fill="none" stroke="{ORANGE}" stroke-width="2" stroke-dasharray="4 4"/>'
        f'<path d="M100,130 q-6,-30 6,-44 q-2,-26 22,-30 q24,0 26,22 l8,14 l-8,4 q4,16 -10,20 l2,14 Z" fill="{ORANGE}"/>'
        + "".join(f'<ellipse cx="{x}" cy="{y}" rx="6" ry="3" fill="{GRASS}" transform="rotate({r} {x} {y})"/>' for x, y, r in
                  [(108, 62, -50), (118, 56, -20), (130, 55, 10), (141, 60, 40)])),
    "ROM-005": svg(  # empire: lands all around one sea
        f'<rect x="10" y="10" width="220" height="160" rx="10" fill="{GRASS}"/>'
        f'<path d="M30,96 q30,-30 70,-12 q30,14 60,-4 q30,-16 56,6 q-6,30 -40,30 q-30,0 -50,14 q-30,18 -60,-2 q-26,-14 -36,-32 Z" fill="{SEA}"/>'
        f'<path d="M20,20 H220 V160 H20 Z" fill="none" stroke="{RED}" stroke-width="5" stroke-dasharray="12 7"/>'
        f'<circle cx="104" cy="70" r="6" fill="{RED}"/><text x="114" y="66" font-family="sans-serif" font-size="13" font-weight="700" fill="{INK}">Rome</text>'),
    "ROM-006": svg(  # forum: open square with columns and people
        f'<rect x="20" y="118" width="200" height="40" fill="{STONE}"/>'
        + columns_row(26, 104, 66, 118, 4, WHITE) + columns_row(136, 214, 66, 118, 4, WHITE) +
        f'<rect x="20" y="58" width="90" height="10" fill="{STONE_DK}"/><rect x="130" y="58" width="90" height="10" fill="{STONE_DK}"/>'
        + person(100, 152, NAVY, 0.6) + person(122, 156, ORANGE, 0.6) + person(144, 150, BLUE, 0.6) +
        f'<rect x="58" y="138" width="24" height="12" fill="{RED}"/><rect x="162" y="138" width="24" height="12" fill="{TURQ}"/>'),
    "ROM-007": svg(  # Latin: carved inscription
        f'<rect x="30" y="44" width="180" height="92" fill="{STONE}" stroke="{STONE_DK}" stroke-width="4"/>'
        f'<text x="120" y="88" text-anchor="middle" font-family="serif" font-size="34" letter-spacing="4" fill="{INK}">AQVA</text>'
        f'<text x="120" y="122" text-anchor="middle" font-family="serif" font-size="20" letter-spacing="3" fill="{INK}">= WATER</text>'),
    "ROM-008": svg(  # Roman numerals: a clock face
        f'<circle cx="120" cy="90" r="70" fill="{WHITE}" stroke="{NAVY}" stroke-width="5"/>'
        + "".join(f'<text x="{x}" y="{y}" text-anchor="middle" font-family="serif" font-size="20" font-weight="700" fill="{NAVY}">{t}</text>'
                  for x, y, t in ((120, 44, "XII"), (172, 97, "III"), (120, 150, "VI"), (68, 97, "IX"))) +
        f'<line x1="120" y1="90" x2="120" y2="54" stroke="{INK}" stroke-width="4" stroke-linecap="round"/><line x1="120" y1="90" x2="146" y2="104" stroke="{ORANGE}" stroke-width="4" stroke-linecap="round"/>'
        f'<circle cx="120" cy="90" r="5" fill="{INK}"/>'),
    "ROM-009": svg(  # gladiator: helmet, shield, short sword
        f'<path d="M60,120 q-4,-62 40,-68 q44,6 40,68 Z" fill="{STONE_DK}"/><path d="M76,82 h48 v28 h-48 Z" fill="{INK}"/>'
        + "".join(f'<line x1="{76 + i * 8}" y1="84" x2="{76 + i * 8}" y2="108" stroke="{STONE_DK}" stroke-width="2"/>' for i in range(1, 6)) +
        f'<path d="M82,52 q18,-30 36,0" fill="{RED}"/>'
        f'<rect x="150" y="56" width="56" height="88" rx="10" fill="{RED}" stroke="{GOLD}" stroke-width="4"/><circle cx="178" cy="100" r="10" fill="{GOLD}"/>'
        f'<path d="M40,150 l50,-22" stroke="{STONE_DK}" stroke-width="7" stroke-linecap="round"/><path d="M34,156 l14,-6" stroke="{INK}" stroke-width="9"/>'),
    "ROM-010": svg(  # Colosseum: tiers of arches
        f'<ellipse cx="120" cy="150" rx="100" ry="14" fill="{STONE_DK}"/>'
        + arches(30, 210, 150, 112, 9) + arches(30, 210, 112, 78, 9) + arches(30, 210, 78, 48, 9) +
        f'<rect x="30" y="38" width="180" height="10" fill="{STONE}" stroke="{STONE_DK}"/>'),
    "ROM-011": svg(  # aqueduct: arches carrying a water channel
        f'<path d="M0,150 Q120,128 240,150 V180 H0 Z" fill="{GRASS}"/>'
        + arches(20, 220, 150, 104, 6) + arches(20, 220, 104, 70, 12) +
        f'<rect x="20" y="58" width="200" height="12" fill="{STONE_DK}"/><rect x="24" y="60" width="192" height="5" fill="{BLUE}"/>'
        f'<path d="M30,48 h170" stroke="{BLUE}" stroke-width="3" fill="none"/><polygon points="200,43 212,48 200,53" fill="{BLUE}"/>'
        f'<text x="120" y="40" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{NAVY}">water flows gently downhill</text>'),
    "ROM-012": svg(  # legion: rows of shields and the eagle standard
        "".join(f'<rect x="{34 + i * 34}" y="{92 + j * 30}" width="28" height="40" rx="4" fill="{RED}" stroke="{GOLD}" stroke-width="2.5"/>'
                f'<circle cx="{48 + i * 34}" cy="{112 + j * 30}" r="4" fill="{GOLD}"/>' for j in range(2) for i in range(5)) +
        f'<line x1="120" y1="20" x2="120" y2="92" stroke="{INK}" stroke-width="4"/>'
        f'<path d="M120,22 l-22,-6 l10,12 l-14,2 l26,8 l26,-8 l-14,-2 l10,-12 Z" fill="{GOLD}"/>'),
    "ROM-013": svg(  # Twelve Tables: Rome's first laws, on public display
        "".join(f'<rect x="{x}" y="{y}" width="48" height="30" rx="4" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>'
                for y in (44, 82, 120) for x in (36, 96, 156))
        + "".join(f'<line x1="{x + 8}" y1="{y + 11}" x2="{x + 40}" y2="{y + 11}" stroke="{ORANGE}" stroke-width="2"/>'
                  f'<line x1="{x + 8}" y1="{y + 19}" x2="{x + 32}" y2="{y + 19}" stroke="{ORANGE}" stroke-width="2"/>'
                  for y in (44, 82, 120) for x in (36, 96, 156))
        + person(26, 176, NAVY, 0.75)
        + caption("12 tablets, in the forum for all")),
    "ROM-014": svg(  # due process: fair, public steps before any punishment
        f'<rect x="18" y="42" width="52" height="30" rx="6" fill="{BLUE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<rect x="94" y="42" width="52" height="30" rx="6" fill="{BLUE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<rect x="170" y="42" width="52" height="30" rx="6" fill="{ORANGE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<text x="44" y="62" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{WHITE}">1</text>'
        f'<text x="120" y="62" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{WHITE}">2</text>'
        f'<text x="196" y="62" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{WHITE}">3</text>'
        f'<line x1="70" y1="57" x2="90" y2="57" stroke="{NAVY}" stroke-width="3"/>'
        f'<polygon points="88,52 98,57 88,62" fill="{NAVY}"/>'
        f'<line x1="146" y1="57" x2="166" y2="57" stroke="{NAVY}" stroke-width="3"/>'
        f'<polygon points="164,52 174,57 164,62" fill="{NAVY}"/>'
        f'<text x="44" y="90" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="{NAVY}">told</text>'
        f'<text x="120" y="90" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="{NAVY}">heard</text>'
        f'<text x="196" y="90" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="{NAVY}">judged</text>'
        + f'<path d="M120,104 v22" stroke="{NAVY}" stroke-width="3" stroke-dasharray="6 5"/>'
        f'<path d="M104,132 h32 v16 a4,4 0 0 1 -4,4 h-24 a4,4 0 0 1 -4,-4 Z" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        f'<line x1="112" y1="140" x2="128" y2="140" stroke="{GRASS}" stroke-width="3"/>'
        + caption("fair steps first, punishment last")),
    "ROM-015": svg(  # patrician: a noble born into land and power
        f'<rect x="0" y="152" width="240" height="28" fill="{STONE}"/>'
        + person(96, 152, NAVY, 1.5, toga=WHITE)
        + f'<path d="M74,72 q22,-18 44,0" fill="none" stroke="{GRASS}" stroke-width="6"/>'
        f'<rect x="136" y="76" width="46" height="30" rx="4" fill="{WHITE}" stroke="{RED}" stroke-width="3"/>'
        f'<path d="M144,86 h30 M144,96 h22" stroke="{RED}" stroke-width="3"/>'
        f'<path d="M176,152 h44 v-18 h-44 Z" fill="{ORANGE}" stroke="{STONE_DK}" stroke-width="2"/>'
        f'<polygon points="172,134 198,116 224,134" fill="{RED}"/>'
        + caption("born noble, owns the land")),
    "ROM-016": svg(  # plebeian: a free Roman who works for a living
        f'<rect x="0" y="152" width="240" height="28" fill="{STONE}"/>'
        + person(84, 152, BLUE, 1.4)
        + f'<line x1="102" y1="108" x2="128" y2="146" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        f'<polygon points="122,142 136,150 120,156" fill="{STONE_DK}"/>'
        f'<rect x="150" y="52" width="34" height="34" rx="4" fill="{WHITE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<path d="M154,86 l8,-24 l8,16 l8,-10 l6,18 Z" fill="{ORANGE}" stroke="{STONE_DK}" stroke-width="2"/>'
        f'<rect x="150" y="96" width="34" height="30" rx="4" fill="{WHITE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<circle cx="167" cy="110" r="7" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>'
        f'<rect x="150" y="136" width="34" height="26" rx="4" fill="{WHITE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<path d="M158,152 q9,-18 18,0 Z" fill="{ORANGE}" stroke="{STONE_DK}" stroke-width="2"/>'
        + caption("free, working, but not noble")),
    "ROM-017": svg(  # tribune: the official elected to defend the plebeians
        f'<rect x="0" y="152" width="240" height="28" fill="{STONE}"/>'
        + "".join(person(x, 152, BLUE, 0.8) for x in (34, 58, 82))
        + person(128, 152, ORANGE, 1.4, arm_up=True)
        + f'<path d="M150,80 h34 v18 q0,12 -17,20 q-17,-8 -17,-20 Z" fill="{WHITE}" stroke="{RED}" stroke-width="3"/>'
        f'<circle cx="167" cy="102" r="6" fill="{RED}"/>'
        + "".join(person(x, 152, NAVY, 0.95, toga=WHITE) for x in (196, 216))
        + caption("stands between the people and the nobles")),
    "ROM-018": svg(  # veto: one word that stops a decision
        f'<rect x="34" y="46" width="118" height="76" rx="6" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        + "".join(f'<line x1="48" y1="{64 + i * 15}" x2="138" y2="{64 + i * 15}" stroke="{NAVY}" stroke-width="3"/>' for i in range(4))
        + f'<path d="M40,150 L200,58" stroke="{RED}" stroke-width="7" stroke-linecap="round"/>'
        f'<circle cx="170" cy="120" r="34" fill="{WHITE}" stroke="{RED}" stroke-width="6"/>'
        f'<text x="170" y="130" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="700" fill="{RED}">X</text>'
        + caption("I forbid it — the decision stops")),
    "ROM-019": svg(  # latifundia: huge estates worked by enslaved people
        f'<rect x="0" y="138" width="240" height="42" fill="{GRASS}"/>'
        f'<path d="M0,138 V112 Q120,98 240,114 V138 Z" fill="{STONE_DK}" stroke="{INK}" stroke-width="2"/>'
        + "".join(sprout(x, 170, 22) for x in (34, 62, 90, 152, 180, 208))
        + f'<rect x="150" y="76" width="72" height="38" fill="{WHITE}" stroke="{STONE_DK}" stroke-width="2.5"/>'
        + columns_row(156, 216, 84, 114, 4, WHITE)
        + f'<rect x="146" y="70" width="80" height="10" rx="3" fill="{STONE}" stroke="{STONE_DK}" stroke-width="1.5"/>'
        f'<polygon points="142,70 186,48 230,70" fill="{RED}" stroke="{STONE_DK}" stroke-width="2"/>'
        + "".join(person(x, 138, TURQ, 0.7) for x in (108, 126, 144))
        + no_sign(62, 54, 16)
        + f'<circle cx="62" cy="54" r="9" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2"/>'
        + caption("one huge estate, unpaid workers")),
    "ROM-020": svg(  # chattel slavery: a person treated as property
        f'<rect x="0" y="150" width="240" height="30" fill="{STONE}"/>'
        + person(84, 150, INK, 1.5)
        + f'<path d="M70,120 q14,10 28,0" fill="none" stroke="{STONE_DK}" stroke-width="5"/>'
        f'<path d="M70,140 q14,10 28,0" fill="none" stroke="{STONE_DK}" stroke-width="5"/>'
        f'<rect x="140" y="52" width="80" height="44" rx="6" fill="{WHITE}" stroke="{RED}" stroke-width="3"/>'
        f'<circle cx="154" cy="66" r="5" fill="{RED}"/>'
        f'<text x="180" y="82" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="700" fill="{RED}">property</text>'
        f'<circle cx="180" cy="128" r="15" fill="{GOLD}" stroke="{ORANGE}" stroke-width="3"/>'
        f'<text x="180" y="134" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="700" fill="{ORANGE}">$</text>'
        + caption("a person treated as a thing to own")),
    "CMD-001": svg(  # Analyse: breaking a whole into connected parts
        f'<rect x="92" y="22" width="56" height="34" rx="6" fill="{NAVY}"/>'
        f'<text x="120" y="44" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{WHITE}">WHOLE</text>'
        f'<path d="M120,56 L60,96 M120,56 L120,96 M120,56 L180,96" stroke="{ORANGE}" stroke-width="3.5" stroke-linecap="round"/>'
        f'<rect x="34" y="96" width="52" height="34" rx="6" fill="{BLUE}"/>'
        f'<rect x="94" y="96" width="52" height="34" rx="6" fill="{TURQ}"/>'
        f'<rect x="154" y="96" width="52" height="34" rx="6" fill="{BLUE}"/>'
        f'<text x="120" y="156" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{NAVY}">parts + connections</text>'),
    "CMD-002": svg(  # Demonstrate: prove with evidence + checkmark
        f'<rect x="52" y="28" width="110" height="124" rx="8" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        f'<line x1="70" y1="56" x2="140" y2="56" stroke="{NAVY}" stroke-width="4"/>'
        f'<line x1="70" y1="78" x2="140" y2="78" stroke="{BLUE}" stroke-width="4"/>'
        f'<line x1="70" y1="100" x2="120" y2="100" stroke="{BLUE}" stroke-width="4"/>'
        f'<circle cx="164" cy="118" r="28" fill="{GRASS}" stroke="{WHITE}" stroke-width="3"/>'
        f'<path d="M150,118 l10,10 l18,-20" fill="none" stroke="{WHITE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'),
    "CMD-003": svg(  # Describe: detailed picture with descriptive lines
        f'<rect x="28" y="36" width="88" height="108" rx="8" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        f'<circle cx="56" cy="64" r="10" fill="{GOLD}"/>'
        f'<polygon points="34,132 64,92 92,132" fill="{GRASS}"/><polygon points="64,132 90,102 110,132" fill="{TURQ}"/>'
        f'<line x1="134" y1="54" x2="210" y2="54" stroke="{NAVY}" stroke-width="5" stroke-linecap="round"/>'
        f'<line x1="134" y1="78" x2="200" y2="78" stroke="{BLUE}" stroke-width="4" stroke-linecap="round"/>'
        f'<line x1="134" y1="102" x2="210" y2="102" stroke="{BLUE}" stroke-width="4" stroke-linecap="round"/>'
        f'<line x1="134" y1="126" x2="184" y2="126" stroke="{ORANGE}" stroke-width="4" stroke-linecap="round"/>'),
    "CMD-004": svg(  # Discuss: two balanced viewpoints in speech bubbles
        f'<path d="M26,40 h82 a10,10 0 0 1 10,10 v38 a10,10 0 0 1 -10,10 h-44 l-16,16 v-16 h-22 a10,10 0 0 1 -10,-10 v-38 a10,10 0 0 1 10,-10 Z" fill="{NAVY}"/>'
        f'<text x="67" y="74" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{WHITE}">Side A</text>'
        f'<path d="M132,68 h82 a10,10 0 0 1 10,10 v38 a10,10 0 0 1 -10,10 h-22 v16 l-16,-16 h-44 a10,10 0 0 1 -10,-10 v-38 a10,10 0 0 1 10,-10 Z" fill="{ORANGE}"/>'
        f'<text x="173" y="102" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{WHITE}">Side B</text>'
        f'<text x="120" y="162" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{INK}">balanced review + evidence</text>'),
    "CMD-005": svg(  # Document: book with citation quotes & reference tag
        f'<rect x="56" y="30" width="128" height="120" rx="8" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        f'<text x="90" y="78" font-family="serif" font-size="44" font-weight="700" fill="{ORANGE}">“ ”</text>'
        f'<line x1="76" y1="98" x2="164" y2="98" stroke="{NAVY}" stroke-width="3.5"/>'
        f'<rect x="76" y="112" width="88" height="22" rx="4" fill="{SKY}" stroke="{BLUE}" stroke-width="1.5"/>'
        f'<text x="120" y="128" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="{NAVY}">(Author, p. 12)</text>'),
    "CMD-006": svg(  # Evaluate: balance scale weighing pros and limitations
        f'<line x1="120" y1="34" x2="120" y2="148" stroke="{NAVY}" stroke-width="5"/>'
        f'<rect x="86" y="146" width="68" height="10" rx="4" fill="{NAVY}"/>'
        f'<line x1="56" y1="62" x2="184" y2="50" stroke="{ORANGE}" stroke-width="4" stroke-linecap="round"/>'
        f'<path d="M56,62 L38,104 H74 Z" fill="none" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<path d="M34,104 Q56,118 78,104 Z" fill="{BLUE}"/>'
        f'<path d="M184,50 L166,92 H202 Z" fill="none" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<path d="M162,92 Q184,106 206,92 Z" fill="{TURQ}"/>'),
    "CMD-007": svg(  # Exemplify: general rule pointing to a concrete example star
        f'<rect x="30" y="64" width="76" height="52" rx="8" fill="{NAVY}"/>'
        f'<text x="68" y="95" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="700" fill="{WHITE}">IDEA</text>'
        f'<line x1="112" y1="90" x2="144" y2="90" stroke="{ORANGE}" stroke-width="5" stroke-linecap="round"/>'
        f'<polygon points="142,82 156,90 142,98" fill="{ORANGE}"/>'
        f'<rect x="160" y="54" width="56" height="72" rx="8" fill="{WHITE}" stroke="{ORANGE}" stroke-width="3"/>'
        f'<text x="188" y="96" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="{ORANGE}">e.g.</text>'),
    "CMD-008": svg(  # Explain: CAUSE -> WHY / HOW -> EFFECT
        f'<rect x="22" y="64" width="74" height="52" rx="8" fill="{BLUE}"/>'
        f'<text x="59" y="95" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{WHITE}">CAUSE</text>'
        f'<line x1="102" y1="90" x2="134" y2="90" stroke="{ORANGE}" stroke-width="5"/>'
        f'<polygon points="132,82 146,90 132,98" fill="{ORANGE}"/>'
        f'<rect x="148" y="64" width="74" height="52" rx="8" fill="{NAVY}"/>'
        f'<text x="185" y="95" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{WHITE}">EFFECT</text>'
        f'<text x="120" y="46" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="700" fill="{ORANGE}">WHY? / HOW?</text>'),
    "CMD-009": svg(  # Explore: compass for systematic discovery
        f'<circle cx="120" cy="90" r="58" fill="{WHITE}" stroke="{NAVY}" stroke-width="5"/>'
        f'<polygon points="120,42 134,90 120,78 106,90" fill="{ORANGE}"/>'
        f'<polygon points="120,138 134,90 120,102 106,90" fill="{NAVY}"/>'
        f'<circle cx="120" cy="90" r="6" fill="{GOLD}"/>'),
    "CMD-010": svg(  # Formulate: structured blueprint building blocks
        f'<rect x="44" y="34" width="152" height="32" rx="6" fill="{NAVY}"/>'
        f'<text x="120" y="55" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{WHITE}">1. Clear Question</text>'
        f'<rect x="44" y="76" width="152" height="32" rx="6" fill="{BLUE}"/>'
        f'<text x="120" y="97" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{WHITE}">2. Key Concept</text>'
        f'<rect x="44" y="118" width="152" height="32" rx="6" fill="{ORANGE}"/>'
        f'<text x="120" y="139" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{WHITE}">3. Thesis Claim</text>'),
    "CMD-011": svg(  # Identify: spotlighting one distinct item among options
        f'<circle cx="60" cy="90" r="22" fill="{STONE}" stroke="{STONE_DK}" stroke-width="2"/>'
        f'<circle cx="120" cy="90" r="26" fill="{ORANGE}" stroke="{NAVY}" stroke-width="4"/>'
        f'<circle cx="180" cy="90" r="22" fill="{STONE}" stroke="{STONE_DK}" stroke-width="2"/>'
        f'<path d="M120,30 v22 M112,44 l8,10 l8,-10" fill="none" stroke="{NAVY}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
        f'<text x="120" y="150" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{NAVY}">pick &amp; name it</text>'),
    "CMD-012": svg(  # Interpret: data bars + trend line -> meaning
        f'<line x1="40" y1="142" x2="200" y2="142" stroke="{NAVY}" stroke-width="3"/>'
        f'<rect x="54" y="106" width="24" height="36" fill="{BLUE}"/>'
        f'<rect x="96" y="84" width="24" height="58" fill="{BLUE}"/>'
        f'<rect x="138" y="56" width="24" height="86" fill="{NAVY}"/>'
        f'<path d="M54,96 L108,72 L166,42" fill="none" stroke="{ORANGE}" stroke-width="4" stroke-linecap="round"/>'
        f'<circle cx="166" cy="42" r="6" fill="{ORANGE}"/>'),
    "CMD-013": svg(  # Investigate: magnifying glass examining clues
        f'<rect x="46" y="34" width="110" height="114" rx="8" fill="{WHITE}" stroke="{STONE_DK}" stroke-width="2"/>'
        f'<line x1="64" y1="60" x2="136" y2="60" stroke="{STONE_DK}" stroke-width="4"/>'
        f'<line x1="64" y1="84" x2="136" y2="84" stroke="{NAVY}" stroke-width="4"/>'
        f'<line x1="64" y1="108" x2="116" y2="108" stroke="{STONE_DK}" stroke-width="4"/>'
        f'<circle cx="138" cy="96" r="32" fill="{SKY}" fill-opacity="0.7" stroke="{NAVY}" stroke-width="6"/>'
        f'<line x1="162" y1="120" x2="194" y2="152" stroke="{ORANGE}" stroke-width="9" stroke-linecap="round"/>'),
    "CMD-014": svg(  # Justify: claim held up by strong evidence pillars
        f'<polygon points="40,62 120,28 200,62" fill="{NAVY}"/>'
        f'<text x="120" y="55" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{WHITE}">CLAIM</text>'
        f'<rect x="56" y="62" width="24" height="72" fill="{ORANGE}"/>'
        f'<rect x="108" y="62" width="24" height="72" fill="{ORANGE}"/>'
        f'<rect x="160" y="62" width="24" height="72" fill="{ORANGE}"/>'
        f'<rect x="38" y="134" width="164" height="16" rx="4" fill="{NAVY}"/>'
        f'<text x="120" y="146" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="{WHITE}">EVIDENCE &amp; REASONS</text>'),
    "CMD-015": svg(  # List: numbered sequence 1, 2, 3
        f'<rect x="48" y="26" width="144" height="128" rx="10" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        + "".join(f'<text x="68" y="{62 + i * 32}" font-family="sans-serif" font-size="18" font-weight="700" fill="{ORANGE}">{i + 1}.</text>'
                  f'<line x1="94" y1="{56 + i * 32}" x2="170" y2="{56 + i * 32}" stroke="{NAVY}" stroke-width="4" stroke-linecap="round"/>'
                  for i in range(3))),
    "CMD-016": svg(  # Recognize: spotting a matching pattern
        f'<circle cx="56" cy="70" r="16" fill="{BLUE}"/>'
        f'<rect x="92" y="54" width="32" height="32" rx="4" fill="{ORANGE}"/>'
        f'<circle cx="160" cy="70" r="16" fill="{BLUE}"/>'
        f'<rect x="184" y="50" width="40" height="40" rx="6" fill="none" stroke="{NAVY}" stroke-width="3" stroke-dasharray="5 4"/>'
        f'<rect x="190" y="56" width="28" height="28" rx="4" fill="{ORANGE}"/>'
        f'<text x="120" y="138" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{NAVY}">spot the pattern</text>'),
    "CMD-017": svg(  # Reflect: thoughtful consideration bubble
        f'<circle cx="86" cy="116" r="24" fill="{NAVY}"/>'
        f'<path d="M56,164 q30,-28 60,0" fill="{NAVY}"/>'
        f'<circle cx="118" cy="84" r="5" fill="{BLUE}"/><circle cx="132" cy="68" r="8" fill="{BLUE}"/>'
        f'<ellipse cx="172" cy="52" rx="42" ry="26" fill="{WHITE}" stroke="{BLUE}" stroke-width="3"/>'
        f'<text x="172" y="57" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{NAVY}">Hmm…</text>'),
    "CMD-018": svg(  # Summarize: funnel condensing many details into main point
        f'<polygon points="44,34 196,34 140,104 100,104" fill="{BLUE}"/>'
        f'<circle cx="86" cy="54" r="6" fill="{WHITE}"/><circle cx="120" cy="60" r="6" fill="{WHITE}"/><circle cx="154" cy="52" r="6" fill="{WHITE}"/>'
        f'<rect x="78" y="118" width="84" height="34" rx="8" fill="{ORANGE}"/>'
        f'<text x="120" y="140" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{WHITE}">MAIN POINT</text>'),
    "CMD-019": svg(  # Synthesize: two overlapping circles creating a new idea
        f'<circle cx="94" cy="82" r="42" fill="{BLUE}" fill-opacity="0.75"/>'
        f'<circle cx="146" cy="82" r="42" fill="{ORANGE}" fill-opacity="0.75"/>'
        f'<text x="72" y="86" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{WHITE}">Idea A</text>'
        f'<text x="168" y="86" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{WHITE}">Idea B</text>'
        f'<text x="120" y="86" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="{NAVY}">NEW</text>'
        f'<text x="120" y="152" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="{NAVY}">combine into new insight</text>'),
    "CMD-020": svg(  # Use: gear putting knowledge into practice
        f'<circle cx="120" cy="90" r="36" fill="{NAVY}"/>'
        + "".join(f'<rect x="112" y="38" width="16" height="104" rx="4" fill="{NAVY}" transform="rotate({r} 120 90)"/>' for r in (0, 45, 90, 135)) +
        f'<circle cx="120" cy="90" r="18" fill="{ORANGE}"/>'
        f'<polygon points="115,82 130,90 115,98" fill="{WHITE}"/>'),
    # ------------------------------------------------------------------
    # Economics (shared reference words)
    # ------------------------------------------------------------------
    "ECO-001": svg(  # capitalism: private owners running business for profit
        f'<rect x="0" y="150" width="240" height="30" fill="{STONE}"/>'
        f'<rect x="26" y="86" width="88" height="64" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        f'<polygon points="18,86 70,54 122,86" fill="{RED}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<rect x="52" y="112" width="38" height="38" fill="{BLUE}" stroke="{NAVY}" stroke-width="2.5"/>'
        f'<path d="M132,124 L196,66" stroke="{ORANGE}" stroke-width="6" stroke-linecap="round"/>'
        f'<polygon points="192,58 208,58 208,74" fill="{ORANGE}"/>'
        f'<circle cx="164" cy="152" r="14" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2.5"/>'
        f'<circle cx="192" cy="152" r="14" fill="{GOLD}" stroke="{ORANGE}" stroke-width="2.5"/>'
        + person(216, 150, NAVY, 0.85)
        + caption("private owners, profit first")),
    "ECO-002": svg(  # communism: the state owns and shares everything
        f'<rect x="0" y="150" width="240" height="30" fill="{STONE}"/>'
        f'<rect x="24" y="60" width="96" height="90" fill="{WHITE}" stroke="{NAVY}" stroke-width="3"/>'
        + columns_row(32, 112, 96, 150, 4, WHITE)
        + f'<rect x="16" y="50" width="112" height="12" rx="3" fill="{STONE}" stroke="{STONE_DK}" stroke-width="1.5"/>'
        f'<polygon points="10,50 72,26 134,50" fill="{RED}" stroke="{NAVY}" stroke-width="2.5"/>'
        + "".join(person(x, 150, c, 0.85) for x, c in ((146, BLUE), (176, ORANGE), (206, TURQ)))
        + f'<path d="M140,120 q30,-16 60,0" fill="none" stroke="{RED}" stroke-width="3.5" stroke-dasharray="7 5"/>'
        f'<polygon points="194,114 208,120 194,126" fill="{RED}"/>'
        + caption("the state owns it and shares it out")),
}

def slope_bridge(x0=130, x1=520, y0=100, y1=216, ground=268, n=8):
    """An aqueduct bridge whose top follows a channel sloping from (x0, y0) down to (x1, y1)."""
    y = lambda x: y0 + (x - x0) * (y1 - y0) / (x1 - x0)
    out = f'<polygon points="{x0},{y(x0) + 8} {x1},{y(x1) + 8} {x1},{ground} {x0},{ground}" fill="{STONE}" stroke="{STONE_DK}" stroke-width="2"/>'
    w = (x1 - x0) / n
    for k in range(n):
        cx = x0 + w * (k + 0.5)
        top = y(cx) + 26
        rr = w * 0.32
        if ground - top > rr + 8:
            out += f'<path d="M{cx - rr:.1f},{ground} L{cx - rr:.1f},{top + rr:.1f} A{rr:.1f},{rr:.1f} 0 0 1 {cx + rr:.1f},{top + rr:.1f} L{cx + rr:.1f},{ground} Z" fill="{SKY}"/>'
    out += (f'<polygon points="{x0},{y0} {x1},{y1} {x1},{y1 + 10} {x0},{y0 + 10}" fill="{STONE_DK}"/>'
            f'<polygon points="{x0},{y0 + 1} {x1},{y1 + 1} {x1},{y1 + 6} {x0},{y0 + 6}" fill="{BLUE}"/>')
    return out


# Bigger diagrams for slides and printables (course/units/*/images/)
DIAGRAMS = {
    "aqueduct-slope": (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" width="640" height="300">'
        f'<rect width="640" height="300" rx="16" fill="{SKY}"/>'
        f'<path d="M0,120 Q60,90 110,96 L130,250 H0 Z" fill="{GRASS}"/>'
        f'<path d="M520,236 Q580,224 640,230 V300 H460 Z" fill="{GRASS}"/>'
        f'<path d="M110,250 Q320,300 520,250 V300 H110 Z" fill="{GRASS}"/>'
        f'<text x="40" y="84" font-family="sans-serif" font-size="18" font-weight="700" fill="{NAVY}">spring in the hills</text>'
        + slope_bridge() +
        f'<rect x="530" y="196" width="80" height="40" fill="{WHITE}" stroke="{STONE_DK}" stroke-width="2"/><polygon points="526,196 570,172 614,196" fill="{RED}"/>'
        f'<text x="570" y="262" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="{NAVY}">city</text>'
        f'<text x="390" y="70" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="700" fill="{INK}">a gentle slope all the way:</text>'
        f'<text x="390" y="94" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="700" fill="{INK}">gravity does the work</text>'
        '</svg>\n'),
}


def main():
    OUT.mkdir(exist_ok=True)
    for name, text in ICONS.items():
        (OUT / f"{name}.svg").write_text(text, encoding="utf-8")
    units = OUT.parent.parent / "course" / "units"
    for name, text in DIAGRAMS.items():
        folder = units / "02-ancient-rome" / "images"
        folder.mkdir(parents=True, exist_ok=True)
        (folder / f"{name}.svg").write_text(text, encoding="utf-8")
    print(f"draw_icons: {len(ICONS)} icons, {len(DIAGRAMS)} diagrams")


if __name__ == "__main__":
    main()
