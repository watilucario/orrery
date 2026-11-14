# Review grid for a course sheet

The author's request (18 Oct 2026): to know whether a course is good, meaning easy to understand, quick to absorb, and making you want to learn; to judge his courses and show it with a badge. This grid applies to all subjects. It is used to review a sheet (`univers/<programme>/<matière>/cours/<thème>.md`) and to fill in the subject's review (`revue.md`, format in `univers/README.en.md`). The app draws the badge of each sheet from it (v7.4, `03c`).

## The principle

A course is good if it makes you reach the goal of the exam, quickly and lastingly. It is therefore judged on two levels:

- **substance**: what it teaches is right, sourced, and is what the exam asks for, at the level where it asks for it;
- **form**: the way it is presented reduces useless effort, makes memory work and makes you want to go on.

Substance comes before form: a pleasant but wrong sheet does harm.

**Certification** (the ticked circle in the app): only if all 12 criteria are "oui" (yes) or "sans objet" (not applicable) and the text is the one that was reviewed. Never automatic: a sheet that has just been written is not certified until it has been reviewed and reworked to meet the whole grid.

The criteria adapt to the goal of the topic: a classification topic (the functional balance sheet) calls for no recommendation; it is then marked "sans objet", which counts neither for nor against.

## The 12 criteria

Each criterion gets a verdict: **oui** (yes), **en partie** (partly), **non** (no) or **sans objet** (not applicable), and one sentence that says what was seen (a figure, a section, an example). The verdict words stay in French in `revue.md`, because the app reads them as written.

### Substance

