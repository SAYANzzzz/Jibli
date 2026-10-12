from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUTPUT = PUBLIC / "instagram-posts"
SIZE = 1080
BACKGROUND = "#070B1E"
SURFACE = "#101A38"
BORDER = "#263159"
TEXT = "#F3F5FF"
MUTED = "#AAB4D2"
ACCENT = "#5B9BFF"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    windows = Path("C:/Windows/Fonts")
    candidates = [
        windows / ("arialbd.ttf" if bold else "arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu") / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def base(category: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (SIZE, SIZE), BACKGROUND)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((64, 52, 250, 122), radius=14, fill="#FFFFFF")
    logo = Image.open(PUBLIC / "Logo.png").convert("RGBA")
    logo.thumbnail((150, 56), Image.Resampling.LANCZOS)
    image.paste(logo, (82, 59), logo)
    draw.text((1014, 87), category.upper(), font=font(18, True), fill=MUTED, anchor="ra")
    draw.line((64, 153, 1016, 153), fill=BORDER, width=2)
    return image, draw


def footer(draw: ImageDraw.ImageDraw) -> None:
    draw.line((64, 974, 1016, 974), fill=BORDER, width=2)
    draw.text((66, 1013), "JIBLI  ·  MADE FOR TUNISIA", font=font(17, True), fill=MUTED, anchor="lm")
    draw.text((1014, 1013), "@jibli.tunisia", font=font(18, True), fill=TEXT, anchor="rm")


def image_tile(image: Image.Image, source: Path, box: tuple[int, int, int, int], contain: bool = False) -> None:
    left, top, right, bottom = box
    width, height = right - left, bottom - top
    original = Image.open(source).convert("RGB")
    if contain:
        artwork = Image.new("RGB", (width, height), "#111111")
        fitted = ImageOps.contain(original, (width, height), method=Image.Resampling.LANCZOS)
        artwork.paste(fitted, ((width - fitted.width) // 2, (height - fitted.height) // 2))
    else:
        artwork = ImageOps.fit(original, (width, height), method=Image.Resampling.LANCZOS)
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, height - 1), radius=15, fill=255)
    image.paste(artwork, (left, top), mask)


def invitation_post() -> None:
    image, draw = base("Invitations")
    draw.text((66, 211), "Invitations for", font=font(58, True), fill=TEXT)
    draw.text((66, 281), "every moment.", font=font(58, True), fill=ACCENT)
    draw.multiline_text((68, 385), "Personalised digital invitations,\nmade for your special occasion\nand ready to share on WhatsApp.", font=font(25), fill=MUTED, spacing=13)

    draw.text((68, 558), "WEDDINGS  ·  ENGAGEMENTS", font=font(17, True), fill=TEXT)
    draw.text((68, 599), "BIRTHDAYS  ·  GRADUATIONS", font=font(17, True), fill=TEXT)
    draw.text((68, 640), "FAMILY  ·  BUSINESS  ·  MORE", font=font(17, True), fill=TEXT)
    draw.rounded_rectangle((68, 735, 411, 800), radius=12, fill=ACCENT)
    draw.text((239, 768), "Explore the collection", font=font(20, True), fill=BACKGROUND, anchor="mm")
    draw.text((68, 837), "Starting from 10 TND", font=font(18, True), fill=MUTED)

    draw.rounded_rectangle((598, 211, 1014, 902), radius=20, fill=SURFACE, outline=BORDER, width=2)
    image_tile(image, PUBLIC / "invitations" / "weddings" / "arabesque-burgundy.png", (622, 235, 804, 509))
    image_tile(image, PUBLIC / "invitations" / "birthdays" / "birthday-disco.jfif", (824, 235, 990, 509))
    image_tile(image, PUBLIC / "invitations" / "graduations" / "classic-mortarboard.jfif", (622, 525, 804, 799))
    image_tile(image, PUBLIC / "invitations" / "engagements" / "intimate-vows.jfif", (824, 525, 990, 799))
    draw.text((622, 839), "A design for every reason to celebrate.", font=font(16, True), fill=MUTED)
    footer(draw)
    image.save(OUTPUT / "01-invitations.png", optimize=True)


def gaming_post() -> None:
    image, draw = base("Gaming")
    draw.text((66, 183), "Games, gift cards & more", font=font(42, True), fill=TEXT)
    draw.text((68, 239), "Top up, subscribe and get back to what you love.", font=font(20), fill=MUTED)

    catalog = [
        ("pubg-mobile.jpg", "PUBG Mobile"),
        ("call-of-duty-mobile.webp", "Call of Duty"),
        ("fortnite.jpg", "Fortnite"),
        ("freefire.jpg", "Free Fire"),
        ("roblox.png", "Roblox"),
        ("valorant.jpg", "Valorant"),
        ("brawl-stars.png", "Brawl Stars"),
        ("clash-of-clans.jpg", "Clash of Clans"),
        ("clash-royale.jpg", "Clash Royale"),
        ("genshin-impact.jpg", "Genshin Impact"),
        ("honkai-star-rail.png", "Honkai: Star Rail"),
        ("mobile-legends.jpg", "Mobile Legends"),
        ("fc-mobile.jpg", "FC Mobile"),
        ("efootball.png", "eFootball"),
        ("minecraft.jpg", "Minecraft"),
        ("league-of-legends.jpg", "League of Legends"),
        ("chess.jpg", "Chess.com"),
        ("playstation.png", "PlayStation"),
        ("xbox.jpg", "Xbox"),
        ("nintendo-gift-card.png", "Nintendo"),
        ("steam.jpg", "Steam"),
        ("spotify.png", "Spotify"),
        ("netflix.png", "Netflix"),
        ("youtube-premium.png", "YouTube Premium"),
        ("discord-nitro.png", "Discord Nitro"),
        ("canva.png", "Canva"),
        ("capcut.png", "CapCut"),
        ("chatgpt.png", "ChatGPT"),
        ("google-play-gift-card.png", "Google Play"),
        ("apple-gift-card.png", "Apple Gift Card"),
    ]
    columns = 6
    tile_width = 150
    tile_height = 109
    gap_x = 10
    gap_y = 8
    start_x = 64
    start_y = 291
    for index, (filename, label) in enumerate(catalog):
        row, column = divmod(index, columns)
        x = start_x + column * (tile_width + gap_x)
        y = start_y + row * (tile_height + gap_y)
        draw.rounded_rectangle((x, y, x + tile_width, y + tile_height), radius=12, fill=SURFACE, outline=BORDER, width=1)

        icon = Image.open(PUBLIC / "games" / filename).convert("RGBA")
        icon_background = Image.new("RGBA", icon.size, "#FFFFFF")
        icon_background.alpha_composite(icon)
        icon = ImageOps.fit(icon_background.convert("RGB"), (50, 50), method=Image.Resampling.LANCZOS)
        icon_mask = Image.new("L", (50, 50), 0)
        ImageDraw.Draw(icon_mask).rounded_rectangle((0, 0, 49, 49), radius=9, fill=255)
        image.paste(icon, (x + 50, y + 8), icon_mask)

        label_font = font(12, True)
        words = label.split()
        lines: list[str] = []
        current_line = ""
        for word in words:
            candidate = f"{current_line} {word}".strip()
            if draw.textbbox((0, 0), candidate, font=label_font)[2] <= tile_width - 12:
                current_line = candidate
            else:
                lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
        draw.multiline_text(
            (x + tile_width / 2, y + 72),
            "\n".join(lines[:2]),
            font=label_font,
            fill=TEXT,
            anchor="ma",
            align="center",
            spacing=1,
        )

    draw.text((68, 897), "Game top-ups  ·  Steam & gaming gift cards  ·  Premium subscriptions", font=font(16, True), fill=MUTED)
    footer(draw)
    image.save(OUTPUT / "02-gaming.png", optimize=True)


def aliexpress_post() -> None:
    image, draw = base("AliExpress")
    draw.text((66, 230), "Found it on", font=font(63, True), fill=TEXT)
    draw.text((66, 306), "AliExpress?", font=font(63, True), fill=ACCENT)
    draw.multiline_text((68, 420), "Send Jibli the product link.\nWe’ll help you order it in Tunisia.", font=font(25), fill=MUTED, spacing=13)
    draw.rounded_rectangle((68, 569, 520, 659), radius=13, fill=SURFACE, outline=BORDER, width=2)
    draw.text((94, 614), "NO INTERNATIONAL CARD NEEDED", font=font(17, True), fill=TEXT, anchor="lm")
    draw.rounded_rectangle((68, 735, 391, 800), radius=12, fill=ACCENT)
    draw.text((229, 768), "Order with Jibli", font=font(20, True), fill=BACKGROUND, anchor="mm")

    draw.rounded_rectangle((598, 211, 1014, 902), radius=20, fill=SURFACE, outline=BORDER, width=2)
    ali = Image.open(PUBLIC / "aliexpress-logo.png").convert("RGBA")
    ali.thumbnail((236, 236), Image.Resampling.LANCZOS)
    image.paste(ali, (688, 274), ali)
    draw.text((806, 555), "Browse", font=font(23, True), fill=TEXT, anchor="mm")
    draw.text((806, 609), "Share the link", font=font(23, True), fill=TEXT, anchor="mm")
    draw.text((806, 663), "Order with Jibli", font=font(23, True), fill=ACCENT, anchor="mm")
    draw.line((806, 575, 806, 587), fill=BORDER, width=3)
    draw.line((806, 629, 806, 641), fill=BORDER, width=3)
    draw.text((806, 829), "AliExpress shopping, made easier.", font=font(17, True), fill=MUTED, anchor="mm")
    footer(draw)
    image.save(OUTPUT / "03-aliexpress.png", optimize=True)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    invitation_post()
    gaming_post()
    aliexpress_post()


if __name__ == "__main__":
    main()
