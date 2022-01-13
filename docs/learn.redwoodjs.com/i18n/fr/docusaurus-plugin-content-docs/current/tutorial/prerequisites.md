---
id: prerequisites
title: "Prérequis"
sidebar_label: "Prérequis"
---

Ce didacticiel suppose que vous soyez déjà familier avec quelques concepts fondamentaux :

- [React](https://reactjs.org/)
- [GraphQL](https://graphql.org/)
- [La Jamstack](https://jamstack.org/)

Vous pouvez tout à fait compléter ce didacticiel sans savoir quoique ce soit sur ces technologies, mais il est possible que vous soyez un peu perdu par certains termes que nous utiliserons sans forcément les expliquer au préalable. D'une façon générale, il est toujours utile de savoir où se situe les frontières et pouvoir distinguer par exemple ce qui provient de React de ce qui est ajouté par Redwood.

### Node.js et Yarn

Vous aurez besoin d'être sur une version de Redwood supérieure ou égale à v0.25 pour achever ce tutoriel. Si c'est la première fois que vous utilisez Redwood, alors pas de soucis : la dernière version sera installée automatiquement lorsque vous créerez votre squelette d'application ! Si vous avez un site existant créé avec une version antérieure à la v0.25, vous devrez le mettre à jour. Exécutez cette commande à la racine de votre application et suivez les instructions :

```bash
yarn redwood upgrade
```

### Versions de Node.js et Yarn

👉 **Important:** Si votre système ne repond pas à ces prérequis, _l’installation se soldera par une ERREUR._ Vérifiez en exécutant les commandes suivantes dans un terminal:

- node: "=14.x"
- yarn: ">=1.15"

Procédez aux mises à jour le cas échéant, puis relancez l’installation de RedwoodJS lorsque vous êtes prêt !

```
node --version
yarn --version
```

Veuillez effectuer la mise à niveau en conséquence. Procédez ensuite à l'installation de Redwood quand vous serez prêt !

> **Installer Node et Yarn**
> 
> Il y a différentes façons d’installer Node.js et Yarn. Si vous procédez à leur installation pour la première fois, nous vous recommandons de suivre les points suivants :
> 
> **Yarn**
> 
> - Nous recommandons de suivre les instructions fournies sur [Yarnpkg.com](https://classic.yarnpkg.com/en/docs/install/).
> 
> **Node.js**
> 
> - Pour les utilisateurs de **Mac**, si vous avez dejà installé Homebrew, vous pouvez l’utiliser pour [installer `nvm`](https://formulae.brew.sh/formula/nvm). Dans le cas contraire, suivez les [instructions d'installation pour `nvm`](https://github.com/nvm-sh/nvm#installing-and-updating). 
>     - Pour les utilisateurs de **Mac**, si vous avez déjà installé Homebrew, vous pouvez l’utiliser pour [installer `nvm`](https://formulae.brew.sh/formula/nvm). Dans le cas contraire, suivez les [instructions d'installation pour `nvm`](https://github.com/nvm-sh/nvm#installing-and-updating).
>     - Pour les utilisateurs de **Linux**, vous pouvez suivre les [instructions d'installation pour `nvm`](https://github.com/nvm-sh/nvm#installing-and-updating).
> - Nous recommandons aux utilisateurs de **Windows** de visiter [Nodejs.org](https://nodejs.org/en/) pour savoir comment procéder.
> 
> Si vous êtes un peu perdu au moment de choisir quelle version de Node utiliser, nous vous recommandons la plus récente LTS avec un numéro de version pair, actuellement il s'agit de la v12.

