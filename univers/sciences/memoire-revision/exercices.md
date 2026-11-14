# Exercices

## ex1 · Lire la courbe de rétention
Thème : espacement
Durée conseillée : 10 min
Source : Fiche de cours · oubli et espacement

> Forme simplifiée de la courbe : R(t, S) = (1 + 19/81 × t/S)^(−0,5).
> | Carte | Stabilité |
> |---|---|
> | Carte A | 5 jours |
> | Carte B | 3 jours |

### Question 1
Quelle est la probabilité de rappel de la carte A après 10 jours ?

Réponse : 82,5 %
Tolérance : 0,1
Calcul : t/S = 10/5 = 2. R = (1 + 19/81 × 2)^(−0,5) = (1,4691)^(−0,5) = 0,825.
Indice : calcule d'abord le rapport t/S.

### Question 2
Quelle est la probabilité de rappel de la carte B après 9 jours ?

Réponse : 76,6 %
Tolérance : 0,1
Calcul : t/S = 9/3 = 3. R = (1 + 19/81 × 3)^(−0,5) = (1,7037)^(−0,5) = 0,766.
Indice : le rapport t/S est un nombre entier ici.

### Question 3
Au bout de combien de jours R de la carte B tombe-t-elle à 70 % ?

Réponse : 13,3 jours
Tolérance : 0,1
Calcul : t = S × (81/19) × (R^(−2) − 1) = 3 × 4,2632 × (2,0408 − 1) = 13,3.
Indice : isole t/S dans la formule, puis multiplie par S.

### Question 4
Explique en quelques phrases pourquoi réviser quand R vaut 90 % est plus efficace que d'attendre que R tombe à 50 %.

Attendu : à 90 %, tu retrouves encore le souvenir avec un petit effort, et ta stabilité augmente. À 50 %, il t'en reste moins : tu risques de devoir tout réapprendre. Réviser tôt coûte un peu plus de passages, mais le souvenir tient plus longtemps.