| Criterion | The question | How to check |
|---|---|---|
| `juste` · Correct | Are the figures and formulas exact? | Redo each calculation; compare the amounts with the model solutions; a conflict between two sources is flagged, with the choice made. |
| `sources` · Sourced | Can you find where each fact comes from? | A precise "Sources:" line (document, paragraph, appendix); any fact from outside the course (standard, law, rate) has its source. |
| `examen` · Aligned with the exam | Does it teach what the exam asks, at the level asked? | The typical outline of the answer is given; a past paper or a model solution serves as an example; the app's questions are about the sheet. (Constructive alignment: Biggs, 1996.) |
| `marches` · The four steps | Does it take you from "understand" up to "recommend" when the exam asks for it? | Definitions, calculation, reading the result, recommendations with their limits; the "beyond the calculation" lenses for a finance subject. (Revised Bloom's taxonomy: Anderson and Krathwohl, 2001.) |
| `exemples` · Examples and pitfalls | Is there a worked example, step by step, and the typical mistakes? | A case from the course solved in full; each pitfall with the wrong result it gives. (Worked example effect: Sweller; Pashler et al., 2007.) |

### Form

| Criterion | The question | How to check |
|---|---|---|
| `structure` · Signposted structure | Do you always know where you are? | The same outline from one sheet to the next ("L'essentiel", "À quoi ça sert", "Les mots", "Le calcul pas à pas", "Comment lire", "À l'examen", "Les pièges", "Au-delà du calcul": the essentials, what it is for, the words, the calculation step by step, how to read it, at the exam, the pitfalls, beyond the calculation); titles that say what is below them. (Mayer: signaling principle.) |
| `mots` · Words first | Is the vocabulary explained before it is used? | "Les mots à connaître" (the words to know) before the calculation; each acronym spelled out at its first appearance. (Mayer: pre-training principle.) |
| `concis` · Concise | Is there anything to remove? | No table that repeats a figure (the figure already has its folded table); no passage copied from another sheet; length at the app's pace (150 words per minute). (Mayer: coherence principle.) |
| `visuel` · Useful visual | Does a figure show the central mechanism? | The diagram of the mechanism (not just of the result), placed next to the text that explains it; readable on a phone. (Mayer: multimedia and contiguity principles.) |
| `lisible` · Readable | Does it read without effort? | Short sentences (twenty words at most), direct address ("you"), figures in a table rather than in a paragraph. (Mayer: personalization principle.) |
| `actif` · Makes you search | Does the reader have to retrieve or calculate something before reading the answer? | A question before reading, a calculation to attempt before the solution, a few recall questions at the end. (Testing effect: Roediger and Karpicke, 2006; pretesting: Richland, Kornell and Kao, 2009; Dunlosky et al., 2013.) |
| `envie` · Makes you want more | Does it give a reason to read on? | A concrete hook at the start (a riddle, a stake in numbers, the exam); the usefulness said early; simple to difficult; a quick success. (Keller: ARCS model, attention, relevance, confidence, satisfaction.) |

### Measurable markers

These markers help to judge; they are not scientific norms, and the verdict remains a reading.

- **Duration**: words outside figures ÷ 150 (the app's pace). Silent reading of a factual text is faster (238 words per minute in English, meta-analysis by Brysbaert, 2019), but a sheet with calculations is read more slowly. A "Durée" line shorter than this calculation misleads the reader.
- **Duplicates**: a figure and a table that give the same numbers; an example redone in full in two sheets.
- **Density**: a line of text with more than about ten numbers reads better as a table.
- **Opening**: what you see on the first phone screen (today: "L'essentiel", a list of formulas).

## What research says, in short

- **What works best for remembering**: testing yourself (retrieving an answer from memory) and spacing reviews over time. These are the two techniques rated "highly useful" out of ten by Dunlosky et al. (2013). Rereading, highlighting and summarizing are rated "of low utility". The app already does the first two (multiple-choice questions, free recall, FSRS spaced repetition); a sheet can start them off itself.
- **Getting it wrong first also helps**: trying to answer before having learned, even wrongly, improves the memorization of the answer read afterwards (Richland, Kornell and Kao, 2009).
- **Words and images together**, with nothing useless, with structure cues and vocabulary first (Mayer's principles).
- **Beginner or expert, not the same sheet**: the worked example helps the beginner, but hinders someone who already masters the subject (expertise reversal effect: Kalyuga, Ayres, Chandler and Sweller, 2003). Hence the idea of a guided first reading and a reread through "L'essentiel".
- **The four pillars of learning** (Dehaene): attention, active engagement, feedback, consolidation. A sheet that is only read serves just one.
- **Aligning** what is taught, what is practised and what is assessed (Biggs, 1996).
- **Motivating**: catching attention, showing relevance, giving confidence, leaving a success (Keller, ARCS).

## Sources

- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J. and Willingham, D. T. (2013). Improving students' learning with effective learning techniques. *Psychological Science in the Public Interest*, 14(1), 4-58. https://doi.org/10.1177/1529100612453266
- Roediger, H. L. and Karpicke, J. D. (2006). Test-enhanced learning: taking memory tests improves long-term retention. *Psychological Science*, 17(3), 249-255. https://doi.org/10.1111/j.1467-9280.2006.01693.x
- Richland, L. E., Kornell, N. and Kao, L. S. (2009). The pretesting effect: do unsuccessful retrieval attempts enhance learning? *Journal of Experimental Psychology: Applied*, 15(3), 243-257.
- Mayer, R. E. *Multimedia Learning*, Cambridge University Press (1st ed. 2001): the principles of coherence, signaling, contiguity, segmenting, pre-training, multimedia, personalization. Summary: https://services.dartmouth.edu/TDClient/1806/Portal/KB/PrintArticle?ID=171655
- Kalyuga, S., Ayres, P., Chandler, P. and Sweller, J. (2003). The expertise reversal effect. *Educational Psychologist*, 38(1), 23-31.
- Pashler, H. et al. (2007). *Organizing Instruction and Study to Improve Student Learning* (NCER 2007-2004). Institute of Education Sciences: space out reviews, test yourself, alternate worked examples and problems, link the abstract and the concrete, ask questions that make you explain.
- Biggs, J. (1996). Enhancing teaching through constructive alignment. *Higher Education*, 32, 347-364.
- Anderson, L. W. and Krathwohl, D. R. (eds.) (2001). *A Taxonomy for Learning, Teaching, and Assessing*. Longman.
- Keller, J. M. The ARCS model (attention, relevance, confidence, satisfaction), 1980s.
- Dehaene, S. Course at the Collège de France (2015) and *Apprendre ! Les talents du cerveau, le défi des machines*, Odile Jacob, 2018: https://www.college-de-france.fr/site/stanislas-dehaene/course-2015-01-13-09h30.htm
- Brysbaert, M. (2019). How many words do we read per minute? A review and meta-analysis of reading rate. *Journal of Memory and Language*.

## Reviewing a sheet, step by step

1. Read the sheet as its author would: on a phone, from top to bottom, without the sources.
2. Redo each calculation; compare with the model solutions in `content/`; check each outside fact.
3. Measure: `python3 build.py --empreintes <folder>` gives the fingerprint; count the words, the duplicates, the density.
4. Fill in `revue.md`: one verdict and one sentence per criterion, saying what was seen.
5. Build: the badge appears. If the sheet changes afterwards, the build says so and the badge drops until the next review.
