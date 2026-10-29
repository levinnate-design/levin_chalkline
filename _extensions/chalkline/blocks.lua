--[[
Shortcodes that build a block from the course's data, with Chalkline's Python helpers
(scripts/blocks.py). The same output as the Python cells pages used before, without code in the page.

  {{< vocab-cards unit=1 words="peninsula, colony" zh=true >}}   picture cards, side by side (slides).
                                 Without words=: every word in the unit. zh=true adds the 中文 (not on
                                 review slides), notes=true the longer note, images="pics" another folder.
  {{< word-bank unit=1 "Government: democracy, citizen" "Places: colony" >}}
                                 a word-bank box, one line per group (title="..." to rename it)
  {{< vocab-table unit=1 >}}     a table of words and meanings (words="..." for some; examples=false)
  {{< vocab-list unit=1 >}}      a bulleted list of words and meanings
  {{< fill-in-the-blank unit=1 >}}   a word bank and numbered meanings to fill in; the answer key is teacher-only
  {{< overview season >}}        the overview's parts: season, by-unit, by-type (index.qmd),
                                 learning, family-picks (families.qmd)
  {{< season-events >}}          course/season.yml's events as a list (upcoming=true: only those to come)

Words come from the unit's file in course/vocab/ (made by scripts/import_vocab.py).
]]

local OPTIONS = { "unit", "words", "zh", "notes", "images", "examples", "title", "seed", "upcoming" }

local function python()
  local py = os.getenv("QUARTO_PYTHON")
  if py and py ~= "" then return py end
  local dir = quarto.project.directory or "."
  for _, p in ipairs({ ".venv/bin/python", ".venv/Scripts/python.exe" }) do
    local f = io.open(pandoc.path.join({ dir, p }), "r")
    if f then f:close() return pandoc.path.join({ dir, p }) end
  end
  return package.config:sub(1, 1) == "\\" and "python" or "python3"
end

local function block(name)
  return function(args, kwargs)
    local a = { groups = {} }
    for _, k in ipairs(OPTIONS) do
      local v = kwargs[k] and pandoc.utils.stringify(kwargs[k]) or ""
      if v ~= "" then a[k] = v end
    end
    for _, v in ipairs(args) do table.insert(a.groups, pandoc.utils.stringify(v)) end
    local ok, out = pcall(pandoc.pipe, python(),
      { quarto.utils.resolve_path("scripts/blocks.py"), name, quarto.json.encode(a) }, "")
    local msg = not ok and ("Python didn't run (" .. tostring(out) .. ")") or out:match("^CHALKLINE%-ERROR (.-)%s*$")
    if msg then
      quarto.log.warning(name .. " shortcode: " .. msg)
      return pandoc.Para({ pandoc.Strong({ pandoc.Str("⚠ " .. name .. ": " .. msg) }) })
    end
    return quarto.utils.string_to_blocks(out)   -- like pandoc.read, and callouts and content-visible work too
  end
end

local shortcodes = {}
for _, name in ipairs({ "vocab-cards", "word-bank", "vocab-table", "vocab-list", "fill-in-the-blank", "overview", "season-events" }) do
  shortcodes[name] = block(name)
end
return shortcodes
