--[[
Bilingual text, written once:  [English | 中文]{.bi}

Works anywhere: slide titles, bullets, table cells, boxes, pages and PDFs. Which side is which language
is found from the text, so [中文 | English]{.bi} works too.

  ## [The Hundred Schools | 百家争鸣]{.bi}        alone in its line: the two languages stack, one under the other
  The [Legalists | 法家]{.bi} wanted strict laws.  inside a sentence: side by side, on one line
  [儒家]{.bi}                                      one language only: shown as it is (and marked as 中文)

  {.bi .inline} keeps a span on one line, {.bi .stack} stacks it, wherever it is.
  In HTML the span's class is .bil (with .bil-en and .bil-zh inside): .bi is taken by Bootstrap's icons.

The primary language is shown large, the other smaller and lighter. A deck or page sets it in its labels:

  bilingual:
    primary: en        # en | zh   which language is large
    show: both         # both | en | zh

On slides, a switch in the top-right corner (bilingual.js) changes both live, for every deck in this
browser. The look is in bilingual.css: it only sets the second language's size and colour, so the text
keeps its place's own size, font and colour (a title stays a title, a card's name stays a card's name).
A theme can change that with the --bi-* variables. In PDFs (Typst) the settings are fixed when the file is made.
]]

local primary, show = "en", "both"
local found = false

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

-- splits the span's words at the first |
local function split(content)
  local left, right, bar = {}, {}, false
  for _, inl in ipairs(content) do
    if bar then
      right[#right + 1] = inl
    elseif inl.t == "Str" and inl.text:find("|", 1, true) then
      local a, b = inl.text:match("^(.-)|(.*)$")
      if a ~= "" then left[#left + 1] = pandoc.Str(a) end
      if b ~= "" then right[#right + 1] = pandoc.Str(b) end
      bar = true
    else
      left[#left + 1] = inl
    end
  end
  if not bar then return nil end
  return pandoc.Inlines(trim(left)), pandoc.Inlines(trim(right))
end

-- ---------- web pages and slides ----------

local function html_span(el, en, zh)
  el.content = {
    pandoc.Span(en, pandoc.Attr("", { "bil-en" }, { lang = "en" })),
    pandoc.Span(zh, pandoc.Attr("", { "bil-zh" }, { lang = "zh" })),
  }
  return el
end

-- ---------- PDFs (Typst): primary first, the other smaller and grey, or one of them only ----------

local function typst_text(lang, inlines, second)
  local args = 'lang: "' .. lang .. '"' .. (second and ', size: 0.8em, fill: rgb("#52606D")' or "")
  local out = pandoc.Inlines({ pandoc.RawInline("typst", "#text(" .. args .. ")[") })
  out:extend(inlines)
  out:insert(pandoc.RawInline("typst", "]"))
  return out
end

local function plain_parts(el, en, zh, stack)
  local langs = { en = en, zh = zh }
  if show ~= "both" then return langs[show] end
  local second = primary == "zh" and "en" or "zh"
  local typst = quarto.doc.is_format("typst")
  local first_part = typst and typst_text(primary, langs[primary], false) or langs[primary]
  local out = pandoc.Inlines(first_part)
  if stack and typst then out:insert(pandoc.RawInline("typst", "#linebreak()"))
  else out:insert(stack and pandoc.LineBreak() or pandoc.Space()) end
  if typst then
    out:extend(typst_text(second, langs[second], true))
  else
    out:insert(pandoc.Str("("))
    out:extend(langs[second])
    out:insert(pandoc.Str(")"))
  end
  return out
end

-- ---------- the filter ----------

local function Meta(meta)
  local m = meta["bilingual"]
  if m and pandoc.utils.type(m) == "table" then
    local p = m["primary"] and pandoc.utils.stringify(m["primary"])
    local s = m["show"] and pandoc.utils.stringify(m["show"])
    if p == "en" or p == "zh" then primary = p end
    if s == "both" or s == "en" or s == "zh" then show = s end
  end
end

local function web() return quarto.doc.is_format("html:js") end

-- one span: in HTML two marked spans (the rest is CSS), elsewhere the words in order
local function bilingual(el, alone)
  if not el.classes:includes("bi") then return nil end
  -- in HTML the class becomes .bil: Bootstrap's icons (on every web page) already use .bi and bi-*
  el.classes = el.classes:filter(function(c) return c ~= "bi" end)
  el.classes:insert(1, "bil")
  local stack = el.classes:includes("stack") or (alone and not el.classes:includes("inline"))
  local en, zh = split(el.content)
  if not en then   -- one language only
    local lang = el.attributes["lang"] or script_of(pandoc.utils.stringify(el.content))
    if web() then
      el.attributes["lang"] = lang
      el.classes:insert("bil-mono")
      return el
    end
    return quarto.doc.is_format("typst") and typst_text(lang, el.content, false) or el.content
  end
  if script_of(pandoc.utils.stringify(en)) == "zh" and script_of(pandoc.utils.stringify(zh)) == "en" then
    en, zh = zh, en
  end
  found = true
  if web() then
    if stack then el.classes:insert("bil-stack") end
    return html_span(el, en, zh)
  end
  return plain_parts(el, en, zh, stack)
end

-- a span alone in its line (a title, a bullet, a table cell) stacks; one inside a sentence stays on its line
local function block(el)
  local content = trim(pandoc.List(el.content))
  -- **[A | B]{.bi}** and [[A | B]{.bi}]{.fragment} are alone too
  local function wrapper(i)
    return i.t == "Strong" or i.t == "Emph" or i.t == "Underline" or (i.t == "Span" and not i.classes:includes("bi"))
  end
  while #content == 1 and wrapper(content[1]) do
    content = trim(pandoc.List(content[1].content))
  end
  local alone = #content == 1 and content[1].t == "Span" and content[1].classes:includes("bi")
  local changed = false
  el.content = pandoc.Inlines(el.content):walk({ Span = function(s)
    local r = bilingual(s, alone)
    if r then changed = true end
    return r
  end })
  if changed then return el end
end

local function Pandoc(doc)
  if not found or not web() then return nil end
  quarto.doc.add_html_dependency({
    name = "chalkline-bilingual",
    version = "1.0.0",
    stylesheets = { "bilingual.css" },
    scripts = { { path = "bilingual.js", afterBody = true } },
  })
  quarto.doc.include_text("after-body", '<script type="application/json" id="chalkline-bilingual">'
    .. quarto.json.encode({ primary = primary, show = show, slides = quarto.doc.is_format("revealjs") })
    .. "</script>")
end

return {
  { Meta = Meta },
  { Header = block, Para = block, Plain = block },
  -- spans the blocks above don't reach (inside a figure caption, a link, ...)
  { Span = function(s) return bilingual(s, false) end },
  { Pandoc = Pandoc },
}
