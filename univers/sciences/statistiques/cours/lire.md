Durée : 9 min
Introduction : Dans la presse, un chiffre ou un graphique peut être exact et pourtant trompeur. Ce chapitre donne quatre réflexes : regarder l'axe, distinguer points et pourcentage, se méfier des causes supposées, vérifier la taille de l'échantillon.

## Lire un graphique
### L'axe tronqué
Un graphique en barres devrait partir de zéro, car la hauteur d'une barre représente sa valeur. Si l'axe commence plus haut, une petite différence paraît énorme.

::: barres Ventes de deux mois (graphique honnête)
Mois 1 | 1 200
Mois 2 | 1 230
Note : l'axe part de zéro, la différence est de 2,5 %. Avec un axe qui commence à 1 180, les barres feraient 20 et 50 de haut : la 2e semblerait 2,5 fois plus grande.
:::

::: attention Regarde où commence l'axe
Avant de comparer des hauteurs, lis la première graduation. Un axe qui ne part pas de zéro n'est pas une erreur en soi pour une courbe, mais il est trompeur pour des barres.
:::

## Lire un pourcentage
### Points de pourcentage ou pourcentage
::: definition Point de pourcentage
Un **point de pourcentage** est l'écart entre deux pourcentages. Une **variation en pourcentage** rapporte l'écart à la valeur de départ.
:::

::: exemple Un taux de chômage de 8 % à 10 %
- En points : 10 − 8 = 2 points.
- En relatif : 2 / 8 = 0,25, soit +25 %.
- Écrire « +2 % » mélange les deux et prête à confusion.
:::

### Hausse puis baisse
::: formule
Prix final = prix de départ × (1 + hausse) × (1 − baisse)
:::

Un prix de 100 qui monte de 20 % puis baisse de 20 % devient 100 × 1,20 × 0,80 = 96, soit −4 %. La baisse porte sur une base plus grande que la hausse.

## Corrélation et causalité
Deux grandeurs sont **corrélées** quand elles varient ensemble. Cela ne prouve pas que l'une cause l'autre : une cause commune ou le hasard peuvent suffire.

::: courbe Glaces et coups de soleil, de mars à août
Axe : Mars | Avril | Mai | Juin | Juillet | Août
Glaces vendues | 10 | 12 | 20 | 35 | 50 | 55
Coups de soleil | 5 | 8 | 14 | 28 | 40 | 46
Note : données inventées, en indice. Les deux courbes montent ensemble parce que le beau temps agit sur les deux.
:::

::: attention Corrélation n'est pas causalité
Devant une relation annoncée, pose trois questions : l'une peut-elle venir de l'autre dans l'autre sens ? Une troisième cause explique-t-elle les deux ? Le hasard est-il possible sur peu de données ?
:::

## La taille de l'échantillon
Un sondage interroge une partie des gens, pas tout le monde. Son résultat est donc approximatif.

::: formule
Marge d'erreur (95 %) ≈ 1 / √n, avec n le nombre de personnes interrogées
:::

Cette règle approchée vaut pour un échantillon tiré au hasard.

::: barres Marge d'erreur selon la taille de l'échantillon
100 | 10
400 | 5
1 000 | 3,2
2 500 | 2
Unité : points
Note : 1 / √100 = 10 points, 1 / √400 = 5 points, 1 / √1 000 ≈ 3,2 points, 1 / √2 500 = 2 points.
:::

::: exemple 52 % sur 1 000 personnes
La marge est d'environ 3 points : le vrai score est probablement entre 49 % et 55 %. On ne peut pas affirmer qu'une majorité est favorable.
:::

## À retenir
- Pour des barres, l'axe doit partir de zéro ; regarde toujours la première graduation.
- Point de pourcentage = écart entre deux pourcentages ; pourcentage = écart rapporté au départ.
- De 8 % à 10 % : +2 points, soit +25 %.
- +20 % puis −20 % ne revient pas au départ : cela fait −4 %.
- Corrélation n'est pas causalité : cherche une cause commune.
- Marge d'erreur ≈ 1 / √n : plus n est grand, plus elle est petite.
- Demande combien de personnes ont répondu et comment elles ont été choisies.

Sources : Règles usuelles de lecture des statistiques ; données inventées pour la démo, calculs vérifiés avec python3.
