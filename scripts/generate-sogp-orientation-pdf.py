#!/usr/bin/env python3
"""Generate the branded SOGP orientation PDF from the approved Markdown draft."""

from __future__ import annotations

import html
import re
from io import BytesIO
from pathlib import Path

from fontTools.ttLib import TTFont as FontToolsFont
from fontTools.varLib.instancer import instantiateVariableFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "sogp-orientation-guide.md"
OUTPUT = ROOT / "output" / "pdf" / "sogp-orientation-guide-draft.pdf"
TMP = ROOT / "tmp" / "pdfs" / "sogp-orientation"
LOGO = ROOT / "public" / "brand" / "white-logotype.png"

PAGE_WIDTH = 6 * inch
PAGE_HEIGHT = 9 * inch
MARGIN_X = 0.52 * inch
CONTENT_TOP = 0.96 * inch
CONTENT_BOTTOM = 0.55 * inch

BLUE = colors.HexColor("#051480")
BLUE_DARK = colors.HexColor("#031067")
SKY = colors.HexColor("#D2F1FF")
SKY_SOFT = colors.HexColor("#F4F9FF")
LIME = colors.HexColor("#E9ED01")
INK = colors.HexColor("#061056")
MUTED = colors.HexColor("#40518A")
LINE = colors.HexColor("#DDE7F0")
RED = colors.HexColor("#B42318")
RED_SOFT = colors.HexColor("#FEF3F2")
GREEN = colors.HexColor("#447A13")
GREEN_SOFT = colors.HexColor("#F1F8E9")
GREY = colors.HexColor("#6876A0")
GREY_SOFT = colors.HexColor("#F1F4F7")
WHITE = colors.white


def find_font_file(family: str, weight: int) -> Path:
    """Resolve the Latin WOFF2 file emitted by Next.js for a Google font."""
    css_files = list((ROOT / ".next" / "static" / "chunks").glob("*.css"))
    if not css_files:
        raise FileNotFoundError("No .next font CSS found. Run `npm run build` first.")

    family_pattern = re.escape(family)
    block_pattern = re.compile(
        rf"@font-face\{{font-family:{family_pattern};[^}}]*font-weight:{weight};[^}}]*\}}"
    )
    src_pattern = re.compile(r"src:url\(\.\./media/([^\)]+\.woff2)\)")

    candidates: list[tuple[Path, str]] = []
    for css_file in css_files:
        css = css_file.read_text(encoding="utf-8")
        for block in block_pattern.findall(css):
            match = src_pattern.search(block)
            if not match:
                continue
            font_path = ROOT / ".next" / "static" / "media" / match.group(1)
            if font_path.exists():
                candidates.append((font_path, block))

    if not candidates:
        raise FileNotFoundError(f"Could not resolve {family} weight {weight} from .next.")

    # Next emits Vietnamese, Latin-ext, then Latin. The Latin block contains
    # the punctuation range and is the right compact subset for this guide.
    for path, block in candidates:
        if "U+2000-206F" in block:
            return path
    return candidates[-1][0]


def convert_font(source: Path, output: Path, *, weight: int | None = None) -> Path:
    output.parent.mkdir(parents=True, exist_ok=True)
    font = FontToolsFont(source)
    if weight is not None and "fvar" in font:
        font = instantiateVariableFont(
            font,
            {"wght": weight},
            inplace=False,
            updateFontNames=True,
        )
    font.flavor = None
    font.save(output)
    return output


def register_fonts() -> None:
    sen_source = find_font_file("Sen", 400)
    body_sources = {
        400: find_font_file("Be Vietnam Pro", 400),
        600: find_font_file("Be Vietnam Pro", 600),
        700: find_font_file("Be Vietnam Pro", 700),
    }

    font_paths = {
        "Sen-Regular": convert_font(sen_source, TMP / "Sen-Regular.ttf", weight=400),
        "Sen-SemiBold": convert_font(sen_source, TMP / "Sen-SemiBold.ttf", weight=600),
        "Sen-Bold": convert_font(sen_source, TMP / "Sen-Bold.ttf", weight=700),
        "BeVietnam-Regular": convert_font(
            body_sources[400], TMP / "BeVietnam-Regular.ttf"
        ),
        "BeVietnam-SemiBold": convert_font(
            body_sources[600], TMP / "BeVietnam-SemiBold.ttf"
        ),
        "BeVietnam-Bold": convert_font(
            body_sources[700], TMP / "BeVietnam-Bold.ttf"
        ),
    }
    for name, path in font_paths.items():
        pdfmetrics.registerFont(TTFont(name, str(path)))

    pdfmetrics.registerFontFamily(
        "BeVietnam-Regular",
        normal="BeVietnam-Regular",
        bold="BeVietnam-SemiBold",
        italic="BeVietnam-Regular",
        boldItalic="BeVietnam-SemiBold",
    )


