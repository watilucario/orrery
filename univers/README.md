# Univers : le contenu de l'app

Tout ce que l'app fait réviser est ici, dans des fichiers lisibles. Le code de l'app (`src/`) ne contient plus de questions.
`python3 build.py` lit ces fichiers, les contrôle et les assemble dans la page. Au moindre problème (bonne réponse absente,
source manquante, identifiant renommé…), il s'arrête et dit quel fichier et quelle ligne corriger.

Les documents de cours d'origine (poly, slides, PDF) restent dans `content/`.

```
univers/
  app.json                      le nom de l'app et le prénom donné à l'IA (v13)
  bachelor/                     un programme = un univers de l'app (v5)
    programme.json              son nom, sa galaxie et l'ordre des matières
    droit-fiscal/               une matière
      recette.json              modèle, statut, réglages des blocs, textes, annexe
      qcm/<thème>.md            les QCM, un fichier par thème
      cas.md                    les cas pratiques en étapes
      exercices.md              les exercices rédigés
      simulation.md             les questions réservées à la simulation
      regles.md                 ce qu'on envoie à Claude : consignes et règles du cours
      documents.md              les documents types : bilan, compte de résultat… ligne par ligne (v7.3)
      constructions.md          les tableaux à construire ligne par ligne, case par case (v8)
      calcul.js                 le calcul mental (générateurs de questions, en code)
      ids.lock                  le verrou des identifiants (géré par build.py)
    droit-des-societes/
      recette.json              statut « en préparation » : attend les documents
  tage-mage/                    un autre univers : les six sous-tests du TAGE MAGE
```

## L'app (`app.json`, v13) : ce qui est propre à la personne

```json
{"nom": "Révisions", "eleve": "l'auteur", "contexte": "étudiant"}
```

