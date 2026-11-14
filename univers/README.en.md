# Universes: the content of the app

Everything the app has you revise is here, in readable files. The code of the app (`src/`) no longer contains any questions. `python3 build.py` reads these files, checks them and builds them into the page. At the slightest problem (right answer missing, source missing, identifier renamed…), it stops and says which file and which line to fix.

**Language note.** The keywords of the format (`Explication :`, `Source :`, `Thème :`, `## L'essentiel`, `Réponse :`, `Niveau :`…) are read literally by the parser, so they stay in French, whatever the language of the content. Only the text after them is translated.

The original course documents (handouts, slides, PDFs) stay in `content/`.

```
univers/
  app.json                      the name of the app and the first name given to the AI (v13)
  bachelor/                     a programme = a universe of the app (v5)
    programme.json              its name, its galaxy and the order of the subjects
    droit-fiscal/               a subject
      recette.json              model, status, settings of the blocks, texts, appendix
      qcm/<thème>.md            the multiple-choice questions, one file per topic
      cas.md                    the practical cases in steps
      exercices.md              the written exercises
      simulation.md             the questions reserved for the simulation
      regles.md                 what is sent to Claude: instructions and rules of the course
      documents.md              the standard documents: balance sheet, income statement… line by line (v7.3)
      constructions.md          the tables to build line by line, box by box (v8)
      calcul.js                 mental arithmetic (question generators, in code)
      ids.lock                  the lock on identifiers (managed by build.py)
    droit-des-societes/
      recette.json              status "en préparation" (in preparation): waits for the documents
  tage-mage/                    another universe: the six sub-tests of the TAGE MAGE
```

## The app (`app.json`, v13): what belongs to the person

```json
{"nom": "Révisions", "eleve": "l'auteur", "contexte": "étudiant"}
```

`nom`: the title of the page. `eleve`: the first name given to the AI in its requests ("Réponse de l'élève"). `contexte`: who the person is, for the question on a selection. Everything is optional; without this file, the app is called "Révisions" and the AI reads the first name from the profile (otherwise "l'élève", the student). Maitrise, the blank version (`dist/maitrise/`), has none: it knows nobody in advance. The content of this whole folder, in the app's exchange format (`docs/format-donnees.en.md`), is written at each build into `dist/donnees/contenu.maitrise.json`: it can be imported into Maitrise.

## The programme (`programme.json`): a universe (v5)

Each programme is a universe of the app: the home screen, Review, Progress and the upcoming exams only show its subjects. You move from one to another through "Univers" in the menu (or the pill at the top of the home screen). Universes are sorted in the alphabetical order of their folders; the first is the one a newcomer gets.

- `id`: identifier of the universe (kept in the profile settings). Don't change it.
- `nom`: shown everywhere ("Bachelor", "TAGE MAGE").
- `description`: one sentence, on the universe card in the menu.
- `libelle_matieres`: what its subjects are called, in the plural ("matières" by default; "sous-tests" for TAGE MAGE).
- `vide`: the text of the home screen as long as no subject is ready.
- `galaxie`: the drawing of the universe, for the move from one universe to another. `teinte` (0 to 360, the color of the arms), `bras` (1 to 6), `enroulement` (0.5 to 6: the bigger, the more the arms wind), `inclinaison` (in radians, -3.2 to 3.2) and `aplatissement` (0.2 to 1: 1 = seen face on). The drawing is always the same for a given universe.
- `matieres`: the folders of the subjects, in display order. A subject "in preparation" appears with its summary and waits for its documents; setting its `agenda` field already lets the app recognize its classes and exams.

## The recipe (`recette.json`)

