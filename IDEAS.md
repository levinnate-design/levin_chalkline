# Ideas for later

Things we've talked about but not built yet. Add to this list; move an idea out when it's built (and log it in `TOOL-CHANGES.md`).

## To do next

- **Math worksheets: still an area of concern, need more work.** The Unit 4 practice worksheets (Times and Divide, Mixed Review, Garden Times Tables) are a first pass, not finished. Not tonight: the plan is to ask the math teachers for copies of their current worksheets and match their style, then rework the layouts, problem mix and difficulty.
- **A new intro deck: everything interactive.** One deck that walks a new teacher through every interactive option now in Chalkline (review games, learning activities, timelines, Label it, polls, the toolbox, the chalkboard, PDF worksheets), each with a live example and one line on how to write it. The Start here catalogue slide lists them; this would *teach* them.
- **An intro piece: "lists are the secret".** A short deck (or a section of the one above) that drives home the big idea: **make lists of your course's vocabulary and key facts first** (words and meanings, dates and events, people and what they did, places and pictures). Once a list exists, it becomes a quick, reusable activity in minutes: snowman, matching, memory, bingo, Jeopardy, sort it, timelines, flashcards, quizzes. Show one list turning into five activities. The vocab list (`vocab/data/vocab.csv`) is the model.

## Classroom tools: next steps

Every tool is now a web component in its own file (`_extensions/classroom/toolbox/tools/`), with no title bar, and the content is the card. `toolbox.js` is only the frame (panels, menu, remembering). Ideas for later:

- **Lit** (a small, standard library for web components, about 6 KB, no build step) if a tool's template gets long and fiddly. Not needed yet.
- **A teacher's own tool:** with the tools in their own files, a teacher's `_extensions/my-tools/` could add a tool to the menu with one file, the same way. Part of the extension plan below.
- **Games and activities on the shared parts:** they already take their colors and corners from `ui/ui.css`, but their buttons and menus are still their own (`games.css`, `activities.css`). Moving them onto `.ui-btn`, `.ui-seg` and `.ui-pop` would make every button in Chalkline one button.
- **The vocab app** (`vocab/app/`) has its own colors (`brand.css`, made from `brand/`). It could load `ui/ui.css` too.
- **Sidebars:** Vocab and Packet are now docked sidebars (the slides move over to make room). Next: the unit's worksheets by name (Packet). Chalkboard ink stays where it was drawn on the screen when a sidebar opens or closes (the slide moves under it), as it already does when Slide size changes the space around the slide.

## Chalkline as a Quarto extension (after alpha)

**Where we are:** alpha. A couple of teachers are trying Chalkline in their own cloned repositories. Today Chalkline's code lives inside each course (`_extensions/classroom`, `scripts/`, `brand/`, the Typst template, the launchers, the vocab app), so every course is a full copy, and a fix (like the video sizing) has to be copied into each one by hand.

**The plan:** split it in two.

1. **A Chalkline repository:** the tool only, released as a Quarto extension with a version number. A course installs it with `quarto add <owner>/chalkline` (it lands in `_extensions/chalkline/`) and updates with `quarto update <owner>/chalkline`. A course can stay on an older version until its teacher chooses to update.
2. **A course template:** a starter repository ("Use this template" on GitHub) with `_quarto.yml`, an example unit, `brand/`, `season.yml` and the launchers, which installs the extension. One click makes a new course.

**Layers, so updates never overwrite a teacher's work:**

- **Chalkline:** the shared tool. Nobody edits it inside a course; an update would overwrite those edits.
- **School and course settings:** `_quarto.yml`, the school's `brand/` (colors, logo, fonts) and `season.yml`. Their styles load after Chalkline's, so they win.
- **Personal tools:** a teacher's own small extension beside Chalkline (for example `_extensions/my-tools/`) for their own shortcodes, filters or styles. Quarto runs both.
- **Content:** units, lessons, worksheets, vocab. All theirs.

The rule "log tool changes in `TOOL-CHANGES.md`" becomes "put your changes in your own layer". When a personal tool is useful for everyone, it moves up into Chalkline for the next release; the logs from alpha are where those ideas come from.

**What packs easily, and what needs work:**

- Easy: the Lua filters and shortcodes, the toolbox, games, activities, the video fit, and the web and slide styles.
- Can ship inside the extension, with `_quarto.yml` pointing to them: the Python scripts (the overview catalog, packets, slide PDFs, vocab brand).
- A custom format in the extension: the Typst PDF template (worksheets, the playful layout).
- In the course template rather than the extension: the launchers, the vocab app, `.vscode/` and the publish workflow.

**Moving the alpha testers over:**

1. Read each tester's `TOOL-CHANGES.md` and pull the good changes into Chalkline first.
2. Then, in their repository, delete the old tool folders, `quarto add` the extension, and move anything personal into `_extensions/my-tools/`.
3. Their content doesn't change.

**When:** before a third or fourth course, or before the alpha group grows. Each copy made before then is one more to move over.

## Play at home (phones), next steps

- **Phone layouts for the other one-player games**, one at a time, like Word Blitz's (container queries in `games.css`): Snowman and Scramble (the snowman smaller on top, the letters below), Memory (3 × 4 cards), Picture reveal, Matching (one column). Then take each one off the scale-to-fit list (`FITS_ITSELF` in `games.js`).
- **Play offline (the subway):** a web app manifest and a service worker, so the Play page can be added to the home screen and keeps working with no signal (the page, the games and the vocab pictures saved on the phone).
- **Tests:** keep the Playwright scripts that play each game (slides, desktop page, phone page) in the repo and run them on every push.
- **A shared game kit:** the pieces Word Blitz has that other games could use (the wrong answers from the same unit and another unit, words that come back, high-score tables, timers that pause off-slide, level themes, the canvas fire), maybe on Lit.

## Review games

- **Heads up / Taboo.** A big word card for one student who faces the class; classmates describe the word without saying it (or without the "don't say" words under it). A timer, and *Got it* / *Pass* buttons that count. Good speaking practice for English learners. From the vocab list: the word, with its meaning hidden for the teacher.
- **Spin the wheel.** A colorful wheel that spins and stops on one slice: a question type, a topic, a team, or a student from the name picker's class list. Looks great on a smartboard.
- **Odd one out.** Four pictures or words; students say which doesn't belong, and why. No single right answer, so it's good for talking. From the vocab list: three words from one topic and one from another.
- **Zoom in.** A photo starts zoomed in close; each tap zooms out a little. "What is it?"
- **Who wants to be a millionaire.** A question ladder with lifelines: 50:50, and "ask the class", using the tap-to-vote poll.

## Bingo, next steps

- **Your own words:** a box to paste `word | meaning` lines, kept in the browser, for a bingo that isn't from the vocab list.
- **Picture cards:** pictures on the cards instead of words (for younger students). The vocab drawings are SVG, so they'd need turning into PNG in the browser first.
- **Bigger grids for one unit:** a unit has about 12 words, so its cards are 3 × 3. 4 × 4 and 5 × 5 need 16 or 24 words: all units, or a unit with more words.
- If a unit's vocab list changes, a game code makes different cards than the ones printed before. Make new cards after changing the vocab.