def normalise_text(value: str) -> str:
    return value.replace("–", "-").replace("—", "-").replace("‑", "-")


def inline_markup(value: str) -> str:
    safe = html.escape(normalise_text(value), quote=False)
    safe = re.sub(
        r"\[([^\]]+)\]\((https?://[^)]+)\)",
        r'<link href="\2" color="#051480"><u>\1</u></link>',
        safe,
    )
    return re.sub(
        r"\*\*(.+?)\*\*",
        r'<font name="BeVietnam-SemiBold">\1</font>',
        safe,
    )


def build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "cover_eyebrow": ParagraphStyle(
            "CoverEyebrow",
            parent=base["Normal"],
            fontName="BeVietnam-SemiBold",
            fontSize=8.2,
            leading=10,
            tracking=1.25,
            textColor=INK,
            alignment=TA_CENTER,
        ),
        "cover_title": ParagraphStyle(
            "CoverTitle",
            parent=base["Title"],
            fontName="Sen-SemiBold",
            fontSize=35,
            leading=36,
            textColor=WHITE,
            alignment=TA_LEFT,
            spaceAfter=15,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle",
            parent=base["Normal"],
            fontName="BeVietnam-Regular",
            fontSize=12.2,
            leading=18,
            textColor=colors.HexColor("#E6ECFF"),
            alignment=TA_LEFT,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="Sen-Bold",
            fontSize=20,
            leading=23,
            textColor=BLUE,
            spaceBefore=12,
            spaceAfter=9,
            keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "H3",
            parent=base["Heading3"],
            fontName="Sen-SemiBold",
            fontSize=12.5,
            leading=16,
            textColor=INK,
            spaceBefore=8,
            spaceAfter=5,
            keepWithNext=True,
        ),
        "schedule_label": ParagraphStyle(
            "ScheduleLabel",
            parent=base["Normal"],
            fontName="Sen-SemiBold",
            fontSize=10.5,
            leading=13,
            textColor=WHITE,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="BeVietnam-Regular",
            fontSize=9.6,
            leading=14.1,
            textColor=INK,
            spaceAfter=7.5,
            allowWidows=0,
            allowOrphans=0,
        ),
        "body_bold": ParagraphStyle(
            "BodyBold",
            parent=base["BodyText"],
            fontName="BeVietnam-SemiBold",
            fontSize=9.6,
            leading=14.1,
            textColor=INK,
        ),
        "list": ParagraphStyle(
            "List",
            parent=base["BodyText"],
            fontName="BeVietnam-Regular",
            fontSize=9.25,
            leading=13.6,
            textColor=INK,
        ),
        "step_number": ParagraphStyle(
            "StepNumber",
            parent=base["Normal"],
            fontName="Sen-Bold",
            fontSize=9,
            leading=10,
            alignment=TA_CENTER,
            textColor=WHITE,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["Normal"],
            fontName="BeVietnam-Regular",
            fontSize=7.4,
            leading=10.3,
            textColor=MUTED,
        ),
        "callout": ParagraphStyle(
            "Callout",
            parent=base["BodyText"],
            fontName="Sen-SemiBold",
            fontSize=11.2,
            leading=16,
            textColor=BLUE,
        ),
        "closing": ParagraphStyle(
            "Closing",
            parent=base["BodyText"],
            fontName="Sen-SemiBold",
            fontSize=12.2,
            leading=17,
            textColor=WHITE,
            alignment=TA_LEFT,
        ),
    }


class ColourChip(Flowable):
    def __init__(self, fill: colors.Color, stroke: colors.Color | None = None):
        super().__init__()
        self.width = 12
        self.height = 12
        self.fill = fill
        self.stroke = stroke or fill

    def draw(self) -> None:
        self.canv.setFillColor(self.fill)
        self.canv.setStrokeColor(self.stroke)
        self.canv.roundRect(0, 1, 10, 10, 2, fill=1, stroke=1)


class Checkbox(Flowable):
    def __init__(self):
        super().__init__()
        self.width = 12
        self.height = 12

    def draw(self) -> None:
        self.canv.setStrokeColor(BLUE)
        self.canv.setLineWidth(1.1)
        self.canv.roundRect(0, 1, 10, 10, 1.7, fill=0, stroke=1)


def paragraph(value: str, styles: dict[str, ParagraphStyle], style: str = "body") -> Paragraph:
    return Paragraph(inline_markup(value), styles[style])


