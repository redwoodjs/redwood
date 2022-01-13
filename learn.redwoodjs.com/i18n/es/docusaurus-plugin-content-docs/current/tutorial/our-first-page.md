---
id: our-first-page
title: "Nuestra primera página"
sidebar_label: "Nuestra primera página"
---

Demos a nuestros usuarios algo más que la página de bienvenida de Redwood. Usaremos la herramienta de línea de comando `redwood` para crear nuestra página:

    yarn redwood generate page home /

El comando anterior hace cuatro cosas:

- Crea `web/src/pages/HomePage/HomePage.js`. Redwood usa el primer argumento como nombre del componente de la página, luego lo pasa a mayúsculas y añade el sufijo "Page".
- Crea un archivo de pruebas, junto con el componente recién creado, en `web/src/pages/HomePage/HomePage.test.js` con un único test. _Escribe_ tests para sus componentes, _¿verdad?_
- Crea un archivo Storybook para el componente en `web/src/pages/HomePage/HomePage.stories.js`. Storybook es una herramienta maravillosa para desarrollar y organizar eficientemente los componentes de la interfaz de usuario (UI). Consulte este [tema del Foro de Redwood](https://community.redwoodjs.com/t/how-to-use-the-new-storybook-integration-in-v0-13-0/873) para aprender más y empezar a usarlo en su proceso de desarrollo.
- Añade una `<Route>` en `web/src/Routes.js` que mapea la ruta raíz `/` a la nueva página _HomePage_.

> **Importación de rutas de páginas automática**
> 
> Notará que en `Routes. js` hacemos referencia a un componente `HomePage` que no se importa en ningún lado. Redwood importa automáticamente todas las páginas en el archivo Routes porque precisaremos referenciarlas luego. Esto evita extensas declaraciones de `import` en el archivo.

De hecho, esta página ya está disponible (su navegador se recargó automáticamente):

![Renderización por omisión de la HomePage](https://user-images.githubusercontent.com/300/76237559-b760ba80-61eb-11ea-9a77-b5006b03031f.png)

No es bonita, ¡pero es un comienzo! Pruebe en su editor cambiar algo del texto y guardarlo. Su navegador debería recargarse con el nuevo texto.

### Ruteo

Abra `web/src/Routes.js` y verifique que la ruta fue creada:

```html
<Route path="/" page={HomePage} name="home" />
```

Cambie el *path* de la ruta a algo como:

```html
<Route path="/hello" page={HomePage} name="home" />
```

Tan pronto añada su primera ruta no volverá a ver la pantalla inicial de Redwood. A partir de ahora Redwood servirá `NotFoundPage` cuando no encuentre una ruta que coincida con la URL solicitada. Cambie la URL a http://localhost:8910/hello donde verá la página de inicio "HomePage".

Antes de continuar ¡cambie de vuelta la ruta a `/`!

