Durée : 10 min
Introduction : Deux séries peuvent avoir la même moyenne et pourtant être très différentes : l'une régulière, l'autre très étalée. La dispersion mesure cet étalement. Ce chapitre présente l'étendue, la variance, l'écart-type et les quartiles.

## Mesurer l'étalement
### L'étendue
::: definition Étendue
L'**étendue** est l'écart entre la plus grande et la plus petite valeur. Elle ne regarde que les deux extrêmes.
:::

::: formule
Étendue = valeur maximale − valeur minimale
:::

Deux classes ont chacune une moyenne de 10 sur cinq contrôles, mais leurs notes n'ont rien à voir.

::: courbe Deux classes, même moyenne
Axe : Contrôle 1 | Contrôle 2 | Contrôle 3 | Contrôle 4 | Contrôle 5
Classe A | 10 | 10 | 10 | 10 | 10
Classe B | 2 | 6 | 10 | 14 | 18
Note : moyenne de 10 dans les deux cas. Étendue de 0 pour la classe A, de 16 pour la classe B.
:::

## Variance et écart-type
### Le principe
On regarde de combien chaque valeur s'écarte de la moyenne. Les écarts positifs et négatifs s'annuleraient : on les met donc au carré avant de les moyenner.

::: definition Variance et écart-type
La **variance** est la moyenne des carrés des écarts à la moyenne. L'**écart-type** est sa racine carrée : il s'exprime dans la même unité que les données.
:::

::: formule
Population : variance = Σ(x − moyenne)² / n
Échantillon : variance = Σ(x − moyenne)² / (n − 1)
Écart-type = √variance
:::

::: etapes Calculer un écart-type
Moyenne | m = somme des valeurs / n
Écarts | chaque valeur − m
Carrés | chaque écart au carré
Variance | somme des carrés / n (ou n − 1)
Écart-type | racine carrée de la variance
:::

### Population ou échantillon
Si tu as **toutes** les valeurs (les huit élèves d'une classe, rien d'autre), tu divises par n. Si tes valeurs ne sont qu'une partie d'un groupe plus grand (un sondage), tu divises par n − 1.

::: exemple Huit notes sur 20
Notes : 8 ; 10 ; 10 ; 12 ; 13 ; 14 ; 15 ; 18. Somme : 100, moyenne : 12,5.

- Somme des carrés des écarts : 72.
- Population : variance 72 / 8 = 9, écart-type 3 (exactement).
- Échantillon : variance 72 / 7 ≈ 10,29, écart-type ≈ 3,21 (arrondis au centième).
:::

::: attention Une constante ne change pas la dispersion
Ajouter 5 points à toutes les notes décale la moyenne, pas l'écart-type. Multiplier toutes les notes par 2 double l'écart-type.
:::

## Les quartiles
### Une mesure qui résiste aux extrêmes
::: definition Quartiles
Les **quartiles** découpent la série triée en quatre groupes de même effectif. Q1 a un quart des valeurs en dessous, Q3 en a les trois quarts. L'**écart interquartile** vaut Q3 − Q1.
:::

Méthode utilisée ici : la médiane de chaque moitié (la médiane est écartée si n est impair). Les logiciels utilisent d'autres méthodes qui donnent parfois des valeurs voisines mais différentes.

::: exemple Les sept salaires
Salaires : 1 700 ; 1 800 ; 1 800 ; 1 900 ; 2 000 ; 2 100 ; 2 300 €.

- Moitié basse (1 700 ; 1 800 ; 1 800) : Q1 = 1 800 €.
- Moitié haute (2 000 ; 2 100 ; 2 300) : Q3 = 2 100 €.
- Écart interquartile : 2 100 − 1 800 = 300 €. Étendue : 600 €.
:::

Remplaçons 2 300 € par 9 000 € : les quartiles ne bougent pas, mais l'étendue et l'écart-type explosent.

::: barres Avant et après le salaire de 9 000 €
Séries : Avant | Après
Étendue | 600 | 7 300
Écart interquartile | 300 | 300
Écart-type (population) | 192 | 2 493
Unité : €
Note : écarts-types de population, arrondis à l'euro. L'écart interquartile reste à 300 €.
:::

## À retenir
- Étendue = maximum − minimum ; elle ne regarde que les extrêmes.
- Variance = moyenne des carrés des écarts à la moyenne ; écart-type = sa racine carrée.
- Population : on divise par n. Échantillon : on divise par n − 1.
- L'écart-type a la même unité que les données ; la variance, l'unité au carré.
- Ajouter une constante ne change pas la dispersion.
- Écart interquartile = Q3 − Q1 : il contient la moitié centrale des valeurs.
- Les quartiles résistent aux valeurs extrêmes, pas l'étendue ni l'écart-type.

Sources : Définitions standard de la statistique descriptive ; données inventées pour la démo, recalculées avec python3.