def numbered_step(number: str, value: str, styles: dict[str, ParagraphStyle]) -> Table:
    number_box = Table(
        [[Paragraph(number, styles["step_number"])]],
        colWidths=[22],
        rowHeights=[22],
    )
    number_box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BLUE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BOX", (0, 0), (-1, -1), 0, BLUE),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    row = Table(
        [[number_box, Paragraph(inline_markup(value), styles["list"])]],
        colWidths=[29, PAGE_WIDTH - (2 * MARGIN_X) - 29],
    )
    row.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return row


def bullet_row(value: str, styles: dict[str, ParagraphStyle]) -> Table:
    label_match = re.match(r"\*\*(.+?):\*\*\s*(.*)", value)
    chip_fill = LIME
    chip_stroke = LIME
    if label_match:
        label = label_match.group(1)
        colour_map = {
            "Green": (GREEN_SOFT, GREEN),
            "Red": (RED_SOFT, RED),
            "Grey": (GREY_SOFT, GREY),
            "Outlined date": (WHITE, BLUE),
        }
        chip_fill, chip_stroke = colour_map.get(label, (LIME, LIME))

    row = Table(
        [[ColourChip(chip_fill, chip_stroke), Paragraph(inline_markup(value), styles["list"])]],
        colWidths=[19, PAGE_WIDTH - (2 * MARGIN_X) - 19],
    )
    row.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return row


def checklist_row(value: str, styles: dict[str, ParagraphStyle]) -> Table:
    row = Table(
        [[Checkbox(), Paragraph(inline_markup(value), styles["list"])]],
        colWidths=[19, PAGE_WIDTH - (2 * MARGIN_X) - 19],
    )
    row.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return row


def callout(value: str, styles: dict[str, ParagraphStyle], *, closing: bool = False) -> Table:
    background = BLUE if closing else SKY
    style = styles["closing"] if closing else styles["callout"]
    table = Table(
        [[Paragraph(inline_markup(value), style)]],
        colWidths=[PAGE_WIDTH - (2 * MARGIN_X)],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("BOX", (0, 0), (-1, -1), 0, background),
                ("LEFTPADDING", (0, 0), (-1, -1), 15),
                ("RIGHTPADDING", (0, 0), (-1, -1), 15),
                ("TOPPADDING", (0, 0), (-1, -1), 13),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 13),
            ]
        )
    )
    return table


def schedule_band(value: str, styles: dict[str, ParagraphStyle]) -> Table:
    table = Table(
        [[Paragraph(inline_markup(value), styles["schedule_label"])]],
        colWidths=[PAGE_WIDTH - (2 * MARGIN_X)],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BLUE),
                ("BOX", (0, 0), (-1, -1), 0, BLUE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    table.spaceAfter = 9
    return table


def draw_cover(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(BLUE)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    canvas.setFillColor(BLUE_DARK)
    canvas.circle(PAGE_WIDTH + 30, PAGE_HEIGHT - 50, 125, fill=1, stroke=0)
    canvas.setFillColor(SKY)
    canvas.circle(PAGE_WIDTH - 22, 42, 90, fill=1, stroke=0)
    canvas.setFillColor(LIME)
    canvas.circle(PAGE_WIDTH - 68, 89, 17, fill=1, stroke=0)
    canvas.drawImage(
        str(LOGO),
        MARGIN_X,
        PAGE_HEIGHT - 1.35 * inch,
        width=88,
        height=45,
        preserveAspectRatio=True,
        mask="auto",
        anchor="c",
    )
    canvas.restoreState()


def draw_content_chrome(canvas, page_number: int) -> None:
    canvas.saveState()
    canvas.setFillColor(BLUE)
    canvas.rect(0, PAGE_HEIGHT - 48, PAGE_WIDTH, 48, fill=1, stroke=0)
    canvas.setFillColor(LIME)
    canvas.rect(0, PAGE_HEIGHT - 50, PAGE_WIDTH, 2, fill=1, stroke=0)
    canvas.drawImage(
        str(LOGO),
        MARGIN_X,
        PAGE_HEIGHT - 37,
        width=50,
        height=26,
        preserveAspectRatio=True,
        mask="auto",
        anchor="c",
    )
    canvas.setFont("Sen-SemiBold", 7.4)
    canvas.setFillColor(WHITE)
    canvas.drawRightString(
        PAGE_WIDTH - MARGIN_X,
        PAGE_HEIGHT - 30,
        "SCHOOL OF GOD'S PURPOSE",
    )

    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN_X, 29, PAGE_WIDTH - MARGIN_X, 29)
    canvas.setFont("BeVietnam-Regular", 6.7)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, 17, "SOGP orientation guide")
    canvas.drawRightString(PAGE_WIDTH - MARGIN_X, 17, str(page_number))
    canvas.restoreState()


