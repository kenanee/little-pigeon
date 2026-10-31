# 🦈 Deep Escape — Ocean Run

**Deep Escape** est un jeu de poursuite en 3D dans un vaste monde sous-marin. Le joueur pilote un requin personnalisable, récolte des perles et tente d'échapper aux orques.

## Lancer le jeu en local

Le jeu utilise des modules JavaScript ES et importe Three.js. Il faut donc le lancer avec un serveur local ; le double-clic sur `index.html` peut être bloqué par le navigateur.

### VS Code

Ouvre le dossier dans VS Code, installe l'extension **Live Server**, puis clique sur **Go Live**.

### Python

Dans un terminal ouvert dans le dossier du projet, lance `py -m http.server 8000` (Windows) ou `python3 -m http.server 8000` (macOS/Linux), puis ouvre **http://localhost:8000**.

Une connexion Internet est nécessaire pour charger Three.js depuis jsDelivr.

## Commandes

| Action | Commande |
|---|---|
| Tourner à gauche / droite | Souris gauche / droite, ou **Q** / **D** |
| Monter / plonger | Souris haut / bas |
| Avancer / ralentir | **Z** / **S** |
| Monter / descendre directement | **E** / **C** |
| Boost | **Espace** |
| Pause | **Échap** |

Sur téléphone, les boutons tactiles apparaissent pendant la partie.

## Fonctionnalités

- Océan 3D ouvert avec fond marin texturé, rochers, forêts de varech, coraux, poissons et bulles.
- Décor optimisé avec des maillages instanciés pour limiter les appels de rendu.
- Requin profilé avec nageoire dorsale, nageoires latérales, branchies et queue animée.
- Orques avec motifs noirs et blancs, nageoires et nage synchronisée.
- Cinq apparences de requin : Bleu, Blanc, Tigre, Abysses et Néon.
- Perles à collectionner, score, boost et trois vies.
- Éclairage sous-marin évolutif et ambiance originale générée avec Web Audio.
- Progression locale sauvegardée dans le navigateur : nom, perles et apparences débloquées.

## Structure du projet

```text
little-pigeon/
├── index.html
├── styles.css
├── src/
│   ├── main.js
│   ├── world.js
│   ├── shark.js
│   ├── orca.js
│   └── audio.js
└── README.md
```

Les modèles du requin et des orques, les récifs, les plantes, les poissons et les bulles sont générés par le code du jeu. Il s'agit d'un prototype procédural ; les modèles ne sont pas des scans ou des animations de capture de mouvement.
