Durée : 8 min
Introduction : Une série de chiffres est difficile à lire telle quelle. On la résume par une valeur « du milieu » : la moyenne, la médiane ou le mode. Ce chapitre t'apprend à les calculer, à les comparer et à choisir le bon.

## Trois façons de résumer une série
### La moyenne
::: definition Moyenne
La **moyenne** est la somme des valeurs divisée par leur nombre. Si on partageait le total à parts égales, chacun recevrait la moyenne.
:::

::: formule
Moyenne = (x₁ + x₂ + … + xₙ) / n
:::

### La médiane et le mode
::: definition Médiane
La **médiane** coupe la série triée en deux moitiés de même effectif. Avec un nombre impair de valeurs, c'est celle du milieu. Avec un nombre pair, c'est la moyenne des deux valeurs du milieu.
:::

::: definition Mode
Le **mode** est la valeur la plus fréquente. Il sert aussi pour des catégories (une couleur, une ville), là où une moyenne n'a pas de sens.
:::

::: exemple Sept salaires mensuels
Salaires en euros, triés : 1 700 ; 1 800 ; 1 800 ; 1 900 ; 2 000 ; 2 100 ; 2 300.

- Somme : 13 600 €. Moyenne : 13 600 / 7 ≈ 1 943 € (arrondie à l'euro).
- Médiane : la 4e valeur, soit 1 900 €.
- Mode : 1 800 € (deux fois).
:::

::: barres Les sept salaires
Salarié 1 | 1 700
Salarié 2 | 1 800
Salarié 3 | 1 800
Salarié 4 | 1 900
Salarié 5 | 2 000
Salarié 6 | 2 100
Salarié 7 | 2 300
Unité : €
Note : la médiane est la barre du milieu (1 900 €), le mode la valeur qui apparaît deux fois (1 800 €).
:::

## Quand une valeur extrême s'en mêle
La moyenne utilise toutes les valeurs, donc un extrême la déplace. La médiane ne dépend que du rang : elle bouge très peu. Remplaçons le salaire de 2 300 € par 9 000 € dans l'exemple.

::: barres Avant et après le salaire de 9 000 €
Séries : Avant | Après
Moyenne | 1 943 | 2 900
Médiane | 1 900 | 1 900
Mode | 1 800 | 1 800
Unité : €
Note : la moyenne passe de 1 943 € à 2 900 € (20 300 / 7). La médiane et le mode ne bougent pas.
:::

::: attention La moyenne n'est pas « le salaire typique »
Avec un salaire isolé très haut, presque personne ne gagne la moyenne : ici, six salariés sur sept gagnent moins que 2 900 €. Dans ce cas, annonce aussi la médiane.
:::

## Choisir le bon indicateur
| Situation | Indicateur le plus utile |
|---|---|
| Valeurs régulières, sans extrême | Moyenne |
| Valeurs étalées ou extrême isolé (salaires, prix de l'immobilier) | Médiane |
| Catégories (couleur, marque) | Mode |

::: camembert Couleur préférée de 20 élèves
Bleu | 8
Vert | 6
Rouge | 4
Jaune | 2
Total : 20
Note : le mode est « bleu ». Calculer une moyenne de couleurs n'aurait aucun sens.
:::

## À retenir
- Moyenne = somme des valeurs divisée par leur nombre.
- Médiane = valeur du milieu de la série triée (moyenne des deux du milieu si n est pair).
- Mode = valeur la plus fréquente ; le seul indicateur possible pour des catégories sans ordre.
- Un extrême déplace fortement la moyenne, très peu la médiane.
- La médiane n'est pas toujours une valeur de la série.
- Pour des salaires ou des prix, donne la médiane à côté de la moyenne.
- Trie toujours la série avant de chercher la médiane.

Sources : Définitions standard de la statistique descriptive ; données inventées pour la démo, recalculées avec python3.
