---
id: our-first-test
title: "Nuestro primer Test"
sidebar_label: "Nuestro primer Test"
---

Si Storybook es la primera fase de crear/actualizar un componente, la segunda fase debe ser confirmar la funcionalidad con un test. Añadamos un test para nuestra nueva funcionalidad de resumen.

Primero ejecutemos la suite existente para ver si rompimos algo:

```bash
yarn rw test
```

¡Bueno, eso no tomó mucho tiempo! ¿Pueden adivinar lo que hemos roto?

![imagen](https://user-images.githubusercontent.com/300/96655765-1b576f80-12f3-11eb-9e92-0024c19703cc.png)

El test estaba buscando el texto completo del blog post, pero recuerde que en **BlogPostsCell** teníamos **BlogPost** sólo mostrando el *resumen* del post. Este test está buscando emparejar el texto completo, que ya no está presente en la página.

Actualicemos el test para que compruebe el comportamiento esperado. Hay libros completos escritos sobre la mejor manera de hacer tests, así que no importa lo que decidamos probar en este código, siempre habrá alguien que nos diga que lo estamos haciendo mal. Solo como ejemplo, el test mas sencillo sería simplemente copiar el output y usarlo como texto en el test:

```javascript {7-8}
// web/src/components/BlogPostsCell.test.js

test('Success renders successfully', async () => {
  const posts = standard().posts
  render(<Success posts={posts} />)

  expect(screen.getByText(posts[0].title)).toBeInTheDocument()
  expect(screen.getByText("Neutra tacos hot chicken prism raw denim, put a bird on it enamel pin post-ironic vape cred DIY. Str...")).toBeInTheDocument()
})
```

Pero el número de caracteres a los que truncamos podría ser cambiado, así que ¿cómo lo encapsulamos en nuestro test? ¿O deberíamos? El número de caracteres está en el componente **BlogPost**, sobre el cual este no debería saber. Incluso si refactorizamos la función `truncate()` en un lugar compartido y la importamos en **BlogPost** y en este test, el test seguirá sabiendo demasiado sobre **BlogPost**—¿Por qué debería el test saber los detalles internos de **BlogPost** y que este está haciendo uso de la función `truncate()` del todo? ¡No debería!

Hagamos un arreglo--en virtud del hecho de que esta funcionalidad tiene un prop llamado "summary", podemos adivinar que está haciendo *algo* para acortar el texto. Entonces, ¿qué pasa si ponemos a prueba tres cosas sobre las que podemos hacer suposiciones en este instante:

1. El texto completo del post *no está* presente
2. Pero, al menos el primer par de palabras del post *están* presentes
3. El texto mostrado termina en "..."

Esto nos da un buffer si decidimos truncar a algo así como 25 palabras, o incluso si aumentamos a un par de centenas. Lo que *no* abarca, sin embargo, es el caso en el que el cuerpo del blog post es más corto que el límite del truncado. En ese caso, el texto completo estaría presente, y probablemente deberíamos actualizar la función `truncate()` para que no añada `...` en ese caso. Dejaremos a ustedes añadir esa funcionalidad y el test case en su tiempo libre. ;)

### Añadiendo el Test

Vale, hagámoslo:

```javascript {27-34}
// web/src/components/BlogPostsCell.test.js

import { render, screen } from '@redwoodjs/testing'
import { Loading, Empty, Failure, Success } from './BlogPostsCell'
import { standard } from './BlogPostsCell.mock'

describe('BlogPostsCell', () => {
  test('Loading renders successfully', () => {
    render(<Loading />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('Empty renders successfully', async () => {
    render(<Empty />)
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })

  test('Failure renders successfully', async () => {
    render(<Failure error={new Error('Oh no')} />)
    expect(screen.getByText(/Oh no/i)).toBeInTheDocument()
  })

  test('Success renders successfully', async () => {
    const posts = standard().posts
    render(<Success posts={posts} />)

    posts.forEach((post) => {
      const truncatedBody = post.body.substring(0, 10)
      const regex = new RegExp(`${truncatedBody}.*\.{3}`)

      expect(screen.getByText(post.title)).toBeInTheDocument()
      expect(screen.queryByText(post.body)).not.toBeInTheDocument()
      expect(screen.getByText(regex)).toBeInTheDocument()
    })
  })
})
```

