# Design decisions

Each entry: what was decided, why, and what was ruled out.

1. **Content is separate from code.** Questions, sheets and cases live in `univers/`, never in `src/js`. A subject is added without touching the code. *Ruled out: questions written directly in the JavaScript, faster to write but impossible to reuse.*
2. **`build.py` rejects invalid content.** A question with no source, a missing right answer or a deleted identifier stops the build, with the file and the line. *Ruled out: warnings, which end up being ignored.*
3. **Question identifiers never change** (`ids.lock`). The review memory is indexed by identifier: renaming a question would lose the progress. A question is corrected in place.
4. **FSRS-6 checked against a reference.** The spaced repetition engine is compared with ts-fsrs on 60,000 transitions (`tests/fsrs_check.js`). The weights don't change without running this check again. *Ruled out: a home-made algorithm judged "by eye".*
5. **One page, ES5 JavaScript, no library.** The code is joined into a single file, with no dependency: the app opens as it is in a browser. *Ruled out: a framework and a bundler, too much surface for a one-person project.*
6. **One engine, two apps.** Every new feature is coded once in `src/`; the version with content and the blank version are built from the same code. Data moves from one to the other through a versioned export file (`docs/format-donnees.en.md`).
7. **The help of an AI is optional.** Without a Claude account, progress is saved to a file and courses are imported as "packs" made by any AI. The app does not depend on a provider.
8. **Confidence before the answer is shown sets the review.** "Sure", "hesitating" or "guess" changes the grade given to the algorithm: a right answer by guessing does not count as something learned.
