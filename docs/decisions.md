# Décisions de conception

Chaque entrée : ce qui a été décidé, pourquoi, et ce qui a été écarté.

1. **Le contenu est séparé du code.** Questions, fiches et cas vivent dans `univers/`, jamais dans `src/js`. Une matière
   s'ajoute sans toucher au code. *Écarté : des questions écrites en dur dans le JavaScript, plus rapides à écrire mais
   impossibles à réutiliser.*
2. **`build.py` refuse le contenu invalide.** Une question sans source, une bonne réponse absente ou un identifiant
   supprimé arrêtent l'assemblage, avec le fichier et la ligne. *Écarté : des avertissements, qu'on finit par ignorer.*
3. **Les identifiants de questions ne changent jamais** (`ids.lock`). La mémoire de révision est indexée par
   identifiant : renommer une question ferait perdre la progression. On corrige une question sur place.
4. **FSRS-6 vérifié contre une référence.** Le moteur de répétition espacée est comparé à ts-fsrs sur 60 000 transitions
   (`tests/fsrs_check.js`). Les poids ne changent pas sans relancer ce contrôle. *Écarté : un algorithme maison jugé « à
   l'œil ».*
5. **Une seule page, JavaScript ES5, aucune bibliothèque.** Le code est concaténé dans un seul fichier, sans dépendance :
   l'app s'ouvre telle quelle dans un navigateur. *Écarté : un framework et un bundler, trop de surface pour un projet
   d'une personne.*
6. **Un moteur, deux apps.** Toute nouveauté se code une fois dans `src/` ; la version avec contenu et la version vierge
   s'assemblent depuis le même code. Les données passent de l'une à l'autre par un fichier d'export versionné
   (`docs/format-donnees.md`).
7. **L'aide d'une IA est facultative.** Sans compte Claude, la progression se sauvegarde dans un fichier et les cours
   s'importent en « packs » faits par n'importe quelle IA. L'app ne dépend pas d'un fournisseur.
8. **La confiance avant correction règle la révision.** « Sûr », « j'hésite » ou « au hasard » change la note donnée à
   l'algorithme : une réponse juste au hasard ne compte pas comme un acquis.
