--[[
Classroom shortcodes. Content files use these plain markers; this file decides
what each one becomes in each output format (slides, web page, PDF, Word).

  {{< lines 3 >}}                        ruled writing lines (gap="0.4in" optional)
  {{< drawing-box label="Side view" >}}  dot-grid drawing area (height="3in" optional;
                                         default fills the rest of the PDF page)
  {{< blank 1.5in >}}                    a fill-in line inside a sentence or heading
  {{< lesson-nav >}}                     on a lesson page: its strand, time, "before this" and "next up"
                                         links (from generated/lessons.json, made by scripts/lessons.py)
  {{< timer 20 >}}                       countdown timer for slides (minutes)
  {{< objectives >}}                     the page's `objectives:` list, as bullets
  {{< pdf "scoring-sheet.pdf" >}}        an outside PDF, next to this file ("/course/..." = from the
                                         project root). In the PDF output its pages
                                         go in as full pages (pages="2-3" picks some); on the web, a
                                         download link and a viewer. Page counts come from
                                         generated/pdf-pages.json (scripts/catalog.py).
  {{< packet >}}                         on a unit page: a download link for the unit packet (all its
                                         printables in one PDF, made by scripts/packets.py). The teacher
                                         site shows two: the teacher edition and the student copy.
                                         Nothing if the unit has no printables.
  {{< vocab "chain wrap" >}}             a VEX term; hovering shows its vocab card (picture, 中文,
                                         definition, link). Name a term, an "also called" name or an
                                         ID (ENG-078). text="chain wraps" changes the words shown;
                                         zh=true also prints the 中文 after the word in PDF/Word
                                         (for reference sheets; leave it off on quizzes).
                                         Terms come from vocab/data/vocab.csv
                                         (via scripts/vocab_terms.py). PDF/Word: the word in bold.

Quarto's built-in {{< pagebreak >}} also works everywhere.
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

local function typst_string(s)
  return '"' .. s:gsub("\\", "\\\\"):gsub('"', '\\"') .. '"'
end

local included = {}
local function include_once(file)
  if included[file] then return end
  included[file] = true
  quarto.doc.include_file("after-body", quarto.utils.resolve_path(file))
end

-- VEX vocab terms, loaded once from generated/vocab-terms.json and looked up by ID, term or "also called" name.
local vex_vocab
local function vocab_lookup(key)
  if not vex_vocab then
    vex_vocab = {}
    local path = (quarto.project.directory or ".") .. "/generated/vocab-terms.json"
    local f = io.open(path, "r")
    if not f then
      quarto.log.warning("vocab shortcode: can't read " .. path .. " (run scripts/vocab_terms.py)")
      return nil
    end
    local data = quarto.json.decode(f:read("a"))
    f:close()
    for _, t in ipairs(data.terms) do
      for _, k in ipairs({ t.id, t.term, table.unpack(t.aka or {}) }) do
        local lk = k:lower()
        if vex_vocab[lk] == nil then vex_vocab[lk] = t end
      end
    end
  end
  return vex_vocab[key:lower()]
end

-- Outside PDFs: page counts from generated/pdf-pages.json, and paths from the project root.
local pdf_page_counts
local function pdf_pages(rel)
  if not pdf_page_counts then
    pdf_page_counts = {}
    local f = io.open((quarto.project.directory or ".") .. "/generated/pdf-pages.json", "r")
    if f then pdf_page_counts = quarto.json.decode(f:read("a")); f:close() end
  end
  return pdf_page_counts[rel]
end

-- "course/units/05-game-day/sheet.pdf" for "sheet.pdf" written in course/units/05-game-day/x.qmd
local function from_project_root(file)
  if file:sub(1, 1) == "/" then return file:sub(2) end   -- already from the project root
  local root = (quarto.project.directory or ""):gsub("\\", "/")
  local doc = (quarto.doc.input_file or ""):gsub("\\", "/")
  local dir = doc:sub(#root + 2):match("^(.*)/") or ""
  local path = (dir ~= "" and (dir .. "/") or "") .. file
  path = path:gsub("/%./", "/")
  while path:find("[^/]+/%.%./") do path = path:gsub("[^/]+/%.%./", "", 1) end
  return path
end

-- "2-3" or "1,4" -> {2, 3} / {1, 4}; nil -> every page
local function page_list(spec, count)
  local pages = {}
  if not spec then
    for i = 1, count do pages[#pages + 1] = i end
    return pages
  end
  for part in spec:gmatch("[^,]+") do
    local a, b = part:match("^%s*(%d+)%s*%-%s*(%d+)%s*$")
    if a then
      for i = tonumber(a), tonumber(b) do pages[#pages + 1] = i end
    elseif part:match("^%s*%d+%s*$") then
      pages[#pages + 1] = tonumber(part)
    end
  end
  return pages
end

-- Unit packets, loaded once from generated/packets.json (written by scripts/catalog.py).
local function packet_for_this_page()
  local f = io.open((quarto.project.directory or ".") .. "/generated/packets.json", "r")
  if not f then return nil end
  local packets = quarto.json.decode(f:read("a"))
  f:close()
  local input = quarto.doc.input_file or ""
  local unit = input:match("units[/\\]([^/\\]+)[/\\]index%.qmd$")
            or input:match("summatives[/\\]([^/\\]+)[/\\]index%.qmd$")
  return unit and packets[unit]
end

-- Lesson links, loaded once from generated/lessons.json and looked up by source path.
local lesson_nav_data
local function lesson_info()
  if not lesson_nav_data then
    lesson_nav_data = {}
    local path = (quarto.project.directory or ".") .. "/generated/lessons.json"
    local f = io.open(path, "r")
    if not f then
      quarto.log.warning("lesson-nav shortcode: can't read " .. path .. " (run scripts/lessons.py)")
      return nil
    end
    lesson_nav_data = quarto.json.decode(f:read("a"))
    f:close()
  end
  local input = quarto.doc.input_file
  local dir = quarto.project.directory
  if dir and input:sub(1, #dir) == dir then input = input:sub(#dir + 2) end
  return lesson_nav_data[input]
end

local function lesson_links(list)
  local out = pandoc.Inlines({})
  for i, item in ipairs(list) do
    if i > 1 then out:insert(pandoc.Str(" · ")) end
    out:insert(pandoc.Link(item.title, "/" .. item.path))
  end
  return out
end

return {
  ["lesson-nav"] = function()
    local info = lesson_info()
    if not info then return pandoc.Null() end
    local rows = pandoc.Blocks({})
    local head = pandoc.Inlines({ pandoc.Link(info.strand, "/" .. info.strand_path) })
    if info.minutes then head:insert(pandoc.Str(" · " .. info.minutes .. " min")) end
    rows:insert(pandoc.Para(head))
    if #info.before > 0 then
      local p = pandoc.Inlines({ pandoc.Strong("Before this: ") })
      p:extend(lesson_links(info.before))
      rows:insert(pandoc.Para(p))
    end
    if #info.next > 0 then
      local p = pandoc.Inlines({ pandoc.Strong("Next up: ") })
      p:extend(lesson_links(info.next))
      rows:insert(pandoc.Para(p))
    end
    return pandoc.Div(rows, pandoc.Attr("", { "lesson-nav" }))
  end,

  ["vocab"] = function(args, kwargs, meta)
    local key = str(args[1], "")
    local t = vocab_lookup(key)
    local shown = str(kwargs["text"], t and t.term or key)
    if not t then
      quarto.log.warning('vocab shortcode: "' .. key .. '" is not in vocab/data/vocab.csv')
      return pandoc.Str(shown)
    end
    if not quarto.doc.is_format("html") then
      if str(kwargs["zh"], "false") == "true" and t.zh ~= "" then
        return pandoc.Span({ pandoc.Strong({ pandoc.Str(shown) }), pandoc.Space(), pandoc.Str(t.zh) })
      end
      return pandoc.Strong({ pandoc.Str(shown) })
    end
    include_once("vocab-card.html")
    -- Picture and link paths are from the site root; add the "../" this page needs.
    local up = quarto.project.offset and (quarto.project.offset .. "/") or ""
    local img = t.image ~= "" and ('<img src="' .. html_escape(up .. t.image) .. '" alt="" loading="lazy">') or ""
    -- 🔊 buttons read the word aloud (English, then 中文) with the computer's voices (vocab-card.html).
    local function say(text, lang, label)
      return '<button type="button" class="vc-say" data-lang="' .. lang .. '" data-say="' .. html_escape(text) ..
             '" aria-label="' .. label .. '" title="' .. label .. '">🔊</button>'
    end
    local zh = t.zh ~= "" and (' <span class="vc-zh">' .. html_escape(t.zh) .. say(t.zh, "zh-CN", "Say it in Chinese") .. '</span>') or ""
    return pandoc.RawInline("html",
      '<span class="vocab-term" tabindex="0">' .. html_escape(shown) ..
      '<span class="vocab-card" role="tooltip">' .. img ..
      '<span class="vc-term">' .. html_escape(t.term) .. say(t.term, "en-US", "Say it in English") .. zh .. '</span>' ..
      '<span class="vc-def">' .. html_escape(t.definition) .. '</span>' ..
      '<a class="vc-link" href="' .. html_escape(up .. t.url) .. '" target="_blank" rel="noopener">' .. html_escape(str(meta and meta["vocab-title"], "Vocab")) .. ' ↗</a>' ..
      '</span></span>')
  end,

  ["pdf"] = function(args, kwargs)
    local file = str(args[1], nil)
    if not file then return pandoc.Null() end
    local rel = from_project_root(file)
    local count = pdf_pages(rel)
    if not count then
      quarto.log.warning('pdf shortcode: no page count for ' .. rel .. ' (is the file there? scripts/catalog.py counts pages before each render)')
      count = 1
    end
    local pages = page_list(str(kwargs["pages"], nil), count)
    local title = str(kwargs["title"], file:match("[^/]+$"))
    if quarto.doc.is_format("typst") then
      local out = {}
      for _, n in ipairs(pages) do
        out[#out + 1] = '#page(margin: 0pt, header: none, footer: none)[#image("/' .. rel ..
          '", page: ' .. n .. ', width: 100%, height: 100%, fit: "contain")]'
      end
      return pandoc.RawBlock("typst", table.concat(out, "\n"))
    end
    local label = "📄 " .. title .. " (PDF, " .. #pages .. " page" .. (#pages == 1 and "" or "s") .. ")"
    local link = pandoc.Para({ pandoc.Link({ pandoc.Str(label) }, file) })   -- a real link, so Quarto copies the file
    if quarto.doc.is_format("html") then
      return pandoc.Blocks({ link, pandoc.RawBlock("html",
        '<iframe class="pdf-embed" src="' .. html_escape(file) .. '" title="' .. html_escape(title) ..
        '" style="width:100%;height:70vh;border:1px solid #c6d0da;border-radius:8px"></iframe>') })
    end
    return link
  end,

  ["packet"] = function()
    local teacher = false
    for _, profile in ipairs(quarto.project.profile or {}) do
      if profile == "parent" then return pandoc.Null() end   -- the family site has no packets
      if profile == "teacher" then teacher = true end
    end
    local p = packet_for_this_page()
    if not p or not quarto.doc.is_format("html") then return pandoc.Null() end
    local name = p.pdf:match("[^/]+$")
    local n = #p.files + #(p.extras or {})
    local count = n .. " printable" .. (n == 1 and "" or "s")
    local function button(label, file, classes)
      return pandoc.Link({ pandoc.Str(label) }, file, "", pandoc.Attr("", classes))
    end
    if teacher then   -- both editions (scripts/packets.py writes unit-teacher-packet.pdf next to it)
      local teacher_file = name:gsub("%-packet%.pdf$", "-teacher-packet.pdf")
      local function card(cls, label, note, file)
        return pandoc.Div({ pandoc.Para({ button(label, file, { "btn" }) }),
                            pandoc.Para({ pandoc.Str(note) }) }, pandoc.Attr("", { "packet-card", cls }))
      end
      return pandoc.Div({
        card("packet-teacher", "🔑 Teacher edition (PDF)", "With answer keys and teacher notes. For you, not for students.", teacher_file),
        card("packet-student", "🎒 Student copy (PDF)", "No answer keys. Print this one for class. All " .. count .. ".", name),
      }, pandoc.Attr("", { "packet-cards" }))
    end
    return pandoc.Para({ button("📄 Unit packet (PDF)", name, { "btn", "btn-primary" }),
                         pandoc.Span({ pandoc.Str(" · all " .. count .. " in one file, ready to print") },
                                     pandoc.Attr("", { "text-muted" })) })
  end,

  ["lines"] = function(args, kwargs)
    local n = tonumber(str(args[1], "3")) or 3
    local gap = str(kwargs["gap"], nil)
    if quarto.doc.is_format("typst") then
      local extra = gap and (", gap: " .. gap) or ""
      return pandoc.RawBlock("typst", "#answer-lines(" .. n .. extra .. ")")
    elseif quarto.doc.is_format("html") then
      return pandoc.RawBlock("html", '<div class="answer-lines" style="--lines: ' .. n .. '"></div>')
    else
      local blocks = {}
      for _ = 1, n do
        table.insert(blocks, pandoc.Para({ pandoc.Str(string.rep("_", 70)) }))
      end
      return blocks
    end
  end,

  ["blank"] = function(args)
    local width = str(args[1], "1.5in")
    if quarto.doc.is_format("typst") then
      return pandoc.RawInline("typst", "#blank(" .. width .. ")")
    elseif quarto.doc.is_format("html") then
      return pandoc.RawInline("html", '<span class="blank" style="width: ' .. html_escape(width) .. '"></span>')
    end
    return pandoc.Str(string.rep("_", 12))
  end,

  ["drawing-box"] = function(args, kwargs)
    local label = str(kwargs["label"], nil)
    local height = str(kwargs["height"], nil)
    if quarto.doc.is_format("typst") then
      local a = { "height: " .. (height or "1fr") }
      if label then table.insert(a, "label: " .. typst_string(label)) end
      return pandoc.RawBlock("typst", "#drawing-box(" .. table.concat(a, ", ") .. ")")
    elseif quarto.doc.is_format("html") then
      local style = height and (' style="height: ' .. html_escape(height) .. '"') or ""
      local lab = label and ('<span class="drawing-box-label">' .. html_escape(label) .. '</span>') or ""
      return pandoc.RawBlock("html", '<div class="drawing-box"' .. style .. '>' .. lab .. '</div>')
    else
      return pandoc.Para({ pandoc.Emph({ pandoc.Str("[" .. (label or "Drawing space") .. "]") }) })
    end
  end,

  ["objectives"] = function(args, kwargs, meta)
    local list = meta["objectives"]
    if list == nil then return pandoc.Null() end
    local items = {}
    for _, o in ipairs(list) do
      table.insert(items, { pandoc.Plain(pandoc.Inlines(pandoc.utils.stringify(o))) })
    end
    return pandoc.BulletList(items)
  end,

  ["timer"] = function(args)
    local minutes = tonumber(str(args[1], "5")) or 5
    if quarto.doc.is_format("revealjs") then
      include_once("countdown.html")
      return pandoc.RawBlock("html", '<div class="countdown" data-minutes="' .. minutes .. '"></div>')
    end
    return pandoc.Para({ pandoc.Strong({ pandoc.Str("Timer: " .. minutes .. " minutes") }) })
  end,
}
