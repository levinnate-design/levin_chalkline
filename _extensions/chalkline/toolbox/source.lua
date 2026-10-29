--[[
View source (U): each slide's source, as the teacher wrote it, for toolbox/tools/source.js.

Reads the deck's .qmd file before Quarto changes anything (shortcodes, includes and notes stay as
they were typed) and cuts it where reveal.js starts a slide: a heading at the slide level or higher
(## by default), or a --- line after an empty line, outside ::: blocks and ``` code. The labels at
the top go with the title slide.

Each piece gets the id its heading gives the slide (pandoc's own rule, so it matches the slide's
id in the page); a --- slide has none. The tool matches pieces to slides by id, and by order where
there's none. Teacher build only (filter.lua): the source has the notes and the answer keys.
]]

local M = {}

-- The id pandoc gives this heading line: {#its-own} or one made from the words
local function heading_id(line)
  local ok, doc = pcall(pandoc.read, line, "markdown")
  local b = ok and doc.blocks[1]
  return b and b.t == "Header" and b.identifier ~= "" and b.identifier or nil
end

-- text: the .qmd file; level: the deck's slide-level. Gives { {id, from, to}, ... } with line
-- numbers counted from 1.
function M.slices(text, level)
  local lines = {}
  for l in (text:gsub("\r\n?", "\n") .. "\n"):gmatch("([^\n]*)\n") do table.insert(lines, l) end
  local slices, seen = {}, {}
  local function start(i, id)
    if id then   -- the same words twice: pandoc adds -1, -2
      local n = seen[id]
      seen[id] = (n or 0) + 1
      if n then id = id .. "-" .. n end
    end
    if #slices > 0 then slices[#slices].to = i - 1 end
    table.insert(slices, { id = id, from = i })
  end
  start(1, "title-slide")   -- the labels at the top, and anything before the first slide
  local i = 1
  if lines[1] and lines[1]:match("^%-%-%-%s*$") then   -- skip the labels: their --- isn't a slide
    i = 2
    while lines[i] and not lines[i]:match("^%-%-%-%s*$") and not lines[i]:match("^%.%.%.%s*$") do i = i + 1 end
    i = i + 1
  end
  local depth, fence = 0, nil
  while i <= #lines do
    local l = lines[i]
    if fence then
      if l:match("^%s*" .. fence .. "+%s*$") then fence = nil end
    else
      local f = l:match("^%s*(```+)") or l:match("^%s*(~~~+)")
      if f then fence = f:sub(1, 1):rep(#f):gsub("%p", "%%%0")
      elseif l:match("^%s*:::+%s*$") then depth = math.max(0, depth - 1)
      elseif l:match("^%s*:::+%s*%S") then depth = depth + 1
      elseif depth == 0 then
        local hashes = l:match("^(#+)%s")
        if hashes and #hashes <= level then start(i, heading_id(l))
        elseif l:match("^%-%-%-+%s*$") and (i == 1 or lines[i - 1]:match("^%s*$")) then start(i, nil)
        end
      end
    end
    i = i + 1
  end
  slices[#slices].to = #lines
  for _, s in ipairs(slices) do   -- leave out the empty lines at the end of each slide
    while s.to > s.from and lines[s.to]:match("^%s*$") do s.to = s.to - 1 end
  end
  return slices, lines
end

-- The page's JSON for the tool: the file's path in the project, its text, the slices, and (on
-- this computer only, not on GitHub's) the full path, for the tool's Open in VS Code.
function M.json(meta)
  local file = quarto.doc.input_file
  local f = file and io.open(file, "r")
  if not f then return "" end
  local text = f:read("a")
  f:close()
  local level = tonumber(meta["slide-level"] and pandoc.utils.stringify(meta["slide-level"]) or "") or 2
  local slices = M.slices(text, level)
  local data = {
    file = pandoc.path.make_relative(file, quarto.project.directory or "."):gsub("\\", "/"),
    text = text:gsub("\r\n?", "\n"),
    slides = slices,
  }
  if not os.getenv("CI") then data.path = file:gsub("\\", "/") end
  return '<script type="application/json" id="chalkline-source">' .. quarto.json.encode(data):gsub("</", "<\\/") .. '</script>'
end

return M
