---
id: everyones-favorite-thing-to-build-forms
title: "Los favoritos a construir: Formularios"
sidebar_label: "Los favoritos a construir: Formularios"
---

¡Espere, no se vaya! Eventualmente llegaríamos a esto, ¿no es así? Como ha de suponer, Redwood tiene una forma menos horrible de crear formularios, no hubiéramos escrito esto de no ser así. De hecho, Redwood incluso puede hacerle _disfrutar_ crear formularios. Si, sí, disfrutar, leyó bien. _¿Disfrutar_ crear formularios? _¿Tolerar_ crear formularios?

La tercera parte del video tutorial continúa aquí:

> **Aviso de contenido obsoleto**
> 
> Estos videos fueron grabados con una versión anterior de Redwood y muchos comandos están desactualizados. Si quiere construir el blog necesitará acompañar el vídeo con este texto, que está actualizado a la última versión.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/eT7iIy0F8Tk?rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; modestbranding; showinfo=0" allowfullscreen></iframe>
</div>

Ya tenemos un formulario o dos en la aplicación; ¿recuerda los scaffolds? ¡Y funcionan bastante bien! ¿Qué tan difícil puede ser? (lo que viene será mucho más impresionante si no ha echado un vistazo a ese código).

Creemos un formulario muy básico, por ejemplo "contáctenos".

### Creemos la página

    yarn rw g page contact

Agreguemos un link a contáctenos en la cabecera del layout:

```javascript {17-19}
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
            <li>
              <Link to={routes.contact()}>Contáctenos</Link>
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

Usemos pues el `BlogLayout` para la página `ContactPage` y asegurémonos de incluirla en el `<Set>` en el archivo de rutas:

```javascript {5}
// web/src/Routes.js

<Router>
  <Set wrap={BlogLayout}>
    <Route path="/contact" page={ContactPage} name="contact" />
    <Route path="/about" page={AboutPage} name="about" />
    <Route path="/" page={HomePage} name="home" />
  </Set>
  <Route notfound page={NotFoundPage} />
</Router>
```

Compruebe que todo se vea bien antes de continuar.

### Funciones auxiliares para formularios

En React los formularios tienen mala fama. Hay Components [ Controlados](https://reactjs.org/docs/forms.html#controlled-components), [Descontrolados](https://reactjs.org/docs/uncontrolled-components.html), [bibliotecas de terceros](https://jaredpalmer.com/formik/) y otras herramientas para simplificarlos. Originalmente la especificación HTML eran bien sencillos: un campo de `<input>` con un atributo `nombre` que se envía a algún lado al hace clic en el botón "Enviar".

Creemos que Redwood da un paso en la dirección correcta pues le liberar de escribir código repetitivo con componentes controlados y además facilita la validación y la gestión errores. Veamos cómo funciona.

Antes de empezar, añadimos unas clases de CSS para definir el diseño del formulario y que éste sea más claro, también nos ahorremos de escribir atributos de `style` que haría más difícil de seguir los ejemplos. Por ahora pondremos estas clases en el archivo `index.css` en `web/src`:

```css
/* web/src/index.css */

button, input, label, textarea {
  display: block;
  outline: none;
}

label {
  margin-top: 1rem;
}

.error {
  color: red;
}

input.error, textarea.error {
  border: 1px solid red;
}
```

Por ahora no usaremos la base de datos por lo que no crearemos una célula de contacto. Creemos el formulario en la página misma. Como es de esperar, un formulario en Redwood comienza con la etiqueta `<Form>`:

```javascript {3,7}
// web/src/pages/ContactPage/ContactPage.js

import { Form } from '@redwoodjs/forms'

const ContactPage = () => {
  return (
    <Form></Form>
  )
}

export default ContactPage
```

No es gran qué. Ni siquiera aparece en el navegador. Agreguemos un campo para ver algo en el navegador. Redwood include varios tipos de input como ser `<TextField>`. También le daremos un nombre, `name` de modo que lo diferenciemos de otros inputs en la página:

```javascript {3,8}
// web/src/pages/ContactPage/ContactPage.js

import { Form, TextField } from '@redwoodjs/forms'

