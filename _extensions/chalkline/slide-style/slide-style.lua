--[[
TO BE REMOVED: the first slide-style experiment. Replaced by bilingual/bilingual.lua ([English | 中文]{.bi}
anywhere) and the slide kit (styles/layout.scss). Only course/units/00-start-here/slide-style-slides.qmd uses it.

Slide style: slides whose look can be changed without touching their words.

A slide opts in with  {.styled kind="..."}  on its heading. Everything else is optional:

  ## [Schools of thought | 诸子百家]{.bi} {#schools .styled kind="cards" type="row" look="game" scheme="brand" items="5"}

  kind     cards | narrative | bigidea                  the layout (required)
  type     row | grid | table                           cards only: how the cards are laid out
  look     plain | game | brutal                        borders, shadows and corners
  scheme   brand | ink | mono | dusk | warm | <name>    colours (<name>: a scheme in the course's own CSS, see below)
  primary  en | zh                                      which language is large
  show     both | en | zh                               which languages are shown
  img      none | thumb | banner | frame | duotone | bg  cards only: how pictures are drawn
  flow     interleave | side                            narrative only: English and 中文 under each other, or in two columns
  pic      none | side | top                            narrative only: where the picture goes
  items    1 to 9                                       cards only: show the first n cards (the rest wait for the style panel)

A deck can set its own defaults in its labels, and name the schemes its own CSS file adds:

  slide-style:
    look: game
    schemes: [bamboo, scroll]       # these show up in the style panel (Style… in a styled slide's corner)

Words in two languages are written once:  [English | 中文]{.bi}. One language only ([中文]{.bi}
or [English]{.bi}) is fine: that text is shown on its own and the slide has no language switch.

The pieces inside a slide (all optional, in any order):
  ::: schools   holds the  ::: card  divs (each: .name .who .idea .text spans, and a picture), then a  ::: think  strip
  ::: narbody   holds a picture (![caption](file){.pic credit="..."}) and  ::: narr  with one [English | 中文]{.bi} per paragraph
  .kicker .stmt .src   spans on a big idea slide
A  ::: {.card .spot}  card is the highlighted one.

What this file does: finds each styled slide, turns [A | B]{.bi} into the two spans, puts ss- in front
of the class names (a vocab card is already .card in a deck), turns the settings into data-ss-*
attributes on the slide, counts the cards so the layout can adapt (slide-style-count.css, written
by gen-count-css.py), and loads the CSS and JavaScript. The look is all in slide-style.css.
]]

local DEFAULTS = { type = "row", look = "plain", scheme = "brand", primary = "en", show = "both", img = "none", flow = "interleave", pic = "side" }
local ALLOWED = {
  type    = { row = true, grid = true, table = true },
  look    = { plain = true, game = true, brutal = true },
  primary = { en = true, zh = true },
  show    = { both = true, en = true, zh = true },
  img     = { none = true, thumb = true, banner = true, frame = true, duotone = true, bg = true },
  flow    = { interleave = true, side = true },
  pic     = { none = true, side = true, top = true },
}
local KINDS = { cards = true, narrative = true, bigidea = true }
local BUILT_IN_SCHEMES = { "brand", "ink", "mono", "dusk", "warm" }
-- classes written in a slide's markup that get an ss- prefix
local PREFIXED = {}
for name in ("schools card think narbody narr pic spot off name who idea text tag q kicker stmt src bi"):gmatch("%a+") do PREFIXED[name] = true end

local defaults = {}
for k, v in pairs(DEFAULTS) do defaults[k] = v end
local extra_schemes = {}
local MAX_CARDS = 9

local function warn(msg) io.stderr:write("slide-style: " .. msg .. "\n") end

local function read_meta(meta)
  local m = meta["slide-style"]
  if not m or pandoc.utils.type(m) ~= "table" then return end
  for k, _ in pairs(DEFAULTS) do
    if m[k] then defaults[k] = pandoc.utils.stringify(m[k]) end
  end
  if m["schemes"] then
    for _, s in ipairs(m["schemes"]) do
      extra_schemes[#extra_schemes + 1] = pandoc.utils.stringify(s)
    end
  end
end

local function valid_scheme(v)
  -- a scheme from the course's own CSS can have any plain name
  return v:match("^[%a][%w_-]*$") ~= nil
end

-- ---------- [English | 中文]{.bi} ----------

local function is_blank(inl) return inl.t == "Space" or inl.t == "SoftBreak" or inl.t == "LineBreak" end
local function trim(list)
  while #list > 0 and is_blank(list[1]) do table.remove(list, 1) end
  while #list > 0 and is_blank(list[#list]) do table.remove(list) end
  return list
end

local function script_of(text)
  local cjk, latin = 0, 0
  for _, cp in utf8.codes(text) do
    if (cp >= 0x4E00 and cp <= 0x9FFF) or (cp >= 0x3400 and cp <= 0x4DBF) then cjk = cjk + 1
    elseif (cp >= 65 and cp <= 90) or (cp >= 97 and cp <= 122) then latin = latin + 1 end
  end
  return (cjk > 0 and cjk >= 0.3 * (cjk + latin)) and "zh" or "en"
end

-- other classes on the span (.name, .who ...) get the ss- prefix too
local function prefix_classes(el)
  local out = {}
  for _, c in ipairs(el.classes) do out[#out + 1] = PREFIXED[c] and ("ss-" .. c) or c end
  el.classes = pandoc.List(out)
end

local function bilingual(el)
  if not el.classes:includes("bi") then return nil end
  local left, right, found = {}, {}, false
  for _, inl in ipairs(el.content) do
    if found then
      right[#right + 1] = inl
    elseif inl.t == "Str" and inl.text:find("|", 1, true) then
      local a, b = inl.text:match("^(.-)|(.*)$")
      if a ~= "" then left[#left + 1] = pandoc.Str(a) end
      if b ~= "" then right[#right + 1] = pandoc.Str(b) end
      found = true
    else
      left[#left + 1] = inl
    end
  end
  if not found then
    -- one language only: keep the text as it is and say which it is
    local lang = el.attributes["lang"]
    if lang ~= "zh" and lang ~= "en" then lang = script_of(pandoc.utils.stringify(el.content)) end
    el.classes:insert("mono")
    el.attributes["lang"] = lang
    prefix_classes(el)
    return el
  end
  el.content = {
    pandoc.Span(trim(left), pandoc.Attr("", { "ss-en" }, { lang = "en" })),
    pandoc.Span(trim(right), pandoc.Attr("", { "ss-zh" }, { lang = "zh" })),
  }
  prefix_classes(el)
  return el
end

-- ---------- pictures: ![Caption](images/file.jpg){.pic credit="Author, licence"} ----------

local function add_resource(path)
  if path and path ~= "" and not path:match("^%a+://") and quarto and quarto.doc and quarto.doc.input_file then
    quarto.doc.add_resource(pandoc.path.join({ pandoc.path.directory(quarto.doc.input_file), path }))
  end
end

local function picture(img)
  local cap = pandoc.utils.stringify(img.caption)
  local credit = img.attributes["credit"] or ""
  add_resource(img.src)
  local plain = pandoc.Image(cap ~= "" and { pandoc.Str(cap) } or {}, img.src)
  return pandoc.Div({
    pandoc.Plain({ plain }),
    pandoc.Div({ pandoc.Plain({
      pandoc.Span({ pandoc.Str(cap) }, pandoc.Attr("", { "ss-cap" })),
      pandoc.Span({ pandoc.Str(credit) }, pandoc.Attr("", { "ss-credit" })),
    }) }, pandoc.Attr("", { "ss-figcap" })),
  }, pandoc.Attr("", { "ss-pic" }))
end

local function first_pic_image(block)
  local found
  block:walk({ Image = function(i) if not found and i.classes:includes("pic") then found = i end end })
  return found
end

local function Figure(el)
  local img = first_pic_image(el)
  if img then return picture(img) end
end

local function sole_image(el)   -- a paragraph with only a picture in it
  if #el.content == 1 and el.content[1].t == "Image" and el.content[1].classes:includes("pic") then
    return picture(el.content[1])
  end
end

-- ---------- one styled slide ----------

local function count_langs(blocks)
  local both, zh, en = 0, 0, 0
  pandoc.Pandoc(blocks):walk({ Span = function(s)
    if s.classes:includes("ss-bi") then
      if s.classes:includes("ss-mono") then
        if s.attributes["lang"] == "zh" then zh = zh + 1 else en = en + 1 end
      else both = both + 1 end
    end
  end })
  local langs = "both"
  if both == 0 and zh > 0 and en == 0 then langs = "zh"
  elseif both == 0 and en > 0 and zh == 0 then langs = "en"
  elseif both > 0 and (zh + en) > 0 then
    warn("a bilingual slide has text in one language only (write it as [English | 中文]{.bi})")
  end
  return langs
end

local function rename_divs(blocks, items)
  local cards = 0
  local doc = pandoc.Pandoc(blocks):walk({
    Div = function(d)
      local was_card = d.classes:includes("card")
      prefix_classes(d)
      if was_card then
        cards = cards + 1
        if items and cards > items then d.classes:insert("ss-off") end
      end
      -- paragraphs of a narrative get a row number, so two columns line up
      if d.classes:includes("ss-narr") then
        local k = 0
        d = d:walk({ Span = function(s)
          if s.classes:includes("ss-bi") then
            k = k + 1
            s.attributes["style"] = "--r:" .. k
            return s
          end
        end })
      end
      return d
    end,
  })
  return doc.blocks, cards
end

local function style_slide(header, blocks)
  local kind = header.attributes["kind"]
  if not KINDS[kind or ""] then
    warn("slide '" .. pandoc.utils.stringify(header.content):sub(1, 40) .. "': kind must be cards, narrative or bigidea")
    return header, blocks
  end
  -- words: bilingual spans, pictures
  -- a Figure first (it holds a Plain with the picture, which the second pass would take apart)
  local doc = pandoc.Pandoc(blocks):walk({ Figure = Figure })
  doc = pandoc.Pandoc(doc.blocks):walk({ Span = bilingual, Para = sole_image, Plain = sole_image })
  blocks = doc.blocks
  header.content = pandoc.Pandoc({ pandoc.Plain(header.content) }):walk({ Span = bilingual }).blocks[1].content

  local items = tonumber(header.attributes["items"])
  local cards
  blocks, cards = rename_divs(blocks, items)
  local shown = items and math.min(items, cards) or cards
  if cards > MAX_CARDS then warn(cards .. " cards; layouts are tuned for 1 to " .. MAX_CARDS .. ". Split the slide.") end

  local langs = count_langs(blocks)
  local a = header.attributes
  for k, d in pairs(DEFAULTS) do
    local v = a[k] or defaults[k] or d
    if k ~= "scheme" and not ALLOWED[k][v] then warn("bad " .. k .. "='" .. v .. "', using '" .. d .. "'"); v = d end
    if k == "scheme" and not valid_scheme(v) then warn("bad scheme '" .. v .. "', using 'brand'"); v = "brand" end
    a["data-ss-" .. k] = v
    a[k] = nil
  end
  if langs ~= "both" then   -- one language only: nothing to switch, so pin the settings to it
    a["data-ss-show"] = langs
    a["data-ss-primary"] = langs
  end
  a["data-ss-langs"] = langs
  a["data-ss-count"] = tostring(math.max(1, math.min(shown, MAX_CARDS)))
  a["data-ss-cards"] = tostring(cards)
  a["items"] = nil
  a["kind"] = nil
  header.classes = header.classes:filter(function(c) return c ~= "styled" end)
  header.classes:insert("ss")
  header.classes:insert("ss-" .. kind)
  return header, blocks
end

-- ---------- the document: find the styled slides ----------

local function ends_slide(b)
  return (b.t == "Header" and b.level <= 2) or b.t == "HorizontalRule"
end

local function Pandoc(doc)
  if not quarto.doc.is_format("revealjs") then return nil end
  read_meta(doc.meta)
  local out, any = pandoc.List(), false
  local i, n = 1, #doc.blocks
  while i <= n do
    local b = doc.blocks[i]
    if b.t == "Header" and b.level == 2 and b.classes:includes("styled") then
      local body = pandoc.List()
      local j = i + 1
      while j <= n and not ends_slide(doc.blocks[j]) do body:insert(doc.blocks[j]); j = j + 1 end
      local header, blocks = style_slide(b, body)
      out:insert(header)
      out:extend(blocks)
      any = true
      i = j
    else
      out:insert(b)
      i = i + 1
    end
  end
  if not any then return nil end
  doc.blocks = out

  quarto.doc.add_html_dependency({
    name = "slide-style",
    version = "1.0.0",
    stylesheets = { "slide-style.css", "slide-style-count.css" },
    scripts = { { path = "slide-style.js", afterBody = true } },
  })
  local config = { schemes = BUILT_IN_SCHEMES, own = extra_schemes }
  quarto.doc.include_text("after-body",
    '<script type="application/json" id="slide-style-config">' .. quarto.json.encode(config):gsub("</", "<\\/") .. "</script>")
  return doc
end

return { { Pandoc = Pandoc } }
