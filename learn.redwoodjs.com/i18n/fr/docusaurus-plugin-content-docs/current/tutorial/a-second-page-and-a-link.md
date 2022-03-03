---
id: a-second-page-and-a-link
title: "Une Seconde Page et un Lien"
sidebar_label: "Une Seconde Page et un Lien"
---

Ajoutons donc une page "About" à notre blog de manière à ce que personne n'ignore qui se trouve derrière cette application exceptionnelle. Nous allons créer une nouvelle page en utilisant `redwood`:

    yarn redwood generate page about

Remarquez que nous n'avons pas spécifié de chemin cette fois-ci, uniquement le nom de la page. En effet, si vous ne le précisez pas, la commande `redwood generate page` créera une `Route` en lui donnant pour chemin le nom de la page préfixé par un slash `/`. Dans le cas présent, ce sera donc `/about`.

> **Fragmenter le code pour chaque page**
> 
> Au fur et à mesure que vous ajoutez des pages à votre application, vous pouvez légitimement vous inquiéter du fait que le navigateur va devoir télécharger un volume initial de données toujours croissant. Soyez rassuré! Redwood va automatiquement fragmenter le code pour chaque page de telle façon que le chargement soit toujours extrêmement véloce. Vous pouvez donc créer autant de pages que vous le souhaitez sans vous inquiéter outre mesure de la taille finale du bundle webpack. Si, dans le cas contraire, vous souhaitez que certaines pages soient spécifiquement intégrées dans le bundle principal, il vous est possible de personaliser cette fonctionalité.

`http://localhost:8910/about` devrait maintenant pointer sur votre nouvelle page. Bien entendu, absolument personne ne va trouver cette page de votre blog en modifiant manuellement l'URL! Ajoutons donc un lien depuis la page d'accueil vers la page About, et vice-versa. Nous commencerons par créer un simple header et une barre de navigation dans `HomePage.js`:

```javascript {3,7-19}
// web/src/pages/HomePage/HomePage.js

import { Link, routes } from "@redwoodjs/router";

const HomePage = () => {
    return (
        <>
            <header>
                <h1>Redwood Blog</h1>
                <nav>
                    <ul>
                        <li>
                            <Link to={routes.about()}>A Propos</Link>
                        </li>
                    </ul>
                </nav>
            </header>
            <main>Home</main>
        </>
    );
};

export default HomePage;
```

Remarquons ici plusieurs points :

- Redwood adore les "[Function Components](https://www.robinwieruch.de/react-function-component)". Nous ferons un usage fréquent des "[React Hooks](https://reactjs.org/docs/hooks-intro.html)" au fil de l'élaboration de notre blog, et ces derniers ne sont actifs que dans les "function components". Vous êtes libres d'utiliser des "class components", mais nous vous recommandons de les éviter sauf cas particulier.
- Les balises Redwood `<Link>`, dans leur usage le plus simple, prennent un seul attribut `to`. Cet attribut `to` appelle une "_named route function_" de façon à générer l'URL correcte. Cette fonction possède le même nom que l'attribut `name` présent sur la `<Route>`:

  `<Route path="/about" page={AboutPage} name="about" />`

  Si vous n'aimez pas le nom que la commande `redwood generate` utilise pour votre route, vous pouvez parfaitement le changer dans le fichier `Routes.js`! Les routes nommées sont extrêmement utiles car, si vous désirez modifiez le chemin associé avec une route, il vous suffit de le modifier dans le fichier `Routes.js` et immédiatement tous les liens qui utilisent cette route pointerons au bon endroit. Vous pouvez également passer directement une chaîne de caractères à l'attribut `to`, mais alors vous ne bénéficiez plus de ce mécanisme bien utile.

### Retour à la maison

Une fois sur la page "About", nous n'avons aucun moyen de revenir en arrière. Pour y remédier, ajoutons également un lien à cet endroit:

```javascript {3,7-25}
// web/src/pages/AboutPage/AboutPage.js

import { Link, routes } from "@redwoodjs/router";

const AboutPage = () => {
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
            <main>
                <p>
                    Ce site est créé avec pour seule intention de démontrer la puissance créative de Redwood!
        Oui, c'est très
                    impressionant :D
                </p>
                <Link to={routes.home()}>Retour à la page d'accueil</Link>
            </main>
        </>
    );
};

export default AboutPage;
```

Bien! Affichons cette page dans le navigateur and vérifions que nous pouvons aller et venir entre les différentes pages.

En tant que développeur de classe cosmique, vous avez probablement repéré ce copier-coller un peu lourd du `<header>`. Nous aussi. C'est la raison pour laquelle Redwood dispose d'un petite chose bien pratique appelé "_Layout_"."

