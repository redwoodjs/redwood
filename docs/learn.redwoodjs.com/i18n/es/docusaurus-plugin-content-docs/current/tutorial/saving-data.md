---
id: saving-data
title: "Guardando los datos"
sidebar_label: "Guardando los datos"
---

Añadamos una nueva tabla. Abra `api/db/schema.prisma` y añada un modelo de "Contact" luego del modelo Post existente:

```javascript
// api/db/schema.prisma

model Contact {
  id        Int @id @default(autoincrement())
  name      String
  email     String
  message   String
  createdAt DateTime @default(now())
}
```

> **Sintaxis de Prisma para campos opcionales**
> 
> Indique un campo como opcional (que acepte `NULL` como valor) con un signo de interrogación luego del tipo de datos, ej. `String?`. Esto hace que `name` sea de tipo `String` o `NULL`.

Luego creamos y aplicamos una migración:

    yarn rw prisma migrate dev

Podemos nombrarla "crear contactos".

Ahora creemos la interfaz GraphQL para acceder a la tabla. Aún no hemos usado este comando `generate` (si bien el comando `scaffold` se usa detrás de escena):

    yarn rw g sdl contact

Al igual que el comando `scaffold`, se crean dos nuevos archivos en el directorio `api`:

1. `api/src/graphql/contacts.sdl.js`: contiene el esquema de GraphQL
2. `api/src/services/contacts/contacts.js`: contiene la lógica de negocios.

A continuación abra `api/src/graphql/contacts.sdl.js`, verá ya definidos los tipos `Contact`, `CreateContactInput` y `UpdateContactInput`: el comando `generate sdl` ha escrito el esquema y ha creado un tipo `Contact` con cada campo de la tabla, así como un tipo `Query` con la consulta `contacts` que devuelve una list de `Contact`:

```javascript
// api/src/graphql/contacts.sdl.js

export const schema = gql`
  type Contact {
    id: Int!
    name: String!
    email: String!
    message: String!
    createdAt: DateTime!
  }

  type Query {
    contacts: [Contact!]!
  }

  input CreateContactInput {
    name: String!
    email: String!
    message: String!
  }

  input UpdateContactInput {
    name: String
    email: String
    message: String
  }
`
```

¿Qué son `CreateContactInput` y `UpdateContactInput`? Redwood sigue la recomendación GraphQL de usar [tipos de entrada](https://graphql.org/graphql-js/mutations-and-input-types/) en mutaciones en lugar de listar todos los campos explícitamente. Cada campo requerido en `schema.prisma` será obligatorio en `CreateContactInput` (impide crear registros inválidos) pero no así en `UpdateContactInput`. Esto se debe a que puede actualizar uno o más campos. La alternativa sería separar los tipos de entrada para cada permutación de campos a actualizar. Nos parece que es mejor tener una sola entrada aunque no sea la forma **perfecta** de hacer una API GraphQL.

> Redwood asume que el código no establece un valor para campos `id` o `createdAt` por lo los deja fuera de los tipos de entrada, pero si la base de datos requiere actualizaciones manuales Ud puede agregarlos tanto a `CreateContactInput` como a `UpdateContactInput`.

Dado que todas las columnas en el archivo `schema.prisma` son requeridas, se marcan con el signo de exclamación `!` al final del tipo de datos (ej. `nombre: String!`). ).

> **Sintaxis GraphQL para campos requeridos**
> 
> La syntaxis de GraphQL's require un símbolo de exclamación `!` para indicar que el campo _es requerido_. Recuerde también: `schema.prisma` requiere un símbolo de pregunta `?` cuando un campo _es opcional_.

Como se describe en [Misión secundaria: Cómo funciona Redwood con datos](side-quest-how-redwood-works-with-data), no hay resolutores explícitos definidos en el archivo SDL. Redwood usa una nomenclatura simple: cada campo listado en los tipos `Query` y `Mutation` en el archivo `sdl` (ej `api/src/graphql/contacts.sdl.js`) mapea una función con el mismo nombre en el archivo `services` (`api/src/services/contacts/contacts.js`).

En este caso creamos una única `Mutation` que llamaremos `createContact`. Agregue esto al final del archivo SDL (antes de cerrar el tilde):

```javascript {28-30}
// api/src/graphql/contacts.sdl.js

export const schema = gql`
  type Contact {
    id: Int!
    name: String!
    email: String!
    message: String!
    createdAt: DateTime!
  }

  type Query {
    contacts: [Contact!]!
  }

  input CreateContactInput {
    name: String!
    email: String!
    message: String!
  }

  input UpdateContactInput {
    name: String
    email: String
    message: String
  }

  type Mutation {
    createContact(input: CreateContactInput!): Contact
  }
