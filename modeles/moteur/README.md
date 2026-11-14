# Le moteur seul (v7)

L'app sans aucun contenu de cours : un univers « Mes cours » et une matière d'attente, « Ton premier cours ».
On y importe ses cours en packs (Profil › Importer un cours). C'est la version à héberger ailleurs que sur claude.ai,
ou à partager : elle ne contient aucun support de cours d'une école.

`python3 build.py` l'assemble aussi, dans `dist/moteur/` (`index.html` et `standalone.html`). Seule :
`python3 build.py --univers modeles/moteur --dist dist/moteur`.