Este test cicla por cada post en nuestro mock `standard()` y por cada uno:

<div class="code-dl">

```javascript
const truncatedBody = post.body.substring(0, 10)
```
Crea una variable `truncatedBody` que contenga los primeros 10 caracteres del texto del post

```javascript
const regex = new RegExp(`${truncatedBody}.*\.{3}`)
```
Crea una expresión regular que contiene esos 10 caracteres seguidos por cualquier carácter `.*` hasta que alcance tres puntos `\.{3}` (la elipsis al final del texto truncado)

```javascript
expect(screen.getByText(post.title)).toBeInTheDocument()
```
Encuentra el título en la página

```javascript
expect(screen.queryByText(post.body)).not.toBeInTheDocument()
```
Al buscar el texto *completo* del cuerpo, *no* debe encontrarlo

```javascript
expect(screen.getByText(regex)).toBeInTheDocument()
```
Encuentra el texto truncado y los elipsis en algún lugar de la página

</div>

Tan pronto cuando haya guardado el archivo el test debe haber ejecutado y pasado! Pulsa `a` para ejecutar la suite de tests completa.

> **¿Cuál es la diferencia entre `getByText()` y `queryByText()`?**
> 
> `getByText()` lanza un error si el texto no se encuentra en el documento, mientras que `queryByText()` resulta en `null` y le permite continuar el test (y es una forma de comprobar si cierto texto *no* se encuentra en la página). Puede leer más acerca de estos en la documentación de [DOM Testing Library Queries](https://testing-library.com/docs/dom-testing-library/api-queries).

Para corroborar que estamos probando lo que creemos que estamos probando, abra `BlogPostsCell.js` y elimine el prop `summary={true}` (o cámbielo a `false`)—la prueba fallará: ahora el texto completo del post *está* en la página y `expect(screen.queryByText(post.body)).not.toBeInTheDocument()` *está* en el documento. ¡Asegúrese de volver a poner el prop `summary={true}` antes de continuar!

### ¿Cómo funcionan los Mocks?

Los Mocks se usan para definir los datos devueltos por GraphQL. En las células, una llamada GraphQL es enviada (la consulta definida por **QUERY**) y regresa el componente **Success**. No queremos tener que ejecutar el servidor de la Api con datos reales en la base de datos solo para Storybook o para las pruebas, por lo que Redwood intercepta esas llamadas GraphQL y devuelve los datos definidos en los Mocks.

Los nombres de a los mocks están disponibles en archivos de pruebas e historias. Solo requiere importar el que quiera usar (`standard` se importa en archivos de prueba generados) y puedes usar la sintaxis de propagación para pasarla al componente ** Success**.

Pongamos que el mock se ve así:

```javascript
export const standard = () => ({
  posts: [
    {
      id: 1,
      title: 'First Post',
      body: `Neutra tacos hot chicken prism raw denim...`,
      createdAt: '2020-01-01T12:34:56Z',
    },
    {
      id: 2,
      title: 'Second Post',
      body: `Master cleanse gentrify irony put a bird on it...`,
      createdAt: '2020-01-01T12:34:56Z',
    },
  ],
})
```

La primera clave en el objeto devuelto se llama `posts`. Ese es también el nombre de la prop que se espera que se envíe a **Success** en la célula:

```javascript {1}
export const Success = ({ posts }) => {
  return (
    {posts.map((post) => <BlogPost post={post} />)}
  )
}
```

Así que simplemente podemos difundir el resultado de `standard()` en una historia o prueba cuando usamos el componente **Success** y todo funciona bien:

```javascript {5}
import { Success } from './BlogPostsCell'
import { standard } from './BlogPostsCell.mock'

export const success = () => {
  return Success ? <Success {...standard()} /> : null
}

export default { title: 'Cells/BlogPostsCell' }
```

Puede tener tantos mocks como quiera, importe los nombres que necesite y páselos como props a los componentes.

### Probando BlogPost

¡Nuestras pruebas están pasando de nuevo, pero es mentira! Nunca añadimos una prueba para la funcionalidad de `resumen` que añadimos al componente **BlogPost**. Hemos probado que **BlogPostsCell** solicita que **BlogPost** devuelva un resumen, pero sólo **BlogPost** sabe que el resumen existe.

Cuando entra en la zona programando la aplicación puede ser fácil obviar pruebas como esa. ¿No fue Winston Churchill quien dijo "una suite de pruebas completa requiere una vigilancia eterna"? Técnicas como [Test driven development](https://en.wikipedia.org/wiki/Test-driven_development) (TDD) ayudan a prevenir esta tendencia: escriba la prueba primero, véala fallar, entonces escriba el código para hacerla pasar de modo tal que cada línea de código esté respaldada por una prueba. Lo que estamos haciendo le llamamos [Development driven testing](https://medium.com/table-xi/development-driven-testing-673d3959dac2), es decir, probando a partir de código. Puede que se decida en algún lugar intermedio, pero una máxima es siempre verdadera: algo es mejor que nada.

La funcionalidad de resumen en **BlogPost** es bastante simple, pero hay un par de maneras diferentes que podríamos probarla:

* Exportar la función `truncate()` y probarla directamente
* Evalúa el estado final del componente renderizado

En este caso `truncate()` "pertenece a" **BlogPost** y el mundo exterior realmente no debería preocuparse por su existencia. Si a un cierto punto vemos que otro componente necesitaba truncar texto, entonces sería moveríamos dicha función a una ubicación compartida y la importaríamos en ambos componentes. `truncate()` podría incluso tener su propia prueba. Pero por ahora preocupémonos de probar la parte "pública" del componente, el resultado renderizado.

En este caso, vamos a probar que la salida coincide con una cadena exacta. Podríamos girar en círculos tratando de refactorizar el código para que sea a imposible que cambios en el código rompan las pruebas, pero ¿necesitaríamos tanta flexibilidad? ¡Siempre es un balance!

Moveremos los datos de ejemplo a una constante y luego los usamos en la prueba existente (que valida que al no pasar la prop `summary` tenemos como resultado el cuerpo completo) como en una nueva prueba que comprueba la versión con resumen:

```javascript {6-17,21,23-24,27-37}
// web/src/components/BlogPost/BlogPost.test.js

import { render, screen } from '@redwoodjs/testing'
import BlogPost from './BlogPost'

const POST = {
  id: 1,
  title: 'First post',
  body: `Neutra tacos hot chicken prism raw denim, put a bird on it
         enamel pin post-ironic vape cred DIY. Street art next level
         umami squid. Hammock hexagon glossier 8-bit banjo. Neutra la
         croix mixtape echo park four loko semiotics kitsch forage
         chambray. Semiotics salvia selfies jianbing hella shaman.
         Letterpress helvetica vaporware cronut, shaman butcher YOLO
         poke fixie hoodie gentrify woke heirloom.`,
  createdAt: new Date().toISOString(),
}

describe('BlogPost', () => {
  it('renders a blog post', () => {
    render(<BlogPost post={POST} />)

    expect(screen.getByText(POST.title)).toBeInTheDocument()
    expect(screen.getByText(POST.body)).toBeInTheDocument()
  })

  it('renders a summary of a blog post', () => {
    render(<BlogPost post={POST} summary={true} />)

    expect(screen.getByText(POST.title)).toBeInTheDocument()
    expect(
      screen.getByText(
        'Neutra tacos hot chicken prism raw denim, put a bird \
        on it enamel pin post-ironic vape cred DIY. Str...'
      )
    ).toBeInTheDocument()
  })
})
```

Al guardar los cambios y ejecutar las pruebas comprobaremos que la suite funciona.

### Una última cosa

Recuerde que establecemos la prop `summary` por omisión a `falso` y que es probado por el primer caso de prueba. Sin embargo, no tenemos una prueba que compruebe lo que sucede si `false` se recibe explícitamente. ¡Siéntase libre de añadirlo y mejorar la cobertura!

