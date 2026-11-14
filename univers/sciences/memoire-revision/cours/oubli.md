Introduction : Tu oublies, et c'est normal. Ce chapitre montre comment l'oubli évolue avec le temps et ce qui le fait ralentir. Tu y trouves la formule que l'app utilise pour estimer ce que tu sais encore.

## La courbe de l'oubli
### Ce qu'Ebbinghaus a observé
En 1885, Hermann Ebbinghaus publie ses expériences sur sa propre mémoire. Il apprend des listes de syllabes sans sens. Il attend, puis il les réapprend. Ce qu'il gagne au réapprentissage lui dit ce qu'il en restait.

::: definition Courbe de l'oubli
La **baisse du souvenir en fonction du temps** écoulé sans révision. Elle chute vite au début, puis de plus en plus lentement.
:::

### Une formule pour la décrire
Les modèles actuels, comme FSRS, écrivent cette courbe avec une formule. Elle donne R, la **probabilité de rappel** : la chance que tu te souviennes à cet instant.

::: formule R(t, S) = (1 + 19/81 × t/S)^(−0,5)
t : jours depuis la dernière révision. S : stabilité, en jours.
:::

::: definition Stabilité (S)
Le nombre de jours au bout duquel R tombe à **90 %**. Si t = S, alors R = 0,9.
:::

::: courbe Probabilité de rappel selon la stabilité
Axe : 0 | 1 | 2 | 4 | 7 | 14 | 21 | 30
S = 2 jours | 100 | 94,6 | 90 | 82,5 | 74,1 | 61,5 | 53,7 | 47
S = 8 jours | 100 | 98,6 | 97,2 | 94,6 | 91,1 | 84,2 | 78,7 | 72,9
Unité : %
Note : forme simplifiée de la courbe FSRS, pente fixe. L'app utilise les paramètres complets de FSRS-6. Axe : jours depuis la dernière révision.
:::

## Pourquoi on oublie
### Trois explications classiques
- **La trace s'affaiblit** quand tu ne la sollicites pas.
- **Les souvenirs proches se gênent** : deux notions voisines se mélangent.
- **L'indice manque** : le souvenir existe, mais tu ne retrouves pas le chemin.

::: attention Oublier ne veut pas dire mal comprendre
Même une notion bien comprise s'efface sans révision. Un oubli n'est pas un échec : c'est le signal qu'il faut revoir.
:::

## Ce que la courbe change pour toi
### La stabilité aplatit la courbe
Plus S est grande, plus la courbe descend lentement. Une révision réussie augmente S. Tu n'as donc pas besoin de tout revoir tout le temps.

::: exemple Deux cartes, sept jours plus tard
Carte A : S = 2 jours. Carte B : S = 8 jours.
- A : R = (1 + 19/81 × 7/2)^(−0,5) = 74,1 %.
- B : R = (1 + 19/81 × 7/8)^(−0,5) = 91,1 %.
La carte A est la plus fragile : elle passe avant.
:::

## À retenir
- La courbe de l'oubli décrit la baisse du souvenir avec le temps.
- Ebbinghaus l'a étudiée en 1885, sur lui-même, avec des syllabes sans sens.
- L'oubli est rapide au début, puis ralentit.
- R est la probabilité de rappel, entre 0 et 1.
- La stabilité S est le délai où R vaut 90 %.
- Avec la forme de la fiche : R = (1 + 19/81 × t/S)^(−0,5).
- Oublier est normal : ce n'est pas la preuve que tu as mal compris.
- Une carte à faible S se révise avant une carte à forte S.

Sources : Ebbinghaus, Über das Gedächtnis (1885) ; dépôt open-source open-spaced-repetition (FSRS) ; code de l'app, module de répétition espacée. Valeurs recalculées pour cette fiche.
