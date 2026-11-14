# Grille de relecture d'une fiche de cours

Demande de l'auteur (18 oct. 2026) : savoir si un cours est bon, c'est-à-dire facile à comprendre, vite assimilé, et s'il
donne envie d'apprendre ; juger ses cours et le montrer par une pastille. Cette grille vaut pour toutes les matières.
Elle sert à relire une fiche (`univers/<programme>/<matière>/cours/<thème>.md`) et à remplir la relecture de la matière
(`revue.md`, format dans `univers/README.md`). L'app en tire la pastille de chaque fiche (v7.4, `03c`).

## Le principe

Un cours est bon s'il fait atteindre l'objectif de l'examen, vite et durablement. On le juge donc à deux niveaux :

- **le fond** : ce qu'il enseigne est juste, sourcé, et c'est ce que l'examen demande, au niveau où il le demande ;
- **la forme** : la façon de le présenter réduit l'effort inutile, fait travailler la mémoire et donne envie de continuer.

Le fond passe avant la forme : une fiche agréable mais fausse fait du tort.

**Certification** (le rond coché de l'app) : seulement si les 12 critères sont à « oui » (ou « sans objet ») et que le
texte est celui qui a été relu. Jamais d'office : une fiche qui vient d'être écrite n'est pas certifiée tant qu'elle n'a
pas été relue et retravaillée jusqu'à remplir toute la grille.

Les critères s'adaptent à l'objectif du thème : un thème de classement (le bilan fonctionnel) n'appelle pas de
recommandation ; on note alors « sans objet », qui ne compte ni pour ni contre.

## Les 12 critères

Chaque critère reçoit un verdict : **oui**, **en partie**, **non** ou **sans objet**, et une phrase qui dit ce qui a été
vu (un chiffre, une section, un exemple).

### Fond

| Critère | La question | Comment le vérifier |
|---|---|---|
| `juste` · Juste | Les chiffres et les formules sont-ils exacts ? | Refaire chaque calcul ; comparer les montants aux corrigés ; un conflit entre deux supports est signalé, avec le choix fait. |
| `sources` · Sourcée | Peut-on retrouver d'où vient chaque fait ? | Ligne « Sources : » précise (document, paragraphe, annexe) ; tout fait extérieur au cours (norme, loi, taux) a sa source. |
| `examen` · Alignée sur l'examen | Enseigne-t-elle ce que l'examen demande, au niveau demandé ? | Le plan type de la copie est donné ; une annale ou un corrigé sert d'exemple ; les questions de l'app portent sur la fiche. (Alignement constructif : Biggs, 1996.) |
| `marches` · Les quatre marches | Fait-elle monter de « comprendre » à « recommander » quand l'examen le demande ? | Définitions, calcul, lecture du résultat, recommandations avec leurs limites ; les regards « au-delà du calcul » pour une matière de finance. (Taxonomie de Bloom révisée : Anderson et Krathwohl, 2001.) |
| `exemples` · Exemples et pièges | Y a-t-il un exemple résolu pas à pas et les erreurs typiques ? | Un cas du cours résolu en entier ; chaque piège avec le faux résultat qu'il donne. (Effet de l'exemple résolu : Sweller ; Pashler et al., 2007.) |

### Forme

