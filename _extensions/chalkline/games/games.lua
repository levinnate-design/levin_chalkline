--[[
Slide games, shared by shortcodes.lua (games from the vocab list) and filter.lua (games you
write out yourself in a ::: div). Each game becomes an empty <div> with its settings as JSON;
games.js draws it in the browser. Slides and web pages: in PDFs and Word you get one line saying so.
]]

local M = {}

local function html_escape(s)
  return (s:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"):gsub('"', "&quot;"))
end

-- Chalkline's design layer (ui/ui.css): filter.lua adds it to every page and deck; the games add it too.
function M.ui()
  quarto.doc.add_html_dependency({ name = "chalkline-ui", version = "1.0.0", stylesheets = { "ui/ui.css" } })
end

-- Games work on slides and on web pages: any HTML output (revealjs is one too).
function M.web()
  return quarto.doc.is_format("html")
end

function M.div(kind, config)
  M.ui()
  quarto.doc.add_html_dependency({
    name = "classroom-games",
    version = "1.0.0",
    scripts = {   -- paths are from _extensions/chalkline/; timeline.js and activities.js add their games to games.js
      { path = "games/games.js", afterBody = true },
      { path = "games/timeline.js", afterBody = true },
      { path = "games/activities.js", afterBody = true },   -- uses timeline.js's drag helper
    },
    stylesheets = { "games/games.css", "games/timeline.css", "games/activities.css" },
    -- Bingo makes its printable cards in the browser with pdf-lib (the PDF viewer's copy; MIT).
    resources = { "pdf-viewer/pdf-lib.esm.min.js" },
  })
  local game = '<div class="cg-game cg-' .. kind .. '" data-game="' .. kind ..
    '" data-config="' .. html_escape(quarto.json.encode(config)) .. '" data-prevent-swipe></div>'
  -- On a web page, the game sits in a .cg-host box: the games' styles apply inside .reveal (slides)
  -- or .cg-host (pages), and the box tells the game how much room it has (container queries).
  if not quarto.doc.is_format("revealjs") then game = '<div class="cg-host">' .. game .. '</div>' end
  return pandoc.RawBlock("html", game)
end

-- Outside slides (web page, PDF, Word): a line saying the game is on the slides.
function M.placeholder(name)
  return pandoc.Para({ pandoc.Emph({ pandoc.Str(name .. " (a game on the slides)") }) })
end

-- "Question | Answer" -> "Question", "Answer" (the first | splits them).
function M.split(text)
  local q, a = text:match("^(.-)%s*|%s*(.-)%s*$")
  if not q then return text, "" end
  return q, a
end

return M