const ContactPage = () => {
  return (
    <Form>
      <TextField name="input" />
    </Form>
  )
}

export default ContactPage
```

<img src="https://user-images.githubusercontent.com/300/80258121-4f4d2300-8637-11ea-83f5-c667e05aaf74.png" />

¡Por fin vemos algo! Aún así, muy aburrido. Agregemos un botón de enviar:

```javascript {3,9}
// web/src/pages/ContactPage/ContactPage.js

import { Form, TextField, Submit } from '@redwoodjs/forms'

const ContactPage = () => {
  return (
    <Form>
      <TextField name="input" />
      <Submit>Enviar</Submit>
    </Form>
  )
}

export default ContactPage
```

<img src="https://user-images.githubusercontent.com/300/80258188-7572c300-8637-11ea-9583-1b7636f93be0.png" />

Ahora tenemos un formulario de verdad. Escriba algo y cliquee "Enviar". Nada reventó en la página pero tampoco vemos si el formulario fue enviado o que pasó con los datos (sin embargo, puede que haya notado errores en el inspector web). A continuación obtendremos los datos enviados.

### onSubmit

Al igual que un formulario HTML, agregaremos un asidero al evento `onSubmit` del `<Form>`. Esta función recibirá un solo argumento: un objeto con los campos del formulario enviado:

```javascript {4-6,9}
// web/src/pages/ContactPage/ContactPage.js

const ContactPage = () => {
  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form onSubmit={onSubmit}>
      <TextField name="input" />
      <Submit>Enviar</Submit>
    </Form>
  )
}
```

Ahora, escriba en el campo y cliquee enviar:

<img src="https://user-images.githubusercontent.com/300/80258293-c08cd600-8637-11ea-92fb-93d3ca1db3cf.png" />

¡Muy bien! Añadamos un par de campos para que el formulario sea más útil. Renombremos el actual a "name" (nombre) y añadamos "email" (correo electrónico) y "message" ( mensaje):

```javascript {3,12-14}
// web/src/pages/ContactPage/ContactPage.js

import { Form, TextField, TextAreaField, Submit } from '@redwoodjs/forms'

const ContactPage = () => {
  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form onSubmit={onSubmit}>
      <TextField name="name" />
      <TextField name="email" />
      <TextAreaField name="message" />
      <Submit>Enviar</Submit>
    </Form>
  )
}

export default ContactPage
```

Vemos que el componente `<TextAreaField>` genera un componente HTML `<textarea>` contenido en el formulario de Redwood:

<img src="https://user-images.githubusercontent.com/300/80258346-e4e8b280-8637-11ea-908b-06a1160b932b.png" />

Añadamos algunas etiquetas:

```javascript {5,8,11}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Nombre</label>
    <TextField name="name" />

    <label htmlFor="email">Correo electrónico</label>
    <TextField name="email" />

    <label htmlFor="message">Mensaje</label>
    <TextAreaField name="message" />

    <Submit>Enviar</Submit>
  </Form>
)
```

<img src="https://user-images.githubusercontent.com/300/80258431-15c8e780-8638-11ea-8eca-0bd222b51d8a.png" />

Al completar el formulario y enviarlo, debería ver un mensaje en la consola con los tres campos.

### Validaciones

Usted se preguntará: "Vale, autor del tutorial, ¿cuál es la gran novedad?" Acaba de crear las funciones auxiliares para formularios como si fura la gran cosa, si bien hay muchas bibliotecas que permiten omitir la creación de inputs y controles manuales. "¿Y qué?" ¡Y está en lo cierto! Cualquiera puede completar el formulario _correctamente_ (aunque muchos testers cuestionarían esta afirmación), ¿qué pasa cuando alguien olvida algo, comete un error o trata de hackear el formulario? ¿Quién podrá ayudarnos? Redwood, por supuesto.

Indicaremos los tres campos como requeridos para enviar un mensaje. Usaremos el atributo estándar HTML `required`:

```javascript {6,9,12}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Nombre</label>
    <TextField name="name" required />

    <label htmlFor="email">Correo electrónico</label>
    <TextField name="email" required />

    <label htmlFor="message">Mensaje</label>
    <TextAreaField name="message" required />

    <Submit>Enviar</Submit>
  </Form>
)
```

<img src="https://user-images.githubusercontent.com/300/80258542-5163b180-8638-11ea-8450-8a727de177ad.png" />

Ahora al enviarlo, habrá un mensaje en el navegador indicando que campo debe ser completado. Esto es mejor que nada, es hora de estilar estos mensajes. ¿Podemos hacerlo mejor?

¡Sí! Cambiemos el atributo `required` por `validation` y pasemos un objeto al para usar las funciones auxiliares del formulario:

```javascript {6,9,12}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Nombre</label>
    <TextField name="name" validation={{ required: true }} />

    <label htmlFor="email">Correo electrónico</label>
    <TextField name="email" validation={{ required: true }} />

    <label htmlFor="message">Mensaje</label>
    <TextAreaField name="message" validation={{ required: true }} />

    <Submit>Enviar</Submit>
  </Form>
)
```

Al enviar el formulario con campos vacíos, el campo "name" se enfocará. ¡Qué aburrido! Pero ya falta menos para una sorpresa... Crearemos una funcion auxiliar para mostrar el error en el componente. Usaremos HTML pero podríamos estilarlo si quiciéramos.

### `<FieldError>`

Agreguemos un `<FieldError>` (recuerde agregar la declaración `import`):

```javascript {8,20,24,28}
// web/src/pages/ContactPage/ContactPage.js

