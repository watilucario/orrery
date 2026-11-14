Introduction : You forget, and that is normal. This chapter shows how forgetting evolves over time and what slows it down. It gives you the formula the app uses to estimate what you still know.

## The forgetting curve
### What Ebbinghaus observed
In 1885, Hermann Ebbinghaus published his experiments on his own memory. He learned lists of nonsense syllables. He waited, then relearned them. What he saved when relearning told him how much remained.

::: definition Forgetting curve
The **decline of memory as a function of the time** elapsed without review. It drops fast at first, then more and more slowly.
:::

### A formula to describe it
Current models, such as FSRS, write this curve as a formula. It gives R, the **probability of recall**: the chance that you remember at that moment.

::: formule R(t, S) = (1 + 19/81 × t/S)^(−0,5)
t: days since the last review. S: stability, in days.
:::

::: definition Stability (S)
The number of days after which R falls to **90 %**. If t = S, then R = 0,9.
:::

::: courbe Probability of recall by stability
Axe : 0 | 1 | 2 | 4 | 7 | 14 | 21 | 30
S = 2 days | 100 | 94,6 | 90 | 82,5 | 74,1 | 61,5 | 53,7 | 47
S = 8 days | 100 | 98,6 | 97,2 | 94,6 | 91,1 | 84,2 | 78,7 | 72,9
Unité : %
Note : simplified form of the FSRS curve, fixed slope. The app uses the full FSRS-6 parameters. Axis: days since the last review.
:::

## Why we forget
### Three classic explanations
- **The trace weakens** when you do not use it.
- **Similar memories interfere**: two neighboring ideas get mixed up.
- **The cue is missing**: the memory exists, but you cannot find the path to it.

::: attention Forgetting does not mean misunderstanding
Even a well-understood idea fades without review. Forgetting is not a failure: it is the signal that you need to review.
:::

## What the curve changes for you
### Stability flattens the curve
The larger S is, the more slowly the curve falls. A successful review raises S. So you do not need to review everything all the time.

::: exemple Two cards, seven days later
Card A: S = 2 days. Card B: S = 8 days.
- A: R = (1 + 19/81 × 7/2)^(−0,5) = 74,1 %.
- B: R = (1 + 19/81 × 7/8)^(−0,5) = 91,1 %.
Card A is the more fragile: it goes first.
:::

## À retenir
- The forgetting curve describes the decline of memory over time.
- Ebbinghaus studied it in 1885, on himself, with nonsense syllables.
- Forgetting is fast at first, then slows down.
- R is the probability of recall, between 0 and 1.
- Stability S is the delay at which R is 90%.
- With the form from the sheet: R = (1 + 19/81 × t/S)^(−0.5).
- Forgetting is normal: it is not proof that you misunderstood.
- A card with low S is reviewed before a card with high S.

Sources : Ebbinghaus, Über das Gedächtnis (1885) ; open-source open-spaced-repetition project (FSRS) ; app code, spaced repetition module. Values recomputed for this sheet.
