# Instructions: turn a course into a revision pack

You are going to read my course documents (handouts, slides, notes, past exams and their solutions) and build a revision pack for my app from them. The app reads the pack exactly as written and rejects any line that doesn't follow the format, telling me which line to fix. You work in two stages: first the framing, then the production, only after I agree.

**Important: language of the format.** The pack is written in English (questions, explanations, course sheets, sources), but the **syntax keywords of the format stay in French, exactly as shown below**, because the app's parser reads them literally. This covers the section headings (`# Pack ·`, `# QCM ·`, `# Cours ·`, `# Cas`, `# Exercices`, `# Fin du pack`…), the field names (`Titre :`, `Identifiant :`, `Thème :`, `Explication :`, `Source :`, `Réponse :`, `Calcul :`, `Indice :`, `Attendu :`…), the box types (`definition`, `formule`, `exemple`, `attention`, `source`), the question types (`associer`, `ordonner`, `trous`), and the fixed values (`oui`, `non`, `comprendre`, `faire`, `expliquer`, `recommander`). Never translate or alter them. Only the text that comes after them is in English. Write a field as: the keyword, a space, a colon, a space, then the value (the French spacing before the colon is part of the keyword).

## Stage 1 · Framing

Read all the documents. Do not produce the pack yet. Answer in 400 words at most, in English, with these four parts:

1. **What I understood**: the course or courses, the teacher, the language, the sessions or chapters, the exam if it is mentioned (format, length, date).
2. **Proposed plan**: one chapter = one topic, with a short identifier and a name. For each one: the course sheet, the number of multiple-choice questions, the cases and exercises planned.
3. **Points to settle**: for each point, your default answer in square brackets. Look for at least these:
   - several courses in the documents [one pack per course];
   - an exercise with no solution [I work it out with the course and write "solution worked out by the AI" in its source];
   - documents that contradict each other [I point it out in the explanation];
   - sessions or chapters announced but missing [I cover what I have and say so in the summary];
   - unreadable content (image, graph) [I take no figure from it];
   - documents in another language [pack in English, original term in brackets].
4. **What you can add**: your notes, what the teacher said out loud, the exam format and date, what you find difficult. Write it or dictate it.

End with: "Shall I start production with this plan? Reply "go ahead" or correct whatever you want."

If I reply "go ahead" with nothing else, apply your default answers. What I bring you (notes, things said in class) goes into the pack, with "your notes" as the source.

## Completing or updating a course already imported

If I also give you an existing pack (it starts with "# Pack · "), we complete it (new sessions, new documents) or correct it.

- At framing, say what it already contains (topics, number of questions), what you add and what you correct.
- At production, return **only what changes**, in an update pack: "# Pack · <same title>", "Identifiant : <the same>", "Mise à jour : oui", then:
  - the "Thème :" lines that are new or renamed;
  - each question added or corrected, in full, under "# QCM · <topic>"; each case or exercise added or corrected, in full with all its steps or questions, under "# Cas" or "# Exercices";
  - each sheet added or corrected, in full ("# Cours · <topic>").
- To correct, keep the existing identifier: the app replaces the old version and keeps my progress. To add, take a new identifier that follows the numbering (au9 after au8). Never rename or delete an identifier.
- The app merges this pack with the old one, then checks the whole.

## Stage 2 · Production

### Delivery

- If you can create a file (downloadable file, artifact, document), put the pack in a file named `<identifier>.pack.md`. Otherwise, write the raw text, with no code block around it.
- The pack goes from the line "# Pack · …" to the line "# Fin du pack", nothing before, nothing after. Outside the pack, two lines at most: what is done, what remains to check.
- Too long for one reply: stop after a complete question and write "(to be continued in the next message)". When I say "continue", resume exactly there, repeating nothing.

### Rules of substance

1. Invent nothing. Every question, every figure, every rule comes from the documents or from my notes. If a figure is missing, don't ask the question.
2. Every question has an explanation (1 to 3 sentences) and a precise source: document, page or slide.
3. Rephrase: don't copy long passages.
4. Multiple-choice question: one right answer and three plausible wrong ones, drawn from common mistakes.
5. The four choices have a comparable length and precision: the right answer is not the longest. Nuances go in the explanation. Vary its position.
6. Cover the whole validated plan: at least 8 multiple-choice questions per topic when the course allows it, guided cases to apply, exercises to practise as on exam day.
7. Address me as "you", use short sentences, write in English.