| Critère | La question | Comment le vérifier |
|---|---|---|
| `structure` · Structure signalée | Sait-on toujours où l'on est ? | Le même plan d'une fiche à l'autre (L'essentiel, À quoi ça sert, Les mots, Le calcul pas à pas, Comment lire, À l'examen, Les pièges, Au-delà du calcul) ; des titres qui disent ce qu'il y a dessous. (Mayer : principe de signalement.) |
| `mots` · Les mots d'abord | Le vocabulaire est-il expliqué avant d'être utilisé ? | « Les mots à connaître » avant le calcul ; chaque sigle développé à sa première apparition. (Mayer : principe de pré-apprentissage.) |
| `concis` · Concise | Y a-t-il quelque chose à enlever ? | Pas de tableau qui répète une figure (la figure a déjà son tableau replié) ; pas de passage recopié d'une autre fiche ; longueur au rythme de l'app (150 mots par minute). (Mayer : principe de cohérence.) |
| `visuel` · Visuel utile | Une figure montre-t-elle le mécanisme central ? | Le schéma du mécanisme (pas seulement du résultat), placé à côté du texte qui l'explique ; lisible sur téléphone. (Mayer : principes multimédia et de contiguïté.) |
| `lisible` · Lisible | Se lit-elle sans effort ? | Phrases courtes (une vingtaine de mots au plus), tutoiement, chiffres en tableau plutôt qu'en paragraphe. (Mayer : principe de personnalisation.) |
| `actif` · Fait chercher | Le lecteur doit-il retrouver ou calculer quelque chose avant de lire la réponse ? | Une question avant la lecture, un calcul à tenter avant la solution, quelques questions de rappel à la fin. (Effet test : Roediger et Karpicke, 2006 ; pré-test : Richland, Kornell et Kao, 2009 ; Dunlosky et al., 2013.) |
| `envie` · Donne envie | Donne-t-elle une raison de lire la suite ? | Une accroche concrète au début (une énigme, un enjeu chiffré, l'examen) ; l'utilité dite tôt ; du simple au difficile ; un succès rapide. (Keller : modèle ARCS, attention, pertinence, confiance, satisfaction.) |

### Repères mesurables

Ces repères aident à juger ; ce ne sont pas des normes scientifiques, et le verdict reste une lecture.

- **Durée** : mots hors figures ÷ 150 (le rythme de l'app). La lecture silencieuse d'un texte documentaire est plus
  rapide (238 mots par minute en anglais, méta-analyse de Brysbaert, 2019), mais une fiche à calculs se lit plus
  lentement. Une ligne « Durée » plus courte que ce calcul trompe le lecteur.
- **Doublons** : une figure et un tableau qui donnent les mêmes chiffres ; un exemple refait en entier dans deux fiches.
- **Densité** : une ligne de texte avec plus d'une dizaine de chiffres se lit mieux en tableau.
- **Ouverture** : ce que l'on voit sur le premier écran du téléphone (aujourd'hui : « L'essentiel », une liste de
  formules).

## Ce que dit la recherche, en bref

- **Ce qui marche le mieux pour retenir** : se tester (retrouver une réponse de mémoire) et étaler les révisions dans le
  temps. Ce sont les deux techniques jugées « très utiles » sur dix par Dunlosky et al. (2013). Relire, surligner et
  résumer sont jugés « peu utiles ». L'app fait déjà les deux premières (QCM, rappel libre, répétition espacée FSRS) ;
  une fiche peut les amorcer elle-même.
- **Se tromper d'abord aide aussi** : tenter de répondre avant d'avoir appris, même faux, améliore la mémorisation de la
  réponse lue ensuite (Richland, Kornell et Kao, 2009).
- **Les mots et les images ensemble**, sans rien d'inutile, avec des repères de structure et le vocabulaire d'abord
  (principes de Mayer).
- **Débutant ou expert, pas la même fiche** : l'exemple résolu aide le débutant, mais gêne quelqu'un qui maîtrise déjà
  (effet d'inversion dû à l'expertise : Kalyuga, Ayres, Chandler et Sweller, 2003). D'où l'idée d'une première lecture
  guidée et d'une relecture par « L'essentiel ».
- **Les quatre piliers de l'apprentissage** (Dehaene) : l'attention, l'engagement actif, le retour d'information, la
  consolidation. Une fiche à lire seulement n'en sert qu'un.
- **Aligner** ce qu'on enseigne, ce qu'on fait faire et ce qu'on évalue (Biggs, 1996).
- **Motiver** : capter l'attention, montrer la pertinence, donner confiance, laisser un succès (Keller, ARCS).

## Sources

- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J. et Willingham, D. T. (2013). Improving students' learning with
  effective learning techniques. *Psychological Science in the Public Interest*, 14(1), 4-58.
  https://doi.org/10.1177/1529100612453266
- Roediger, H. L. et Karpicke, J. D. (2006). Test-enhanced learning: taking memory tests improves long-term retention.
  *Psychological Science*, 17(3), 249-255. https://doi.org/10.1111/j.1467-9280.2006.01693.x
- Richland, L. E., Kornell, N. et Kao, L. S. (2009). The pretesting effect: do unsuccessful retrieval attempts enhance
  learning? *Journal of Experimental Psychology: Applied*, 15(3), 243-257.
- Mayer, R. E. *Multimedia Learning*, Cambridge University Press (1re éd. 2001) : les principes de cohérence,
  signalement, contiguïté, segmentation, pré-apprentissage, multimédia, personnalisation. Résumé :
  https://services.dartmouth.edu/TDClient/1806/Portal/KB/PrintArticle?ID=171655
- Kalyuga, S., Ayres, P., Chandler, P. et Sweller, J. (2003). The expertise reversal effect. *Educational Psychologist*,
  38(1), 23-31.
- Pashler, H. et al. (2007). *Organizing Instruction and Study to Improve Student Learning* (NCER 2007-2004). Institute
  of Education Sciences : espacer les révisions, se tester, alterner exemples résolus et problèmes, relier l'abstrait
  et le concret, poser des questions qui font expliquer.
- Biggs, J. (1996). Enhancing teaching through constructive alignment. *Higher Education*, 32, 347-364.
- Anderson, L. W. et Krathwohl, D. R. (dir.) (2001). *A Taxonomy for Learning, Teaching, and Assessing*. Longman.
- Keller, J. M. Le modèle ARCS (attention, relevance, confidence, satisfaction), années 1980.
- Dehaene, S. Cours au Collège de France (2015) et *Apprendre ! Les talents du cerveau, le défi des machines*, Odile
  Jacob, 2018 : https://www.college-de-france.fr/site/stanislas-dehaene/course-2015-01-13-09h30.htm
- Brysbaert, M. (2019). How many words do we read per minute? A review and meta-analysis of reading rate. *Journal of
  Memory and Language*.

## Relire une fiche, pas à pas

1. Lire la fiche comme l'auteur : sur téléphone, de haut en bas, sans les sources.
2. Refaire chaque calcul ; comparer aux corrigés de `content/` ; vérifier chaque fait extérieur.
3. Mesurer : `python3 build.py --empreintes <dossier>` donne l'empreinte ; compter les mots, les doublons, la densité.
4. Remplir `revue.md` : un verdict et une phrase par critère, en disant ce qui a été vu.
5. Assembler : la pastille apparaît. Si la fiche change ensuite, l'assemblage le dit et la pastille tombe jusqu'à la
   prochaine relecture.
