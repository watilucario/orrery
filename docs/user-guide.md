🇫🇷 Version française : [guide-utilisation.md](guide-utilisation.md)

# Orrery user guide

This guide is written for someone who has never used GitHub and doesn't need to. To use Orrery, all you need is a browser: no account, no installation, no server.

**[Open the demo](https://watilucario.github.io/orrery/)**

Allow about ten minutes to go through everything. The first five are enough to get the idea.

## In two sentences

Orrery has you review **at the right moment**: a question comes back just before you would forget it, not earlier. With each answer, you say how sure you were, and that sets the date of the next review.

Everything stays **in your browser**. Nothing is sent anywhere, and nobody can see your progress.

## 1. The first visit

Very first screen: **Français · English**. Pick your language; you can change it later in **Profile › Settings › Language**.

On first launch, a guide in several screens introduces the app. You can skip it at any time with "Skip", and reopen it later in **Profile › Replay the app guide**.

1. **Your first name** (optional): so the app can talk to you.
2. **The daily session**: the principle, in a few lines.
3. **What you can do here**: the list of everything the app can do.
4. **Create your universe**: a simulation, nothing is saved (see part 6).
5. **Import your first course**: a simulation with a real small sample course (see part 7).
6. **Your exams**: a date for each subject, if you have one. It sets the pace of new questions.

## 2. Your first daily session

This is the heart of the app. On **Today**, pick a subject in the row under the title (the number tells you how many questions are waiting), then tap **Start**:

- Read the question and choose an answer.
- **Before the answer is shown**, say whether you were **sure**, **hesitating**, or **guessing**.
- Read the explanation and its source: this is where you learn.

What it changes:

| Your answer | What happens |
|---|---|
| Wrong, or right by guessing | The question comes back in the same session, then very soon on the following days. |
| Right, but you hesitated | It comes back a little sooner. |
| Right and you were sure | It comes back later. |

A question you get right while sure can come back **without the choices**. You then have to find the answer yourself: it's harder, and it's what fixes things in memory best.

Do the session every day, even a short one. It's the gap between two reviews that makes you remember.

## 3. The universes and subjects in the demo

A **universe** groups subjects, like a programme or a project. The demo has two, with two subjects each. Everything is written for the demonstration, and the numbers are made up.

| Universe | Subject | What you'll find |
|---|---|---|
| Finance | Financial mathematics | Simple and compound interest, discounting |
| Finance | Basic accounting | Balance sheet, journal entries, profit |
| Learning | Memory and revision | The forgetting curve, spaced repetition, active recall |
| Learning | Basic statistics | Mean and median, spread, reading a figure in the press |

On **Today**, the chosen subject is the star in the middle, and its **chapters are the planets** orbiting around it: tap a planet to open its chapter, the star to open the subject. The percentage under each planet is the share of its questions that you have mastered.

To move from one universe to another, tap the pill at the top right of Today. **See the map** shows all your universes as galaxies: tap one to dive in, and you find your subjects as stars. Tap the empty space or "All universes" to go back.

## 4. Explore a subject

Open a subject from **Review**, from the star on Today, or from the map. At the top, a **four-axis radar** shows your mastery of the subject (understand, apply, explain, recommend): a hollow axis is a gap to fill. Below it, two tabs:

- **Practise**: the daily session, resuming a set, the app's advice, free practice, the mistake notebook and the mock exam.
- **Course**: one line per chapter with its four steps. A chapter opens its own page: the course, ways to practise on that chapter alone, and its own radar.

Depending on the subject, you'll find:

- **Course sheets**: one per topic, with diagrams, boxes (definition, formula, example, pitfall) and a plan that builds itself.
- **Multiple-choice questions of all kinds**: multiple choice, true or false, find the mistake, match, put in order, fill in the blanks.
- **Quick sets**: a few questions on one topic, to practise without a full session.
- **A guided case**: a problem you solve in several steps, with a correction at each step.
- **A written exercise**: numerical questions with a hint and a detailed calculation, and one question to write out.

## 5. What helps around the sessions

- **Exams**: add a date and a target grade (Profile › Add an exam, then Agenda › Exams). The daily session prepares for the next exam.
- **Daily plan**: what to study, how much, and in what order, spread out until the exam.
- **Mistake notebook**: the questions you miss come back there, along with a "To read before" list for the exam.
- **Search** across all courses: press `/` on a computer.
- **Highlights and notes** on the sheets. You can find them all in Profile › Notes and highlights.
- **Calculator**: `Alt + C`, to calculate without leaving the exercise.
- **Progress**: what you remember of each course, your streaks, your charts.

## 6. Create your universe

In the demo, the guide has you **try it for real on screen, without saving anything**: you type a name, a galaxy appears, you choose subjects. It's the fastest way to see the idea.

To create a real universe that stays, Orrery has a blank version, **Maitrise**. It starts with no content and guides you to create your universe, then one system per subject. It is built with `python3 build.py` and opens from `dist/maitrise/standalone.html`. For that you need to get the project: this is the only moment when GitHub becomes useful (see the last part).

## 7. Import a course

Do you have a course as a PDF, slides or notes? An AI can turn it into a **pack**, a structured text that Orrery can read. No particular AI is required: Claude, ChatGPT, Le Chat, your choice.

1. Open **Profile › Import a course**, then **Copy the instructions**.
2. Paste the instructions into the AI of your choice, with the documents of **one** course only. The AI tells you what it understood, suggests a plan and asks its questions. Answer, add your notes if you like, then say "go ahead".
3. Paste the pack it gives you into the text box (or open its file), then **Check**.
4. If the pack is good, the app counts what it understood (topics, questions, sheets) and offers **Add to my subjects**.
5. If the pack is rejected, the app says **which line to fix**. Tap **Copy the errors for the AI**, paste them into the conversation, and the AI gives you a corrected pack.

To **try without an AI**, the welcome guide replays these steps with a small sample course, "The solar system". Its text is also in the project: [`modeles/exemple-pack.en.md`](../modeles/exemple-pack.en.md). You can copy and paste it as it is into Import a course.

Completing or correcting a course you already imported is done with an **update pack**: the AI only returns what changes, and your progress is kept.

The full format of packs is in [`modele-de-pack.en.md`](modele-de-pack.en.md).

## 8. Keep your progress

Your progress lives in your browser's storage. It is erased if you clear the site's data, or if you change device.

- **Profile › Back up or restore**: a file with all your progress, to keep or to take elsewhere.
- Make a backup from time to time, especially after importing courses: an imported course exists only in this browser.

## Frequently asked questions

**Do I need an account?** No.

**What happens to what I enter?** It stays in your browser. The project has no server.

**My progress doesn't show on my other device, why?** Each browser has its own memory. Use Back up or restore to move from one to the other.

**Does the app work offline?** The page is self-contained. Once loaded, it doesn't need the network for sessions. I haven't tested opening it offline from a phone.

**Are the demo questions reliable?** They are written for the demonstration. The numbers are made up or recalculated, but it is not a course to learn for an exam.

## Going further (this is where GitHub helps)

- Get the code: on the project page, the green **Code** button then **Download ZIP**, or `git clone`.
- Build the app: `python3 build.py` (Python 3, nothing else to install). The result is in `dist/standalone.html`.
- Write content by hand instead of with an AI: [`univers/README.en.md`](../univers/README.en.md) describes all the files.
- Understand the design choices: [`decisions.en.md`](decisions.en.md).


## The four steps of mastery

Each chapter is confirmed in four steps, from the simplest to the most demanding: **understand** (what the ideas are and why), **apply** (use the method on numbers), **explain** (justify in your own words) and **recommend** (propose a decision suited to the situation). A step is only confirmed by evidence: questions answered correctly on several different days, not a set done in one go. The radar at the top of each subject sums them up; the grid per chapter is in the Course tab, and the Progress screen recalls them.