import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
} from '@redwoodjs/forms'

const ContactPage = () => {
  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form onSubmit={onSubmit}>
      <label htmlFor="name">Nombre</label>
      <TextField name="name" validation={{ required: true }} />
      <FieldError name="name" />

      <label htmlFor="email">Correo electrónico</label>
      <TextField name="email" validation={{ required: true }} />
      <FieldError name="email" />

      <label htmlFor="message">Mensaje</label>
      <TextAreaField name="message" validation={{ required: true }} />
      <FieldError name="message" />

      <Submit>Enviar</Submit>
    </Form>
  )
}

export default ContactPage
```

Vea que el atributo `name` del visor de errores coincide con el `nombre` del campo. Así es que Redwood sabe en qué campo mostrar el error. Pruebe a enviar el formulario ahora.

<img src="https://user-images.githubusercontent.com/300/80258694-ac95a400-8638-11ea-904c-dc034f07b12a.png" />

Esto es sólo el comienzo. Asegurémonos de que la gente se da cuenta del error. ¿Recuerda la clase `.error` que definimos en `index.css`? Agreguemos el atributo `className` al `<FieldError>`:

```javascript {7,11,15}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Nombre</label>
    <TextField name="name" validation={{ required: true }} />
    <FieldError name="name" className="error" />

    <label htmlFor="email">Correo electrónico</label>
    <TextField name="email" validation={{ required: true }} />
    <FieldError name="email" className="error" />

    <label htmlFor="message">Mensaje</label>
    <TextAreaField name="message" validation={{ required: true }} />
    <FieldError name="message" className="error" />

    <Submit>Enviar</Submit>
  </Form>
)
```

<img src="https://user-images.githubusercontent.com/300/73306040-3cf65100-41d0-11ea-99a9-9468bba82da7.png" />

¿Sabe lo que sería bueno? Si el input mismo indicara que ocurrió un error. Agreguemos el atributo `errorClassName` a los inputs:

```javascript {9,17,25}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Nombre</label>
    <TextField
      name="name"
      validation={{ required: true }}
      errorClassName="error"
    />
    <FieldError name="name" className="error" />

    <label htmlFor="email">Correo electrónico</label>
    <TextField
      name="email"
      validation={{ required: true }}
      errorClassName="error"
    />
    <FieldError name="email" className="error" />

    <label htmlFor="message">Mensaje</label>
    <TextAreaField
      name="message"
      validation={{ required: true }}
      errorClassName="error"
    />
    <FieldError name="message" className="error" />

    <Submit>Enviar</Submit>
  </Form>
)
```

<img src="https://user-images.githubusercontent.com/300/80258907-39d8f880-8639-11ea-8816-03a11c69e8ac.png" />

¿Y qué pasa si cambiaramos la _etiqueta_? Podríamos pero necesitaremos el componente personalizado `<Label>` de Redwood para eso. Tenga en cuenta que el atributo `htmlFor` de `<label>` coincide con la propiedad `name` de `<Label>`, al igual que con los demás componentes del formulario. Recuerde declarar el `import`:

```javascript {9,19-21,29-31,39-41}
// web/src/pages/ContactPage/ContactPage.js