def apply_content_chrome(source: Path, output: Path) -> None:
    reader = PdfReader(str(source))
    writer = PdfWriter()

    packet = BytesIO()
    overlay_canvas = pdfcanvas.Canvas(
        packet,
        pagesize=(PAGE_WIDTH, PAGE_HEIGHT),
    )
    for page_number in range(1, len(reader.pages)):
        draw_content_chrome(overlay_canvas, page_number)
        overlay_canvas.showPage()
    overlay_canvas.save()
    packet.seek(0)
    overlays = PdfReader(packet)

    for index, page in enumerate(reader.pages):
        if index > 0:
            page.merge_page(overlays.pages[index - 1], over=True)
        writer.add_page(page)

    if reader.metadata:
        writer.add_metadata(
            {
                key: value
                for key, value in reader.metadata.items()
                if isinstance(key, str) and isinstance(value, str)
            }
        )

    with output.open("wb") as output_file:
        writer.write(output_file)


def build_story(styles: dict[str, ParagraphStyle]) -> list[Flowable]:
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    story: list[Flowable] = [
        Spacer(1, 2.28 * inch),
        Table(
            [[Paragraph("ORIENTATION GUIDE", styles["cover_eyebrow"])]],
            colWidths=[112],
            rowHeights=[24],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), LIME),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]
            ),
        ),
        Spacer(1, 18),
        Paragraph("School of God’s<br/>Purpose", styles["cover_title"]),
        Paragraph(
            "Your journey through the School of God’s Purpose",
            styles["cover_subtitle"],
        ),
        NextPageTemplate("content"),
        PageBreak(),
    ]

    paragraphs_seen = 0
    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("# SOGP orientation guide"):
            continue
        if line.startswith("## How the programme works"):
            continue
        if line.startswith("## "):
            story.extend([Spacer(1, 4), Paragraph(inline_markup(line[3:]), styles["h2"])])
            continue
        if line.startswith("### "):
            if line == "### Progress":
                story.append(PageBreak())
            heading = line[4:]
            if heading in {"Monday to Saturday", "Sunday"}:
                story.append(schedule_band(heading, styles))
            else:
                story.append(Paragraph(inline_markup(heading), styles["h3"]))
            continue
        ordered = re.match(r"(\d+)\.\s+(.+)", line)
        if ordered:
            story.append(numbered_step(ordered.group(1), ordered.group(2), styles))
            continue
        checklist = re.match(r"- \[ \]\s+(.+)", line)
        if checklist:
            story.append(checklist_row(checklist.group(1), styles))
            continue
        bullet = re.match(r"-\s+(.+)", line)
        if bullet:
            story.append(bullet_row(bullet.group(1), styles))
            continue
        if line.startswith("**") and line.endswith("**"):
            story.extend([Spacer(1, 8), callout(line[2:-2], styles, closing=True)])
            continue

        paragraphs_seen += 1
        if paragraphs_seen == 1:
            story.append(callout(line, styles))
            story.append(Spacer(1, 6))
        else:
            story.append(paragraph(line, styles))

    return story


def main() -> None:
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    styles = build_styles()

    cover_frame = Frame(
        MARGIN_X,
        CONTENT_BOTTOM,
        PAGE_WIDTH - (2 * MARGIN_X),
        PAGE_HEIGHT - CONTENT_BOTTOM,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
        id="cover",
    )
    content_frame = Frame(
        MARGIN_X,
        CONTENT_BOTTOM,
        PAGE_WIDTH - (2 * MARGIN_X),
        PAGE_HEIGHT - CONTENT_TOP - CONTENT_BOTTOM,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
        id="content",
    )

    source_pdf = TMP / "sogp-orientation-content.pdf"
    document = BaseDocTemplate(
        str(source_pdf),
        pagesize=(PAGE_WIDTH, PAGE_HEIGHT),
        title="SOGP orientation guide",
        author="Pleros Ministries and Missions",
        subject="How SOGP works and how to use the Pleros Dashboard",
        creator="Pleros Ministries and Missions",
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=CONTENT_TOP,
        bottomMargin=CONTENT_BOTTOM,
    )
    document.addPageTemplates(
        [
            PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover),
            PageTemplate(id="content", frames=[content_frame]),
        ]
    )

    document.build(build_story(styles))
    apply_content_chrome(source_pdf, OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
