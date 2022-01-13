---
id: layouts
title: "Mises en pages"
sidebar_label: "Mises en page"
---

Une façon de résoudre la duplication du `<header>` aurait pu être de créer un composant `<Header>` et l'inclure à la fois dans `HomePage` et `AboutPage`. Cela fonctionne, mais y a-t-il une meilleure solution? Dans l'idéal, votre code ne devrait comporter qu'une seule et unique balise `<header>`.

Lorsque vous regardez à ces deux pages, quelle est leur raison d'être principale? Toutes deux ont un peu de contenu à afficher. Toutes deux ne devraient pas avoir à connaître ce qui vient avant ce contenu (comme un `<header>`), ou après ce même contenu (comme un `<footer>`). C'est exactement ce que font les "Layouts": ils entourent une page dans un composant qui va ensuite afficher à l'intérieur le contenu de la page: Le layout peut contenir n'importe quel contenu en dehors de la page elle-même. D'un point de vue conceptuel, le document final sera structuré de la façon suivante :

<img src="https://user-images.githubusercontent.com/300/70486228-dc874500-1aa5-11ea-81d2-eab69eb96ec0.png" alt="Diagramme de structure des Layouts" width="300" />

Utilisons Redwood pour générer un layout contenant ce `<header>` :

    yarn redwood g layout blog

> **raccourci `generate`**
> 
> Désormais nous utiliserons le raccourci `g` à la place de `generate`

Ce faisant, nous avons créé le fichier `web/src/layouts/BlogLayout/BlogLayout.js` et un son fichier de test associé. Nous appellerons ce dernier le "blog" layout car nous aurons certainement d'autres layout plus tard (un layout "admin" par exemple).

Supprimez ce `<header>` de `HomePage` et `AboutPage` et copier son contenu à l'intérieur du layout. Supprimons également le doublon de la balise `<main>` par la même occasion.

```javascript {3,7-19}
// web/src/layouts/BlogLayout/BlogLayout.js

import { Link, routes } from "@redwoodjs/router";

const BlogLayout = ({ children }) => {
    return (
        <>
            <header>
                <h1>Redwood Blog</h1>
                <nav>
                    <ul>
                        <li>
                            <Link to={routes.about()}>About</Link>
                        </li>
                    </ul>
                </nav>
            </header>
            <main>{children}</main>
        </>
    );
};

export default BlogLayout;
```

`children` est l'endroit où la magie opère! Toute page passée en argument à un layout s'affiche là. Les pages se focalisent donc à nouveau sur ce qui compte vraiment, le contenu ( nous pouvons retirer l'import de `Link` et les `routes` pour `Homepage` car ils sont désormais dans le Layout ). Pour ce faire, il va nous falloir changer notre fichier de routes. Nous allons encapsuler `HomePage` et `AboutPage` dans le `BlogLayout`, en utilisant un `<Set>` :

```javascript {3,4,9-12}
// web/src/Routes.js

import { Router, Route, Set } from '@redwoodjs/router'
import BlogLayout from 'src/layouts/BlogLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={BlogLayout}>
        <Route path="/about" page={AboutPage} name="about" />
        <Route path="/" page={HomePage} name="home" />
      </Set>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
```

> **L'alias `src`**
> 
> Remarquez que l'import utilise `src/layouts/BlogLayout` et non `../src/layouts/BlogLayout` ou `./src/layouts/BlogLayout`. Pouvoir se contenter d'ajouter uniquement `src` est un petit apport bien pratique de Redwood: `src` est un alias pour le chemin du répertoire `src` du workspace courant. En d'autres termes, lorsque vous travaillez dans `web`, `src` pointe vers `web/src`. Et lorsque vous travaillez dans `api` il pointe vers `api/src`.

Revenez donc dans votre navigateur, et vous devriez alors voir...... rien de nouveau. Mais c'est bien, cela signifie que notre Layout fonctionne.

> **Pourquoi certaines choses sont nommées d'une certaine façon?**
> 
> Il est possible que vous ayez remarqué quelques répetitions dans le nom des fichiers utilisés par Redwood. Ainsi les pages se trouvent dans un répertoire appelé `/pages`, et contiennent de nouveau `Page` dans leur nom. Idem pour les Layouts. Pourquoi de choix?
> 
> Lorsque vous avez des dizaines de fichiers ouverts dans votre éditeur de code, il est facile de se perdre. C'est d'autant plus le cas lorsque vous avez des fichiers aux noms similaires dans des répertoires différents. Nous avons découvert que cette petite duplication dans le noms des fichiers permet d'être plus efficace lorsqu'il est nécessaire d'en localiser un parmi les nombreux onglets ouvert dans l'éditeur de code.
> 
> Le plugin [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) peut également vous aider à distinguer les fichiers entre eux.
> 
> <img src="https://user-images.githubusercontent.com/300/73025189-f970a100-3de3-11ea-9285-15c1116eb59a.png" width="400" />

### Retour à la Maison, encore une fois

Ajoutons encore un autre `<Link>` de façon à ce que le titre et le logo pointent vers la page d'accueil:

```javascript {9-11}
// web/src/layouts/BlogLayout/BlogLayout.js

import { Link, routes } from '@redwoodjs/router'

const BlogLayout = ({ children }) => {
  return (
    <>
      <header>
        <h1>
          <Link to={routes.home()}>Redwood Blog</Link>
        </h1>
        <nav>
          <ul>
            <li>
              <Link to={routes.about()}>About</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>{children}</main>
    </>
  )
}

export default BlogLayout
```

Enfin nous pouvons éliminer de la page About le lien "Retour à la page d'accueil" devenu superflu (ainsi que les imports `Link` et `routes` associés).

```javascript
// web/src/pages/AboutPage/AboutPage.js

const AboutPage = () => {
  return (
    <p>
      This site was created to demonstrate my mastery of Redwood: Look on my
      works, ye mighty, and despair!
    </p>
  )
}

export default AboutPage
```
