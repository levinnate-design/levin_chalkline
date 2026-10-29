# Putting a course online (Cloudflare Workers)

For a real course. The Chalkline sample itself (project-chalkline) is published on GitHub Pages:
all its content is a demo, so its teacher version can be public. A real course's answer keys can't.

Two free websites, rebuilt by GitHub every time you change `main`:

- **Student site**: for students and families. No sign-in.
- **Teacher site**: answer keys, speaker notes, the toolbox. Only the teachers you name can open it:
  they type their email and get a 6-digit code.

Claude does most of the work with the **Cloudflare API connector**. You do the steps that need a
person: making the account, the API token (a password for GitHub, so it never goes through the chat)
and checking the sites. The files are in `hosting/` next to this note.

Tested with the Robotics League course, 2026-10-28.

## What you need

- The course in a **private** GitHub repository (the answer keys are in the source files).
- Claude on claude.ai with access to that repository (Claude Code on the web).

## Steps

**1. You: a Cloudflare account.** Skip this if you have one.
Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up), sign up with your email
and confirm the email. The free plan is enough. Then open **Workers & Pages** once: Cloudflare gives
you a `workers.dev` address, like `something.workers.dev`. Everyone will see it in your site's
address, so if it shows a name you don't want public, change it: **Workers & Pages ›
Account details › Subdomain › pencil icon** (or ask Claude to change it in step 3).

**2. You: connect Claude to Cloudflare.** In claude.ai, open **Settings › Connectors › Add custom
connector**, name it `Cloudflare API`, and paste `https://mcp.cloudflare.com/mcp`. Sign in to
Cloudflare when it asks, and allow it to **edit Workers** and **edit Access**. Then start a
**new** Claude session on your course (a session only sees the connectors it started with).

**3. Claude: add the hosting files.** Say: *"Set up hosting for this course with HOSTING.md in the
Chalkline extension."* Claude then:

- copies `hosting/deploy.yml` to `.github/workflows/deploy.yml`, and the other files in `hosting/`
  to the course's own `hosting/` folder;
- renames the two Workers from `my-course` and `my-course-teachers` to your course's name
  (the teacher one must keep the same name in `teacher.jsonc` and `teacher-placeholder.jsonc`);
- sets `QUARTO_VERSION` in the workflow to your Quarto version;
- reads your **account ID** and `workers.dev` address with the connector, and sets `student-site:`
  in `_quarto.yml` to the student site's address (`https://<course>.<subdomain>.workers.dev/`),
  so the QR codes on slides point there;
- pushes this to a branch. The build runs, but nothing goes online yet.

**4. You: give GitHub a key to Cloudflare.** Best done on a computer, not a phone (a phone can
break the long token in two).

1. Cloudflare: **profile icon › My Profile › API Tokens › Create Token**, use the template
   **Edit Cloudflare Workers**, pick your account, **Continue to summary › Create Token**.
   Copy it with the **Copy** button. It is shown only once.
2. GitHub: your course repository **› Settings › Secrets and variables › Actions › Secrets tab ›
   New repository secret**. Add two secrets (not Variables, not Environment secrets):
   - `CLOUDFLARE_API_TOKEN`: the token.
   - `CLOUDFLARE_ACCOUNT_ID`: the account ID Claude gave you in step 3.

Never paste the token into the chat. Tell Claude "the secrets are in": it checks them by reading the
next build's **Check the Cloudflare secrets** step, which says whether they were found and whether
Cloudflare accepts them, without showing them.

**5. Claude: put the student site online.** Claude merges the branch into `main` (or opens a pull
request for you to merge). The build uploads the student site. The teacher Worker gets only a
"not open yet" page, because nobody has to sign in for it yet.

**6. Claude: lock the teacher site.** Tell Claude the teachers' email addresses. With the connector,
Claude:

- turns on **One-time PIN** (sign-in with an email code) in Cloudflare Access;
- adds an Access application for the teacher site's address
  (`<course>-teachers.<subdomain>.workers.dev`) with one rule: **allow** those emails;
- checks that the address now sends visitors to a Cloudflare sign-in page;
- runs the workflow again (**Actions › Build and publish › Run workflow** on `main`). This time it
  sees the sign-in and uploads the real teacher site.

If Cloudflare asks for a **Zero Trust team name** or plan first, open **Zero Trust** in the
dashboard once, pick a team name (it appears in the sign-in address) and the **Free** plan, then ask
Claude to go on. Leave the account-wide setting **Workers & Pages › Access** (it would lock *every*
Worker, the student site too) **off**.

**7. You: check.** In a private browser window:

- the student site opens with no sign-in;
- the teacher site asks for an email, the code arrives, and an address not on the list is refused.

Try both from school too (Wi-Fi and phone data). If `workers.dev` is slow or blocked there, buy a
domain (Cloudflare Registrar is cheapest) and add it to each Worker under **Settings › Domains &
Routes › Custom domain**. Access covers it automatically.

## Later

- **Add or remove a teacher:** ask Claude to change the email list on the teacher site's Access
  application (or **Zero Trust › Access › Applications › the app › Policies**). Free for up to 50
  people.
- **New token** (if it expires or leaks): make one as in step 4 and replace the GitHub secret.
  Delete the old one in Cloudflare.
- **Safety net:** before every upload, the workflow checks that the teacher address still asks for
  a sign-in. If Access is ever turned off, the next build puts the placeholder page back.

## Why it's built this way

- **Workers, not Pages.** On Pages, Access covered only the preview addresses unless you added a
  second application by hand. On Workers, one Access application on the address protects the site.
- **Email codes, not one shared password.** Each teacher is named and can be removed alone, and
  there's a log of who signed in. A shared password spreads, and changing it locks everyone out.
- **The token stays out of the chat.** The connector does the setup with your own sign-in; GitHub
  holds the token the builds use.
