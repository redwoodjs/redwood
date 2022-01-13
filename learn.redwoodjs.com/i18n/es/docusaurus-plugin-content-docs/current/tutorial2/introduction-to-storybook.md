---
id: introduction-to-storybook
title: "Introducción a Storybook"
sidebar_label: "\"Introducción a Storybook\""
---

Veamos de qué se trata esta cosa de Storybook. Ejecute este comando para iniciar el servidor Storybook (de nuevo, puede cancelar el test runner y ejecutar esto en la misma sesión, o iniciar una nueva):

```bash
yarn rw storybook
```

Después de un poco de compilación, debería recibir un mensaje diciendo que Storybook ha comenzado y está disponible en http://localhost:7910

![imagen](https://user-images.githubusercontent.com/300/95522673-8f078d00-0981-11eb-9551-0a211c726802.png)

Si juega un poco con el árbol de archivos a la izquierda verá todos los componentes, células y páginas que creamos en el tutorial. ¿De dónde salieron? Si recuerda, cada vez que generamos una nueva página/celda/componente creamos al menos *tres* archivos:

* BlogPost.js
* BlogPost.stories.js
* BlogPost.test.js

> Si generó una célula entonces también obtuvo un archivo `.mock.js` (más información sobre estos luego).

¡Estos archivos `.stories.js` hacen posible que exista el árbol en el navegador de Storybook! Tomado directamente de su homepage, Storybook se describe así:

*"...una herramienta de código abierto para desarrollar componentes de interfaz de usuario de forma aislada para React, Vue, Angular, y más. Hace que la construcción de impresionantes interfaces de usuario sea organizada y eficiente"*

Por lo tanto, la idea es que puedes construir tus componentes/celdas/páginas aisladamente, hacerlos ver de la manera que quieras y mostrando los datos correctos, luego conectándolos a tu aplicación completa.

Cuando se abrió Storybook debería haber abierto **Components > BlogPost > Generated** que es el componente generado que creamos para mostrar una entrada en el blog. Si abre `web/src/components/BlogPost/BlogPost.stories.js` verá lo que se necesita para explicar este componente a Storybook, y no es mucho:

```javascript
// web/src/components/BlogPost/BlogPost.stories.js

import BlogPost from './BlogPost'

export const generated = () => {
  return (
    <BlogPost
      post={{
        id: 1,
        title: 'First Post',
        body: `Neutra tacos hot chicken prism raw denim, put a bird on it
              enamel pin post-ironic vape cred DIY. Street art next level
              umami squid. Hammock hexagon glossier 8-bit banjo. Neutra
              la croix mixtape echo park four loko semiotics kitsch forage
              chambray. Semiotics salvia selfies jianbing hella shaman.
              Letterpress helvetica vaporware cronut, shaman butcher YOLO
              poke fixie hoodie gentrify woke heirloom.`,
        createdAt: '2020-01-01T12:34:45Z'
      }}
    />
  )
}

export default { title: 'Components/BlogPost' }
```

Importe el componente que desea utilizar y luego todas las exportaciones nombradas en el archivo serán una "historia" como se muestra en Storybook. En este caso, el generador lo llamó "generated" que muestra como la historia "Generated" en la vista del árbol:

```bash
Components
└── BlogPost
    └── Generated
```

Esto hace que sea fácil crear variantes de su componente y que todas se muestren juntas.

> ¿De dónde vinieron los datos del ejemplo de blog post? Nosotros (el equipo de Redwood) añadimos eso a la historia en el repositorio de `redwood-tutorial` para mostrarle cómo se podría ver una historia después de conectar algunos datos de ejemplo. Varias de las historias necesitan datos como estos, algunos en línea y otros en esos archivos `mock.js`. El resto del tutorial le mostrará cómo hacerlo usted mismo con nuevos componentes a medida que los cree.

