--[[
Video shapes, for video-fit.html. Runs before Quarto turns {{< video >}} into a player, while the
link is still the one the author wrote: a YouTube Short (youtube.com/shorts/...) is tall (9:16),
anything else is wide (16:9), and Quarto's own aspect-ratio="9x16" (ignored on slides) wins. The
video is wrapped in a span that says so; on slides, video-fit.html sizes the player to that shape.
]]

function Span(el)
  if not quarto.doc.is_format("revealjs") or not el.classes:includes("quarto-shortcode__") then return nil end
  local raw = el.attributes["data-raw"] or ""
  if not raw:match("^{{<%s*video%s") then return nil end
  if raw:match("%swidth=") or raw:match("%sheight=") then return nil end   -- the author's own size: leave it alone
  local w, h = raw:match('aspect%-ratio="?(%d+)x(%d+)')
  local shape = w and (w .. "/" .. h) or (raw:find("youtube%.com/shorts/") and "9/16" or "16/9")
  return pandoc.Span({ el }, pandoc.Attr("", { "video-shape" }, { { "data-aspect", shape } }))
end