import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
  Label,
} from '@redwoodjs/forms'

const ContactPage = () => {
  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form onSubmit={onSubmit}>
      <Label name="name" errorClassName="error">
        Nombre
      </Label>
      <TextField
        name="name"
        validation={{ required: true }}
        errorClassName="error"
      />
      <FieldError name="name" className="error" />

      <Label name="email" errorClassName="error">
        Correo electrónico
      </Label>
      <TextField
        name="email"
        validation={{ required: true }}
        errorClassName="error"
      />
      <FieldError name="email" className="error" />

      <Label name="message" errorClassName="error">
        Mensaje
      </Label>
      <TextAreaField
        name="message"
        validation={{ required: true }}
        errorClassName="error"
      />
      <FieldError name="message" className="error" />

      <Submit>Enviar</Submit>
    </Form>
  )
}

export default ContactPage
```

<img src="https://user-images.githubusercontent.com/300/80259003-70af0e80-8639-11ea-97cf-b6b816118fbf.png" />

> **Estilando lo errores**
> 
> Además de `className` y `errorClassName` puede usar `style` y `errorStyle` para decorar los inputs. Vea [la documentación de Formularios ](https://redwoodjs.com/docs/form) para más detalles de como estilar mensajes de error.

### Como validar el formato del input

Controlemos el formato del correo electrónico:

```html {7-9}
// web/src/pages/ContactPage/ContactPage.js

<TextField
  name="email"
  validation={{
    required: true,
    pattern: {
      value: /[^@]+@[^.]+\..+/,
    },
  }}
  errorClassName="error"
/>
```

No es la mejor validación del mundo pero asumamos que es suficiente por ahora. Cambiemos el mensaje en la validación del correo electrónico para que sea un poco más amigable:

```html {9}
// web/src/pages/ContactPage/ContactPage.js

<TextField
  name="email"
  validation={{
    required: true,
    pattern: {
      value: /[^@]+@[^.]+\..+/,
      message: 'Por favor, ingrese una dirección de correo electrónico',
    },
  }}
  errorClassName="error"
/>
```

<img src="https://user-images.githubusercontent.com/300/80259139-bd92e500-8639-11ea-99d5-be278dc67afc.png" />

Notará que enviar un formulario con errores de validación no muestra nada en la consola, sucede que no está siendo enviando. ¡Esto es bueno! Corrija los errores y todo funcionará bien.

> **Validaciones instantáneas en el lado del cliente**
> 
> Un error de validación _desaparecerá_ tan pronto como arregle el contenido del input. No tiene que cliquear "Enviar" para eliminar los mensajes de error.

Finalmente, ¿sabe lo qué sería _realmente_ agradable? Que los inputs fueran validados apenas el usuario completa cada uno para que el usuario no tenga que llenar todo y enviarlo múltiples veces para ver todos los errores. Hagámoslo:

```html
// web/src/pages/ContactPage/ContactPage.js

<Form onSubmit={onSubmit} validation={{ mode: 'onBlur' }}>
```

¿Qué opina? ¿Mereció la pena la alaraca? Con apenas unos componentes ya tenemos un formulario con validaciones y datos listos para procesar, todo gratis.

> **Para saber más sobre formularios**
> 
> Redwood usa [React Hook Form](https://react-hook-form.com/) para construir formularios, hay muchas más funcionalidades disponibles en esa documentación. Para aprender más vea [toda la documentación sobre formularios](https://redwoodjs.com/docs/form).

Redwood tiene un truco para tratar formularios, pero lo dejaremos para cuando enviemos uno al servidor.

Un formulario de contacto es útil sólo si consigue que alguien lo contacte. Creemos una tabla de base de datos para guardar los datos enviados y crear nuestra primera mutación GraphQL.

