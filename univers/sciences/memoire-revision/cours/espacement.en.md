Introduction : Reviewing at the right time beats reviewing often. This chapter explains the spacing effect and how FSRS decides when a card comes back. This is what the daily session does.

## The spacing effect
### Spread out rather than pack together
::: definition Spacing effect
For the same amount of study time, reviews **spread over time** give a more durable memory than reviews packed together.
:::

Cramming the night before an exam helps in the short term. The memory then fades quickly. The synthesis by Dunlosky and colleagues (2013) ranks spaced practice among the most useful techniques.

::: attention Spacing does not mean waiting until you have forgotten everything
If you let R fall too low, you start almost from zero. The right moment is when recall takes a little effort.
:::

## Intervals that grow
### The more solid it is, the longer you wait
When you succeed on a card, its stability goes up. The card can therefore wait longer before coming back.

::: courbe Three cards, three stabilities
Axe : 0 | 2 | 4 | 8 | 16 | 32
S = 2 days | 100 | 90 | 82,5 | 71,8 | 59 | 45,9
S = 4 days | 100 | 94,6 | 90 | 82,5 | 71,8 | 59
S = 8 days | 100 | 97,2 | 94,6 | 90 | 82,5 | 71,8
Unité : %
Note : simplified form of the FSRS curve, fixed slope. Axis: days since the last review. Stabilities of 2, 4 and 8 days illustrate successive successful reviews.
:::

### The probability at each step
Measure time in multiples of S. For t = S, R is 90%. After that, R falls more and more slowly.

::: barres Probability of recall by t/S
t = 1 × S | 90
t = 2 × S | 82,5
t = 3 × S | 76,6
t = 4 × S | 71,8
t = 5 × S | 67,8
Unité : %
Note : formula from the Forgetting curve sheet, values rounded to 0,1.
:::

## FSRS: three quantities
### Difficulty, stability, probability of recall
FSRS comes from the open-source open-spaced-repetition project. It tracks three quantities for each card.

| Quantity | What it is |
|---|---|
| Difficulty (D) | How hard the card is, from 1 to 10 |
| Stability (S) | Days before R falls to 90% |
| Probability of recall (R) | Chance you remember right now |

### What your rating does
After each answer, you rate from 1 to 4. FSRS derives a new difficulty and a new stability from it. After a lapse, stability drops.

::: formule Next review ≈ S days later
The app aims for a retention of 90 %. Since R is 90 % when t = S, the interval equals S, rounded, with a minimum of 1 day.
:::

::: attention 90 % does not mean 100 %
R is a probability. On average, about one card in ten is already forgotten when it comes back. This is intended: the effort of recall makes your memory work.
:::

::: exemple When should it come back to aim for R = 70 %?
For the form in the sheet, t = S × (81/19) × (R^(−2) − 1).
With R = 0,7: t = S × 4,263 × 1,041 = 4,4 × S.
A card with S = 4 days would come back after 17,7 days: too late to aim for 90 %.
:::

## À retenir
- Spread-out reviews are remembered better than packed ones.
- Cramming helps in the short term, then the memory fades.
- A successful review raises stability: the interval grows.
- FSRS tracks D (difficulty), S (stability) and R (probability of recall).
- Stability is the delay at which R is 90%.
- The app schedules the next review when R reaches 90%, that is S days later.
- After a lapse, stability drops and the card comes back sooner.
- The curve is not a straight line: R falls more and more slowly.

Sources : open-source open-spaced-repetition project (FSRS) ; Dunlosky et al., Improving Students' Learning With Effective Learning Techniques (2013) ; app code, spaced repetition module. Values recomputed for this sheet.
