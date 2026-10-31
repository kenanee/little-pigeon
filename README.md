# 🐦 Little Pigeon — City Escape

**Little Pigeon** est un jeu de poursuite en 3D dans une ville inspirée de Manhattan. Le joueur pilote un pigeon personnalisable, récupère des pièces et tente d'échapper aux pilons de poulet frits.

## Lancer le jeu en local

Le jeu utilise des modules JavaScript ES et importe Three.js. Il faut donc le lancer avec un serveur local ; le double-clic sur `index.html` peut être bloqué par le navigateur.

### Option A — Python (simple)

1. Télécharge le dépôt avec **Code → Download ZIP**, puis décompresse-le.
2. Ouvre un terminal dans le dossier `little-pigeon`.
3. Lance :

```bash
python -m http.server 8000
```

4. Ouvre **http://localhost:8000** dans Chrome, Edge ou Firefox.

### Option B — VS Code

Ouvre le dossier dans VS Code, installe l'extension **Live Server**, puis clique sur **Go Live**.

Une connexion Internet est nécessaire pour charger Three.js et le modèle 3D de voiture CC0. Si le modèle de voiture n'est pas disponible, un véhicule de secours généré par le jeu est utilisé.

## Commandes

| Action | Clavier |
|---|---|
| Avancer | **Z** (AZERTY) ou **W** (QWERTY) / ↑ |
| Reculer | **S** / ↓ |
| Aller à gauche | **Q** ou **A** / ← |
| Aller à droite | **D** / → |
| Boost | **Espace** ou **Maj** |
| Pause | **Échap** |

Sur téléphone, les boutons tactiles apparaissent pendant la partie.

## Fonctionnalités

- Ville 3D procédurale inspirée de Manhattan : immeubles en brique, façades vitrées, fenêtres, escaliers de secours, arbres, feux de circulation, lampadaires, trottoirs et avenues.
- Voitures 3D avec modèle GLB réaliste CC0 chargé depuis 3DAssets.dev ; voitures de secours si le CDN est indisponible.
- Pigeon personnalisé avec silhouette profilée, cou irisé, bec, yeux, pattes, queue et ailes à plumes superposées.
- Cinq skins : Commun, Neige (rare), Rouge-pigeon (légendaire), Ailes de dragon (mythique) et Multicolore (divin).
- Poursuivants en forme de pilons frits, pièces à collectionner, score, boost et trois vies.
- Cycle jour / soir / nuit, éclairage dynamique et ciel étoilé.
- Ambiance musicale originale générée avec Web Audio ; elle s'active avec le bouton **SON** pendant la partie.
- Progression locale sauvegardée dans le navigateur : nom, pièces et skins débloqués.

## Structure du projet

```text
little-pigeon/
├── index.html          # Interface et points d'entrée
├── styles.css          # Styles de l'interface
├── src/
│   ├── main.js         # Boucle de jeu, commandes, collisions et HUD
│   ├── world.js        # Ville, circulation, éclairage et pièces
│   ├── pigeon.js       # Modèle 3D du pigeon et plumes
│   ├── chicken.js      # Modèle 3D des pilons poursuivants
│   └── audio.js        # Musique d'ambiance et effets sonores
└── README.md
```

## Publier sur GitHub Pages

1. Dans le dépôt, ouvre **Settings → Pages**.
2. Dans **Build and deployment**, choisis **Deploy from a branch**.
3. Choisis la branche **main** et le dossier **/(root)**, puis clique sur **Save**.
4. Après le déploiement, GitHub affichera l'adresse du jeu dans **Settings → Pages**.

## Ressources 3D et limites du prototype

La voiture utilise un modèle GLB externe de 3DAssets.dev, publié sous **CC0 1.0**. Les façades, la ville, le pigeon et les pilons sont construits par le code du jeu ; les textures de façades et de chaussée sont générées dans le navigateur. La musique est également générée à partir d'oscillateurs Web Audio et ne contient pas de morceau commercial.

Ce prototype possède des modèles et une scène 3D plus détaillés que la première version, mais il ne s'agit pas encore d'un jeu photoréaliste de production : le pigeon et les pilons sont des modèles procéduraux, sans squelette Blender ni capture de mouvement. Les prochaines étapes possibles sont un modèle de pigeon riggé, des animations de vol et de course, des matériaux PBR de façades et des effets de circulation plus poussés.

Voir [ASSET_CREDITS.md](./ASSET_CREDITS.md) pour les liens et licences.
