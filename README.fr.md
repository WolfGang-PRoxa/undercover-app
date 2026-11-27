# Undercover

[English](README.md)

Undercover est un jeu de soirée pour l'app iOS **[Scriptable](https://scriptable.app)**. Chacun reçoit un mot secret : les Civils ont tous le même mot, les Infiltrés un mot proche mais différent, et Mister White n'en a aucun. Les joueurs décrivent leur mot à tour de rôle, puis votent pour éliminer celui qu'ils soupçonnent. Le script gère toute la partie :

- tirage d'un groupe de mots proches et attribution des rôles (Civil, Infiltré, Mister White) ;
- distribution des mots à l'écran (en se passant le téléphone) ou par SMS ;
- ordre de parole, éliminations, dernière chance de Mister White et conditions de victoire ;
- classement des joueurs avec points et statistiques par rôle ;
- listes de mots téléchargeables, et vos propres listes ;
- un journal texte de chaque partie.

Le jeu existe en anglais (`undercover_en.js`) et en français (`undercover_fr.js`).

## Installation

1. Installez [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) sur votre iPhone ou iPad.
2. Dans Scriptable, créez un nouveau script, nommez-le `Installer Undercover` et collez-y le contenu de [`undercover_installer_fr.js`](undercover_installer_fr.js) (ou de [`undercover_installer_en.js`](undercover_installer_en.js) pour la version anglaise).
3. Lancez-le : il télécharge le jeu depuis la branche `main` de ce dépôt, l'enregistre sous le nom `Undercover_fr` (`Undercover_en` en anglais) et propose de le lancer.

Au premier lancement, le jeu crée son dossier de données et télécharge les listes de mots officielles.

## Mise à jour

- **Jeu** : relancez `Installer Undercover`. Il télécharge la dernière version et remplace le script.
- **Listes de mots** : dans le jeu, _Configuration avancée > Changer de liste de mots > Mettre à jour les listes officielles_.

## Emplacement des données

Les données sont enregistrées dans `Scriptable/Undercover/`, sur **iCloud Drive** quand il est disponible (synchronisé entre vos appareils), sinon _Sur mon iPhone_. Vous pouvez les ouvrir depuis l'app Fichiers.

| Chemin                     | Contenu                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `players.json`             | Profils des joueurs, scores cumulés et statistiques par rôle (`played`, `won`, `lost`)   |
| `config.json`              | Mode Debug et réglages de session (rôle ou pseudo dans les SMS, liste de mots active)    |
| `lists/`                   | Listes officielles téléchargées depuis le dépôt et vos propres listes                    |
| `lists/*__used_words.json` | Groupes de mots déjà joués avec chaque liste                                             |
| `logs/`                    | Un journal texte par partie, également consultable dans l'écran _Historique des parties_ |

### Listes de mots

Les listes de mots sont des fichiers JSON composés de groupes de 4 à 5 mots proches :

```json
[
  ["Mot A", "Mot B", "Mot C", "Mot D"],
  ["Chien", "Chat", "Loup", "Renard"]
]
```

L'ancien format par paire (`[{ "civil": "...", "undercover": "..." }]`) est toujours pris en charge.

À chaque partie, un groupe **jamais joué** avec la liste active est tiré au sort : deux de ses mots deviennent le mot des Civils et celui des Infiltrés, et le groupe entier est marqué comme utilisé. Quand tous les groupes ont été joués, le jeu propose de réinitialiser la liste (également possible via _Configuration avancée > Réinitialiser les mots utilisés_).

Les listes officielles sont dans le dossier [`lists/`](lists) et référencées dans [`lists/index.json`](lists/index.json) :

| Fichier                                       | Contenu                                                           |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `default_en.json` / `default_fr.json`         | Liste par défaut (50 groupes), également embarquée dans le script |
| `pop_culture_en.json` / `culture_pop_fr.json` | Culture pop : films, séries, jeux vidéo, marques... (64 groupes)  |

Pour utiliser votre propre liste, déposez un fichier `.json` dans `Scriptable/Undercover/lists/` puis sélectionnez-la dans _Configuration avancée > Changer de liste de mots_. Pour publier une nouvelle liste officielle, ajoutez le fichier dans `lists/` et son nom dans `lists/index.json`.

## Fonctionnement

Chaque script est une application monopage dans une unique `UITable` Scriptable :

- `main()` exécute une boucle sans fin autour de `startApp()`, qui affiche l'interface et résout une `Promise` quand l'utilisateur lance une partie ou quitte.
- `render()` vide le tableau et reconstruit la vue courante (`appState.view` : menu principal, classement, partie en cours, règles...).
- `sessionConfig` contient les préférences persistantes ; `appState` contient les joueurs (enregistrés dans `players.json`) et la partie en cours.
- `launchGame()` calcule le nombre d'Infiltrés (25 % des joueurs arrondi au supérieur, ou une valeur manuelle) et de Mister White, tire un groupe avec `pickPair()`, attribue les rôles avec `assignRoles()` et construit l'ordre de parole avec `buildTurnOrder()` (Mister White ne parle jamais en premier).
- `executeElimination()` retire un joueur, laisse Mister White deviner le mot des Civils et vérifie les conditions de victoire : plus aucun Infiltré ni Mister White, les Civils gagnent ; un seul Civil restant, les Infiltrés et Mister White gagnent.
- `computeEndGameStats()` met à jour les statistiques et attribue les points aux gagnants : `+2` par Civil, `+10` par Infiltré, `+6` pour Mister White.

## Développement

Les scripts tournent dans Scriptable ; Node.js (version 22) ne sert qu'aux outils de développement.

```sh
npm install      # installe les outils de développement
npm test         # lance les tests (faux environnement Scriptable dans tests/)
npm run format   # met en forme le code avec Prettier
npm run lint     # vérifie le code avec ESLint
npm run check    # vérification Prettier + ESLint, comme la CI
```

Le travail se fait sur la branche `dev`. Les installeurs lisent `main` : on n'y fusionne que des versions testées. La version est la constante `APP_VERSION` en tête de chaque script (format `X.Y.Z`) et les évolutions sont listées dans [CHANGELOG.fr.md](CHANGELOG.fr.md).

## Licence

[MIT](LICENSE) © 2026 WolfGang-PRoxa