- `id`: identifier of the subject, used for synchronization (`srs_<id>`). Never change it.
- `stockage`: prefix of the browser keys (`qfcc2.` for tax law). Never change it.
- `modele`: `matiere-de-cours` (the only one for now). The model gives the blocks and their default settings.
- `statut`: `prête` (ready) or `en préparation` (in preparation).
- `agenda` (optional): words searched in the title of the classes of the linked calendar (without capitals or accents): "Droit fiscal et des sociétés" contains `droit fiscal`. Used to offer "Review" next to a class and to attach an announced exam ("CC2 …") to its subject.
- `accueil`: `surtitre`, `resume` (card in the list of subjects), `intro` (optional), `sources`, `vide` (subject not ready).
- `themes`: list `{ "id", "nom" }`, in display order. The file `qcm/<id>.md` starts with `# <nom>`.
- `blocs`: one object per block. Setting `false` turns the block off; an object completes the model's settings; absence keeps the model.

| Block | Settings | Default |
|---|---|---|
| `seance_du_jour` | `max`, `nouvelles_par_jour`, `reprise_ecart`, `reprise_max` | 20, 10, 4, 3 |
| `qcm` | `serie_rapide`: number of questions per topic | no quick set |
| `cas` | | active if there is a `cas.md` |
| `exercices` | `intro` (text of the list), `note` (after the source of a solved exercise) | active if there is an `exercices.md`; note: "made-up figures" |
| `simulation` | `nom`, `duree_min`, `questions`, `cas` (exercise id), `points` `{quiz, cas}`, `accueil`, `intro`, `regles`, `programme`, `note`, `note_points` | off |
| `calcul` | `accueil` | off; needs `calcul.js` |
| `aide_claude` | `niveau`, `effort` | `default`, `low`; needs `regles.md` |
| `progression` | | active |
| `maitrise` | `niveaux`, `defaut`, `exigence` (v16), `regards` | active; four steps, no lens |

- `annexe` (optional): a document provided at the exam, shown on request in the questions marked `Barème : oui`. `bouton`, `masquer`, `colonnes`, `lignes`, `note`.
- `bilan.echeance`: end of the sentence of the summary ("à reprendre avant jeudi", to go over before Thursday). By default: "avant l'examen" (before the exam).

In the texts of the simulation, `**text**` is shown in bold.

## Mastery grid (block `maitrise`, v5.1)

On the page of a subject, each topic has four steps: **Comprendre** (meaning, formulas, why), **Savoir faire** (right figures, correct calculations, nothing forgotten), **Expliquer** (finding, meaning, causes) and **Recommander** (suitable solutions, with their limits). A step is confirmed by evidence:

- its multiple-choice questions (v16): at least `part` (80%) of its questions mastered. A question is mastered with at least `bonnes` (3) right answers on `jours` (2) different days, including `sans_choix` (1) without the choices when it lends itself to that, at least `ratio` (3) right answers per mistake, and the last answer right. A right answer "by guessing" doesn't count;
- its guided cases: each one fully solved on the first try, on `cas` (2) different days (kept in `<préfixe>casr`, tracked on the account);
- its exercise questions: `preuves` exercises corrected with at least `seuil` of the points (Juste = 1, À moitié = 0.5), including at least `seuil` of the questions answered right on `ex_jours` (2) different days.

