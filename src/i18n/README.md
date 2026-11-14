# Traductions de l'interface (src/i18n)

Une langue = un dossier (`src/i18n/fr/`, `src/i18n/en/`, plus tard `de/`…). Le français est la référence : toute clé qui y est
doit exister dans les autres langues, avec les mêmes `{variables}`. `python3 build.py` contrôle tout et s'arrête avec le
fichier et la clé en cause.

## Tables

- Un fichier JSON plat par lot : `src/i18n/<langue>/<lot>.json`, `{ "zone.sujet": "texte" }`. Plusieurs fichiers par langue
  sont fusionnés ; une clé définie deux fois (même dans deux fichiers) est une erreur. Même nom de fichier dans chaque langue
  (pas obligatoire, mais plus simple à relire). Une clé qui commence par `_` est un commentaire, ignoré.
- Clés : `<zone>.<sujet>` en minuscules, chiffres et `_` (ex. `hub.sous_attente`, `quiz.explain`). La zone est l'écran ou le
  fichier (`hub`, `quiz`, `prof`, `nav`…). `body.json` couvre `src/body.html` (clés générées d'après l'id de l'élément).
- Texte simple (pas de HTML) ; `{nom}` est remplacé par la valeur donnée. Une clé de la table de référence qui n'est utilisée
  par aucun `t("…")` littéral est seulement comptée dans le résumé du build (elle peut servir via une clé calculée).
- `langue.nom` (le nom de la langue, dans sa langue) et `langue.locale` (`fr-FR`, `en-GB`…) sont obligatoires.

## Dans le code (`src/js/00-i18n.js`)

- `t("zone.sujet")`, `t("zone.sujet", {n: 3, nom: "x"})` : le texte. Une clé absente rend la clé et le dit une fois en console.
- Pluriels : `tn("zone.sujet", n, {…})` avec deux clés, `zone.sujet.one` et `zone.sujet.other` (obligatoires toutes les deux) ;
  `{n}` est toujours donné. Exemple : `"lib.cas.one": "{n} cas"`, `"lib.cas.other": "{n} cas"` ; en anglais
  `"{n} case"` / `"{n} cases"`. La catégorie vient d'`Intl.PluralRules` de la langue (en français, 0 et 1 sont « one »).
  Ne plus écrire `plural(n, mot)` (03) : il est français seulement.
- Si la fonction a une variable locale nommée `t` (très fréquent : `var t=…`), elle masque la fonction : utilise `tx(…)` et
  `tnx(…)`, strictement les mêmes. Le build reconnaît les quatre noms.
- Le build ne voit que les appels dont la clé est un **littéral** : `t("hub.titre")`, pas `t("hub." + x)` (permis, mais non
  contrôlé : ajoute la clé dans les deux langues à la main). Un appel dans un commentaire `/* … */` ne compte pas.
- Texte posé dans le HTML : `data-i18n="cle"` (texte de l'élément), `data-i18n-aria`, `data-i18n-ph` (placeholder),
  `data-i18n-title`. `i18nApplique(racine)` les traduit (appelé au démarrage ; rappelle-le sur un morceau de HTML ajouté).
  Le texte français reste dans le HTML comme valeur par défaut. `data-i18n` remplace tout le contenu de l'élément : pour un texte
  mêlé à un `<b>` ou un `<kbd>`, enveloppe chaque morceau dans son `<span>`.
- Dates : `fmtLang()` (locale Intl), `fmtDate(ms, options)`, `fmtNombre(v, options)`. `MOIS` et `JOURS` (07) sont déjà dans
  la langue (`i18nDates()`, appelé par 13). Évite les `toLocaleString("fr-FR")` en dur.
- `i18nTitre(mot)` et `i18nEnc(type)` : les mots-clés de syntaxe du contenu montrés à l'écran (« L'essentiel », « À retenir »,
  « Teste-toi », encadrés `definition`, `formule`…) deviennent leur libellé (`cours.*` dans `syntaxe.json`).

## Ce qui reste en français

- Identifiants (questions, thèmes, cas, exercices, recettes), clés de stockage (`qfcc2.*`, préfixes), ids HTML et classes CSS.
- Les mots-clés de syntaxe des fichiers de contenu, y compris dans les fichiers `.en` (`Explication :`, `Source :`, `Niveau :`,
  `## L'essentiel`, `## À retenir`, `::: definition`… voir `univers/README.md`).
- Le format des nombres des fichiers de contenu (`Réponse : 1 234,5`) : la lecture est la même dans toutes les langues.

## Contenu par langue (build.py)

`X.md` → `X.en.md`, `recette.json` → `recette.en.json`, `programme.json` → `programme.en.json`, `calcul.js` → `calcul.en.js`,
`docs/modele-de-pack.en.md`, `modeles/exemple-pack.en.md`. Le build contrôle chaque variante comme l'original, puis qu'elle a les
mêmes identifiants, bonnes réponses, nombres, repères, figures et encadrés (`::: type`, dans le même ordre), et les mêmes
thèmes et parties de fiche. Une matière sans variante reste en français. Une fiche anglaise est certifiée si sa jumelle
française l'est (`revue_langue`).

## Vérifier

`python3 build.py` (clés, variables, appels `t("…")`, `data-i18n`, variantes de contenu), puis ouvrir `dist/standalone.html`,
choisir la langue (Profil › Réglages › Langue) et parcourir l'écran traduit.