### The format, to follow to the letter

Elements in angle brackets are to be replaced, brackets included. Remember: the French keywords stay as they are (see the note at the top).

```
# Pack · <title of the subject>

Titre : <title of the subject>
Identifiant : <lowercase without accents, digits and hyphens: audit-legal>
Surtitre : <one line: Final exam · statutory audit>
Résumé : <one line: what the pack contains>
Sources : <the documents used>
Thème : <topic-id> · <Topic name>
Thème : <topic-id> · <Topic name>

# QCM · <topic-id>

## <question-id>
<Text of the question>

- [ ] <wrong answer>
- [x] <right answer>
- [ ] <wrong answer>
- [ ] <wrong answer>

Explication : <why it is the right answer>
Source : <document, page or slide>

# Cours · <topic-id>

Durée : <n> min
Introduction : <2 or 3 sentences: what the chapter is about, what it is for>

## <title of the part>
### <title of the sub-part>
<the idea: definition, rule, conditions>

::: exemple <title>
<the example from the course, after the idea>
:::

## <title of the next part>
<…>

## À retenir
- <5 to 8 points to know by heart>

Sources : <documents>

# Cas

## <case-key> · <name of the case>
Thème : <topic-id>

> <problem statement, one piece of data per line>

### <step-id>
<question of the step>

- [x] <right answer>
- [ ] <wrong answer>
- [ ] <wrong answer>
- [ ] <wrong answer>

Explication : <explanation of the step>
Source : <document, page>

# Exercices

## <exercise-id> · <title>
Thème : <topic-id>
Durée conseillée : <n> min
Source : <document, page>

> <problem statement, one piece of data per line>

### Question 1
<question whose answer is a number>

Réponse : <number> <unit>
Calcul : <the detailed calculation>
Indice : <a hint that does not give the result>

### Question 2
<question whose answer is written out>

Attendu : <the expected answer, in a few sentences>

# Fin du pack
```

### Details

- Identifiers: letters without accents, digits, "-" and "_", no spaces, all different within the pack. One prefix per topic for the questions: au1, au2…
- One "# QCM · <topic>" section per topic in the header.
- One sheet "# Cours · <topic>" per topic, after the questions: "Introduction :", then 2 to 5 parts "##" with their sub-parts "###", then "## À retenir" last, then "Sources :". Don't number the parts: the app does it and builds the plan from them.
- In a sheet, theory first, example next: a sheet is never a string of examples. Boxes go between "::: <type> <title>" and ":::", never one inside another: "definition" (a term), "formule", "exemple", "attention" (a common pitfall), "source" (two documents that contradict each other). Also allowed: lists "-" and "1.", **bold**, tables ("| a | b |" then "|---|---|"). The box titles and the text inside are in English; the type word stays as written.
- "À retenir" is also what the app's AI helper receives: make it exact and complete.
- "# Cas" and "# Exercices" are optional. Each case and each exercise has its "Thème :" line and at least one statement line "> ". Each exercise has "Durée conseillée" and "Source".
- A blank line ends an explanation. The options all begin with "- [ ]" or "- [x]".
- Vary the ways of asking: in the "# QCM · <topic>" sections, about one question in four takes one of these forms, chosen according to what it trains:
  - **True or false** (a misconception): two choices "- [ ] True" and "- [x] False" (or the reverse), "Ordre fixe : oui"; the explanation says why.
  - **Find the mistake** (a line of reasoning or a calculation): the statement in "> " lines, one step per line; the choices are the steps; the right one is the wrong step; "Niveau : expliquer".
  - **Match** (who does what, term and definition): "Type : associer" right under the question, then 3 to 6 lines "- <left> = <right>".
  - **Put in order** (steps, procedure, timeline): "Type : ordonner" right under the question, then 3 to 7 lines "1. …", "2. …" in the right order (the app shuffles them).
  - **Fill in the blanks** (a figure, a threshold, a key word): "___" in the question in place of what is missing, "Type : trous" right under the question, then a single line "- [x] <what is missing>".
  Match, put in order and fill in the blanks: only in "# QCM", never in a case or a simulation.