The thresholds in brackets are those of the model; a recipe changes them with `blocs.maitrise.exigence`, for example `{"exigence": {"part": 0.7, "jours": 3}}` (missing keys keep the model's value). The same rules take a question out of the mistake notebook.

Each question carries its step with `Niveau : comprendre | faire | expliquer | recommander`. Without this line: multiple-choice question → comprendre, case step → faire, numerical answer → faire, written answer → expliquer (`defaut`). In a case, the `Niveau :` line under `Thème :` applies to all its steps; in an exercise, under `Thème :`, to all its questions, and a question can change it for itself alone.

The **lenses** ("beyond the calculation") belong to one subject: `blocs.maitrise.regards` = list `{ "id", "nom", "quoi" }`. A question carries one with `Regard : <id>`; the page offers one set per lens. `niveaux` replaces the whole list of steps (`id`, `nom`, `court`, `quoi`, `critere`, `seuil`, `preuves`, `aide`: instruction shown in the field for written answers of the step).

## Multiple-choice questions (`qcm/<thème>.md`, `simulation.md`)

```markdown
## ir1
Married couple, 3 dependent minor children. How many shares does the tax household have?

- [ ] 3
- [ ] 3,5
- [x] 4
- [ ] 5

Explication : 2 shares for the couple, + 0.5 for the 1st child, + 0.5 for the 2nd, + 1 from the 3rd on.

Source : Handout exercises 2 to 5 · sheet §1
```

- Optional, after the source: `Niveau : …` and `Regard : …` (see the mastery grid).
- A single `[x]` box: the right answer. The order of the options is shuffled when displayed, except with `Ordre fixe : oui`.
- `Barème : oui` offers the appendix on the question.
- Statement (v7.3, optional): lines `> …` before the text of the question, with tables and figures like the statement of a case (see below). The text of the question comes after.
- `Repère : DU, EH` (v7.3, optional): the lines of the standard documents (`documents.md`) where the figures of the question are found; the app highlights them. `Repère après : …`: only under the correction (for "Where do you find…?").
- Length of the choices (v7.1): the right answer must not be guessable from its length. Choices of comparable length and precision; nuances go in the explanation. The build warns (without rejecting) when the right answer is, alone, the longest in more than 40% of the questions of a subject (multiple-choice questions, case steps, simulation); a pack import does too.
- Free recall (v7.1): in the daily session, a question whose last answer was right with "sure" comes back without the choices (answer typed, then judged). The app avoids it by itself for "Which…", "Among…", "true or false" and the options "None / All", and for `Ordre fixe : oui`. `Rappel : non` forbids it for a question whose right answer only makes sense next to the others; `Rappel : oui` forces it.
- In `simulation.md`, each question also carries a line `Thème : <id>`.

## Cases in steps (`cas.md`)

`## <clé> · <name of the case>`, then `Thème : <id>`, the statement in lines `> …`, then each step like a multiple-choice question under `### <identifier>`.

Statements (cases, exercises, multiple-choice questions, v7.3): when there are a lot of figures, put them in a table, as in the exam document: `> | Passif | N-1 | N |`, `> |---|---|---|`, one line per item; an empty `>` line separates two tables. A column of numbers is aligned to the right; a line in `**bold**` serves as a group title ("Charges"), a line that starts with "=" or "Total" is a total. A figure (see "Figures") can also go in a statement.

## Written exercises (`exercices.md`)

```markdown
## e2 · Calculating the income tax, from A to Z
Thème : ir
Durée conseillée : 15 min
Barème : oui
Source : Handout exercises 3 to 5 · course sheet §0 and §1

> The statement, one line per line.

### Question 1
Number of shares?

Réponse : 3 parts
Calcul : 2 + 0,5 + 0,5 = 3.

### Question 9
What is the difference between a reduction and a tax credit?

Attendu : A reduction is not refundable…
```

- `Réponse : <number> <unit>`: corrected by the app. Optional: `Tolérance : 1`, `Accepté aussi : 3 496 ou 185 574`.
- `Attendu : …`: written answer, which the student marks himself or herself.
- Line breaks (v10.1): in `Explication`, `Calcul`, `Attendu` and `Indice`, a line that starts with `| ` is shown on a new line (an accounting entry, one account per line; credits indented with non-breaking spaces, kept). The other continuation lines stay joined. Same rule in a pack (`packSuite`, 02).
- `Repère : DU` (optional, v7.3, under `Thème :`): lines of the standard documents to highlight in the exercise.
- `Indice : …` (optional, v6.4): first hint of the guided mode, a lead without the result ("Think about the attachment of adult children"). Without it, the guided mode first offers the reminder from the course (the rules of the topic, `regles.md`).
- `Étiquette : …` (optional) replaces the name of the topic; the exercise is then cross-topic and Claude receives all the rules.

## Course sheets (`cours/<thème>.md`, v7.2)

One sheet per topic, read in the app (the "Cours" tile, "Read the course" inside a topic, "Review the essentials" under the correction of a question). Optional: a topic with no sheet is flagged on the Course screen.

```markdown
Durée : 9 min

## L'essentiel
- 5 to 8 bullets to know by heart (one phone screen).

## Le calcul pas à pas
Paragraphs, lists "-" and "1.", "### Subtitle", **bold**,
> box for a formula
| Mass | k€ |
|---|---|
| Stable uses | 13 862 |

Sources : precise documents (sheet, page, case, model solution)
```

- The first section is "## L'essentiel"; the "Sources :" line ends the sheet. "Durée" absent: calculated (150 words per minute, figures not counted). Nothing else (no "#", "####", HTML, links); tables with equal columns, the 2nd line "|---|---|"; figures "::: " (v7.3, below). The build rejects anything else, with the line. In a pack: section "# Cours · <thème>".

### Second format (v13.1): introduction, parts, "À retenir" at the end

The author's request (29 Oct.): theory first, then the example; a plan, an introduction, titles and subtitles. Both formats are accepted; the second is the one in the pack instructions.

```markdown
Durée : 8 min
Introduction : 2 or 3 sentences: what the chapter is about, what it is for.

## The audit risk
### Three risks that multiply
::: definition Audit risk
The probability of an **inappropriate opinion** on the accounts.
:::

::: formule
Audit risk = IR × CR × DR
:::

::: attention IR × CR is not the audit risk
It is the risk of material misstatements.
:::

## Materiality
::: exemple Industrial company, revenue 200 M€
- OM = 200 M€ × 0.5% = 1 M€
:::

## À retenir
- 5 to 8 bullets to know by heart.

Sources : Session 2, p. 6 to 12
```

- "Introduction :" (not empty) before the sections; at least two parts; "## À retenir" last; neither "L'essentiel" nor "À retenir" anywhere else. The app numbers the parts (a numbering such as "I." or "2)" written in the title is removed when displayed) and builds the plan from them, clickable, with "À retenir" at the end.
- Typed boxes, in a sheet only, never one inside another: `::: definition|formule|exemple|attention|source <optional title>` … `:::`, with sheet Markdown inside (table and figure included). Displayed names: Definition, Formula, Example, Pitfall, The documents differ; one color each (accent, gray, `--mid`, `--ko`, `--muted`).
- Key section: "L'essentiel" (first format) or "À retenir" (second): "Review the essentials" under the correction, rules of the helper when the topic has none written (`cle_fiche` ↔ `ficheCle`). The introduction goes into the fingerprint (review); a sheet in the first format keeps its own.
- In both formats (v13.1), "Avant de lire" is shown at the end of the sheet, folded, under the name "Test yourself".

## Summary sheet (`synthese.md`, v10.3)

Optional, one per subject, at the root of its folder: the whole programme on one sheet (to reread before an exam). Same format as a course sheet (`Avant de lire`, "## L'essentiel" first, sections, "Sources :" at the end). The app puts it at the top of the Course screen ("Summary sheet"); it has no topic (no set, no review). In a pack: section "# Synthèse".

## Making the reader search: "Avant de lire" and "À toi" (v7.5)

- `Avant de lire : <a question>` (optional, before `## L'essentiel`, like `Durée`): shown at the top of the sheet; you answer it from memory before reading. Take it up again, solved, in the last section `## Teste-toi`.
- Exercise to attempt, answer folded ("See the answer"), in a sheet or a statement:

```markdown
::: essai Calculate the gross margin of the company Example, year N (k€)
The data (optional, simple Markdown).
--
**22 251 k€.** The calculation and the pitfall to avoid.
:::
```

  One `--` line and only one; the answer cannot be empty. Same checks in a pack (`packFigure`, 02).

## Review of the sheets (`revue.md`, v7.4)

Optional. A review judges each sheet with the grid in `docs/grille-cours.en.md` (5 criteria of substance, 7 of form); the app certifies (a ticked circle) the sheet that has "oui" or "sans objet" on all 12 criteria, and only that one: a sheet that has just been written has no badge until it has been reviewed and reworked. It does not travel in a pack.

```markdown
# Relecture des fiches

Date : 2026-10-18
Par : Claude

A free intro (method, documents compared).

## sig
Empreinte : d42b2cfe
- juste · oui · Calculations redone: all right; SIG identical to the model solution.
- sources · oui · …
- (one line per criterion: juste, sources, examen, marches, exemples, structure, mots, concis, visuel, lisible, actif, envie)
```

- Verdicts: `oui`, `en partie`, `non`, `sans objet` (counts neither for nor against). Then what was seen, in one sentence.
- A single "en partie" or "non": no certification (the detail stays in `revue.md`).
- `Empreinte`: that of the text reviewed (`python3 build.py --empreintes <folder of the subject>`). If the sheet changes, the build flags it and the certification drops until the next review. A subject replaced by a pack keeps its badge only if the sheet is identical.
- The build rejects a missing date, an unknown, missing or duplicated criterion, an absent sheet, with the line.

## Figures (v7.3): diagrams and charts, in a sheet or a statement

The author's request: diagrams, charts, curves and pie charts, where they help to understand (not everywhere). A figure is written between a line `::: <type> <title>` and a line `:::`, one piece of data per line (`label | number`, numbers in the French way: `1 025 000`, `− 7 022`, `26,69`). The app draws it in light and dark, with the table of its figures below it. All accept `Note : …` (one sentence under the figure); `Unité : €` (or `k€`, `%`, `jours`) is added to the values. The build checks the figures and rejects a wrong figure, with the line.

| Type | Lines | Check |
|---|---|---|
| `cascade` | `+ label \| amount`, `− label \| amount`, `= label \| amount` (SIG, cash flow, cash) | starts with `+` or `=`, ends with `=`; each `=` must add up (within 1 on integers) |
| `bilan` | the masses on the left, a line `--`, those on the right: `label \| amount \| family`; `Colonnes : Emplois \| Ressources`; `Écart : FRNG \| 1 \| 1` | both sides equal; a gap compares the limits after n masses on the left and m on the right (FRNG: 1 and 1; TN: before cash) |
| `barres` | `label \| value`; with `Séries : N-1 \| N`, one value per series (2 or 3) | 1 to 12 lines, as many values as series |
| `courbe` | `Axe : 0 % \| 100 % \| 300 %`, then one line per curve: `name \| v1 \| v2 \| v3` | 1 to 3 curves; the axis is to scale if it is numeric |
| `camembert` | `label \| amount`, optional `Total : …` | 2 to 6 positive shares; the total, if given, must add up |
| `etapes` | `step \| detail` (detail optional) | 2 to 8 steps |
| `ecriture` (v10.4) | `D \| account \| label` then `C \| account \| label`, with `\| amount` if needed (title: the date and the operation) | at least one debit and one credit, debits first; amounts on all lines or on none, and then debits = credits |

- The family of a balance sheet mass gives it its color: same family, same color on both sides (the long cycle at the top, operations, cash at the bottom). A mass at 0 is not drawn but counts for the gaps.
- Balance sheet: heights are to the scale of the amounts, on a single scale for both columns (a limit that is lower in amount is also lower on screen); a small mass is enlarged just enough for its name, and the figure says so.
- As for the rest: figures from the model solutions and cases, nothing made up; a fact from outside the course is sourced.

## Standard documents (`documents.md`, v7.3): the balance sheet and the income statement, line by line

The author's request: a readable model of the balance sheet and the income statement, to know on exam day where to look for each figure. Optional; the app then adds the "Modèles" (Templates) tile (one document at a time, or a search across all of them).

```markdown
# Documents types

## bilan-passif · Balance sheet, liabilities
Source : tax return 2025, form 2051-SD (DGFiP) · sheet "Analysis of the financial structure"
> An optional intro, in "> " lines.

### Debts
- DU · Borrowings and debts with credit institutions · Functional balance sheet: stable resources, once taken out…
- EH · Of which bank overdrafts · Liabilities side of cash.
- icne · Of which accrued interest not yet due · Non-operating debts.
```

- `## <identifier> · <title>`, `Source :` required, groups `### <name>` in the order of the exam document.
- A line: `- <code> · <item> · <what the analysis does with it>` (the 3rd part is optional). The code is unique within the subject. Two capitals or digits (DU, FW, 2A): a code of the tax return, displayed; 3 to 8 digits (401, 44566): an account number, displayed (v8); otherwise (icne), an internal identifier, hidden. Questions refer to them with `Repère :`.
- v8: a line with two columns of codes, `- BJ / BK · Total II : fixed assets · …` (on the assets side: gross, then depreciation and impairment), and the name of the two columns under the source: `Colonnes : Brut · Amortissements et dépréciations`. The two codes are separate boxes in "Construire"; a marker can point to either.
- Before the answer, the app shows the card of the document with the lines highlighted, without "what the analysis does with it" (that would give the answer away); under the correction, these lines with what is done with them. Not in a simulation.
- As for the multiple-choice questions: nothing made up, figures from the model solutions, conflicts between sources flagged.

## Constructions (`constructions.md`, v8): a table built box by box

The author's request: build a table (functional balance sheet, SIG, cash flow statement, accounting entry, calculation…) line by line; at each line, the form is shown blank and you touch the box or boxes that apply. Optional; the app then adds the "Construire" (Build) tile.

```markdown
# Constructions

## exemple-bf · Functional balance sheet of the company Example
Thème : bf
Documents : bilan-actif, bilan-passif, renseignements
Unité : k€
Source : Made-up example for the documentation
Montants : BJ = 13 822 ; BK = 3 550 ; DU = 4 572 ; EH = 131
- cb-orig · Finance lease: original value of the equipment · 40

> The statement, in "> " lines (tables and figures allowed).

### es · Stable uses
Cases : BJ, cb-orig
Résultat : 13 862
Indice : The functional balance sheet takes gross values.
Explication : 13 822 + 40.

### rs · Stable resources
Cases : BK, DU, − EH
Admis : DM, DN
Résultat : 7 991
Explication : …

### frng · FRNG
Cases : @rs, − @es
Résultat : − 5 871
Explication : …
```

- `Documents :` the documents of `documents.md` shown as a form (none: only the data of the statement, as in tax law). `Montants :` the figures of the statement, box by box (several lines possible): shown when you choose "With the figures". `- <id> · <label> · <amount>`: a piece of data outside the form (finance lease, N-1…).
- `Signes : Débit / Crédit` (optional): the name of the two signs; otherwise + and −. Signs only count if a line subtracts something (or if `Signes :` is there).
- A line: `### <id> · <label>`, `Cases :` (`− EH`: subtracted, or on the credit side; `@es`: a line already built; `aucune`: nothing goes here), `Admis :` (boxes that are also right but empty in this statement: you can touch them without error), `Résultat :`, `Explication :` (required), `Indice :`.
- `build.py` rejects a result that doesn't add up (signed sum of the boxes, within 1 on integers), a box absent from the chosen documents and data, an `@` line not yet built, a missing amount for a line with `Résultat :`. A pack import makes the same checks (`packConstructions`).
- In the app: checking says how many boxes are right, extra, with the wrong sign, and how many are missing (not which ones); then the hint of the line, where to look for what is missing, the correction. Progress: `<préfixe>cons`.

## The Claude helper (`regles.md`)

Three required sections, `## Consigne · explication d'une question`, `## Consigne · question sur un exercice`, `## Consigne · correction d'une copie`, then one section `## Règle · <name>` per rule, with the line `Thèmes : ir, rcm`. Claude only receives the rules of the topic of the question: this is what keeps the helper economical in tokens. The first rule is that of the appendix: it is added when the question shows the appendix.

## The lock on identifiers (`ids.lock`)

The review memory is attached to the identifier of each question. `build.py` adds new identifiers to the lock and rejects the disappearance of a locked identifier: a question is corrected in place, never renamed. To really remove a question, also remove its line from the lock, knowing that its progress will be ignored.

## Packs: a whole subject in a single text (v7)

A pack gathers everything above for one subject: you import it into the app (Profile › Import a course) with no build and no Claude Code. An AI writes one from a course with `docs/modele-de-pack.en.md`, which the app copies ("Copy the answer template"). `build.py` writes the pack of each ready subject into `dist/packs/<id>.md` and files a pack in `univers/` (`--depaqueter <pack.md> <folder>`).

~~~markdown
# Pack · <title>

Titre : <title>
Identifiant : <id of the subject>
Univers : <id of a programme>          (optional: otherwise, the one chosen at import)
Surtitre : …    Résumé : …    Sources : …    Agenda : word, word    (optional, one line each)
Thème : <id> · <name>                   (one line per topic)
Regard : <id> · <name> · <what>         (optional, mastery grid)

```json
{ … the whole recipe, optional: the lines above complete it … }
```

# QCM · <id of the topic>     (the content of qcm/<thème>.md, without its title)
# Cas                     (cas.md)
# Exercices               (exercices.md)
# Simulation              (simulation.md)
# Documents               (documents.md, v7.3)
# Constructions           (constructions.md, v8)
# Règles                  (regles.md, optional since v13; missing instructions: modeles/consignes-par-defaut.md)
# Fin du pack
~~~

- What comes before "# Pack" and after "# Fin du pack" is ignored: an AI can wrap the pack in sentences or in ```.
- A section may come back (a pack given in two parts): its questions are added.
- Default values: model `matiere-de-cours`, status `prête`, `titre_h1` = title, storage `qfcc2.pk.<id>.`.
- Rules for the AI helper (v13): a topic that no "Règle · " covers receives the "L'essentiel" of its sheet ("<name of the topic> : l'essentiel", then the section). Same rule in build.py and in the app.
- The app (`src/js/02-packs.js`) makes the checks of `build.py` and produces the same recipe (`test_packs.py` checks parity on each ready subject). It also accepts "Clé: valeur", "**Clé :** valeur" and the options "* [x]".
- A pack that carries the identifier of a subject of the app replaces it, with its storage and its universe: progress follows.
- Other ways of asking (v13.4), in `qcm/<thème>.md` only (rejected in a case or a simulation), with "Type : " right under the question: `associer` (3 to 6 lines `- <left> = <right>`, no duplicate on either side; the app offers a list per element on the left), `ordonner` (3 to 7 numbered lines `1. …` in the right order; the app shuffles them, never in order, arrows ↑ ↓), `trous` (`___` in the question, one line `- [x] <what is missing>`; always asked with no choices, through free recall). Right only if everything is right; no confidence (right = 3, wrong = 1). Excluded from the iPhone widget. True or false and "find the mistake" are ordinary multiple-choice questions.
- Update pack (v13, in the app only): "Mise à jour : oui" in the header, the same identifier as an imported course, and only what changes. The app merges it into the imported course (`packFusion`, 02): Titre, Surtitre, Résumé, Sources, Agenda replaced; Thème and Regard by identifier; a sheet ("# Cours · ", "# Synthèse") replaced in full; in the other sections, a "##" block replaces the one with the same identifier (before " · ", whole title for a rule) or is added; nothing is deleted. A case or an exercise is sent back in full.
- Mental arithmetic (`calcul.js`) is code: it does not travel in a pack.
