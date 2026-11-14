Introduction : Revoir au bon moment vaut mieux que revoir souvent. Ce chapitre explique l'effet d'espacement et la façon dont FSRS décide quand une carte revient. C'est ce que fait la séance du jour.

## L'effet d'espacement
### Étaler plutôt que concentrer
::: definition Effet d'espacement
À temps de travail égal, des révisions **réparties dans le temps** donnent un souvenir plus durable que des révisions concentrées.
:::

Le bourrage la veille d'un examen aide à court terme. Le souvenir s'efface ensuite vite. La synthèse de Dunlosky et ses collègues (2013) classe la pratique espacée parmi les techniques les plus utiles.

::: attention Espacer ne veut pas dire attendre d'avoir tout oublié
Si tu laisses R tomber trop bas, tu repars presque de zéro. Le bon moment est celui où le rappel demande un petit effort.
:::

## Des intervalles qui s'allongent
### Plus c'est solide, plus on attend
Quand tu réussis une carte, sa stabilité augmente. La carte peut donc attendre plus longtemps avant de revenir.

::: courbe Trois cartes, trois stabilités
Axe : 0 | 2 | 4 | 8 | 16 | 32
S = 2 jours | 100 | 90 | 82,5 | 71,8 | 59 | 45,9
S = 4 jours | 100 | 94,6 | 90 | 82,5 | 71,8 | 59
S = 8 jours | 100 | 97,2 | 94,6 | 90 | 82,5 | 71,8
Unité : %
Note : forme simplifiée de la courbe FSRS, pente fixe. Axe : jours depuis la dernière révision. Les stabilités 2, 4 et 8 jours illustrent des révisions réussies successives.
:::

### La probabilité à chaque palier
Mesure le temps en multiples de S. Pour t = S, R vaut 90 %. Ensuite R baisse de moins en moins vite.

::: barres Probabilité de rappel selon t/S
t = 1 × S | 90
t = 2 × S | 82,5
t = 3 × S | 76,6
t = 4 × S | 71,8
t = 5 × S | 67,8
Unité : %
Note : formule de la fiche Courbe de l'oubli, valeurs arrondies à 0,1.
:::

## FSRS : trois grandeurs
### Difficulté, stabilité, probabilité de rappel
FSRS vient du projet open-source open-spaced-repetition. Il suit trois grandeurs pour chaque carte.

| Grandeur | Ce que c'est |
|---|---|
| Difficulté (D) | Dureté de la carte, de 1 à 10 |
| Stabilité (S) | Jours avant que R tombe à 90 % |
| Probabilité de rappel (R) | Chance de te souvenir maintenant |

### Ce que fait ta note
Après chaque réponse, tu notes de 1 à 4. FSRS en tire une nouvelle difficulté et une nouvelle stabilité. Après un oubli, la stabilité baisse.

::: formule Prochaine révision ≈ S jours plus tard
L'app vise une rétention de 90 %. Comme R vaut 90 % quand t = S, l'intervalle est égal à S, arrondi, d'au moins 1 jour.
:::

::: attention 90 % ne veut pas dire 100 %
R est une probabilité. En moyenne, environ une carte sur dix est déjà oubliée quand elle revient. C'est voulu : l'effort de rappel fait travailler la mémoire.
:::

::: exemple Quand revenir pour viser R = 70 % ?
Pour la forme de la fiche, t = S × (81/19) × (R^(−2) − 1).
Avec R = 0,7 : t = S × 4,263 × 1,041 = 4,4 × S.
Une carte de S = 4 jours reviendrait au bout de 17,7 jours : trop tard pour viser 90 %.
:::

## À retenir
- Des révisions étalées retiennent mieux que des révisions concentrées.
- Le bourrage aide à court terme, puis le souvenir s'efface.
- Une révision réussie augmente la stabilité : l'intervalle s'allonge.
- FSRS suit D (difficulté), S (stabilité) et R (probabilité de rappel).
- La stabilité est le délai où R vaut 90 %.
- L'app place la prochaine révision quand R atteint 90 %, soit S jours plus tard.
- Après un oubli, la stabilité baisse et la carte revient plus tôt.
- La courbe n'est pas une droite : R baisse de moins en moins vite.

Sources : dépôt open-source open-spaced-repetition (FSRS) ; Dunlosky et al., Improving Students' Learning With Effective Learning Techniques (2013) ; code de l'app, module de répétition espacée. Valeurs recalculées pour cette fiche.
