---
id: our-first-page
title: "Notre Première Page"
sidebar_label: "Notre Première Page"
---

Donnons à nos utilisateurs quelque chose de plus à contempler que la page d'accueil de Redwood. Utilisons la commande `redwood` pour créer une première page :

    yarn redwood generate page home /

Cette commande fait les choses suivantes :

- Création de `web/src/pages/HomePage/HomePage.js`. Redwood prend le nom spécifié comme premier argument, le met en majuscules et le suffixe avec "Page" pour construire votre nouveau composant de type Page.
- Création d’un fichier de test du composant `web/src/pages/HomePage/HomePage.test.js` avec un simple test d’exemple à l’intérieur. Vous écrivez _toujours_ les tests de vos composants, _n’est-ce pas ??_
- Création d’un fichier Storybook `web/src/pages/HomePage/HomePage.stories.js`. Storybook est un outil formidable pour développer efficacement et organiser vos composants. Si vous souhaitez en savoir plus jetez un oeuil à ce [sujet sur le forum Redwood](https://community.redwoodjs.com/t/how-to-use-the-new-storybook-integration-in-v0-13-0/873) pour apprendre comment l’utiliser.
- Ajout d’une `<Route>` dans `web/src/Routes.js` qui fait correspondre le chemin `/` à la nouvelle page _HomePage_.

> **Import automatique des pages dans le fichier Routes**
> 
> Si vous regardez dans Routes, vous constaterez mention d'un composant, `HomePage`, qui n'est présent nulle part ailleurs. Redwood importe automatiquement toutes les pages dans le fichier Routes puisque nous aurons besoin de toutes les référencer de toute façon. Cela permet de s'épargner un `import` massif qui viendrait encombrer le fichier Routes.

En réalité, cette page est déjà active (et votre navigateur l’a rechargée pour vous) :

![Default HomePage render](https://user-images.githubusercontent.com/300/76237559-b760ba80-61eb-11ea-9a77-b5006b03031f.png)

D’accord, ça ne flatte pas encore la rétine mais c’est un début! Ouvrez cette page dans votre éditeur, modifiez un peu le texte et sauvegardez. Votre navigateur devrait recharger la page avec vos modifications.

### Routage

Ouvrez `web/src/Routes.js` et observez la route qui vient d’être créée :

```html
<Route path="/" page={HomePage} name="home" />
```

Essayez de modifier cette route de la façon suivante:

```html
<Route path="/hello" page={HomePage} name="home" />
```

Dès que vous ajoutez votre première route, la page d'accueil par défaut de Redwood disparaît. Désormais, lorsqu'aucune route ne peut être trouvée pour l'URL demandée, Redwood va retourner la page `NotFoundPage`. Modifiez l'URL de votre navigateur pour ouvrir `http://localhost:8910/hello`, vous devriez voir de nouveau le contenu de `HomePage.js`.

Modifiez à nouveau la route pour revenir à son état initial `/` avant de continuer.

