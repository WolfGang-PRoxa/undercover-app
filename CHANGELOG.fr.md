# Changelog

[English](CHANGELOG.md)

Toutes les évolutions notables du projet sont consignées ici. Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et les versions suivent le format `X.Y.Z`.

## [Unreleased]

### Améliorations

- Version au format `X.Y.Z` (`APP_VERSION = "1.2.0"`).

## [1.2.0] - 2026-11-21

### Corrections

- URL du dépôt mise à jour (ancien nom undercover-scriptable).

## [1.1.0] - 2026-10-24

### Ajouts

- Journal de chaque partie dans `Scriptable/Undercover/logs/` et écran « Historique des parties ».
- Liste de mots « Culture pop » (`culture_pop_fr.json`, `pop_culture_en.json`).
- `lists/index.json` et bouton « Mettre à jour les listes officielles ».
- « Réinitialiser les mots utilisés » et nombre de groupes restants par liste.

### Corrections

- **Tirage des mots** : la liste active n'était jamais présente sur l'appareil (non téléchargée en FR, URL erronée en EN), le jeu retombait donc sur une liste de secours de 2 groupes (Chat/Chien/Loup/Renard et Soleil/Lune/Étoile/Planète). La liste embarquée contient désormais la liste par défaut complète et les listes officielles sont téléchargées automatiquement.
- Mélange des mots non biaisé (Fisher-Yates au lieu d'un tri aléatoire).
- Un groupe de mots déjà joué ne peut plus ressortir ; quand la liste blanche est épuisée, le jeu le signale et propose de la réinitialiser au lieu de la vider silencieusement.
- Mots en double entre deux groupes des listes par défaut.
- Distribution à l'écran : le mot s'affichait directement. Le jeu annonce maintenant à qui passer le téléphone et attend sa confirmation avant d'afficher le mot.
- Le titre de la fenêtre du mot affichait l'emoji du rôle, révélant à chaque joueur s'il était Civil ou Infiltré.
- Mister White pouvait parler en premier.
- Une partie pouvait démarrer avec moins de 2 Civils, ou avec un nombre négatif d'Infiltrés / Mister White.
- Les fichiers iCloud non téléchargés n'étaient pas attendus avant lecture.
- URL de téléchargement des installeurs.

## [1.0.0]

### Ajouts

- Version initiale.