`nom` : le titre de la page. `eleve` : le prénom donné à l'IA dans ses demandes (« Réponse de l'élève »). `contexte` : qui
il est, pour la question sur une sélection. Tout est facultatif ; sans ce fichier, l'app s'appelle « Révisions » et l'IA
lit le prénom du profil (sinon « l'élève »). Maitrise, la version vierge (`dist/maitrise/`), n'en a pas : elle ne connaît
personne d'avance. Le contenu de tout ce dossier, au format d'échange de l'app (`docs/format-donnees.md`), est écrit à
chaque assemblage dans `dist/donnees/contenu.maitrise.json` : il s'importe dans Maitrise.

## Le programme (`programme.json`) : un univers (v5)

Chaque programme est un univers de l'app : l'accueil, Réviser, Progrès et les prochains examens ne montrent que ses
matières. On passe de l'un à l'autre par « Univers » dans le menu (ou la pastille en haut de l'accueil). Les univers
sont rangés dans l'ordre alphabétique des dossiers ; le premier est celui d'un nouveau venu.

- `id` : identifiant de l'univers (gardé dans les réglages du profil). Ne pas le changer.
- `nom` : affiché partout (« Bachelor », « TAGE MAGE »).
- `description` : une phrase, sur la carte de l'univers dans le menu.
- `libelle_matieres` : comment s'appellent ses matières, au pluriel (par défaut « matières » ; « sous-tests » au TAGE MAGE).
- `vide` : le texte de l'accueil tant qu'aucune matière n'est prête.
- `galaxie` : le dessin de l'univers, pour le passage d'un univers à l'autre. `teinte` (0 à 360, la couleur des bras),
  `bras` (1 à 6), `enroulement` (0,5 à 6 : plus c'est grand, plus les bras s'enroulent), `inclinaison` (en radians,
  -3,2 à 3,2) et `aplatissement` (0,2 à 1 : 1 = vue de face). Le dessin est toujours le même pour un univers donné.
- `matieres` : les dossiers des matières, dans l'ordre d'affichage. Une matière « en préparation » apparaît avec son
  résumé et attend ses documents ; mettre son champ `agenda` permet déjà de reconnaître ses cours et ses examens.

## La recette (`recette.json`)

- `id` : identifiant de la matière, utilisé pour la synchronisation (`srs_<id>`). Ne jamais le changer.
- `stockage` : préfixe des clés du navigateur (`qfcc2.` pour le droit fiscal). Ne jamais le changer.
- `modele` : `matiere-de-cours` (le seul pour l'instant). Le modèle donne les blocs et leurs réglages par défaut.
- `statut` : `prête` ou `en préparation`.
- `agenda` (facultatif) : mots cherchés dans le titre des cours de l'agenda relié (sans majuscules ni accents) : « Droit fiscal et des sociétés » contient `droit fiscal`. Sert à proposer « Réviser » à côté d'un cours et à rattacher un examen annoncé (« CC2 … ») à sa matière.
- `accueil` : `surtitre`, `resume` (carte de la liste des matières), `intro` (facultatif), `sources`, `vide` (matière pas prête).
- `themes` : liste `{ "id", "nom" }`, dans l'ordre d'affichage. Le fichier `qcm/<id>.md` commence par `# <nom>`.
- `blocs` : un objet par bloc. Mettre `false` coupe le bloc ; un objet complète les réglages du modèle ; l'absence garde le modèle.

| Bloc | Réglages | Par défaut |
|---|---|---|
| `seance_du_jour` | `max`, `nouvelles_par_jour`, `reprise_ecart`, `reprise_max` | 20, 10, 4, 3 |
| `qcm` | `serie_rapide` : nombre de questions par thème | aucune série rapide |
| `cas` | | actif s'il y a `cas.md` |
| `exercices` | `intro` (texte de la liste), `note` (après la source d'un exercice corrigé) | actif s'il y a `exercices.md` ; note : « chiffres inventés » |
| `simulation` | `nom`, `duree_min`, `questions`, `cas` (id d'exercice), `points` `{quiz, cas}`, `accueil`, `intro`, `regles`, `programme`, `note`, `note_points` | coupé |
| `calcul` | `accueil` | coupé ; demande `calcul.js` |
| `aide_claude` | `niveau`, `effort` | `default`, `low` ; demande `regles.md` |
| `progression` | | actif |
| `maitrise` | `niveaux`, `defaut`, `exigence` (v16), `regards` | actif ; quatre marches, aucun regard |

- `annexe` (facultatif) : document fourni à l'examen, affiché sur demande dans les questions marquées `Barème : oui`.
  `bouton`, `masquer`, `colonnes`, `lignes`, `note`.
- `bilan.echeance` : fin de phrase du bilan (« à reprendre avant jeudi »). Par défaut : « avant l'examen ».

Dans les textes de la simulation, `**texte**` s'affiche en gras.

## Grille de maîtrise (bloc `maitrise`, v5.1)

Sur la page de la matière, chaque thème a quatre marches : **Comprendre** (sens, formules, pourquoi), **Savoir faire**
(bons chiffres, calculs justes, rien d'oublié), **Expliquer** (constat, signification, causes) et **Recommander**
(solutions adaptées, avec leurs limites). Une marche se valide par des preuves :

- ses QCM (v16) : au moins `part` (80 %) de ses questions maîtrisées. Une question est maîtrisée avec au moins `bonnes`
  (3) bonnes réponses sur `jours` (2) jours différents, dont `sans_choix` (1) sans les choix quand elle s'y prête, au moins
  `ratio` (3) bonnes réponses par erreur, et la dernière réponse juste. Une réponse juste « au hasard » ne compte pas ;
- ses cas guidés : chacun réussi en entier du premier coup, `cas` (2) jours différents (gardé dans `<préfixe>casr`, suivi
  sur le compte) ;
- ses questions d'exercice : `preuves` exercices corrigés avec au moins `seuil` des points (Juste = 1, À moitié = 0,5),
  dont au moins `seuil` des questions réussies `ex_jours` (2) jours différents.

Les seuils entre parenthèses sont ceux du modèle ; une recette les change avec `blocs.maitrise.exigence`, par exemple
`{"exigence": {"part": 0.7, "jours": 3}}` (les clés absentes gardent la valeur du modèle). Les mêmes règles font sortir
une question du carnet d'erreurs.

Chaque question porte sa marche avec `Niveau : comprendre | faire | expliquer | recommander`. Sans cette ligne : QCM →
comprendre, étape de cas → faire, réponse chiffrée → faire, réponse rédigée → expliquer (`defaut`). Dans un cas, la
ligne `Niveau :` sous `Thème :` vaut pour toutes ses étapes ; dans un exercice, sous `Thème :`, pour toutes ses
questions, et une question peut la changer pour elle seule.

Les **regards** (« au-delà du calcul ») sont propres à une matière : `blocs.maitrise.regards` = liste
`{ "id", "nom", "quoi" }`. Une question en porte un avec `Regard : <id>` ; la page propose une série par regard.
`niveaux` remplace toute la liste des marches (`id`, `nom`, `court`, `quoi`, `critere`, `seuil`, `preuves`, `aide` :
consigne affichée dans le champ des réponses rédigées de la marche).

## QCM (`qcm/<thème>.md`, `simulation.md`)

```markdown
## ir1
Couple marié, 3 enfants mineurs à charge. Combien de parts a le foyer fiscal ?

- [ ] 3
- [ ] 3,5
- [x] 4
- [ ] 5

Explication : 2 parts pour le couple, + 0,5 pour le 1er enfant, + 0,5 pour le 2e, + 1 à partir du 3e.

Source : Poly exos 2 à 5 · fiche §1
```

- Facultatif, après la source : `Niveau : …` et `Regard : …` (voir la grille de maîtrise).
- Une seule case `[x]` : la bonne réponse. L'ordre des options est mélangé à l'affichage, sauf avec `Ordre fixe : oui`.
- `Barème : oui` propose l'annexe sur la question.
- Énoncé (v7.3, facultatif) : des lignes `> …` avant le texte de la question, avec des tableaux et des figures comme
  l'énoncé d'un cas (voir plus bas). Le texte de la question vient après.
- `Repère : DU, EH` (v7.3, facultatif) : les lignes des documents types (`documents.md`) où se trouvent les chiffres de
  la question ; l'app les surligne. `Repère après : …` : seulement sous la correction (pour « Où trouve-t-on… ? »).
- Longueur des choix (v7.1) : la bonne réponse ne doit pas se deviner à sa longueur. Des choix de longueur et de précision
  comparables ; les nuances vont dans l'explication. L'assemblage avertit (sans refuser) quand la bonne réponse est, seule,
  la plus longue dans plus de 40 % des questions d'une matière (QCM, étapes de cas, simulation) ; l'import d'un pack aussi.
- Rappel libre (v7.1) : dans la séance du jour, une question dont la dernière réponse était juste avec « sûr » revient
  sans les choix (réponse tapée, puis jugée). L'app l'évite d'elle-même pour « Laquelle… », « Parmi… », « vrai ou faux »
  et les options « Aucune / Toutes », et pour `Ordre fixe : oui`. `Rappel : non` l'interdit pour une question dont la
  bonne réponse n'a de sens qu'à côté des autres ; `Rappel : oui` le force.
- Dans `simulation.md`, chaque question porte aussi une ligne `Thème : <id>`.

## Cas en étapes (`cas.md`)

`## <clé> · <nom du cas>`, puis `Thème : <id>`, l'énoncé en lignes `> …`, puis chaque étape comme un QCM sous `### <identifiant>`.

Énoncés (cas, exercices, QCM, v7.3) : quand il y a beaucoup de chiffres, mets-les en tableau, comme dans le document de
l'examen : `> | Passif | N-1 | N |`, `> |---|---|---|`, une ligne par poste ; une ligne `>` vide sépare deux tableaux.
Une colonne de nombres s'aligne à droite ; une ligne en `**gras**` sert de titre de groupe (« Charges »), une ligne qui
commence par « = » ou « Total » est un total. Une figure (voir « Figures ») peut aussi aller dans un énoncé.

## Exercices rédigés (`exercices.md`)

```markdown
## e2 · Calcul de l'IR, de A à Z
Thème : ir
Durée conseillée : 15 min
Barème : oui
Source : Poly exos 3 à 5 · fiche cours §0 et §1

> L'énoncé, une ligne par ligne.

### Question 1
Nombre de parts ?

Réponse : 3 parts
Calcul : 2 + 0,5 + 0,5 = 3.

### Question 9
Quelle différence entre une réduction et un crédit d'impôt ?

Attendu : La réduction n'est pas remboursable…
```

- `Réponse : <nombre> <unité>` : corrigée par l'app. Facultatif : `Tolérance : 1`, `Accepté aussi : 3 496 ou 185 574`.
- `Attendu : …` : réponse rédigée, que l'étudiant note lui-même.
- Retour à la ligne (v10.1) : dans `Explication`, `Calcul`, `Attendu` et `Indice`, une ligne qui commence par `| ` s'affiche
  sur une nouvelle ligne (une écriture comptable, un compte par ligne ; crédits en retrait par des espaces insécables,
  gardés). Les autres lignes de suite restent collées. Même règle dans un pack (`packSuite`, 02).
- `Repère : DU` (facultatif, v7.3, sous `Thème :`) : lignes des documents types à surligner dans l'exercice.
- `Indice : …` (facultatif, v6.4) : premier indice du mode guidé, une piste sans le résultat (« Pense au rattachement
  des enfants majeurs »). Sans lui, le mode guidé propose d'abord le rappel du cours (les règles du thème, `regles.md`).
- `Étiquette : …` (facultatif) remplace le nom du thème ; l'exercice est alors transversal et Claude reçoit toutes les règles.

## Fiches de cours (`cours/<thème>.md`, v7.2)

Une fiche par thème, lue dans l'app (tuile « Cours », « Lire le cours » dans un thème, « Revoir l'essentiel » sous la
correction d'une question). Facultative : un thème sans fiche est signalé sur l'écran Cours.

```markdown
Durée : 9 min

## L'essentiel
- 5 à 8 puces à savoir par cœur (un écran de téléphone).

## Le calcul pas à pas
Paragraphes, listes « - » et « 1. », « ### Sous-titre », **gras**,
> encadré pour une formule
| Masse | k€ |
|---|---|
| Emplois stables | 13 862 |

Sources : documents précis (fiche, page, cas, corrigé)
```

- La première section est « ## L'essentiel » ; la ligne « Sources : » termine la fiche. « Durée » absente : calculée
  (150 mots par minute, figures non comptées). Rien d'autre (pas de « # », « #### », HTML, liens) ; tableaux à colonnes
  égales, la 2e ligne « |---|---| » ; figures « ::: » (v7.3, ci-dessous). L'assemblage refuse sinon, avec la ligne. Dans
  un pack : section « # Cours · <thème> ».

### Second format (v13.1) : introduction, parties, « À retenir » à la fin

Demande de l'auteur (29 oct.) : la théorie d'abord, puis l'exemple ; un plan, une introduction, des titres et sous-titres.
Les deux formats sont acceptés ; le second est celui de la consigne des packs.

```markdown
Durée : 8 min
Introduction : 2 ou 3 phrases : de quoi parle le chapitre, à quoi il sert.

## Le risque d'audit
### Trois risques qui se multiplient
::: definition Risque d'audit
La probabilité d'une **opinion inappropriée** sur les comptes.
:::

::: formule
Risque d'audit = RI × RC × RND
:::

::: attention RI × RC n'est pas le risque d'audit
C'est le risque d'anomalies significatives.
:::

## La matérialité
::: exemple Société industrielle, CA 200 M€
- OM = 200 M€ × 0,5 % = 1 M€
:::

## À retenir
- 5 à 8 puces à savoir par cœur.

Sources : Session 2, p. 6 à 12
```

- « Introduction : » (non vide) avant les sections ; au moins deux parties ; « ## À retenir » en dernier ; ni
  « L'essentiel » ni « À retenir » ailleurs. L'app numérote les parties (une numérotation « I. », « 2) » écrite dans le
  titre est retirée à l'affichage) et en fait le plan, cliquable, avec « À retenir » au bout.
- Encadrés typés, dans une fiche seulement, jamais l'un dans l'autre : `::: definition|formule|exemple|attention|source
  <titre facultatif>` … `:::`, du Markdown de fiche dedans (tableau et figure compris). Noms affichés : Définition,
  Formule, Exemple, Piège, Les documents divergent ; une couleur chacun (accent, gris, `--mid`, `--ko`, `--muted`).
- Section clé : « L'essentiel » (premier format) ou « À retenir » (second) : « Revoir l'essentiel » sous la correction,
  règles de l'aide quand le thème n'en a pas d'écrites (`cle_fiche` ↔ `ficheCle`). L'introduction entre dans
  l'empreinte (relecture) ; une fiche du premier format garde la sienne.
- Dans les deux formats (v13.1), « Avant de lire » s'affiche en fin de fiche, replié, sous le nom « Teste-toi ».

## Fiche de synthèse (`synthese.md`, v10.3)

Facultative, une par matière, à la racine de son dossier : tout le programme sur une fiche (à relire avant un examen).
Même format qu'une fiche de cours (`Avant de lire`, « ## L'essentiel » d'abord, sections, « Sources : » à la fin). L'app
la met en tête de l'écran Cours (« Fiche de synthèse ») ; elle n'a pas de thème (pas de série, pas de relecture). Dans un
pack : section « # Synthèse ».

## Faire chercher : « Avant de lire » et « À toi » (v7.5)

- `Avant de lire : <une question>` (facultatif, avant `## L'essentiel`, comme `Durée`) : affichée en tête de la fiche ;
  on y répond de tête avant de lire. La reprendre, résolue, dans la dernière section `## Teste-toi`.
- Exercice à tenter, réponse repliée (« Voir la réponse »), dans une fiche ou un énoncé :

```markdown
::: essai Calcule la marge brute de l'entreprise Exemple, année N (k€)
Les données (facultatives, Markdown simple).
--
**22 251 k€.** Le calcul et le piège à éviter.
:::
```

  Une ligne `--` et une seule ; la réponse ne peut pas être vide. Mêmes contrôles dans un pack (`packFigure`, 02).

## Relecture des fiches (`revue.md`, v7.4)

Facultative. Une relecture juge chaque fiche avec la grille de `docs/grille-cours.md` (5 critères de fond, 7 de forme) ;
l'app certifie (un rond coché) la fiche qui a « oui » ou « sans objet » aux 12 critères, et seulement elle : une fiche
qui vient d'être écrite n'a aucun signe tant qu'elle n'a pas été relue et retravaillée. Elle ne voyage pas dans un pack.

```markdown
# Relecture des fiches

Date : 2026-10-18
Par : Claude

Une intro libre (méthode, documents comparés).

## sig
Empreinte : d42b2cfe
- juste · oui · Calculs refaits : tous justes ; SIG identiques au corrigé.
- sources · oui · …
- (une ligne par critère : juste, sources, examen, marches, exemples, structure, mots, concis, visuel, lisible, actif, envie)
```

- Verdicts : `oui`, `en partie`, `non`, `sans objet` (ne compte ni pour ni contre). Puis ce qui a été vu, en une phrase.
- Un seul « en partie » ou « non » : pas de certification (le détail reste dans `revue.md`).
- `Empreinte` : celle du texte relu (`python3 build.py --empreintes <dossier de la matière>`). Si la fiche change,
  l'assemblage le signale et la certification tombe jusqu'à la relecture suivante. Une
  matière remplacée par un pack garde sa pastille seulement si la fiche est identique.
- L'assemblage refuse une date absente, un critère inconnu, manquant ou en double, une fiche absente, avec la ligne.

## Figures (v7.3) : schémas et graphiques, dans une fiche ou un énoncé

Demande de l'auteur : des schémas, des graphiques, des courbes et des camemberts, là où ils aident à comprendre (pas
partout). Une figure s'écrit entre une ligne `::: <type> <titre>` et une ligne `:::`, une donnée par ligne
(`libellé | nombre`, nombres à la française : `1 025 000`, `− 7 022`, `26,69`). L'app la dessine en clair et en sombre,
avec sous elle le tableau de ses chiffres. Toutes acceptent `Note : …` (une phrase sous la figure) ; `Unité : €` (ou
`k€`, `%`, `jours`) s'ajoute aux valeurs. L'assemblage vérifie les chiffres et refuse une figure fausse, avec la ligne.

| Type | Lignes | Contrôle |
|---|---|---|
| `cascade` | `+ libellé \| montant`, `− libellé \| montant`, `= libellé \| montant` (SIG, CAF, trésorerie) | commence par `+` ou `=`, finit par `=` ; chaque `=` doit tomber juste (à 1 près sur des entiers) |
| `bilan` | les masses de gauche, une ligne `--`, celles de droite : `libellé \| montant \| famille` ; `Colonnes : Emplois \| Ressources` ; `Écart : FRNG \| 1 \| 1` | deux côtés égaux ; un écart compare les limites après n masses à gauche et m à droite (FRNG : 1 et 1 ; TN : avant la trésorerie) |
| `barres` | `libellé \| valeur` ; avec `Séries : N-1 \| N`, une valeur par série (2 ou 3) | 1 à 12 lignes, autant de valeurs que de séries |
| `courbe` | `Axe : 0 % \| 100 % \| 300 %`, puis une ligne par courbe : `nom \| v1 \| v2 \| v3` | 1 à 3 courbes ; l'axe est à l'échelle s'il est chiffré |
| `camembert` | `libellé \| montant`, `Total : …` facultatif | 2 à 6 parts positives ; le total, s'il est donné, doit tomber juste |
| `etapes` | `étape \| détail` (détail facultatif) | 2 à 8 étapes |
| `ecriture` (v10.4) | `D \| compte \| libellé` puis `C \| compte \| libellé`, avec `\| montant` au besoin (titre : la date et l'opération) | au moins un débit et un crédit, les débits d'abord ; montants sur toutes les lignes ou sur aucune, et alors débits = crédits |

- La famille d'une masse de bilan lui donne sa couleur : même famille, même couleur des deux côtés (le cycle long en
  haut, l'exploitation, la trésorerie en bas). Une masse à 0 n'est pas dessinée mais compte pour les écarts.
- Bilan : les hauteurs sont à l'échelle des montants, sur une seule échelle pour les deux colonnes (une limite plus basse
  en montant l'est aussi à l'écran) ; une petite masse est agrandie juste assez pour son nom, et la figure le dit.
- Comme pour le reste : chiffres des corrigés et des cas, rien d'inventé ; un fait extérieur au cours est sourcé.

## Documents types (`documents.md`, v7.3) : le bilan et le compte de résultat, ligne par ligne

Demande de l'auteur : un modèle lisible du bilan et du compte de résultat, pour savoir le jour J où chercher chaque chiffre.
Facultatif ; l'app ajoute alors la tuile « Modèles » (un document à la fois, ou une recherche dans tous).

```markdown
# Documents types

## bilan-passif · Bilan passif
Source : liasse fiscale 2025, formulaire 2051-SD (DGFiP) · fiche « Analyse de la structure financière »
> Une intro facultative, en lignes « > ».

### Dettes
- DU · Emprunts et dettes auprès des établissements de crédit · Bilan fonctionnel : ressources stables, une fois sortis…
- EH · Dont concours bancaires courants · Trésorerie passive.
- icne · Dont intérêts courus non échus · Dettes hors exploitation.
```

- `## <identifiant> · <titre>`, `Source :` obligatoire, des groupes `### <nom>` dans l'ordre du document de l'examen.
- Une ligne : `- <code> · <poste> · <ce que l'analyse en fait>` (la 3e partie est facultative). Le code est unique dans
  la matière. Deux majuscules ou chiffres (DU, FW, 2A) : un code de la liasse fiscale, affiché ; de 3 à 8 chiffres
  (401, 44566) : un numéro de compte, affiché (v8) ; sinon (icne), un identifiant interne, caché. Les questions s'y
  réfèrent par `Repère :`.
- v8 : une ligne à deux colonnes de codes, `- BJ / BK · Total II : actif immobilisé · …` (à l'actif : brut, puis
  amortissements et dépréciations), et le nom des deux colonnes sous la source : `Colonnes : Brut · Amortissements et
  dépréciations`. Les deux codes sont des cases à part dans « Construire » ; un repère peut viser l'un ou l'autre.
- Avant la réponse, l'app montre la carte du document avec les lignes surlignées, sans « ce que l'analyse en fait »
  (ce serait souffler la réponse) ; sous la correction, ces lignes avec ce qu'on en fait. Pas en simulation.
- Comme pour les QCM : rien d'inventé, chiffres des corrigés, conflits entre supports signalés.

## Constructions (`constructions.md`, v8) : un tableau construit case par case

Demande de l'auteur : construire un tableau (bilan fonctionnel, SIG, tableau de flux, écriture comptable, calcul…) ligne
par ligne ; à chaque ligne, la liasse s'affiche vierge et on touche la ou les cases qui servent. Facultatif ; l'app
ajoute alors la tuile « Construire ».

```markdown
# Constructions

## exemple-bf · Bilan fonctionnel de l'entreprise Exemple
Thème : bf
Documents : bilan-actif, bilan-passif, renseignements
Unité : k€
Source : Exemple inventé pour la documentation
Montants : BJ = 13 822 ; BK = 3 550 ; DU = 4 572 ; EH = 131
- cb-orig · Crédit-bail : valeur d'origine du matériel · 40

> L'énoncé, en lignes « > » (tableaux et figures permis).

### es · Emplois stables
Cases : BJ, cb-orig
Résultat : 13 862
Indice : Le bilan fonctionnel prend les valeurs brutes.
Explication : 13 822 + 40.

### rs · Ressources stables
Cases : BK, DU, − EH
Admis : DM, DN
Résultat : 7 991
Explication : …

### frng · FRNG
Cases : @rs, − @es
Résultat : − 5 871
Explication : …
```

- `Documents :` les documents de `documents.md` montrés comme liasse (aucun : seulement les données de l'énoncé, comme
  en droit fiscal). `Montants :` les chiffres de l'énoncé, case par case (plusieurs lignes possibles) : affichés quand
  on choisit « Avec les chiffres ». `- <id> · <libellé> · <montant>` : une donnée hors liasse (crédit-bail, N-1…).
- `Signes : Débit / Crédit` (facultatif) : le nom des deux signes ; sinon + et −. Les signes ne comptent que si une
  ligne retranche quelque chose (ou si `Signes :` est là).
- Une ligne : `### <id> · <libellé>`, `Cases :` (`− EH` : retranchée, ou au crédit ; `@es` : une ligne déjà construite ;
  `aucune` : rien ne va ici), `Admis :` (cases justes aussi mais vides dans cet énoncé : on peut les toucher sans
  erreur), `Résultat :`, `Explication :` (obligatoire), `Indice :`.
- `build.py` refuse un résultat qui ne tombe pas juste (somme signée des cases, à 1 près sur des entiers), une case
  absente des documents choisis et des données, une ligne `@` pas encore construite, un montant manquant pour une ligne
  avec `Résultat :`. L'import d'un pack fait les mêmes contrôles (`packConstructions`).
- Dans l'app : vérifier dit combien de cases sont justes, en trop, au mauvais signe, et combien il en manque (pas
  lesquelles) ; puis l'indice de la ligne, où chercher ce qui manque, la correction. Progression : `<préfixe>cons`.

## Aide de Claude (`regles.md`)

Trois sections obligatoires, `## Consigne · explication d'une question`, `## Consigne · question sur un exercice`,
`## Consigne · correction d'une copie`, puis une section `## Règle · <nom>` par règle, avec la ligne `Thèmes : ir, rcm`.
Claude ne reçoit que les règles du thème de la question : c'est ce qui garde l'aide économe en tokens.
La première règle est celle de l'annexe : elle est ajoutée quand la question affiche l'annexe.

## Le verrou des identifiants (`ids.lock`)

La mémoire de révision est attachée à l'identifiant de chaque question. `build.py` ajoute les nouveaux identifiants au
verrou et refuse qu'un identifiant verrouillé disparaisse : on corrige une question sur place, on ne la renomme jamais.
Pour retirer vraiment une question, enlever aussi sa ligne du verrou, en sachant que sa progression sera ignorée.

## Packs : une matière entière dans un seul texte (v7)

Un pack réunit tout ce qui précède pour une matière : on l'importe dans l'app (Profil › Importer un cours) sans
assemblage ni Claude Code. Une IA en écrit un à partir d'un cours avec `docs/modele-de-pack.md`, que l'app copie
(« Copier le modèle de réponse »). `build.py` écrit le pack de chaque matière prête dans `dist/packs/<id>.md` et
range un pack dans `univers/` (`--depaqueter <pack.md> <dossier>`).

~~~markdown
# Pack · <titre>

Titre : <titre>
Identifiant : <id de la matière>
Univers : <id d'un programme>          (facultatif : sinon, celui choisi à l'import)
Surtitre : …    Résumé : …    Sources : …    Agenda : mot, mot    (facultatifs, une ligne chacun)
Thème : <id> · <nom>                   (une ligne par thème)
Regard : <id> · <nom> · <quoi>         (facultatif, grille de maîtrise)

```json
{ … la recette entière, facultative : les lignes ci-dessus la complètent … }
```

# QCM · <id du thème>     (le contenu de qcm/<thème>.md, sans son titre)
# Cas                     (cas.md)
# Exercices               (exercices.md)
# Simulation              (simulation.md)
# Documents               (documents.md, v7.3)
# Constructions           (constructions.md, v8)
# Règles                  (regles.md, facultatif depuis la v13 ; consignes absentes : modeles/consignes-par-defaut.md)
# Fin du pack
~~~

- Ce qui précède « # Pack » et suit « # Fin du pack » est ignoré : une IA peut entourer le pack de phrases ou de ```.
- Une section peut revenir (un pack donné en deux fois) : ses questions s'ajoutent.
- Valeurs par défaut : modèle `matiere-de-cours`, statut `prête`, `titre_h1` = titre, stockage `qfcc2.pk.<id>.`.
- Règles pour l'aide de l'IA (v13) : un thème qu'aucune « Règle · » ne couvre reçoit « L'essentiel » de sa fiche
  (« <nom du thème> : l'essentiel », puis la section). Même règle dans build.py et l'app.
- L'app (`src/js/02-packs.js`) fait les contrôles de `build.py` et rend la même recette (`test_packs.py` vérifie la
  parité sur chaque matière prête). Elle accepte en plus « Clé: valeur », « **Clé :** valeur » et les options « * [x] ».
- Un pack qui porte l'identifiant d'une matière de l'app la remplace, avec son stockage et son univers : la progression suit.
- Autres façons de demander (v13.4), dans `qcm/<thème>.md` seulement (refusées dans un cas ou une simulation), avec
  « Type : » juste sous la question : `associer` (3 à 6 lignes `- <gauche> = <droite>`, sans doublon de chaque côté ;
  l'app propose une liste par élément de gauche), `ordonner` (3 à 7 lignes `1. …` numérotées dans le bon ordre ; l'app
  les mélange, jamais dans l'ordre, flèches ↑ ↓), `trous` (`___` dans la question, une ligne `- [x] <ce qui manque>` ;
  toujours posée sans choix, par le rappel libre). Juste seulement si tout est juste ; pas de confiance (juste = 3,
  faux = 1). Exclues du widget iPhone. Vrai ou faux et « trouver l'erreur » sont des QCM ordinaires.
- Pack de mise à jour (v13, dans l'app seulement) : « Mise à jour : oui » dans l'en-tête, le même identifiant qu'un cours
  importé, et seulement ce qui change. L'app le fond dans le cours importé (`packFusion`, 02) : Titre, Surtitre, Résumé,
  Sources, Agenda remplacés ; Thème et Regard par identifiant ; fiche (« # Cours · », « # Synthèse ») remplacée en entier ;
  dans les autres sections, un bloc « ## » remplace celui de même identifiant (avant « · », titre entier pour une règle)
  ou s'ajoute ; rien n'est supprimé. Un cas ou un exercice se renvoie en entier.
- Le calcul mental (`calcul.js`) est du code : il ne voyage pas dans un pack.
