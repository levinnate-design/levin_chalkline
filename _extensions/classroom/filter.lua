--[[
Classroom filter. Lets content stay plain: authors write semantic markers and
this file turns them into the right thing for each output format.

Slides (reveal.js):
  - the clock is a toolbox tool, open in every deck (clock: false leaves it closed in a deck)
  - adds a ↓ button when a slide has another slide below it (turn off with `down-arrow: false`)
  - makes a {{< video >}} without a width or height fill the room left on its slide (video-fit.html)
  - speaker notes (::: notes) and the classroom toolbox are in the TEACHER build only
    (--profile teacher); the student site leaves them out
  - adds the classroom toolbox to every deck (turn off with `classroom-tools: false`):
    scoreboard, voice level, traffic light, noise meter, QR code, stopwatch and dice,
    in panels that float above the slides (see toolbox/toolbox.js). Optional, in _quarto.yml:
      classroom-tools:
        qr-site: "https://example.github.io/my-course/"   # older name for student-site: (below)
    The QR code points at the deck on the student site: student-site: "https://.../" in _quarto.yml
  - loads the poll code when a slide has  ::: {.poll ...}  or  ::: {.poll-summary}
  - turns  ::: {.jeopardy}  and  ::: {.trivia}  into slide games (see below and games/games.js)
  - turns  ::: {.quick-ref}  into a quick reference slide: key slides + everything in the unit (quickref.lua)

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

-- The teacher build (quarto render --profile teacher): the only one with the classroom toolbox and
-- speaker notes. The student site gets neither.
local function is_teacher()
  for _, profile in ipairs(quarto.project.profile or {}) do
    if profile == "teacher" then return true end
  end
  return false
end

-- The course's units, packets and vocab words, for the toolbox's Vocab and Packet tools: read from
-- generated/ (units.json and packets.json from scripts/catalog.py, vocab-terms.json from
-- scripts/vocab_terms.py) and put in the page as JSON. Paths are from the project root; `root` is
-- the way up to it from this deck, and `unit` is this deck's unit folder, if it's in one.
local function course_data()
  local dir = (quarto.project.directory or ".") .. "/generated/"
  local function read(name)
    local f = io.open(dir .. name, "r")
    if not f then return nil end
    local ok, value = pcall(quarto.json.decode, f:read("a"))
    f:close()
    return ok and value or nil
  end
  local here = quarto.doc.input_file and pandoc.path.make_relative(quarto.doc.input_file, quarto.project.directory or "."):gsub("\\", "/") or ""
  local unit_id = here:match("^course/units/([^/]+)/")
               or here:match("^course/summatives/([^/]+)/")
               or here:match("^course/teacher/test%-units/([^/]+)/")
  local data = { root = string.rep("../", select(2, here:gsub("/", ""))), unit = unit_id, teacher = is_teacher(), units = {}, words = {} }
  local packets = read("packets.json") or {}
  for _, u in ipairs(read("units.json") or {}) do
    table.insert(data.units, { id = u.id, number = u.number, title = u.short, packet = packets[u.id] and packets[u.id].pdf or nil })
  end
  for _, w in ipairs((read("vocab-terms.json") or {}).terms or {}) do
    table.insert(data.words, { term = w.term, zh = w.zh, def = w.definition, example = w.example, image = w.image, url = w.url, units = w.units })
  end
  return '<script type="application/json" id="chalkline-course">' .. quarto.json.encode(data):gsub("</", "<\\/") .. '</script>'
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

-- Slide games you write yourself (the vocab versions are shortcodes, in shortcodes.lua):
--   ::: {.jeopardy}                       ::: {.trivia seconds="10" title="Greece review"}
--   - **Places**                          - Which city had the first democracy? | Athens
--     - Land with sea on three sides | peninsula     - ...
--     - ... (each row is worth more)      :::
--   - **People**
--     - ...
--   :::
--   ::: {.sort}                           groups to sort into, like jeopardy: each group in bold,
--   - **Athens**                            its items under it. An item can have a picture, and a
--     - Democracy | Citizens voted          reason after a | (shown when it goes in the wrong group).
--     - ![Parthenon](images/parthenon.jpg)  feedback="end": no feedback until Check.
--                                           layout="venn": a Venn diagram of three groups, in the
--                                           order left, both, right.
--   ::: {.matching}  or  ::: {.memory}     pairs to match: a word, a |, then its partner
--   - democracy | Citizens vote on laws
--   :::
-- A clue or question, a |, then its answer. jeopardy: points="100,200,300,400" sets the values;
-- teams="3" starts with 3 teams taking turns (2 to 4; teams="0" for no teams or scores).
local games = dofile(quarto.utils.resolve_path("games/games.lua"))
local quick_ref = dofile(quarto.utils.resolve_path("quickref.lua"))   -- ::: {.quick-ref}: every link in a unit on one slide

local function list_items(blocks)
  for _, b in ipairs(blocks) do
    if b.t == "BulletList" or b.t == "OrderedList" then return b.content end
  end
  return {}
end

local function clue(item)
  local text = {}
  for _, b in ipairs(item) do
    if b.t == "Plain" or b.t == "Para" then table.insert(text, pandoc.utils.stringify(b)) end
  end
  local q, a = games.split(table.concat(text, " "))
  if a == "" then quarto.log.warning('game: no answer after "|" in: ' .. q) end
  return { q = q, a = a }
end

-- A picture named in a game: copy it to the site too (the path is from this file).
local function picture(path)
  if path and path ~= "" and not path:match("^%a+://") then
    quarto.doc.add_resource(pandoc.path.join({ pandoc.path.directory(quarto.doc.input_file), path }))
  end
end

-- One Sort it item: its words, a picture if it has one (![Camel](images/camel.jpg): the picture's
-- description is its name), and the reason after a | ("Camel | Camels need little water.").
local function sort_item(blocks)
  local image, alt = nil, ""
  local rest = pandoc.List()
  for _, b in ipairs(blocks) do
    rest:insert(b:walk({ Image = function(img)
      if not image then
        image = img.src
        alt = pandoc.utils.stringify(img.caption)
      end
      return {}
    end }))
  end
  local text, why = games.split(pandoc.utils.stringify(rest))
  if text == "" then text = alt end
  picture(image)
  return { text = text, why = why, image = image or "" }
end

-- Timelines (timeline.js). Each event is a ::: {.event} div inside the timeline:
--   ::: {.timeline-interactive #rome title="Rome"}   (.timeline-activity: the students' version;
--                                                    plain .timeline is the simple styled list)
--   ::: {.event date="509 BC" title="Rome becomes a republic" image="images/senate.jpg" slide="the-republic"}
--   The Romans remove their last king. ...         (the first paragraph is the summary; all of it shows
--   :::                                             when you zoom in)
--   :::
-- or, for a quick activity, a list: "- 509 BC | Rome becomes a republic", with an optional picture.
-- slide="..." links an event to the slide with that id: it gets a timeline strip (see Pandoc below).
local function timeline_config(el)
  local events = {}
  for _, b in ipairs(el.content) do
    if b.t == "Div" and b.classes:includes("event") then
      local a = b.attributes
      picture(a["image"])
      b.content:walk({ Image = function(img) picture(img.src) end })
      local first = b.content[1]
      table.insert(events, {
        date = a["date"] or "", year = a["year"] or "", title = a["title"] or "", image = a["image"] or "",
        summary = a["summary"] or ((first and (first.t == "Para" or first.t == "Plain")) and pandoc.utils.stringify(first) or ""),
        html = pandoc.write(pandoc.Pandoc(b.content), "html"),
        slide = (a["slide"] or ""):gsub("^#", ""),
      })
    end
  end
  if #events == 0 then
    for _, item in ipairs(list_items(el.content)) do
      local it = sort_item(item)
      local title, summary = games.split(it.why)
      table.insert(events, { date = it.text, year = "", title = title, summary = summary, image = it.image, html = "", slide = "" })
    end
  end
  local a = el.attributes
  return {
    id = el.identifier, title = a["title"] or "", events = events,
    spacing = a["spacing"] or "auto",                                   -- "time", "even" or "auto"
    snap = tonumber(a["snap"] or ""), tolerance = tonumber(a["tolerance"] or ""),
    start = a["start"] or "", ["end"] = a["end"] or "",
  }
end

-- Label it: a picture and its labels. Each line: the label, where its dot is (x,y in % from the
-- top left; press L on the slide to find them), and an optional reason.
--   ::: {.label-it image="images/parthenon-west.jpg"}
--   - Columns | 30,55 | They hold up the roof.
--   :::
local function label_config(el)
  picture(el.attributes["image"])
  local labels = {}
  for _, item in ipairs(list_items(el.content)) do
    local parts = {}
    for part in (pandoc.utils.stringify(item) .. "|"):gmatch("%s*(.-)%s*|") do table.insert(parts, part) end
    local x, y = (parts[2] or ""):match("([%d%.]+)%s*,%s*([%d%.]+)")
    if not x then quarto.log.warning('label-it: no "x,y" place for: ' .. (parts[1] or "")) end
    table.insert(labels, { text = parts[1] or "", x = tonumber(x) or 50, y = tonumber(y) or 50, why = parts[3] or "" })
  end
  return { image = el.attributes["image"] or "", labels = labels }
end

-- Learning activities (activities.js):
--   ::: {.sentence-builder}           one sentence a line; words mix up. Keep words together with /
--   - The Romans / built / long roads.   ("The Romans" stays one tile). After a |, a hint; a picture too.
--   :::
--   ::: {.fill-blanks extra="king, temple"}   a text with the missing words in [square brackets];
--   The Romans built [aqueducts] to carry [water].   extra= adds wrong words to the word bank.
--   :::
--   ::: {.put-in-order first="First" last="Last"}   in the right order; they mix up. A picture and a
--   - Dig a channel | reason (after a |, shown once they're in order) are optional.
--   :::
local function activity_from_div(el)
  if el.classes:includes("sentence-builder") then
    local sentences = {}
    for _, item in ipairs(list_items(el.content)) do
      local it = sort_item(item)
      table.insert(sentences, { text = it.text, hint = it.why, image = it.image })
    end
    return games.div("sentence-builder", { sentences = sentences })
  end
  if el.classes:includes("fill-blanks") then
    el.content:walk({ Image = function(img) picture(img.src) end })
    return games.div("fill-blanks", { html = pandoc.write(pandoc.Pandoc(el.content), "html"), extra = el.attributes["extra"] or "" })
  end
  local items = {}
  for _, item in ipairs(list_items(el.content)) do table.insert(items, sort_item(item)) end
  return games.div("put-in-order", { items = items, first = el.attributes["first"] or "", last = el.attributes["last"] or "" })
end

local function game_from_div(el)
  for _, cls in ipairs({ "sentence-builder", "fill-blanks", "put-in-order" }) do
    if el.classes:includes(cls) then return activity_from_div(el) end
  end
  if el.classes:includes("timeline-interactive") then return games.div("timeline", timeline_config(el)) end
  if el.classes:includes("timeline-activity") then return games.div("timeline-activity", timeline_config(el)) end
  if el.classes:includes("label-it") then return games.div("label-it", label_config(el)) end
  if el.classes:includes("jeopardy") then
    local categories = {}
    for _, item in ipairs(list_items(el.content)) do
      local name = item[1] and pandoc.utils.stringify(item[1]) or ""
      local clues = {}
      for _, c in ipairs(list_items(item)) do table.insert(clues, clue(c)) end
      table.insert(categories, { name = name, clues = clues })
    end
    local points = {}
    for n in (el.attributes["points"] or ""):gmatch("%d+") do table.insert(points, tonumber(n)) end
    return games.div("jeopardy", { categories = categories, points = points, random = false,
      teams = tonumber(el.attributes["teams"] or "2") or 2 })
  end
  if el.classes:includes("sort") then   -- groups in bold, their items under them
    local groups = {}
    for _, item in ipairs(list_items(el.content)) do
      local items = {}
      for _, c in ipairs(list_items(item)) do table.insert(items, sort_item(c)) end
      table.insert(groups, { name = item[1] and pandoc.utils.stringify(item[1]) or "", items = items })
    end
    return games.div("sort", { groups = groups, random = false, feedback = el.attributes["feedback"] or "now",
      layout = el.attributes["layout"] or "" })   -- layout="venn": three groups, the middle one is "both"
  end
  local kind = el.classes:includes("matching") and "matching" or el.classes:includes("memory") and "memory" or nil
  if kind then
    local pairs = {}
    for _, item in ipairs(list_items(el.content)) do table.insert(pairs, clue(item)) end
    return games.div(kind, { pairs = pairs, random = false })
  end
  local questions = {}
  for _, item in ipairs(list_items(el.content)) do table.insert(questions, clue(item)) end
  return games.div("trivia", { questions = questions, random = false,
    seconds = tonumber(el.attributes["seconds"] or "10") or 10, title = el.attributes["title"] or "Quick-fire!" })
end

local function Div(el)
  -- Speaker notes are for the teacher: the student build leaves them out
  if el.classes:includes("notes") and not is_teacher() then return {} end
  if el.classes:includes("quick-ref") then return quick_ref(el) end
  for cls, name in pairs({ jeopardy = "Jeopardy", trivia = "Quick-fire questions", matching = "Matching", memory = "Memory", sort = "Sort it",
                           ["timeline-interactive"] = "Timeline", ["timeline-activity"] = "Timeline activity", ["label-it"] = "Label it",
                           ["sentence-builder"] = "Sentence builder", ["fill-blanks"] = "Fill in the blanks", ["put-in-order"] = "Put it in order" }) do
    if el.classes:includes(cls) then
      if games.web() then return game_from_div(el) end
      return games.placeholder(name)
    end
  end
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
  -- The clock is a toolbox tool now; clock: false tells the toolbox to leave it closed in this deck.
  local clock = meta.clock
  local off = clock ~= nil and pandoc.utils.stringify(clock) == "false"
  -- Slides: a ↓ when a slide has another below it (turn off with `down-arrow: false`).
  local down = meta["down-arrow"]
  local down_off = down ~= nil and pandoc.utils.stringify(down) == "false"
  if quarto.doc.is_format("revealjs") and not down_off then include_once("down-arrow.html") end
  -- Slides: a {{< video >}} with no size of its own fills the room left on its slide.
  if quarto.doc.is_format("revealjs") then include_once("video-fit.html") end
  -- Slides: the classroom toolbox (toolbox/toolbox.js; turn off with `classroom-tools: false`).
  local tools = meta["classroom-tools"]
  local tools_off = tools ~= nil and pandoc.utils.type(tools) ~= "table" and pandoc.utils.stringify(tools) == "false"
  -- Chalkline's design layer (ui/ui.css) on every page and deck: the tools, games, vocab pop-ups
  -- and the PDF viewer all take their colors, corners and buttons from it.
  if quarto.doc.is_format("html") or quarto.doc.is_format("revealjs") then games.ui() end
  if quarto.doc.is_format("revealjs") and not tools_off then
    -- The QR code sends students to this deck on the STUDENT site (never the teacher site, which has
    -- the answer keys): `student-site:` in _quarto.yml (or the older classroom-tools: qr-site:), plus
    -- this deck's path in the site.
    local site = meta["student-site"] and pandoc.utils.stringify(meta["student-site"])
      or (pandoc.utils.type(tools) == "table" and tools["qr-site"] and pandoc.utils.stringify(tools["qr-site"])) or ""
    local tags = {}
    if site ~= "" then tags["chalkline-student-site"] = site end
    if quarto.doc.input_file and quarto.project.directory then
      local rel = pandoc.path.make_relative(quarto.doc.input_file, quarto.project.directory)
      tags["chalkline-page"] = rel:gsub("\\", "/"):gsub("%.qmd$", ".html")
    end
    if off then tags["chalkline-clock"] = "off" end
    quarto.doc.include_text("after-body", course_data())   -- for Vocab and Packet
    quarto.doc.add_html_dependency({   -- the PDF viewer, for Packet (the same files as {{< pdf-viewer >}})
      name = "pdf-viewer",
      version = "1.0.0",
      scripts = { { path = "../pdf-viewer/pdf-viewer.js", attribs = { type = "module" }, afterBody = true } },
      stylesheets = { "../pdf-viewer/pdf-viewer.css" },
      resources = { "../pdf-viewer/pdf.min.mjs", "../pdf-viewer/pdf.worker.min.mjs", "../pdf-viewer/pdf-lib.esm.min.js" },
    })
    quarto.doc.add_html_dependency({
      name = "classroom-tools",
      version = "1.0.0",
      scripts = {   -- the icons and the kit first, then the tools in their own files, then the toolbox
        { path = "ui/icons.js", afterBody = true },
        { path = "toolbox/kit.js", afterBody = true },
        { path = "toolbox/tools/classes.js", afterBody = true },   -- before picker and groups
        { path = "toolbox/tools/picker.js", afterBody = true },
        { path = "toolbox/tools/groups.js", afterBody = true },
        { path = "toolbox/tools/scoreboard.js", afterBody = true },
        { path = "toolbox/tools/voice.js", afterBody = true },
        { path = "toolbox/tools/traffic.js", afterBody = true },
        { path = "toolbox/tools/spotlight.js", afterBody = true },
        { path = "toolbox/tools/clock.js", afterBody = true },
        { path = "toolbox/tools/stopwatch.js", afterBody = true },
        { path = "toolbox/tools/vocab.js", afterBody = true },
        { path = "toolbox/tools/packet.js", afterBody = true },
        { path = "toolbox/tools/qr.js", afterBody = true },
        { path = "toolbox/tools/music.js", afterBody = true },
        { path = "toolbox/tools/dice.js", afterBody = true },
        { path = "toolbox/tools/slide.js", afterBody = true },
        { path = "toolbox/toolbox.js", afterBody = true },
      },
      stylesheets = { "toolbox/toolbox.css" },
      resources = { "toolbox/qrcode.js" },
      meta = next(tags) and tags or nil,
    })
  end
  -- Web pages: links to slideshows open in a new tab (slides-new-tab: false turns it off).
  local nt = meta["slides-new-tab"]
  local nt_off = nt ~= nil and pandoc.utils.stringify(nt) == "false"
  if quarto.doc.is_format("html") and not quarto.doc.is_format("revealjs") and not nt_off then
    include_once("new-tab.html")
  end
  return nil
end

-- Slides only, before the Div pass: give every timeline an id, and put a timeline strip on each
-- slide an event links to (slide="..."), so that slide shows where it is on the timeline.
local function Pandoc(doc)
  if not quarto.doc.is_format("revealjs") then return nil end
  local strips, n = {}, 0
  doc = doc:walk({ Div = function(el)
    local teach = el.classes:includes("timeline-interactive")
    if not teach and not el.classes:includes("timeline-activity") then return nil end
    n = n + 1
    if el.identifier == "" then el.identifier = "timeline-" .. n end
    local i = 0
    for _, b in ipairs(el.content) do
      if b.t == "Div" and b.classes:includes("event") then
        local slide = (b.attributes["slide"] or ""):gsub("^#", "")
        if slide ~= "" and teach then strips[slide] = { el.identifier, i } end
        i = i + 1
      end
    end
    return el
  end })
  if not next(strips) then return doc end
  local blocks = pandoc.List()
  for _, b in ipairs(doc.blocks) do
    blocks:insert(b)
    local s = b.t == "Header" and strips[b.identifier]
    if s then
      blocks:insert(pandoc.RawBlock("html", '<div class="cg-strip" data-timeline="' .. s[1] .. '" data-event="' .. s[2] .. '"></div>'))
    end
  end
  doc.blocks = blocks
  return doc
end

return {
  { Meta = Meta },
  { Pandoc = Pandoc },
  { Div = Div },
}
