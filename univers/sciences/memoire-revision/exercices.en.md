# Exercices

## ex1 · Reading the retention curve
Thème : espacement
Durée conseillée : 10 min
Source : Course sheet · forgetting and spacing

> Simplified form of the curve: R(t, S) = (1 + 19/81 × t/S)^(−0.5).
> | Card | Stability |
> |---|---|
> | Card A | 5 days |
> | Card B | 3 days |

### Question 1
What is the probability of recall of card A after 10 days?

Réponse : 82,5 %
Tolérance : 0,1
Calcul : t/S = 10/5 = 2. R = (1 + 19/81 × 2)^(−0.5) = (1.4691)^(−0.5) = 0.825.
Indice : first work out the ratio t/S.

### Question 2
What is the probability of recall of card B after 9 days?

Réponse : 76,6 %
Tolérance : 0,1
Calcul : t/S = 9/3 = 3. R = (1 + 19/81 × 3)^(−0.5) = (1.7037)^(−0.5) = 0.766.
Indice : the ratio t/S is a whole number here.

### Question 3
After how many days does R for card B fall to 70%?

Réponse : 13,3 days
Tolérance : 0,1
Calcul : t = S × (81/19) × (R^(−2) − 1) = 3 × 4.2632 × (2.0408 − 1) = 13.3.
Indice : isolate t/S in the formula, then multiply by S.

### Question 4
Explain in a few sentences why reviewing when R is 90% is more effective than waiting until R falls to 50%.

Attendu : at 90%, you can still retrieve the memory with a little effort, and your stability goes up. At 50%, less of it is left: you risk having to relearn everything. Reviewing early costs a few more passes, but the memory lasts longer.
