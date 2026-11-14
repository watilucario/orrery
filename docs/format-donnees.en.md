# Data exchange format (format 1)

One file that holds everything that is yours in the app: your universes, your subjects and their content, your progress, your profile (exams, linked calendar, colors, settings). It is used to move from one version of the app to another: from "Révisions" (the version with the Bachelor courses built in) to "Maitrise" (the blank version), from one device to another, or from one copy of Maitrise to the next.

- Export: Profile › Back up or restore › "Export everything" (file `maitrise-<date>.json`, or copied text).
- Import: in Maitrise, at first launch ("I already have my data") or Profile › Back up or restore › "Import data". The import replaces what the app keeps on this device, then restarts it.
- The content alone of the subjects in the repository (without progress) is built by `build.py` into `dist/donnees/contenu.maitrise.json`.

## The app's words

| In the app (Maitrise) | In the repository | In the file |
|---|---|---|
| Universe (a galaxy) | `univers/<programme>/programme.json` | `univers[]` |
| Solar system = a subject | `univers/<programme>/<matière>/recette.json` and its files | `systemes[]` |
| Planet = a part of the course | a topic of the recipe (`themes`) | `systemes[].planetes[]` |
| Content of a subject | multiple-choice questions, cases, exercises, course sheets… | `systemes[].pack` (a pack, see `univers/README.en.md`) |
| Progress | browser memory (`qfcc2.*`, `tm.*`) | `progression.cles` |

## The file

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

- `app` is `"maitrise"`, `format` is `1`. A future version of the app that changes the format raises this number and keeps reading format 1.
- `source`: the name of the app that exported (for information).
- `univers[]`: `id` (letters, digits, `-` and `_`), `nom`; optional: `description`, `libelle` (the word for the subjects of this universe, "matières" by default), `vide` (text shown when nothing is ready), `galaxie` (the drawing of the galaxy: same settings and same limits as `programme.json`, `univers/README.en.md`).
- `systemes[]`: `id` (same rule), `univers` (the `id` of a universe in the file), `nom`, `stockage` (prefix of the keys of its progress), `planetes` (`[{id, nom}]`), `pack` (optional: the content, in the pack format; without a pack, the subject is "in preparation" with its planets), `revue` (optional: the review of the sheets, for their ticked circle).
- `progression.cles`: each key of the app's memory and its value as it is kept (a JSON text), as in the backup (`sauvegarde: 1`). Imported courses are not in there: they travel in `systemes[].pack`.

## Checks at import

The import rejects the whole file, with the list of problems, if:

- it is not a `maitrise` file of format 1, or it has neither universe nor system;
- an identifier is invalid or duplicated (universes, systems);
- a system points to a universe that is not in the file;
- a pack is rejected by the same checks as "Import a course" (those of `build.py`), or carries a different identifier than its system;
- two systems have the same storage, or a storage does not start with `qfcc2.` or `tm.`;
- a progress key belongs neither to the app (`qfcc2.`, `tm.`) nor to the storage of a system.

## Highlights and notes (v17, still format 1)

They travel in `progression.cles`, under the storage of their subject, like the rest of its progress: no new field in the file, `format` stays `1`. An older version that imports this file keeps the key without using it.

- Key: `<stockage>notes` (`qfcc2.notes` for tax law, `qfcc2.diag.notes`, `qfcc2.pk.<id>.notes` for an imported course…). Value: `{<id>: item}`.
- Item for a passage of a sheet: `{id ("n…"), cree (ms), maj (ms), th (identifier of the topic, or "_synthese" for the summary sheet), nomTh, coul (0: note without highlight, 1 yellow, 2 green, 3 blue), texte (the note, "" without a note), q (the exact passage), qv (optional: the same with its spaces between blocks, for display), av and ap (32 characters before and after), pos (place in the sheet, from 0 to 1), sec (title of the part)}`.
- Personal note linked to the subject: `{id, cree, maj, th: null, libre: 1, texte}` ("Personal addition, no source").
- On the claude.ai account: item `note:<id>` of the document `suivi_<subject>` (the most recent wins, deletion recorded as `d: null`); the times are in `<stockage>suivi`, which also travels.
- If the sheet has changed and the passage is no longer in it, the item is never deleted: it is shown as "Passage modified" with its text.

## What keeps data compatible from one version to the next

- A question identifier never changes (`ids.lock` in the repository): the review memory is attached to it.
- The storage of a subject never changes (`qfcc2.` for tax law, `qfcc2.compta.`…): it is the prefix of the keys of its progress. A pack keeps the storage of its recipe (JSON block).
- The identifier of a subject never changes: it names its documents on the account (`srs_<id>`, `suivi_<id>`).
- The profile (`qfcc2.profil`) travels as it is: exams, linked calendar (chosen calendars, colors, ignored events), subject colors, settings, open universe. The universes and systems created in Maitrise are in it too (`mondes`), to follow the claude.ai account.

## What does not travel

- Mental arithmetic (`calcul.js`): it is code, and the app never runs code that comes from a file. It stays in the "Révisions" version built from the repository.
- Calendar events: only the link to your Google calendar travels; the classes are read again from the calendar.
- What the claude.ai account of another page keeps: each artifact has its own database. The file bridges the gap.
