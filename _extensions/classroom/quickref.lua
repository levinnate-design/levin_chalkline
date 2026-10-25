--[[
Quick reference slide: every link in a unit on one slide, for class. Write

    ## Quick reference

    ::: {.quick-ref}
    - [Athens or Sparta?](city-states-slides.html#/athens-or-sparta)
    - [Exit ticket](city-states-slides.html#/exit-ticket)
    :::

The links you list (any slide, in any deck: deck.html#/slide-id) become numbered "Key slides" on
the left. On the right, a grid of everything in the unit, from generated/catalog.json (written by
scripts/catalog.py, so it is always up to date): the packet, every deck, printable and outside link,
each in its type's color, with a PDF link. Clicking one opens it in a pop-up over the slides
(quickref.js); key slides in this deck just go there, and outside sites open in a new tab. The unit is the one this deck is in; unit="02-ancient-rome"
picks another. With no list, the grid takes the whole slide. Other formats get a plain list.
]]

local function esc(s)
  return (tostring(s or ""):gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"):gsub('"', "&quot;"))
end

local function catalog()
  local f = io.open((quarto.project.directory or ".") .. "/generated/catalog.json", "r")
  if not f then return {} end
  local ok, items = pcall(quarto.json.decode, f:read("a"))
  f:close()
  return ok and items or {}
end

local function outside(path) return path:match("^https?://") ~= nil end

return function(el)
  local root = quarto.project.directory or "."
  local here = pandoc.path.make_relative(quarto.doc.input_file, root):gsub("\\", "/")
  local doc_dir = pandoc.path.directory(here)
  local unit_dir = el.attributes["unit"] and ("course/units/" .. el.attributes["unit"]) or doc_dir
  local function link(path)   -- a project path, as seen from this deck
    if outside(path) then return path end
    return (pandoc.path.make_relative(path, doc_dir, true):gsub("\\", "/"))
  end

  -- everything in the unit: its own files, then its outside links (same unit name)
  local items, unit_name = {}, nil
  local all = catalog()
  for _, i in ipairs(all) do
    if not outside(i.path) and i.path:sub(1, #unit_dir + 1) == unit_dir .. "/" then unit_name = unit_name or i.unit end
  end
  for _, i in ipairs(all) do
    local mine = outside(i.path) and i.unit == unit_name or (not outside(i.path) and i.path:sub(1, #unit_dir + 1) == unit_dir .. "/")
    if mine and i.edition ~= "teacher" then table.insert(items, i) end   -- in class: the student copy of the packet
  end

  -- the key slides the author listed
  local pins = {}
  for _, b in ipairs(el.content) do
    if b.t == "BulletList" or b.t == "OrderedList" then
      for _, item in ipairs(b.content) do
        pandoc.walk_block(pandoc.Div(item), { Link = function(l)
          local deck = l.target:gsub("#.*$", "")
          local deck_title
          for _, i in ipairs(all) do
            if not outside(i.path) and link(i.path) == deck then deck_title = i.title end
          end
          table.insert(pins, { text = pandoc.utils.stringify(l.content), href = l.target, deck = deck_title or (deck ~= "" and deck or "This deck") })
          return l
        end })
      end
    end
  end

  if not quarto.doc.is_format("revealjs") then   -- web pages and PDFs: a plain list
    local list = {}
    for _, p in ipairs(pins) do table.insert(list, { pandoc.Plain({ pandoc.Link(p.text, p.href) }) }) end
    for _, i in ipairs(items) do table.insert(list, { pandoc.Plain({ pandoc.Link(i.title, link(i.path)), pandoc.Str(" (" .. i.type .. ")") }) }) end
    return pandoc.BulletList(list)
  end

  quarto.doc.add_html_dependency({ name = "chalkline-quickref", version = "1.0.0", stylesheets = { "quickref.css" },
    scripts = { { path = "quickref.js", afterBody = true } } })   -- decks and printables open in a pop-up
  local out = { '<div class="qref' .. (#pins > 0 and "" or " qref-nopins") .. '">' }
  if #pins > 0 then
    table.insert(out, '<div class="qref-pins"><div class="qref-head">Key slides</div>')
    for n, p in ipairs(pins) do
      table.insert(out, '<a class="qref-pin" href="' .. esc(p.href) .. '"><span class="qref-n">' .. n .. '</span><span><b>' .. esc(p.text) ..
        '</b>' .. (p.deck and ('<small>' .. esc(p.deck) .. '</small>') or "") .. '</span></a>')
    end
    table.insert(out, '</div>')
  end
  table.insert(out, '<div class="qref-all"><div class="qref-head">Everything in ' .. esc(unit_name or "this unit") .. '</div><div class="qref-grid">')
  for _, i in ipairs(items) do
    local kind = outside(i.path) and "link" or i.type:lower()
    local pdf = (i.pdf and i.pdf ~= i.path) and ('<a class="qref-pdf" href="' .. esc(link(i.pdf)) .. '">PDF</a>') or ""
    local here_mark = (not outside(i.path) and i.path == here:gsub("%.qmd$", ".html")) and ' <span class="qref-here">this deck</span>' or ""
    table.insert(out, '<div class="qref-tile qref-t-' .. kind .. '"><a class="qref-title" href="' .. esc(link(i.path)) .. '"' ..
      (outside(i.path) and ' target="_blank" rel="noopener"' or "") .. '>' .. esc(i.title) .. '</a>' ..
      '<span class="qref-meta"><span class="qref-kind">' .. (outside(i.path) and esc(i.source) or esc(i.type)) .. '</span>' .. here_mark .. pdf .. '</span></div>')
  end
  table.insert(out, '</div></div></div>')
  return pandoc.RawBlock("html", table.concat(out))
end
