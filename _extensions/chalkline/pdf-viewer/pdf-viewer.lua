--[[
PDF viewer: show a PDF inside a slide or web page, drawn by pdf.js 4.10.38 (pdf.min.mjs and pdf.worker.min.mjs, Apache-2.0: LICENSE-pdfjs.txt).
Part of the Chalkline extension; it also works on its own in any Quarto project.

  {{< pdf-viewer "worksheet.pdf" >}}                  one page at a time, with ‹ › buttons
  {{< pdf-viewer "packet.pdf" layout="gallery" >}}    every page as a thumbnail; tap one to open
                                                      it large, in a window you can drag and resize

Options:
  title="Athens vs Sparta"   the name shown in the toolbar (default: the file name)
  page=2                     the page to start on (viewer)
  height="560px"             how tall the viewer is (default: fills its slide column)
  ink=false                  no pens (default: pens on, for touch screens)
  prefer=false               always show this file, even when the project prefers another (below)

Project option: show another version of each PDF when there is one, for example a student copy
next to a teacher edition. {name} is the file name without ".pdf":
  pdf-viewer:
    prefer: "{name}-student.pdf"
The viewer tries that file first and falls back to the one named in the shortcode.

The path is relative to this file, like a link. The PDF is loaded when the page is shown, not
when it is built, so it can be a PDF that the same render makes (a worksheet's own PDF).
Pens: pen, highlighter, text (tap the page, type, Enter), eraser, undo and Clear. Ink stays on
the page in this browser until Clear. Zoom: − 100% + (or Ctrl/⌘ + scroll, a trackpad pinch, and
+ − 0 in the large window); when zoomed in, scroll or drag to move around.
⬇ Download: with my notes (the PDF with the ink added), the original, or open in a new tab (pdf-lib 1.17.1, pdf-lib.esm.min.js, MIT: LICENSE-pdf-lib.txt;
it loads only when someone presses it).
In other formats (PDF, Word) you get a plain link.
]]

local function str(x, default)
  if x == nil then return default end
  local s = pandoc.utils.stringify(x)
  if s == "" then return default end
  return s
end

local function html_escape(s)
  return (s:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"):gsub('"', "&quot;"))
end

return {
  ["pdf-viewer"] = function(args, kwargs, meta)
    local file = str(args[1], nil)
    if not file then return pandoc.Null() end
    local title = str(kwargs["title"], file:match("[^/]+$"))
    if not quarto.doc.is_format("html") then   -- revealjs counts as html
      return pandoc.Para({ pandoc.Link({ pandoc.Str("📄 " .. title .. " (PDF)") }, file) })
    end
    quarto.doc.add_html_dependency({
      name = "pdf-viewer",
      version = "1.0.0",
      scripts = { { path = "pdf-viewer.js", attribs = { type = "module" }, afterBody = true } },
      stylesheets = { "pdf-viewer.css" },
      resources = { "pdf.min.mjs", "pdf.worker.min.mjs", "pdf-lib.esm.min.js" },
    })
    local prefer = str(meta and meta["pdf-viewer"] and meta["pdf-viewer"]["prefer"], nil)
    if prefer and str(kwargs["prefer"], "true") ~= "false" then
      local dir, name = file:match("^(.-)([^/]+)%.pdf$")
      prefer = name and (dir .. prefer:gsub("{name}", (name:gsub("%%", "%%%%")))) or nil
    else
      prefer = nil
    end
    local layout = str(kwargs["layout"], "viewer") == "gallery" and "gallery" or "viewer"
    local height = str(kwargs["height"], nil)
    local style = height and (' style="height:' .. html_escape(height) .. '"') or ""
    return pandoc.RawBlock("html",
      '<div class="pdfv pdfv-' .. layout .. '" data-src="' .. html_escape(file) ..
      '" data-title="' .. html_escape(title) .. '" data-layout="' .. layout ..
      '" data-page="' .. html_escape(str(kwargs["page"], "1")) ..
      (prefer and ('" data-prefer="' .. html_escape(prefer)) or "") ..
      '" data-ink="' .. (str(kwargs["ink"], "true") == "false" and "false" or "true") ..
      '" data-prevent-swipe data-pending' .. style .. '>' ..
      '<a class="pdfv-fallback" href="' .. html_escape(file) .. '">📄 ' .. html_escape(title) .. ' (PDF)</a></div>')
  end,
}
