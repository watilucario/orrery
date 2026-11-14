# Consigne : transformer un cours en pack de révision

Tu vas lire mes documents de cours (poly, slides, fiches, sujets et corrigés) et en tirer un pack de révision pour mon app. L'app lit le pack tel quel et refuse toute ligne hors format, en me disant laquelle corriger. Tu travailles en deux temps : d'abord le cadrage, puis la production, seulement après mon accord.

## Temps 1 · Cadrage

Lis tous les documents. Ne produis pas encore le pack. Réponds en 400 mots au plus, avec ces quatre parties :

1. **Ce que j'ai compris** : le ou les cours, l'enseignant, la langue, les séances ou chapitres, l'examen s'il est mentionné (format, durée, date).
2. **Plan proposé** : un chapitre = un thème, avec un identifiant court et un nom. Pour chacun : la fiche de cours, le nombre de QCM, les cas et exercices prévus.
3. **Points à trancher** : pour chaque point, ta réponse par défaut entre crochets. Cherche au moins ceux-ci :
   - plusieurs cours dans les documents [un pack par cours] ;
   - exercice sans corrigé [je l'établis avec le cours et j'écris « corrigé établi par l'IA » dans sa source] ;
   - documents qui se contredisent [je le signale dans l'explication] ;
   - séances ou chapitres annoncés mais absents [je couvre ce que j'ai et je le dis dans le résumé] ;
   - contenu illisible (image, graphique) [je n'en tire aucun chiffre] ;
   - documents dans une autre langue [pack en français, terme d'origine entre parenthèses].
4. **Ce que tu peux ajouter** : tes notes, ce que le prof a dit à l'oral, le format et la date de l'examen, ce qui te pose problème. Écris-le ou dicte-le.

Termine par : « Je lance la production avec ce plan ? Réponds "vas-y" ou corrige ce que tu veux. »

Si je réponds « vas-y » sans autre précision, applique tes réponses par défaut. Ce que je t'apporte (notes, oral) entre dans le pack, avec « tes notes » comme source.

## Compléter ou mettre à jour un cours déjà importé

Si je te donne aussi un pack existant (il commence par « # Pack · »), on le complète (nouvelles séances, nouveaux documents) ou on le corrige.

- Au cadrage, dis ce qu'il contient déjà (thèmes, nombre de questions), ce que tu ajoutes et ce que tu corriges.
- En production, rends **seulement ce qui change**, dans un pack de mise à jour : « # Pack · <même titre> », « Identifiant : <le même> », « Mise à jour : oui », puis :
  - les lignes « Thème : » nouvelles ou renommées ;
  - chaque question ajoutée ou corrigée, en entier, sous « # QCM · <thème> » ; chaque cas ou exercice ajouté ou corrigé, en entier avec toutes ses étapes ou questions, sous « # Cas » ou « # Exercices » ;
  - chaque fiche ajoutée ou corrigée, en entier (« # Cours · <thème> »).
- Pour corriger, garde l'identifiant existant : l'app remplace l'ancienne version et garde ma progression. Pour ajouter, prends un identifiant neuf qui suit la numérotation (au9 après au8). Ne renomme ni ne supprime jamais un identifiant.
- L'app fusionne ce pack avec l'ancien, puis contrôle le tout.

## Temps 2 · Production

### Livraison

- Si tu sais créer un fichier (fichier téléchargeable, artefact, document), mets le pack dans un fichier nommé `<identifiant>.pack.md`. Sinon, écris le texte brut, sans bloc de code autour.
- Le pack va de la ligne « # Pack · … » à la ligne « # Fin du pack », rien avant, rien après. Hors du pack, deux lignes au plus : ce qui est fait, ce qui reste à vérifier.
- Trop long pour une réponse : arrête-toi après une question complète et écris « (suite au prochain message) ». Quand je dis « continue », reprends exactement là, sans rien répéter.

### Règles de fond

1. N'invente rien. Chaque question, chaque chiffre, chaque règle vient des documents ou de mes notes. S'il manque un chiffre, ne pose pas la question.
2. Chaque question a une explication (1 à 3 phrases) et une source précise : document, page ou diapositive.
3. Reformule : ne recopie pas de longs passages.
4. QCM : une seule bonne réponse et trois mauvaises plausibles, tirées d'erreurs fréquentes.
5. Les quatre choix ont une longueur et une précision comparables : la bonne réponse n'est pas la plus longue. Les nuances vont dans l'explication. Varie sa place.
6. Couvre tout le plan validé : au moins 8 QCM par thème quand le cours le permet, des cas guidés pour appliquer, des exercices pour s'entraîner comme le jour de l'examen.
7. Tutoiement, phrases courtes, en français.

### Le format, à respecter à la lettre

Les éléments entre chevrons sont à remplacer, chevrons compris. Une ligne « Clé : valeur » s'écrit : la clé, une espace, deux-points, une espace, la valeur.

```
# Pack · <titre de la matière>

Titre : <titre de la matière>
Identifiant : <minuscules sans accents, chiffres et tirets : audit-legal>
Surtitre : <une ligne : Partiel · audit légal>
Résumé : <une ligne : ce que contient le pack>
Sources : <les documents utilisés>
Thème : <id-du-thème> · <Nom du thème>
Thème : <id-du-thème> · <Nom du thème>

# QCM · <id-du-thème>

## <id-de-la-question>
<Texte de la question>

- [ ] <mauvaise réponse>
- [x] <bonne réponse>
- [ ] <mauvaise réponse>
- [ ] <mauvaise réponse>

Explication : <pourquoi c'est la bonne réponse>
Source : <document, page ou diapositive>

# Cours · <id-du-thème>

Durée : <n> min
Introduction : <2 ou 3 phrases : de quoi parle le chapitre, à quoi il sert>

## <titre de la partie>
### <titre de la sous-partie>
<la notion : définition, règle, conditions>

::: exemple <titre>
<l'exemple du cours, après la notion>
:::

## <titre de la partie suivante>
<…>

## À retenir
- <5 à 8 points à savoir par cœur>

Sources : <documents>

# Cas

## <clé-du-cas> · <nom du cas>
Thème : <id-du-thème>

> <énoncé, une donnée par ligne>

### <id-de-l-étape>
<question de l'étape>

- [x] <bonne réponse>
- [ ] <mauvaise réponse>
- [ ] <mauvaise réponse>
- [ ] <mauvaise réponse>

Explication : <explication de l'étape>
Source : <document, page>

# Exercices

## <id-de-l-exercice> · <titre>
Thème : <id-du-thème>
Durée conseillée : <n> min
Source : <document, page>

> <énoncé, une donnée par ligne>

### Question 1
<question dont la réponse est un nombre>

Réponse : <nombre> <unité>
Calcul : <le calcul détaillé>
Indice : <une piste qui ne donne pas le résultat>

### Question 2
<question dont la réponse est rédigée>

Attendu : <la réponse attendue, en quelques phrases>

# Fin du pack
```

### Précisions

- Identifiants : lettres sans accents, chiffres, « - » et « _ », sans espace, tous différents dans le pack. Un préfixe par thème pour les questions : au1, au2…
- Une section « # QCM · <thème> » par thème de l'en-tête.
- Une fiche « # Cours · <thème> » par thème, après les QCM : « Introduction : », puis 2 à 5 parties « ## » avec leurs sous-parties « ### », puis « ## À retenir » en dernier, puis « Sources : ». Ne numérote pas les parties : l'app le fait et en tire le plan.
- Dans une fiche, la théorie d'abord, l'exemple ensuite : une fiche n'est jamais une suite d'exemples. Encadrés entre « ::: <type> <titre> » et « ::: », jamais l'un dans l'autre : « definition » (un terme), « formule », « exemple », « attention » (un piège fréquent), « source » (deux documents qui se contredisent). Permis aussi : listes « - » et « 1. », **gras**, tableaux (« | a | b | » puis « |---|---| »).
- « À retenir » est aussi ce que l'aide de l'IA de l'app reçoit : exact et complet.
- « # Cas » et « # Exercices » sont facultatifs. Chaque cas et chaque exercice a sa ligne « Thème : » et au moins une ligne d'énoncé « > ». Chaque exercice a « Durée conseillée » et « Source ».
- Une ligne vide termine une explication. Les options commencent toutes par « - [ ] » ou « - [x] ».
- Varie les façons de demander : dans les sections « # QCM · <thème> », environ une question sur quatre prend une de ces formes, choisie selon ce qu'elle entraîne :
  - **Vrai ou faux** (une idée reçue) : deux choix « - [ ] Vrai » et « - [x] Faux » (ou l'inverse), « Ordre fixe : oui » ; l'explication dit pourquoi.
  - **Trouver l'erreur** (un raisonnement ou un calcul) : l'énoncé en lignes « > », une étape par ligne ; les choix sont les étapes ; la bonne est l'étape fausse ; « Niveau : expliquer ».
  - **Associer** (qui fait quoi, terme et définition) : « Type : associer » juste sous la question, puis 3 à 6 lignes « - <gauche> = <droite> ».
  - **Ordonner** (étapes, procédure, chronologie) : « Type : ordonner » juste sous la question, puis 3 à 7 lignes « 1. … », « 2. … » dans le bon ordre (l'app les mélange).
  - **Texte à trous** (un chiffre, un seuil, un mot clé) : « ___ » dans la question à la place de ce qui manque, « Type : trous » juste sous la question, puis une seule ligne « - [x] <ce qui manque> ».
  Associer, ordonner et texte à trous : seulement dans « # QCM », jamais dans un cas ni une simulation.
- Après la source, facultatif : « Ordre fixe : oui » si l'ordre des choix compte (« Aucune des réponses ») ; « Rappel : non » si la bonne réponse n'a de sens qu'avec les autres choix (l'app peut reposer une question connue sans ses choix) ; « Niveau : comprendre | faire | expliquer | recommander » (par défaut : QCM comprendre, étape de cas faire, réponse chiffrée faire, réponse rédigée expliquer).
- Réponse chiffrée : le nombre d'abord, au format français (3 496,50 €), puis l'unité. Facultatif : « Tolérance : 1 », « Accepté aussi : 3 496 ou 3 500 ».
- Facultatif : « # Règles », seulement pour une règle qu'aucune fiche ne contient (un barème commun à plusieurs thèmes) : « ## Règle · <nom> », puis « Thèmes : <id>, <id> », puis la règle.

### Seulement si le cours a des calculs, des tableaux de chiffres ou des graphiques

- Beaucoup de chiffres dans un énoncé (bilan, compte de résultat, N-1 et N) : un tableau comme dans le sujet, chaque ligne commençant par « > » : « > | Poste | N-1 | N | », « > |---|---|---| », puis une ligne par poste. Un QCM peut avoir un énoncé : ses lignes « > » avant la question.
- Figures, dans les fiches et les énoncés, seulement là où elles aident : entre « ::: <type> <titre> » et « ::: ». Types :
  - « cascade » : lignes « + libellé | montant », « − libellé | montant », « = libellé | montant » ; chaque « = » tombe juste ;
  - « barres » : « libellé | valeur », ou « Séries : N-1 | N » puis une valeur par série ;
  - « courbe » : « Axe : x1 | x2 | x3 » puis « nom | v1 | v2 | v3 » ;
  - « camembert » : 2 à 6 parts « libellé | montant », « Total : … » ;
  - « etapes » : « étape | détail ».
  Facultatif dans toutes : « Unité : € », « Note : <une phrase> ». Uniquement des chiffres des documents.

### Seulement si le cours est de comptabilité ou de finance

- Figure « bilan » : masses de gauche « libellé | montant | famille », une ligne « -- », celles de droite ; « Colonnes : Emplois | Ressources » ; « Écart : FRNG | 1 | 1 » compare les limites après 1 masse à gauche et 1 à droite. Les deux côtés sont égaux.
- Figure « ecriture » (écriture au journal) : « D | compte | libellé | montant » pour chaque débit, puis « C | … » pour chaque crédit ; débits d'abord, équilibre exact.
- Documents types de l'examen (bilan actif, passif, compte de résultat…) : section « # Documents » à la fin. Pour chacun : « ## <id> · <titre> », « Source : … », des groupes « ### <nom> » dans l'ordre du document, une ligne par poste « - <code> · <poste> · <ce que l'analyse en fait> » (code de la liasse si tu en es sûr, sinon un identifiant court). Sous la source d'une question : « Repère : <code>, <code> » (où chercher ses chiffres), ou « Repère après : <code> » si le montrer avant donnerait la réponse.
- Constructions (bilan fonctionnel, SIG, tableau de flux, écriture) : section « # Constructions » après « # Documents ». Pour chaque tableau : « ## <id> · <titre> », « Thème : <id> », « Documents : <id>, <id> » (aucun pour un calcul sur l'énoncé seul), « Unité : € », « Source : … », « Montants : <code> = <nombre> ; … », des données hors liasse « - <id> · <libellé> · <montant> », « Signes : Débit / Crédit » pour une écriture, et l'énoncé en lignes « > ». Puis une ligne du tableau par « ### <id> · <libellé> » avec « Cases : <code>, − <code>, @<id d'une ligne déjà faite> » (« aucune » si rien ne va), « Admis : <code> » facultatif, « Résultat : <nombre> » (la somme signée des cases tombe juste), « Explication : … », « Indice : … » facultatif.
- Regards « au-delà du calcul » (facultatif) : dans l'en-tête, « Regard : <id> · <nom> · <ce qu'il regarde> » ; sous la source des questions concernées, « Regard : <id> ».

### Avant de rendre, vérifie

- [ ] Chaque thème de l'en-tête a sa section « # QCM · <thème> » et sa fiche « # Cours · <thème> ».
- [ ] Chaque QCM et chaque étape de cas : quatre options (deux pour un vrai ou faux), une seule « - [x] », une explication, une source ; associer, ordonner et trous au format ci-dessus.
- [ ] La bonne réponse est la plus longue dans moins d'un tiers des questions, et sa place varie.
- [ ] Chaque cas et chaque exercice : « Thème : » et au moins une ligne « > ». Chaque exercice : « Durée conseillée », « Source », et pour chaque question « Réponse » avec « Calcul », ou « Attendu ».
- [ ] Chaque fiche : « Introduction : », au moins deux parties, « ## À retenir » en dernier, « Sources : » à la fin, chaque encadré fermé par « ::: ».
- [ ] Tous les identifiants sont différents, sans accents ni espaces.
- [ ] Aucun chiffre ni aucune règle hors des documents et de mes notes ; tout corrigé établi par toi est signalé.
- [ ] Le pack finit par « # Fin du pack ».
- [ ] Mise à jour : « Mise à jour : oui », même identifiant, seulement ce qui change, aucun identifiant existant renommé.