`
```

La mutación `createContact` acepta una variable `input`, que es un objeto que se ajusta a la definición de `CreateContactInput`, es decir, `{ name, email, message }`.

Terminado el SDL, definamos el servicio que guardará los datos en la base de datos. El servicio incluye una función predeterminada de `contacts` para obtener todos los contactos de la base de datos. Añadamos nuestra mutación para crear un nuevo contacto:

```javascript {9-11}
// api/src/services/contacts/contacts.js

import { db } from 'src/lib/db'

export const contacts = () => {
  return db.contact.findMany()
}

export const createContact = ({ input }) => {
  return db.contact.create({ data: input })
}
```

¡Gracias a Prisma se necesita poco código para guardar datos! Esta es una llamada asíncrona pero no tuvimos que preocuparnos por resolver Promesas o tratar con `async/await`. ¡Apollo lo hizo por nosotros!

Antes de conectarlo a la interfaz de usuario echemos un vistazo a la GUI ejecutando `yarn redwood dev`.

### GraphQL Playground

A menudo es útil experimentar y llamar a su API en una forma más "cruda" antes de avanzar en la implementación y ver que falta algo. Por ejemplo, ¿qué pasa si hubiera un error tipográfico en la API o en la capa web? Descubrámoslo accediendo a la API.

Al iniciar el desarrollo con `yarn redwood dev` se inician dos procesos al mismo tiempo. Abra una nueva pestaña del navegador y vaya a http://localhost:8911/graphql Este es el [Playground GraphQL de Apollo](https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/), un GUI web para las APIs GraphQL:

<img src="https://user-images.githubusercontent.com/300/70950852-9b97af00-2016-11ea-9550-b6983ce664e2.png" />

Aún no es muy emocionante, pero revise la pestaña "Docs" en la extrema derecha:

<img src="https://user-images.githubusercontent.com/300/73311311-fce89b80-41da-11ea-9a7f-2ef6b8191052.png" />

¡Es el esquema completo tal como lo definen los archivos SDL! El Playground usa estas definiciones y le dará sugerencias para ayudarle a construir consultas en la parte izquierda. Pruebe obtener los IDs de todos los posts de la base de datos; escribe la consulta a la izquierda y haz clic en el botón "Reproducir" para ejecutarla:

<img src="https://user-images.githubusercontent.com/300/70951466-52e0f580-2018-11ea-91d6-5a5712858781.png" />

El Playground GraphQL es una excelente manera de experimentar con la API o resolver problemas cuando una consulta o mutación que no se comporte de forma esperada.

### Creando un contacto

La mutación GraphQL está lista para en el backend así que sólo queda es invocarla desde el frontend. Como nuestro formulario está en la página `ContactPage` tiene sentido invocar ahí la mutación. Primero definamos la mutación como una constante (que usaremos más tarde) fuera del componente después de las declaraciones de `import`:

```javascript
// web/src/pages/ContactPage/ContactPage.js

const CREATE_CONTACT = gql`
  mutation CreateContactMutation($input: CreateContactInput!) {
    createContact(input: $input) {
      id
    }
  }
`
```

La mutación `createContact` que definimos en el SDL de Contactos recibe un objeto de `entrada` que contiene los campos: nombre, correo electrónico y mensaje.

A continuación llamaremos al hook (gancho) `useMutation` proporcionado por Apollo que ejecutará la mutación cuando estemos listos (recuerde el `import`):

```javascript {11,14}
// web/src/pages/ContactPage/ContactPage.js

import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
  Label,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'

const ContactPage = () => {
  const [create] = useMutation(CREATE_CONTACT)

  const onSubmit = (data) => {
    console.log(data)
  }

  return (...)
}
```

`create` es una función que invoca la mutación y recibe un objeto cuya clave `variables` contiene otro objeto con una clave `input`. Por ejemplo:

```javascript
create({
  variables: {
    input: {
      name: 'Rob',
      email: 'rob@redwoodjs.com',
      message: 'Me encanta Redwood!',
    },
  },
})
```

Si recuerda la `<Form>` nos da todos los campos en un objeto donde la clave es el nombre del campo, por lo que el objeto `data` que recibimos en `onSubmit` ya tiene el formato que necesitamos para la variable `input`!

Actualicemos la función `onSubmit` para invocar la mutación con los datos que recibe:

