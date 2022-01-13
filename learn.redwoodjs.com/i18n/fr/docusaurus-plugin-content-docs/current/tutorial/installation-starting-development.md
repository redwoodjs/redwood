---
id: installation-starting-development
title: "Installation & Démarrage du développement"
sidebar_label: "Installation & Démarrage du développement"
---

Nous utiliserons yarn ([yarn](https://yarnpkg.com/en/docs/install) est un pré-requis) pour créer la structure de base pour notre application :

    yarn create redwood-app ./redwoodblog

Vous obtenez ainsi un nouveau répertoire `redwoodblog` contenant plusieurs sous-répertoires et fichiers. Déplacez-vous dans ce répertoire, puis lancez le serveur de développement :

    cd redwoodblog
    yarn redwood dev

Votre navigateur web devrait se lancer automatiquement et ouvrir `http://localhost:8910` laissant apparaître la page d’accueil de Redwood.

![Redwood Welcome Page](https://user-images.githubusercontent.com/300/73012647-97a43d00-3dcb-11ea-8554-42df29c36e4a.png)

> Mémoriser le numéro de port est très simple, comptez simplement: 8-9-10!

### Premier Commit

Maintenant que nous avons le squelette de notre application Redwood, c'est le bon moment pour enregistrer notre travail avec un premier commit... au cas où.

    git init
    git add .
    git commit -m 'Premier commit'

