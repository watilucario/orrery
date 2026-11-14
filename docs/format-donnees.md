# Format d'échange des données (format 1)

Un fichier qui contient tout ce qui est à toi dans l'app : tes univers, tes matières et leur contenu, ta progression,
ton profil (examens, agenda relié, couleurs, réglages). Il sert à passer d'une version de l'app à une autre : de
« Révisions » (la version avec les cours du Bachelor intégrés) à « Maitrise » (la version vierge), d'un appareil à
un autre, ou d'une copie de Maitrise à la suivante.

- Exporter : Profil › Sauvegarder ou restaurer › « Tout exporter » (fichier `maitrise-<date>.json`, ou texte copié).
- Importer : dans Maitrise, au premier lancement (« J'ai déjà mes données ») ou Profil › Sauvegarder ou restaurer ›
  « Importer des données ». L'import remplace ce que l'app garde sur cet appareil, puis la relance.
- Le contenu seul des matières du dépôt (sans progression) est assemblé par `build.py` dans
  `dist/donnees/contenu.maitrise.json`.

## Les mots de l'app

| Dans l'app (Maitrise) | Dans le dépôt | Dans le fichier |
|---|---|---|
| Univers (une galaxie) | `univers/<programme>/programme.json` | `univers[]` |
| Système solaire = une matière | `univers/<programme>/<matière>/recette.json` et ses fichiers | `systemes[]` |
| Planète = une partie du cours | un thème de la recette (`themes`) | `systemes[].planetes[]` |
| Contenu d'une matière | QCM, cas, exercices, cours… | `systemes[].pack` (un pack, voir `univers/README.md`) |
| Progression | mémoire du navigateur (`qfcc2.*`, `tm.*`) | `progression.cles` |

## Le fichier

```json
{
  "app": "maitrise",
  "format": 1,
  "cree": "2026-10-26T18:00:00.000Z",
  "source": "Révisions",
  "univers": [
    {"id": "bachelor", "nom": "Bachelor", "description": "…", "libelle": "matières", "vide": "…",
     "galaxie": {"teinte": 176, "bras": 2, "enroulement": 2.7, "inclinaison": -0.35, "aplatissement": 0.52}}
  ],
  "systemes": [
    {"id": "fiscal", "univers": "bachelor", "nom": "Droit fiscal", "stockage": "qfcc2.",
     "planetes": [{"id": "ir", "nom": "Impôt sur le revenu"}],
     "pack": "# Pack · Droit fiscal\n…\n# Fin du pack\n",
     "revue": null}
  ],
  "progression": {"cles": {"qfcc2.profil": "{\"v\":1,…}", "qfcc2.srs": "{…}"}}
}
```

- `app` vaut `"maitrise"`, `format` vaut `1`. Une version future de l'app qui change le format augmente ce numéro et
  continue de lire le format 1.
- `source` : le nom de l'app qui a exporté (pour information).
- `univers[]` : `id` (lettres, chiffres, `-` et `_`), `nom` ; facultatifs : `description`, `libelle` (le mot pour les
  matières de cet univers, « matières » par défaut), `vide` (texte quand rien n'est prêt), `galaxie` (dessin de la
  galaxie : mêmes réglages et mêmes bornes que `programme.json`, `univers/README.md`).
- `systemes[]` : `id` (même règle), `univers` (l'`id` d'un univers du fichier), `nom`, `stockage` (préfixe des clés de
  sa progression), `planetes` (`[{id, nom}]`), `pack` (facultatif : le contenu, au format des packs ; sans pack, la
  matière est « en préparation » avec ses planètes), `revue` (facultatif : la relecture des fiches, pour leur rond
  coché).
- `progression.cles` : chaque clé de la mémoire de l'app et sa valeur telle qu'elle est gardée (un texte JSON), comme
  dans la sauvegarde (`sauvegarde: 1`). Les cours importés n'y sont pas : ils voyagent dans `systemes[].pack`.

## Contrôles à l'import

L'import refuse le fichier entier, avec la liste des problèmes, si :

- ce n'est pas un fichier `maitrise` de format 1, ou s'il n'a ni univers ni système ;
- un identifiant est invalide ou en double (univers, systèmes) ;
- un système vise un univers absent du fichier ;
- un pack est refusé par les mêmes contrôles que « Importer un cours » (ceux de `build.py`), ou porte un autre
  identifiant que son système ;
- deux systèmes ont le même stockage, ou un stockage ne commence pas par `qfcc2.` ou `tm.` ;
- une clé de progression n'appartient ni à l'app (`qfcc2.`, `tm.`) ni au stockage d'un système.

## Surlignages et notes (v17, toujours le format 1)

Ils voyagent dans `progression.cles`, sous le stockage de leur matière, comme le reste de sa progression : aucun champ
nouveau dans le fichier, `format` reste `1`. Une version plus ancienne qui importe ce fichier garde la clé sans s'en
servir.

- Clé : `<stockage>notes` (`qfcc2.notes` pour le droit fiscal, `qfcc2.diag.notes`, `qfcc2.pk.<id>.notes` pour un cours
  importé…). Valeur : `{<id>: élément}`.
- Élément d'un passage d'une fiche : `{id ("n…"), cree (ms), maj (ms), th (identifiant du thème, ou "_synthese" pour la
  fiche de synthèse), nomTh, coul (0 : note sans surlignage, 1 jaune, 2 vert, 3 bleu), texte (la note, "" sans note), q
  (le passage exact), qv (facultatif : le même avec ses espaces entre les blocs, pour l'afficher), av et ap (32
  caractères avant et après), pos (place dans la fiche, de 0 à 1), sec (titre de la partie)}`.
- Note perso liée à la matière : `{id, cree, maj, th: null, libre: 1, texte}` (« Ajout perso, non sourcé »).
- Sur le compte claude.ai : élément `note:<id>` du document `suivi_<matière>` (la plus récente gagne, suppression
  enregistrée en `d: null`) ; les heures sont dans `<stockage>suivi`, qui voyage aussi.
- Si la fiche a changé et que le passage n'y est plus, l'élément n'est jamais supprimé : il s'affiche « Passage modifié »
  avec son texte.

## Ce qui garde les données compatibles d'une version à l'autre

- Un identifiant de question ne change jamais (`ids.lock` dans le dépôt) : la mémoire de révision y est attachée.
- Le stockage d'une matière ne change jamais (`qfcc2.` pour le droit fiscal, `qfcc2.compta.`…) : c'est le préfixe des
  clés de sa progression. Un pack garde le stockage de sa recette (bloc JSON).
- L'identifiant d'une matière ne change jamais : il nomme ses documents sur le compte (`srs_<id>`, `suivi_<id>`).
- Le profil (`qfcc2.profil`) voyage tel quel : examens, agenda relié (agendas choisis, couleurs, événements ignorés),
  couleurs des matières, réglages, univers ouvert. Les univers et systèmes créés dans Maitrise y sont aussi
  (`mondes`), pour suivre le compte claude.ai.

## Ce qui ne voyage pas

- Le calcul mental (`calcul.js`) : c'est du code, et l'app n'exécute jamais de code venu d'un fichier. Il reste dans
  la version « Révisions » assemblée depuis le dépôt.
- Les événements de l'agenda : seul le lien vers ton agenda Google voyage ; les cours sont relus dans l'agenda.
- Ce que garde le compte claude.ai d'une autre page : chaque artefact a sa propre base. Le fichier fait le pont.