```javascript {7}
// web/src/pages/ContactPage/ContactPage.js

const ContactPage = () => {
  const [create] = useMutation(CREATE_CONTACT)

  const onSubmit = (data) => {
    create({ variables: { input: data }})
    console.log(data)
  }

  return (...)
}
```

Intente completar y enviar el formulario —¡debería tener un nuevo contacto en la base de datos! Puedes verificarlo que con el Playground GraphQL:

![imagen](https://user-images.githubusercontent.com/300/76250632-ed5d6900-6202-11ea-94ce-bd88e3a11ade.png)

### Mejorar el formulario de contacto

Nuestro formulario funciona pero tiene algunos problemas:

- Al hacer clic varias veces en el botón de enviar se realizarán varios envíos
- El usuario no sabe si el envío fue exitoso
- Si ocurriera un error en el servidor, no tenemos forma de notificar al usuario

Abordemos estos problemas.

El hook `useMutation` devuelve un par de elementos más junto con la función para invocarlo. Podemos deconstruir el segundo elemento de la matriz devuelta. Los dos que nos preocupan son `loading` y `error`:

```javascript {4}
// web/src/pages/ContactPage/ContactPage.js

const ContactPage = () => {
  const [create, { loading, error }] = useMutation(CREATE_CONTACT)

  const onSubmit = (data) => {
    create({ variables: { input: data } })
    console.log(data)
  }

  return (...)
}
```

Sabremos si la llamada a la base de datos sigue cargando si miramos `loading`. Una solución fácil para nuestro problema de envío múltiple sería desactivar el botón de enviar si la llamada todavía está cargando. Podemos fijar el atributo `desactivado` al botón "Guardar" según el valor de `loading`:

```javascript {5}
// web/src/pages/ContactPage/ContactPage.js

return (
  // ...
  <Submit disabled={loading}>Save</Submit>
  // ...
)
```

Es difícil ver diferencias en el entorno de desarrollo pues el envío es muy rápido. Sin embargo, puede simular una conexión lenta a través de la pestaña de Red del Inspector Web de Chrome:

<img src="https://user-images.githubusercontent.com/300/71037869-6dc56f80-20d5-11ea-8b26-3dadb8a1ed86.png" />

Verá que el botón "Guardar" se desactiva durante unos instantes mientras esperas la respuesta.

A continuación, notificaremos al usuario de que su envío fue exitoso. Redwood incluye la biblioteca [react-hot-toast](https://react-hot-toast.com/) para mostrar notificaciones en la página.

`useMutation` acepta como un segundo argumento un un objeto de opciones. Entre ellas una función de callback, `onCompleted`, que se invoca al completar la mutación con éxito. Usaremos ese callback para invocar la función `toast()` que añadirá un mensaje para mostrar en un componente **&lt;Toaster&gt;**.

Añada el callback `onCompleted` a `useMutation` e incluya el componente **&lt;Toaster&gt;** en el bloque de `return`, justo antes del **&lt;Form&gt;**. Envuelva todo en un fragmento (&lt;&gt;&lt;/&gt;) para devolver un solo elemento:

```javascript {5,10-14,19,20,23}
// web/src/pages/ContactPage/ContactPage.js

// ...
import { useMutation } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'

// ...

const ContactPage = () => {
  const [create, { loading, error }] = useMutation(CREATE_CONTACT, {
    onCompleted: () => {
      toast.success('Thank you for your submission!')
    },
  })

  // ...

  return (
    <>
      <Toaster />
      <Form onSubmit={onSubmit} validation={{ mode: 'onBlur' }}>
      // ...
    </>
  )
```

Puede leer la documentación completa de [Toast aquí](https://redwoodjs.com/docs/toast-notifications).

### Mostrando errores del servidor

A continuación informaremos al usuario de errores en el servidor. Hasta ahora solo hemos notificado _errores del lado del cliente_: un campo faltante o formato erróneo. Pero si tenemos controles del lado del servidor que `<Form>` no conozca, necesitaremos que el usuario sepa que falla.

Tenemos una validación para correo en el cliente, pero todo buen desarrollador sabe [_que nunca debe confía en el cliente_](https://www.codebyamir.com/blog/never-trust-data-from-the-browser). Añadamos la validación de correo en la API para estar seguros de los datos son válidos en nuestra base de datos, incluso cuando alguien pase por alto la validación del lado del cliente.

> **¿No hay validación en el servidor?**
> 
> ¿Por qué no validamos en el servidor la existencia de nombre, correo y mensaje? Porque la base de datos lo hace por nosotros. ¿Recuerdas el tipo `String!` en la definición SDL? Esto añade una restricción en la base de datos: el campo no puede ser `null`. Si un `null` llegara hasta la base de datos, se rechazaría el comando insert/update y GraphQL devolvería un error al cliente.
> 
> ¡Como no hay un tipo `email` debemos validarlo por nuestra cuenta!

Hemos hablado de lógica de negocios perteneciente a los servicios y este es un ejemplo perfecto. Añadamos una función `validate` al servicio `contacts`:

```javascript {3,7-15,22}
// api/src/services/contacts/contacts.js

import { UserInputError } from '@redwoodjs/api'

import { db } from 'src/lib/db'

const validate = (input) => {
  if (input.email && !input.email.match(/[^@]+@[^.]+\..+/)) {
    throw new UserInputError("Can't create new contact", {
      messages: {
        email: ['is not formatted like an email address'],
      },
    })
  }
}

export const contacts = () => {
  return db.contact.findMany()
}

export const createContact = ({ input }) => {
  validate(input)
  return db.contact.create({ data: input })
}
```

Así que cuando `createContact` se llame primero validará los inputs y sólo creará el registro en la base de datos cuando no hayan errores.

Ya capturamos cualquier error existente en la constante `error` que obtuvimos de `useMutation`, así que _podríamos_ mostrar un cuadro de error en la página por ejemplo al principio del formulario:

```html {4-9}
// web/src/pages/ContactPage/ContactPage.js

<Form onSubmit={onSubmit} validation={{ mode: 'onBlur' }}>
  {error && (
    <div style={{ color: 'red' }}>
      {"We couldn't send your message: "}
      {error.message}
    </div>
  )}
  // ...
```

> Para manejar errores manualmente, puede hacer lo siguiente:
> 
> ```javascript {3-8}
> // web/src/pages/ContactPage/ContactPage.js
> const onSubmit = async (data) => {
>   try {
>     await create({ variables: { input: data } })
>     console.log(data)
>   } catch (error) {
>     console.log(error)
>   }
> }
> ```

Para ver el error en el servidor, eliminamos la validación del formato de correo del lado del cliente:

```html
// web/src/pages/ContactPage/ContactPage.js

<TextField
  name="email"
  validation={{
    required: true,
  }}
  errorClassName="error"
/>
```

Intente rellenar el formulario con una dirección de correo no válida:

<img src="https://user-images.githubusercontent.com/16427929/98918425-e394af80-24cd-11eb-9056-58c295cf0d5c.PNG" />

No es bonito, pero funciona. Estaría bueno si el campo en sí mismo fuera resaltado como cuando la validación estaba anteriormente...

¿Recuerda cuando le dijimos que `<Form>` tenía otro truco en la manga? ¡Aquí viene!

Quite la pantalla de errores que acabamos de añadir (`{ error && ...`) y reemplácelo por `<FormError>`, pasandole la constante `error` que obtuvimos de `useMutation` y apliquemos un estilo a `wrapperStyle` (no olvide el `import`). También pasamos el `error` a `<Form>` para que pueda configurar el contexto:

```javascript {10,20-24}
// web/src/pages/ContactPage/ContactPage.js

import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
  Label,
  FormError,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'

// ...

return (
  <>
    <Toaster />
    <Form onSubmit={onSubmit} validation={{ mode: 'onBlur' }} error={error}>
      <FormError
        error={error}
        wrapperStyle={{ color: 'red', backgroundColor: 'lavenderblush' }}
      />

      //...
)
```

Ahora envía un mensaje con una dirección de correo inválida:

<img src="https://user-images.githubusercontent.com/300/80259553-c46e2780-863a-11ea-9441-54a9112b9ce5.png" />

Obtenemos ese mensaje de error en la parte superior diciendo que algo salió mal en inglés y _el campo real se resalta_, ¡al igual que la validación en línea! El mensaje en la parte superior puede ser demasiado para un formulario tan breve, pero puede ser clave si el formulario comprende varias pantallas; el usuario tendrá un resumen de lo que salió mal en un solo lugar y sin recurrir a buscar por todos lados los campos en rojo. No tiene porque usar este cuadro de mensajes, bastará eliminar el `<FormError>` y cada campo será resaltado como se espera.

> **Opciones de estilo para `<FormError>`**
> 
> `<FormError>` tiene varias opciones de estilo asociadas a varias partes del mensaje:
> 
> - `wrapperStyle` / `wrapperClassName`: para el contenedor del mensaje
> - `titleStyle` / `titleClassName`: para el título "Can't create new contact"
> - `listStyle` / `listClassName`: el elemento `<ul>` con la lista de errores
> - `listItemStyle` / `listItemClassName`: cada elemento `<li>` para cada error

### Una cosa más...

Dado que no redireccionamos luego del envío del formulario, deberíamos limpiar los campos del mismo. Esto requiere acceder a una función `reset()` que forma parte de `react-hook-form` pero no disponible cuando usamos un simple `<Form>` (como lo estamos usando actualmente).

`react-hook-form` tiene un hook llamado `useForm()` que es llamado dentro del `<Form>`. Para restablecer el formulario debemos invocarlo explícitamente. Pero la funcionalidad de `useForm()` debe usada también en el `Form`. Así lo haremos.

Primero importemos `useForm`:

```javascript
// web/src/pages/ContactPage/ContactPage.js

import { useForm } from 'react-hook-form'
```

Luego lo llamamos dentro del componente:

```javascript {4}
// web/src/pages/ContactPage/ContactPage.js

const ContactPage = () => {
  const formMethods = useForm()
  //...
```

Finalmente le diremos al `<Form>` que use los métodos `formMethods` que acabamos de crear en lugar de los predeterminados:

```javascript {10}
// web/src/pages/ContactPage/ContactPage.js

return (
  <>
    <Toaster />
    <Form
      onSubmit={onSubmit}
      validation={{ mode: 'onBlur' }}
      error={error}
      formMethods={formMethods}
    >
    // ...
```

Ahora podemos llamar a `reset()` en `formMethods` después de llamar `toast()`:

```javascript {6}
// web/src/pages/ContactPage/ContactPage.js

const [create, { loading, error }] = useMutation(CREATE_CONTACT, {
  onCompleted: () => {
    toast.success('¡Gracias por su envío!')
    formMethods.reset()
  },
})
```

<img alt="Captura de pantalla del formulario de contacto con mensaje de éxito" src="https://user-images.githubusercontent.com/300/112360362-7a008b00-8c8f-11eb-8649-76d00be920b7.png" />

> Ya puede volver a colocar la validación del correo en el `<TextField>`, pero debería mantener la validación del lado servidor por si acaso.

Así queda la página `ContactPage.js`:

```javascript
import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
  Label,
  FormError,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'
import { useForm } from 'react-hook-form'

const CREATE_CONTACT = gql`
  mutation CreateContactMutation($input: CreateContactInput!) {
    createContact(input: $input) {
      id
    }
  }
`

const ContactPage = () => {
  const formMethods = useForm()

  const [create, { loading, error }] = useMutation(CREATE_CONTACT, {
    onCompleted: () => {
      toast.success('¡Gracias por su envío!')
      formMethods.reset()
    },
  })

  const onSubmit = (data) => {
    create({ variables: { input: data } })
    console.log(data)
  }

  return (
    <>
      <Toaster />
      <Form
        onSubmit={onSubmit}
        validation={{ mode: 'onBlur' }}
        error={error}
        formMethods={formMethods}
      >
        <FormError
          error={error}
          wrapperStyle={{ color: 'red', backgroundColor: 'lavenderblush' }}
        />
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
          Correo
        </Label>
        <TextField
          name="email"
          validation={{
            required: true,
          }}
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

        <Submit disabled={loading}>Save</Submit>
      </Form>
    </>
  )
}

export default ContactPage
```

¡Eso es todo! [React Hook Form](https://react-hook-form.com/) proporciona un montón de [funcionalidades](https://react-hook-form.com/api) que un `<Form>` común no tiene. Para usar esas funcionalidades puede: llame a `useForm()` pero asegúrese de pasar el objeto (el que llamamos `formMethods`) como una propiedad al `<Form>` para que la validación y otras funcionalidades sigan funcionando.

> Puede que haya notado que la validación del formulario en el evento onBlur dejó de funcionar al llamar explícitamente a `useForm()`. Eso es porque Redwood llama a `useForm()` detrás de las escenas y automáticamente pasa la propiedad de `validación` del `<Form>`. Redwood no llama más a `useForm()`, por lo que necesitará pasar opciones manualmente:
> 
> ```javascript
> const formMethods = useForm({ mode: 'onBlur' })
> ```

El sitio público se ve bastante bien. ¿Qué hay de las funciones administrativas para crear y editar posts? Deberíamos moverlos a una sección de administración y requerir del inicio de sesión para no venga un usuario cualquier y cambie las URLs para crear anuncios indeseables.
