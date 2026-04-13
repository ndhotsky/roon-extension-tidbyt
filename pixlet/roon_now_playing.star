load("encoding/base64.star", "base64")
load("render.star", "render")
load("schema.star", "schema")

ART_SIZE = 24
TEXT_WIDTH = 39

def _safe_text(config, key, fallback = ""):
    value = config.get(key, fallback)
    if value == None:
        return fallback
    text = str(value).strip()
    return text if text else fallback

def _normalize_artwork_b64(s):
    normalized = s.replace(" ", "").replace("\n", "").replace("\r", "").replace("\t", "")
    for _ in range(2):
        if normalized.endswith("="):
            normalized = normalized[:-1]
    return normalized

def _album_art(config):
    artwork_b64 = _normalize_artwork_b64(_safe_text(config, "artwork_b64", ""))
    if artwork_b64:
        decoded = base64.decode(artwork_b64, encoding = "url_raw")
        if decoded:
            return render.Image(src = decoded, width = ART_SIZE, height = ART_SIZE)

    return render.Box(
        width = ART_SIZE,
        height = ART_SIZE,
        color = "#1e232e",
        child = render.Text("R", font = "tom-thumb", color = "#44ff66"),
    )

def main(config):
    title = _safe_text(config, "title", "Nothing Playing")
    subtitle = _safe_text(config, "subtitle", "Unknown Artist")
    album = _safe_text(config, "album", "Unknown Album")
    zone_name = _safe_text(config, "zone_name", "Unknown Zone")
    art = _album_art(config)

    return render.Root(
        child = render.Box(
            color = "#06080d",
            child = render.Column(
                cross_align = "start",
                main_align = "space_between",
                children = [
                    render.Marquee(
                        width = 64,
                        child = render.Text(title, font = "tb-8", color = "#ffffff"),
                    ),
                    render.Row(
                        cross_align = "center",
                        children = [
                            art,
                            render.Box(width = 1, height = 1),
                            render.Box(
                                height = ART_SIZE,
                                child = render.Column(
                                    cross_align = "start",
                                    main_align = "center",
                                    children = [
                                        render.Marquee(
                                            width = TEXT_WIDTH,
                                            child = render.Text(subtitle, font = "tb-8", color = "#dbe3ff"),
                                        ),
                                        render.Marquee(
                                            width = TEXT_WIDTH,
                                            child = render.Text(album, font = "tb-8", color = "#8fd3ff"),
                                        ),
                                        render.Marquee(
                                            width = TEXT_WIDTH,
                                            child = render.Text(zone_name, font = "tb-8", color = "#9ae6b4"),
                                        ),
                                    ],
                                ),
                            ),
                        ],
                    ),
                ],
            ),
        ),
    )

def get_schema():
    return schema.Schema(
        version = "1",
        fields = [
            schema.Text(
                id = "title",
                name = "Title",
                desc = "Track title",
                icon = "music",
                default = "Nothing Playing",
            ),
            schema.Text(
                id = "subtitle",
                name = "Subtitle",
                desc = "Artist or secondary text",
                icon = "user",
                default = "",
            ),
            schema.Text(
                id = "album",
                name = "Album",
                desc = "Album title",
                icon = "text-width",
                default = "",
            ),
            schema.Text(
                id = "zone_name",
                name = "Zone Name",
                desc = "Selected Roon zone name",
                icon = "speaker",
                default = "",
            ),
            schema.Text(
                id = "artwork_b64",
                name = "Artwork Base64",
                desc = "Album art bytes (base64 encoded JPEG)",
                icon = "image",
                default = "",
            ),
        ],
    )
