---
id: authentication
title: "Autenticación"
sidebar_label: "Autenticación"
---

La "autenticación" es un término genérico referido a que un usuario tenga acceso a algún recurso. A menudo el usuario se identifica con una dirección de correo y contraseña. La autenticación puede ser [famosamente voluble](https://www.rdegges.com/2017/authentication-still-sucks/) de hacer bien tanto desde un punto de vista técnico como desde el punto de vista de la felicidad del desarrollador.

¡Pero ya sabe que Redwood le ayuda! No tenemos que escribir desde cero el inicio de sesión: es un problema ya resuelto y es una cosa menos de la que preocuparse. Hoy en día Redwood integra:

- [Netlify Identity](https://docs.netlify.com/visitor-access/identity/)
- [Netlify GoTrue-JS](https://github.com/netlify/gotrue-js)
- [Auth0](https://auth0.com/)
- [Magic Links - Magic.js](https://github.com/MagicHQ/magic-js)
- [Firebase's GoogleAuthProvider](https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider)
- [Supabase](https://supabase.io/docs/guides/auth)
- [Ethereum](https://github.com/oneclickdapp/ethereum-auth)

En este tutorial vamos a mostrar cómo integrar Netlify Identity ya que como último ejercicio vamos a desplegar allí la aplicación.

> **Diferencias entre Autenticación y Autorización**
> 
> Hay dos términos con muchas letras, que comienzan con "A" y terminando en "ación" (con rima y todo) que se asocian en las discusiones sobre cóm hacer el inicio de sesión:
> 
> * Autenticación
> * Autorización
> 
> Así es como Redwood usa estos términos:
> 
> * La **Autenticación** se ocupa de determinar si alguien es quien dice ser, generalmente "iniciando sesión" con un correo y una contraseña, o un proveedor de OAuth como Google.
> * La **Autorización** determina si un usuario (que ya ha sido autenticado) puede hacer algo específico. Generalmente implica el uso de roles y la verificación de permisos antes de acceder a una URL o funcionalidad del sitio.
> 
> Esta sección del tutorial se centra únicamente en la **Autenticación**. ¡Vea la [parte 2 del tutorial](https://learn.redwoodjs.com/docs/tutorial2/role-based-authorization-control-rbac) para aprender sobre autorización en Redwood!

### Configuración de Netlify

Antes de que podamos habilitar Netlify Identity necesitamos configurar un nuevo sitio para la aplicación. [Netlify](https://netlify.com) es una plataforma de hosting que construye e implementa los archivos generados en su CDN a partir de un repositorio git. También proporciona serverless endpoints a los que el frontend puede acceder. En pocas palabras: convierte la parte web en HTML, CSS y JS y convierte la parte API en una API real accesible tanto por la web como por Internet en general.

La forma más fácil de configurar el sitio en Netlify es desplegándolo. No se escucha a menudo los términos "fácil" y "desplegar" juntos en la misma oración (salvo que sea "lo más fácil es no desplegar nada en Internet"), ¡pero Netlify realmente lo hace fácil! (Tenga en cuenta que el despliegue no será éxito porque nos falta una base de datos de producción. Lo cual arreglaremos más tarde—por ahora sólo configuraremos lo mínimo en Netlify para habilitar la autenticación.)

Preparemos pues, la aplicación para ser desplegada con un comando de Redwood para configurar Netlify:

```terminal
yarn rw setup deploy netlify
```

Esto crea un archivo `netlify.toml` con comandos y rutas de archivos que para que Netlify construya la aplicación de Redwood.

Antes de continuar, asegúrese de que su aplicación está disponible en GitHub, GitLab, o Bitbucket. Vamos a asociar Netlify al repositorio git para que con un push al branch principal `main` se desplegar el sitio. Si usted no ha trabajado todavía con Jamstack ¡usted tendrá una agradable sorpresa!

Cree [una cuenta de Netlify](https://app.netlify.com/signup) si no aún no tiene una. Una vez registrado y verificado su correo, simplemente cliquee en el botón **New site from Git** en la parte superior derecha:

<img src="https://user-images.githubusercontent.com/300/73697486-85f84a80-4693-11ea-922f-0f134a3e9031.png" />

Luego autorice a Netlify a conectarse a su proveedor de hosting de git y elija el repositorio del sitio. Puede dejar los ajustes de despliegue con los valores predeterminados y hacer clic en **deploy site**.

Netlify comenzará a construir la aplicación (haga clic en el link **deploying your site** para ver la bitácora), dirá "Site is live" pero nada funcionará. ¡Lo que es esperado! Ahora diríjase a la pestaña **Identity** en Netlify y haga clic en el botón **Enable Identity**:

![Captura de pantalla de ajustes en Netlify](https://user-images.githubusercontent.com/300/82271191-f5850380-992b-11ea-8061-cb5f601fa50f.png)

Cuando la pantalla se actualice haga clic en el botón **Invite users** e introduzca un correo real (pues le enviarán un link de confirmación):

![Captura de pantalla de usuario invitando a Netlify](https://user-images.githubusercontent.com/300/82271302-439a0700-992c-11ea-9d6d-004adef3a385.png)

Antes de revisar el correo con el link de confirmación vamos a configurar la autenticación de la aplicación.

### Configuración de autentificación

Hay un par de lugares donde añadiremos algo de código y una vez más Redwood tiene un comando para configurar automáticamente la autenticación:

```terminal
yarn rw setup auth netlify
```

Eche un vistazo al `api/src/lib/auth.js` recién creado (omitimos los comentarios):

```javascript
// api/src/lib/auth.js

import { AuthenticationError } from '@redwoodjs/api'

export const getCurrentUser = async (decoded, { token, type }) => {
  return decoded
}

export const requireAuth = () => {
  if (!context.currentUser) {
    throw new AuthenticationError("You don't have permission to do that.")
  }
}
```

Por omisión el sistema de autenticación retornará sólo los datos de los que el gestor de autenticación conozca (datos dentro del objeto `jwt` de arriba). Para Netlify Identity esto es una dirección de correo y opcionalmente un nombre y una lista de roles. Por lo general, tendrá el concepto de usuario en la base de datos local. Puede modificar `getCurrentUser` para devolver dicho usuario en lugar de los detalles del sistema de autenticación. Los comentarios en la cabecera del archivo muestran un ejemplo de cómo buscar un usuario dada su dirección de correo. También proporcionamos una implementación simple para requerir que el usuario sea autenticado al intentar acceder a un servicio usando `requireAuth()`. Lanzará un error con el que GraphQL sabrá qué hacer si un usuario no autentificado intenta acceder a algo que no debiera.

Los archivos modificados por el comando de instalación son:

* `web/src/App.js`— envuelve el enrutador con `<AuthProvider>` que brinda a las rutas una referencia a la autenticación y conlleva un hook `useAuth()` con funciones para iniciar sesión, cerrar sesión, comproba el estado actual de sesión y más.
* `api/src/functions/graphql.js`—hace que una variable del usuario actual `currentUser` esté disponible en el backend para ver que puede hacer el usuario. Si implementa la función `getCurrentUser()` en `api/src/lib/auth.js` eso es lo que devolverá `currentUser`, de lo contrario devolverá los detalles que el sistema de autenticación tiene para el usuario. Si no han iniciado sesión, `currentUser` será `null`.

Vincularemos la web y la API para asegurarnos que el usuario sólo hace aquello que se le permite hacer.

### Autenticación en la API

Primero aseguraremos la API para cerciorarnos de que sólo los usuarios autenticados pueden crear, actualizar y eliminar un Post. Abre el servicio Post y controlemos el acceso con el método requireAuth:

```javascript {4,17,24,32}
// api/src/services/posts/posts.js

import { db } from 'src/lib/db'
import { requireAuth } from 'src/lib/auth'

export const posts = () => {
  return db.post.findMany()
}

export const post = ({ id }) => {
  return db.post.findUnique({
    where: { id },
  })
}

export const createPost = ({ input }) => {
  requireAuth()
  return db.post.create({
    data: input,
  })
}

export const updatePost = ({ id, input }) => {
  requireAuth()
  return db.post.update({
    data: input,
    where: { id },
  })
}

export const deletePost = ({ id }) => {
  requireAuth()
  return db.post.delete({
    where: { id },
  })
}

export const Post = {
  user: (_obj, { root }) => db.post.findUnique({ where: { id: root.id } }).user(),
}
```

Ahora intente crear, editar o eliminar un mensaje de nuestras páginas de administración. ¡No pasa nada! ¿Deberíamos mostrar un mensaje de error? En este caso, probablemente no—vamos a bloquear las páginas de administración para que no sean accesibles desde un navegador. La única forma en que generar esos errores en la API es tratando de acceder directamente al endpoint GraphQL, sin pasar por la interfaz de usuario. La API ya devuelve un mensaje de error (abra el Inspector Web en su navegador y pruebe que crear/editar/borrar de nuevo) así que estamos cubiertos.

> **Servicios como contenedores de la lógica de negocio**
> 
> Tenga en cuenta que estamos poniendo los controles de autenticación en el servicio y no en la interfaz GraphQL (en los archivos SDL). En Redwood los **servicios** son contenedores de la lógica de negocio que pueden ser utilizados en otras partes de su aplicación además de la API GraphQL.
> 
> Poniendo aquí los controles de autenticación, se asegura de todo código que intente crear/actualizar/borrar un post estará controlado. De hecho, Apollo (la librería GraphQL usa Redwood) [está de acuerdo con nosotros](https://www.apollographql.com/docs/apollo-server/security/authentication/#authorization-in-data-models)!

### Autenticación web

Limitemos el acceso a las páginas de administración a menos que se haya iniciado sesión. El primer paso será indicar qué rutas requieren inicio de sesión. Agregue la etiqueta `<Private>`:

```javascript {3,16,23}
// web/src/Routes.js

import { Router, Route, Set, Private } from '@redwoodjs/router'
import BlogLayout from 'src/layouts/BlogLayout'
import PostsLayout from 'src/layouts/PostsLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={BlogLayout}>
        <Route path="/blog-post/{id:Int}" page={BlogPostPage} name="blogPost" />
        <Route path="/contact" page={ContactPage} name="contact" />
        <Route path="/about" page={AboutPage} name="about" />
        <Route path="/" page={HomePage} name="home" />
      </Set>
      <Private unauthenticated="home">
        <Set wrap={PostsLayout}>
          <Route path="/admin/posts/new" page={NewPostPage} name="newPost" />
          <Route path="/admin/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />
          <Route path="/admin/posts/{id:Int}" page={PostPage} name="post" />
          <Route path="/admin/posts" page={PostsPage} name="posts" />
        </Set>
      </Private>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
```

Envuelva las rutas que requieran autenticación y opcionalmente añada el atributo `unautenticated` que indica la ruta a redirigir cuando el usuario no está logueado. En este caso volverá a la página principal.

Pruébelo en el navegador. Si navega a http://localhost:8910/admin/posts debería volver a la página principal.

¡Lo que queda por hacer es permitir el inicio de sesión! Si ha construido autenticación anteriormente, sabría que normalmente es tedioso, pero Redwood hace que sea pan comido. La mayor parte de la codificación está dada por comando de configuración, de modo que podemos centrarnos en lo que el usuario ve realmente. Primero, añadamos un link de **Login** que muestra el widget de [Netlify Identity](https://github.com/netlify/netlify-identity-widget). Supongamos que lo queremos en las páginas públicas, así que lo pondremos en el `BlogLayout`:

```javascript {4,7,22-26}
// web/src/layouts/BlogLayout/BlogLayout.js

import { Link, routes } from '@redwoodjs/router'
import { useAuth } from '@redwoodjs/auth'

const BlogLayout = ({ children }) => {
  const { logIn } = useAuth()

  return (
    <div>
      <h1>
        <Link to={routes.home()}>Redwood Blog</Link>
      </h1>
      <nav>
        <ul>
          <li>
            <Link to={routes.about()}>Acerca de</Link>
          </li>
          <li>
            <Link to={routes.contact()}>Contacto</Link>
          </li>
          <li>
            <button onClick={logIn}>
              Ingresar
            </button>
          </li>
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  )
}

export default BlogLayout
```

Intente "ingresar":

![Diálogo de Netlify Identity](https://user-images.githubusercontent.com/300/82387730-aa7ef500-99ec-11ea-9a40-b52b383f99f0.png)

Necesitamos que el widget sepa la URL del sitio para obtener los datos del usuario y validar que puede iniciar sesión. Volver a Netlify, puede obtenerlo desde la pestaña Identidad:

![URL del sitio Netlify](https://user-images.githubusercontent.com/300/82387937-28430080-99ed-11ea-91b7-a4e10f14aa83.png)

Necesita el protocolo y el dominio, no el resto de la ruta. Pegue eso en el diálogo y cliquee **Establecer la URL del sitio**. El diálogo debería recargarse y ahora mostrar una ventana de inicio de sesión:

![Inicio de sesión del widget de identidad de Netlify](https://user-images.githubusercontent.com/300/82388116-97205980-99ed-11ea-8fb4-13436ee8e746.png)

#### Aceptando invitaciones

Para iniciar sesión debemos confirmar nuestra invitación en el correo de Netlify. Encuéntrelo y cliquee **Accept this invite**. Eso le lleva al sitio de producción, donde nada pasa. Pero si mira la URL verá al final algo así como `#invite_token=6gFSXhugtHCXO5Whlc5V`. Cópielo (incluyendo el `#`) y añádalo a la URL de localhost:8910/#invite_token=6gFSXhugtHCXO5Whlc5Vg presione enter y luego vuelva a la URL, pulse otra vez Enter para recargar la página. Ahora el diálogo mostrará **Complete your signup** para registrarse y con contraseña también:

![Contraseña de Netlify Identity](https://user-images.githubusercontent.com/300/82388369-54ab4c80-99ee-11ea-920e-9df10ee0cac2.png)

Luego de registrarse, el diálogo se actualizará ¡y le dirá que está conectado! ¡Funciona! Haga clic en la X en la parte superior derecha para cerrar el diálogo.

> Sabemos que el flujo de aceptación de invitación no es ideal. Lo bueno es que cuando vuelva a desplegar el sitio con autenticación, futuras invitaciones funcionarán automáticamente—el enlace irá a producción que tiene el código necesario para mostrar el diálogo, permitiendo aceptar la invitación.

Sin embargo, no tenemos ninguna pista de hayamos iniciado sesión en el sitio. Cambiemos el botón **Ingresar** por **cerrar sesión** cuando esté autenticado:

```javascript {7,23-24}
// web/src/layouts/BlogLayout/BlogLayout.js

import { Link, routes } from '@redwoodjs/router'
import { useAuth } from '@redwoodjs/auth'

const BlogLayout = ({ children }) => {
  const { logIn, logOut, isAuthenticated } = useAuth()

  return (
    <div>
      <h1>
        <Link to={routes.home()}>Redwood Blog</Link>
      </h1>
      <nav>
        <ul>
          <li>
            <Link to={routes.about()}>Acerca de</Link>
          </li>
          <li>
            <Link to={routes.contact()}>Contacto</Link>
          </li>
          <li>
            <button onClick={isAuthenticated ? logOut : logIn}>
              {isAuthenticated ? 'Cerrar sesión' : 'Ingresar'}
            </button>
          </li>
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  )
}

export default BlogLayout
```

`useAuth()` tiene funciones auxiliares: `isAuthenticated` que devuelve `verdadero` o `falso` según el estado de sesión. y `logOut()` que cierra la sesión. Haciendo clic en **cerrar sesión** cerrará la sesión y cambiará el texto del link a **Iniciar sesión** que al hacer clic abrirá el diálogo para iniciar sesión de nuevo.

Cuando esté *conectado*, podrá acceder a las páginas de administración: http://localhost:8910/admin/posts

> Si va a trabajar en otra aplicación Redwood que use Netlify Identity deberá limpiar manualmente su almacenamiento en localStorage donde se almacena la URL del sitio que cuando apareció por primera vez el diálogo. El almacenamiento local se vincula al dominio y puerto, que por omisión es el mismo toda aplicación de Redwood cuando se desarrolla localmente. Puedes limpiar el almacenamiento local en Chrome yendo al Inspector Web, en la pestaña **Aplicación**, y luego a la izquierda abra **Local Storage** y haga clic en http://localhost:8910. A la derecha verá las claves almacenadas y podrá borrarlas.

Como toque final: mostraremos la dirección de correo del usuario que ha iniciado sesión. Podemos obtener el usuario actual `currentUser` mediante `useAuth()` y contendrá los datos que la biblioteca de autenticación está almacenando sobre el usuario conectado:

```javascript {7,27}
// web/src/layouts/BlogLayout/BlogLayout.js

import { Link, routes } from '@redwoodjs/router'
import { useAuth } from '@redwoodjs/auth'

const BlogLayout = ({ children }) => {
  const { logIn, logOut, isAuthenticated, currentUser } = useAuth()

  return (
    <div>
      <h1>
        <Link to={routes.home()}>Redwood Blog</Link>
      </h1>
      <nav>
        <ul>
          <li>
            <Link to={routes.about()}>Acerca de </Link>
          </li>
          <li>
            <Link to={routes.contact()}>Contacto</Link>
          </li>
          <li>
            <button onClick={isAuthenticated ? logOut : logIn}>
              {isAuthenticated ? 'Cerrar sesión' : Ingresar'}
            </button>
          </li>
          {isAuthenticated && <li>{currentUser.email}</li>}
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  )
}

export default BlogLayout
```

![Email del usuario conectado](https://user-images.githubusercontent.com/300/82389433-05b2e680-99f1-11ea-9d01-456cad508c80.png)

> **Más sobre Netlify Identity**
> 
> Revisa los ajustes (o [documentación](https://docs.netlify.com/visitor-access/identity/)) de Netlify Identity para más opciones, incluyendo permitir a los usuarios crear cuentas en lugar de ser invitados, añadir botones de inicio de sesión con Bitbucket, GitHub, GitLab y Google, recibir webhooks al conectarse y más.

Créalo o no, ¡eso es todo! La autenticación con Redwood es una brisa y eso que estamos empezando. Ahora pongamos este sitio en producción.

