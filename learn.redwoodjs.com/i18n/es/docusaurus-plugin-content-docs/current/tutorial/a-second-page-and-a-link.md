---
id: a-second-page-and-a-link
title: "Una segunda página y un link"
sidebar_label: "Una segunda página y un link"
---

Creemos una página "Acerca de" (about) para nuestro blog de modo que todo el mundo sepa apreciar nuestro genio. Nuevamente usamos `redwood`:

    yarn redwood generate page about

Tenga en cuenta que esta vez no especificamos una ruta como último argumento. Si omite el argumento al ejecutar `redwood generate page`, Redwood creará una `Route` y con el mismo camino que el nombre de la página y prefijando una barra. En este caso: `/about`.

> **Dividiendo el código (code-split) de cada página**
> 
> A medida que se agregan más páginas a la aplicación, nos preocuparíamos de que cada vez más y más código tenga que ser descargado por el usuario en toda carga de inicial de la página. ¡No tema! Redwood automáticamente dividirá código de cada página, lo que significa que las cargas iniciales de las páginas serán muy rápidas, y puede crear tantas páginas como desee sin preocuparse por el tamaño del paquete producido por Webpack. Sin embargo, si desea que se incluyan ciertas páginas en el paquete principal, puede sobreescribir el comportamiento predeterminado.

http://localhost:8910/about debería mostrar nuestra nueva página. Pero como nadie va a encontrarla cambiando la URL a mano vamos a añadir un link desde nuestra página de inicio y viceversa. Empezaremos creando, a la vez, una cabecera (header) y una navegación (nav) en la página de inicio:

```javascript {3,7-19}
// web/src/pages/HomePage/HomePage.js

import { Link, routes } from '@redwoodjs/router'

const HomePage = () => {
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
      <main>Inicio</main>
    </>
  )
}

export default HomePage
```

Señalemos algunas cosas:

- A Redwood le encanta [ componentes funcionales](https://www.robinwieruch.de/react-function-component). Haremos un uso extenso de [Hooks React](https://reactjs.org/docs/hooks-intro.html) y estos sólo están habilitados en componentes funcionales. Usted es libre de usar componentes de clase, pero le recomendamos evitarlos a menos que necesite sus capacidades especiales.
- El componente `<Link>` de Redwood, en su forma más básica, usa sólo el atributo `to`. El atributo `to` llama a una _función de ruta con nombre_ para obtener la URL correspondiente. Dicha función tiene el mismo nombre que el atributo `name` en el componente `<Route>`:

  `<Route path="/about" page={AboutPage} name="about" />`

  Si no te gusta el nombre que `redwood generate` usó para la ruta, ¡siéntase libre de cambiarlo en `Routes.js`! Las rutas con nombre son geniales porque si alguna vez cambias el camino asociado a una ruta, solo necesitas cambiarla en `Routes.js` y cada link apuntará al lugar correcto pues usa la función de ruta con nombre. También puedes usar el atributo `a` pero perderá las bondades que Redwood proporciona con las rutas con nombre.

### De vuelta al inicio

Una vez que navegamos a la página "about" no tenemos forma de volver, así que añadamos un Link allí también:

```javascript {3,7-25}
// web/src/pages/AboutPage/AboutPage.js

import { Link, routes } from '@redwoodjs/router'

const AboutPage = () => {
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
      <main>
        <p>
          Este sitio ha sido creado para probar mi destreza con Redwood: "¡Mirad
Mi obra, poderosos! ¡Desesperad!"
        </p>
        <Link to={routes.home()}>Regresar al inicio</Link>
      </main>
    </>
  )
}

export default AboutPage
```

¡Muy bien! Compruebe en el navegador que puede ir hacia adelante y hacia atrás.

Como desarrollador de clase mundial probablemente haya visto que esto de copiar y pegar `<header>` no es prolijo. Le entendemos bien. Por eso Redwood permite usar plantillas llamadas _Layouts_.

