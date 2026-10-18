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


ICONS = {
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
