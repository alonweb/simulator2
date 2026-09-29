# THE ONE — focus group simulator, devices edition

**Status 2026-09-28: a duplicate of the women's simulator, waiting for its content.** Alon
brings the device photos and questions on 2026-09-29. Until then this is the women's game
unchanged, with three differences that keep the two apart: `SESSION_LABEL` is `DEVICES1`,
`ENDPOINT` is the devices edition's own server (set up 2026-09-28, spreadsheet "Copy of THE ONE
focus group", same presenter key), and the browser keys are
`theone-devices.*` so a phone that has opened both games keeps them separate (both sites
would live on `alonweb.github.io`, which shares storage).

**No survey in this game.** The survey is its own page on the women's site
(https://alonweb.github.io/the-one-simulator/survey.html), offered once a phone has finished
both games; its answers land in the women's sheet and show on the women's presenter page.
This game only marks itself finished (`DONE_KEY` in `config.js`, `finish.js`), and its
thank-you screen shows the survey button when the women's game is finished too.

### To make it the devices game

1. **Its own server. Done 2026-09-28.** In Google Drive, open the "THE ONE focus group" spreadsheet and use
   **File → Make a copy** (the copy carries the Apps Script). In the copy: **Extensions → Apps
   Script**, paste this folder's `apps-script.gs`, add **Services → Google Sheets API**, set
   **Project Settings → Script properties → `PRESENTER_KEY`**, then **Deploy → New deployment →
   Web app** (execute as me, anyone can access). Put its `/exec` URL in `config.js` `ENDPOINT`.
   Do not point this at the women's server: the rows would mix and Reset would wipe both.
2. **The content**, in `config.js`: `MATCHUPS` (five pairs; keep ids `m1`–`m5`, give each device
   an id, a name and a photo path) and `CATEGORIES` (key, short label, the question on the
   banner). Photos go in `photos/`. Survey changes go in the women's `config.js`, not here.
3. **Wording written for contestants**, outside `config.js`: the first question
   (`flow.js`, "who is the one?"), the join screen's "Tonight's ten" (`app.js`), the review and
   presenter lines "Who is the one" and "her" (`present-format.js`), and the presenter's contest
   section ("her", "she won it", the "Contestant" column, in `presenter.js`).
4. **Publish.** Its own repository is `alonweb/simulator2` (created 2026-09-28): players at
   https://alonweb.github.io/simulator2/, presenter at https://alonweb.github.io/simulator2/presenter.html.
   GitHub's `main` holds only an under-construction page for now; the game is developed on the
   local `build-simulator` branch and pushed to `main` when the devices content is in.

---

A throwaway research instrument for one live session. Twenty people play one round of
THE ONE on their own phones, one matchup at a time as the presenter releases each, answer a
then answer the survey on its own page on the women's site; the presenter alone sees the
scored board and every player's answers, and can project the board for the room between matchups. The release-by-release
pacing is for the meeting only; it is not how the product runs a round.
None of this is production code.

Spec and plan live in the HumanPatterns project under
`_bmad-output/planning-artifacts/focus-group-sim/`.

## The pieces

| File | What it is |
|---|---|
| `index.html`, `app.js`, `draft.js` | What a participant sees. Answers are held in the browser and sent once, at lock. |
| `presenter.html`, `presenter.js` | The statistics page, opened with the presenter key: leaderboard, every player's answers, close, export. |
| `finish.js` | Marks this phone as having finished this game, so the survey can wait for both. |
| `survey.js` | Survey validity, used here only by `load.mjs`; the survey itself is on the women's site. |
| `scoring.js` | Every point in the session. Pure functions, fully tested. |
| `stats.js` | Crowd result, leaderboard, session statistics. Pure functions, fully tested. |
| `store.js` | The only code that touches the network. |
| `config.js` | Everything you change between sessions: the categories, the matchups, the survey questions and the session label. |
| `apps-script.gs` | The server side. Paste into Apps Script; see below. |
| `gas-mock.mjs`, `apps-script.test.js` | Runs `apps-script.gs` in node against stand-ins for Google's services, so the server's rules are tested before it is pasted. |
| `rehearse.mjs` | Submits synthetic participants so the path is proven before the day. |

## Before the session

1. **Set the four categories and ten contestants** in `config.js`, and put the
   photographs in `photos/`. The categories shipped here are the pilot mockup's:
   best smile, style, best body, take to Mama.
2. **Set the presenter key.** In the Apps Script editor: **Project Settings → Script
   properties → Add script property**, name `PRESENTER_KEY`, value whatever the
   presenter will type. It is not in this repository, because this repository is public.
   Until it is set the server refuses to close a round or show the statistics page at
   all — which is the intended failure, not a fault.
3. **Deploy the server.** Paste `apps-script.gs` into the Apps Script editor bound to the
   session spreadsheet. In the left column, **Services → + → Google Sheets API → Add**:
   the script appends through that API because the plain append overwrote rows under
   load (8 of 40 lost, 2026-09-26); without it the script falls back to a slow queue.
   Then **Deploy → Manage deployments → edit → Version: New version → Deploy**.
   Saving without a new version leaves the old code serving. This catches everyone.
4. **Verify it** with the commands in `apps-script.test.md`.
5. **Rehearse.** `ENDPOINT="…/exec" CODE=REHEARSAL node rehearse.mjs`, then open
   `presenter.html?code=REHEARSAL`, enter the key, and check the leaderboard adds up.
6. **Stress it.** `N=30 KEY=<presenter key> node load.mjs` fires 30 locks in the same
   instant, then 30 surveys, and reads the sheet back to prove every one landed once.
   Rows are stamped LOADTEST; reset the sheet afterwards. The last line says whether
   anything was lost and which write path served (`api` is the fast one). A repeat of
   the same submissionId is folded to one row on read. Google refuses requests above
   about 30 at once with an error page, which the phone retries by itself.
   Delete the `REHEARSAL` rows from the sheet afterwards.
   **The meeting itself:** `N=30 KEY=<presenter key> node meeting-load.mjs` plays it against the
   real server: 30 phones waiting, releases in waves (1, then 2+3, then 4+5), every phone locking
   the instant a matchup opens, then 30 surveys, with a presenter page reading throughout. Add
   `THINK=60` for people taking up to a minute per matchup. Measured 2026-09-28: nothing lost
   either way; realistic pace needed no retries, the instant case retried a third of the locks
   of a double release for up to a minute (Google's ~60 writes a minute), which the phone's
   two minutes of retrying absorbs. Rows are stamped LOADTEST; reset the sheet afterwards.
6. **Run the tests.** `node --test` from this directory.

## Session label

Nobody types a session code any more. Every row this build writes carries `SESSION_LABEL`
from `config.js`, and closing the round applies to that label. The presenter page shows
**everything in the sheet**; **Reset the sheet** wipes all three tabs so a real session
starts clean (export first, it cannot be undone). `presenter.html?code=DEMO` narrows the
page to one session's rows.

## The survey

Not in this game; see the note at the top of this file.

## What the key protects, and what it does not

The endpoint URL is in `config.js`, so it reaches every participant's browser. That is
unavoidable: the page has to write to it. What the presenter key adds is that only the
presenter can **release a matchup**, **close a round**, **wipe the sheet**, and **read anyone's answers** — the
statistics page is refused without it. Submitting answers needs no key.

Nothing here is real security. The key travels in the request to our own endpoint and
sits in the presenter's browser storage. It would not stop someone determined, and the
data is a focus group's opinions about photographs, not anything that needs to.

## On the day

1. Open `presenter.html`, enter the presenter key and press **Enter**. The statistics page opens; **Log out** takes you back.
2. Participants open the participant link and enter their name. Their phone waits until you
   release a matchup.
3. **Release** a matchup in the Competitions strip. Every waiting phone opens it within about
   five seconds. Release one, or several at once; players answer released matchups in matchup
   order and lock each on its own. A release cannot be taken back (only Reset clears it).
4. Watch the lock count next to each matchup. It counts locks only: the page cannot tell you
   who has joined and is still playing, so count the room. When the room is in, press
   **Project the board**: the board alone, large, with no answers or survey on it. Esc or
   Close returns to the page. Then release the next matchup.
5. After the fifth lock a player sees a thank-you screen, with the survey button once the women's game is finished too. Phones never
   show results. When everyone has locked the fifth: **Close the round**. The page refreshes
   every 10 seconds.
6. **Export raw answers** before you close the laptop. Do not edit `config.js` once the
   first person has locked: category keys and matchup ids are the join between a stored
   answer and the reveal, and changing one strands the answers already in the sheet. That file is what the session can be
   re-scored from afterwards, and it is the only copy that does not need the sheet.

## Afterwards

The export holds every raw answer, so the same session can be scored again under the other
readings of the open scoring questions. Ask for that comparison; it is the evidence that
decision has never had.

**One distortion to know about.** With twenty voters a crowd share can only land on a
multiple of five, so exact hits are far more likely than in a real league, and the exact
bonus is worth five of the six points in a category. The leaderboard will reward round-number
guessing more than skill. The presenter console reports the exact-hit rate so you can see it.

## Local development

`python3 -m http.server 8099` then open `http://localhost:8099`. ES modules do not load over
`file://`, so opening the HTML directly fails with an error that has nothing to do with Google.