- After the source, optional: "Ordre fixe : oui" if the order of the choices matters ("None of the answers"); "Rappel : non" if the right answer only makes sense with the other choices (the app can ask a known question again without its choices); "Niveau : comprendre | faire | expliquer | recommander" (by default: multiple-choice question comprendre, case step faire, numerical answer faire, written answer expliquer).
- Numerical answer: the number first, then the unit. The app reads numbers in the French way: a space between thousands and a comma for decimals, even in an English pack (3 496,50 €). Optional: "Tolérance : 1", "Accepté aussi : 3 496 ou 3 500".
- Optional: "# Règles", only for a rule that no sheet contains (a scale shared by several topics): "## Règle · <name>", then "Thèmes : <id>, <id>", then the rule.

### Only if the course has calculations, tables of figures or graphs

- Many figures in a statement (balance sheet, income statement, N-1 and N): a table as in the exam paper, each line starting with "> ": "> | Item | N-1 | N |", "> |---|---|---|", then one line per item. A multiple-choice question can have a statement: its "> " lines come before the question.
- Figures, in sheets and statements, only where they help: between "::: <type> <title>" and ":::". Types:
  - "cascade": lines "+ label | amount", "− label | amount", "= label | amount"; each "=" must add up exactly;
  - "barres": "label | value", or "Séries : N-1 | N" then one value per series;
  - "courbe": "Axe : x1 | x2 | x3" then "name | v1 | v2 | v3";
  - "camembert": 2 to 6 shares "label | amount", "Total : …";
  - "etapes": "step | detail".
  Optional in all of them: "Unité : €", "Note : <one sentence>". Only figures from the documents.

### Only if the course is about accounting or finance

- Figure "bilan": the left-hand masses "label | amount | family", a line "--", then the right-hand ones; "Colonnes : Emplois | Ressources"; "Écart : FRNG | 1 | 1" compares the limits after 1 mass on the left and 1 on the right. The two sides are equal.
- Figure "ecriture" (journal entry): "D | account | label | amount" for each debit, then "C | … " for each credit; debits first, exact balance.
- Standard documents of the exam (asset side, liabilities side, income statement…): a "# Documents" section at the end. For each one: "## <id> · <title>", "Source : …", groups "### <name>" in the order of the document, one line per item "- <code> · <item> · <what the analysis does with it>" (code from the official form if you are sure of it, otherwise a short identifier). Under the source of a question: "Repère : <code>, <code>" (where to look for its figures), or "Repère après : <code>" if showing it beforehand would give away the answer.
- Constructions (functional balance sheet, intermediate balances, cash flow statement, journal entry): a "# Constructions" section after "# Documents". For each table: "## <id> · <title>", "Thème : <id>", "Documents : <id>, <id>" (none for a calculation on the statement alone), "Unité : €", "Source : …", "Montants : <code> = <number> ; …", data outside the form "- <id> · <label> · <amount>", "Signes : Débit / Crédit" for a journal entry, and the statement in "> " lines. Then one line of the table per "### <id> · <label>" with "Cases : <code>, − <code>, @<id of a line already done>" ("aucune" if nothing fits), "Admis : <code>" optional, "Résultat : <number>" (the signed sum of the boxes adds up exactly), "Explication : …", "Indice : …" optional.
- "Beyond the calculation" lenses (optional): in the header, "Regard : <id> · <name> · <what it looks at>"; under the source of the questions concerned, "Regard : <id>".

### Before handing it over, check

- [ ] Each topic of the header has its "# QCM · <topic>" section and its "# Cours · <topic>" sheet.
- [ ] Each multiple-choice question and each case step: four options (two for a true or false), a single "- [x]", an explanation, a source; match, put in order and fill in the blanks in the format above.
- [ ] The right answer is the longest in fewer than a third of the questions, and its position varies.
- [ ] Each case and each exercise: "Thème :" and at least one "> " line. Each exercise: "Durée conseillée", "Source", and for each question "Réponse" with "Calcul", or "Attendu".
- [ ] Each sheet: "Introduction :", at least two parts, "## À retenir" last, "Sources :" at the end, each box closed by ":::".
- [ ] All identifiers are different, with no accents or spaces.
- [ ] No figure and no rule from outside the documents and my notes; any solution worked out by you is flagged.
- [ ] The pack ends with "# Fin du pack".
- [ ] Update: "Mise à jour : oui", same identifier, only what changes, no existing identifier renamed.
- [ ] All syntax keywords are still in French, exactly as in the format above.
