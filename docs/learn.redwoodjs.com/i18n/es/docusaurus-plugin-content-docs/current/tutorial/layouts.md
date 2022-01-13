---
id: layouts
title: "Plantillas (Layouts)"
sidebar_label: "Plantillas (Layouts)"
---

Una manera de resolver el dilema del `<header>` duplicado sería creando un componente `<Header>` e incluirlo en las páginas `HomePage` y `AboutPage`. Sin embargo hay una solución mejor. Una solución robusta permite referenciar al `<header>` desde cualquier parte de la aplicación.

Cuando usted diseña estas páginas, ¿qué es lo que importa realmente? Que tienen algo de mostrar. No deberían preocuparse de lo que vino antes (como un encabezado `<header>`) o después (como un pie de página `<footer>`). Es aquí donde los "Layouts" resultan útiles: envuelven el componente de página y lo renderizan la página como hijo. Asimismo, el Layout puede contener cualquier contenido que esté fuera de la página misma. Conceptualmente, el documento renderizado tendrá la siguiente estructura de Layouts, páginas y componentes:

<img src="https://user-images.githubusercontent.com/300/70486228-dc874500-1aa5-11ea-81d2-eab69eb96ec0.png" alt="Diagrama estructural de layouts" width="300" />

Creemos un Layout para contener el `<header>`:

    yarn redwood g layout blog

> **Alias de `generate`**
> 
> De ahora en más, usaremos el alias `g` en lugar de `generate` por brevedad.

El comando creó `web/src/layouts/BlogLayout/BlogLayout.js` y un archivo de prueba asociado. A este Layout le llamamos "blog" layout porque podemos tener otros layouts en el futuro ( ¿quizás un layout "admin"?).

Corte el `<header>` tanto de `HomePage` como de `AboutPage` y péguelo en su lugar. Quitemos también la etiqueta duplicada `<main>`:

```javascript {3,7-19}
// web/src/layouts/BlogLayout/BlogLayout.js

import { Link, routes } from '@redwoodjs/router'

const BlogLayout = ({ children }) => {
  return (
    <>
      <header>
        <h1>Redwood Blog</h1>
        <nav>
          <ul>
            <li>
              <Link to={routes.about()}>Acerca de</Link>
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

`children` es donde sucederá la magia. El contenido de la página será renderizado aquí por el Layout. Y ahora las páginas vuelven a centrarse en el contenido que les concierne (también podemos eliminar la importación de `Link` y `routes` de `HomePage` ya que ahora están en el Layout). Para renderizar el Layout tenemos que cambiar nuestras rutas en *Routes. js*. Indicaremos que `HomePage` y `AboutPage` usan el `BlogLayout`, mediante un `<Set>`:

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

> **El alias de `src`**
> 
> Tenga en cuenta que la importación usa `src/layouts/BlogLayout` y no `../src/layouts/BlogLayout` ni `./src/layouts/BlogLayout`. Poder usar sólo `src` es una característica conveniente provista por Redwood: `src` es un alias del camino a `src` en el espacio de trabajo actual. Por lo que si trabaja en `web` entonces `src` apunta a `web/src` y `api` apunta a `api/src` respectivamente.

Volviendo al navagador, puede comprobar que... nada ha cambiado. Lo cuál es bueno, significa que nuestro Layout funciona como esperamos.

> **¿Por qué se llaman las cosas así?**
> 
> Puede que haya notado alguna duplicación en los nombres de los archivos de Redwood. Las páginas se ubican en `/pages` y también tiene un sufijo `Page`. Lo mismo que los Layouts. ¿Cuál es la idea?
> 
> Sucede que cuando tenemos docenas de archivos abiertos en el editor es fácil perderse, especialmente cuando trabajamos con varios archivos con nombres similares o idénticos en distintos directorios. ¡Imagine una docena de archivos llamados `index.js` y trate de encontrar el que estás buscando entre las pestañas abiertas! Hemos encontrado que la duplicación en los nombres de archivos ayuda a la productividad cuando buscamos un archivo específico.
> 
> Si usa el plugin [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) le ayudará a desambiguar la navegación en la pila de componentes:
> 
> <img src="https://user-images.githubusercontent.com/300/73025189-f970a100-3de3-11ea-9285-15c1116eb59a.png" width="400" />

### De regreso por la página de inicio

Coloquemos un `<Link>` en el título/logotipo para volver a la página de inicio como hemos hecho anteriormente:

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
              <Link to={routes.about()}>Acerca de</Link>
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

Ahora podemos eliminar el link "volver al inicio" (también las importaciones) que agregamos en la página "Acerca de":

```javascript
// web/src/pages/AboutPage/AboutPage.js

const AboutPage = () => {
  return (
    <p>
      Este sitio ha sido creado para probar mi destreza con Redwood: "¡Mirad
Mi obra, poderosos! ¡Desesperad!"
    </p>
  )
}

export default AboutPage
```
