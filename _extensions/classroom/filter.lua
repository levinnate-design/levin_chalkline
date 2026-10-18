--[[
Classroom filter. Lets content stay plain: authors write semantic markers and
this file turns them into the right thing for each output format.

Slides (reveal.js):
  - adds the corner clock to every deck (turn off with `clock: false`)
  - loads the poll code when a slide has  ::: {.poll ...}  or  ::: {.poll-summary}

PDF (Typst): a div with one of these classes becomes a call to a layout
function in brand/typst/typst-template.typ, with the div's attributes passed
as named arguments:
  ::: {.keep}                          keep everything inside on one page
  ::: {.write-in}                      taller table rows for handwriting
  ::: {.value word="Respect" zh="尊重" pinyin="zūnzhòng"}   poster value row
  ::: {.big-quote zh="..."}            poster quote
  ::: {.steps title="..."}             numbered list drawn as a row of cards

Web pages: the same classes are styled in brand/styles.scss; for .value this
file also adds the heading (big first letter, Chinese, pinyin).
]]

local TYPST_FUNCTIONS = {
  ["keep"] = "keep",
  ["write-in"] = "write-in",
  ["value"] = "poster-value",
  ["big-quote"] = "poster-quote",
  ["steps"] = "poster-steps",
}

local included = {}
local function include_once(file)
  if included[file] then return end
  included[file] = true
  quarto.doc.include_file("after-body", quarto.utils.resolve_path(file))
end

local function typst_string(s)
  return '"' .. s:gsub("\\", "\\\\"):gsub('"', '\\"') .. '"'
end

local function html_escape(s)
  return (s:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"))
end

local function to_typst(el, fn)
  local args = {}
  for k, v in pairs(el.attributes) do
    table.insert(args, k .. ": " .. typst_string(v))
  end
  table.sort(args)
  local blocks = pandoc.List({ pandoc.RawBlock("typst", "#" .. fn .. "(" .. table.concat(args, ", ") .. ")[") })
  blocks:extend(el.content)
  blocks:insert(pandoc.RawBlock("typst", "]"))
  return blocks
end

local function value_heading_html(el)
  local word = el.attributes["word"] or ""
  local first, rest = word:sub(1, 1), word:sub(2)
  local zh = el.attributes["zh"] or ""
  local pinyin = el.attributes["pinyin"] or ""
  return pandoc.RawBlock("html",
    '<div class="value-head"><span class="value-word"><span class="value-letter">' .. html_escape(first) ..
    '</span>' .. html_escape(rest) .. '</span> <span class="value-zh">' .. html_escape(zh) ..
    '</span> <span class="value-pinyin">' .. html_escape(pinyin) .. '</span></div>')
end

local function Div(el)
  if quarto.doc.is_format("typst") then
    for cls, fn in pairs(TYPST_FUNCTIONS) do
      if el.classes:includes(cls) then return to_typst(el, fn) end
    end
    return nil
  end
  if quarto.doc.is_format("html") then
    if el.classes:includes("poll") or el.classes:includes("poll-summary") then
      if quarto.doc.is_format("revealjs") then include_once("poll.html") end
    end
    if el.classes:includes("value") then
      el.content:insert(1, value_heading_html(el))
      return el
    end
  end
  return nil
end

local function Meta(meta)
  local clock = meta.clock
  local off = clock ~= nil and pandoc.utils.stringify(clock) == "false"
  if quarto.doc.is_format("revealjs") then
    if not off then include_once("clock.html") end
    include_once("countdown.html")
  end
  -- Web pages: links to slideshows open in a new tab (slides-new-tab: false turns it off).
  local nt = meta["slides-new-tab"]
  local nt_off = nt ~= nil and pandoc.utils.stringify(nt) == "false"
  if quarto.doc.is_format("html") and not quarto.doc.is_format("revealjs") and not nt_off then
    include_once("new-tab.html")
  end
  return nil
end

return {
  { Meta = Meta },
  { Div = Div },
}
