---
id: deployment
title: "Despliegue"
sidebar_label: "Despliegue"
---

La parte 4 del video tutorial continúa aquí:

> **Aviso de contenido obsoleto**
> 
> Estos videos fueron grabados con una versión anterior de Redwood y muchos comandos están ahora desactualizados. Si realmente quiere construir el blog necesitará acompañar el vídeo junto con el texto que está actualizado con las últimas versiones.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/UpD3HyuZkvY?rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; modestbranding; showinfo=0" allowfullscreen></iframe>
</div>

Hemos construido Redwood para que fuera más fácil crear y desplegar aplicaciones web completas en Jamstack. Aunque técnicamente ya la hemos desplegado en la sección anterior todavía no funciona. Arreglemos eso.

### La base de datos

Necesitamos una base de datos en Internet para almacenar nuestros datos. Hemos usando SQLite localmente, pero es una base de datos para mono-usuario. SQLite no es adecuado para los requerimientos de conexiones concurrentes que requerirá un sitio web en un ambiente de producción. Para esta parte de este tutorial, usaremos Postgres. (Prisma soporta actualmente SQLite, Postgres y MySQL.) No se preocupe si no está familiarizado con Postgres, Prisma hace todo el trabajo pesado. Sólo necesitamos obtener una base de datos disponible que pueda ser accedida por nuestra aplicación.

Primero indiquemos a Prisma que usaremos Postgres en lugar de SQLite. Actualice el proveedor `provider` en `schema.prisma`:

```javascript
provider = "postgresql"
```

> **!!! ¡Aviso Muy Importante Que Debe Leer!**
> 
> Prisma soporta un solo proveedor de base de datos y dado que no podemos usar SQLite en producción y *debemos* cambiar a Postgres o MySQL, pues tenemos que usar la misma base de datos en nuestro sistema de desarrollo local después de hacer este cambio. Para comenzar vea nuestra guía de configuración de [Postgres Locales](https://redwoodjs.com/docs/local-postgres-setup).

Hay varios proveedores de hosting donde puede iniciar una instancia de Postgres:

- [Railway](https://railway.app/)
- [Heroku](https://www.heroku.com/postgres)
- [Digital Ocean](https://www.digitalocean.com/products/managed-databases)
- [AWS](https://aws.amazon.com/rds/postgresql/)

Vamos a ir con Railway por ahora porque es a) gratis y b) ridículamente fácil de empezar, por lejos de lo más fácil que hemos encontrado. ¡Ni siquiera necesitas crear un inicio de sesión! La única limitación es que si *no* crea una cuenta, su base de datos será eliminada después de siete días. ¡Pero a menos que *se descanse mucho* eso debería bastar para terminar este tutorial!

Diríjase a Railway y haga clic en **Get Started**:

![imagen](https://user-images.githubusercontent.com/300/107562787-1fa2e380-6b95-11eb-90ba-02fea7925a05.png)

Ahora siga las indicaciones. Primero, Cmd+k/Ctrl+k (dependiendo del sistema operativo):

![imagen](https://user-images.githubusercontent.com/300/107562945-495c0a80-6b95-11eb-9ba8-a294669d6cb4.png)

Y ahora elija **Provision PostgreSQL**:

![imagen](https://user-images.githubusercontent.com/300/107562989-5c6eda80-6b95-11eb-944e-34b0ad49f4ea.png)

¡Y créalo o no, hemos terminado! Ahora necesitamos la URL de conexión. Haga clic en **PostgreSQL** a la izquierda, y luego en la pestaña **Connect**. Copie la URL de la base de datos, que comienza con `postgresql://`:

![imagen](https://user-images.githubusercontent.com/300/107562577-da7eb180-6b94-11eb-8731-e86a1c7127af.png)

 ¡Eso es todo para la configuración de base de datos! Informemos a Netlify de eso.

### Netlify

Vuelva a la página principal de Netlify y vaya a **Site settings** en la parte superior, y luego a **Build & Deploy** > **Environment**. Haga clic en **Edit variables** y pegue la URI de conexión de base de datos que obtuvimos en Railway (recuerde que **la clave** es "DATABASE_URL"). Después de pegar el valor, añada `?connection_limit=1` al final. La URI tendrá el siguiente formato: `postgres://<user>:<pass>@<url>/<db>?connection_limit=1`.

![Añadiendo variable de ambiente](https://user-images.githubusercontent.com/300/83188236-3e834780-a0e4-11ea-8cfa-790c2e335a92.png)

> **Límite de conexiones**
> 
> Al configurar la base de datos conviene añadir `?connection_limit=1` a la URI. [Prisma recomdienda hacerlo](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/deployment#recommended-connection-limit) cuando se trabaja en contexto Serverless.

**Recuerde guardar**. Ahora vaya a la pestaña **Deploy** en el parte superior y abre el menú **trigger deploy** a la derecha. luego elija **Deploy site**:

![Desplegando](https://user-images.githubusercontent.com/300/83187760-835aae80-a0e3-11ea-9733-ff54969bba1f.png)

¡Con un poco de suerte (y algo de CIENCIA), seremos exitosos! Haga clic en **preview** en la parte superior de la página para ver el sitio o vuelva atrás y haz clic en la URL de tu sitio web de Netlify:

![URL de Netlify](https://user-images.githubusercontent.com/300/83187909-bef57880-a0e3-11ea-97dc-e557248acd3a.png)

¿Funcionó? Si ve "Empty" debajo de los links Acerca de y Contacto, ¡entonces ha funcionado! ¡Hurra! Está viendo "Empty" porque no hay posts en la base de datos de producción, diríjase a `/admin/posts` y crea un post, luego regrese a la página de inicio y lo verá.

> Si ve un despliegue a través del botón **Vista previa** note que la URL contiene un hash del último commit. Netlify creará uno de estos para cada push a `main` pero sólo muestra el commit exacto, así que si despliega de nuevo no verá ningún cambio. La URL del sitio (disponible en Netlify) siempre muestra el último despliegue exitoso. Vea [Branch deploys](#branch-deploys) para más información.

Si el despliegue falló, compruebe la salida de la bitácora en Netlify y compruebe si tiene sentido el error. Si el despliegue fue exitoso pero el sitio no aparece, intente abrir el inspector web y busque errores. Por ejemplo verifique que copió la cadena de conexión a Postgres exactamente. Si está atascado, pida ayuda en la [Comunidad de Redwood](https://community.redwoodjs.com).

### Despliegue en Branches

Otra característica excelente de Netlify es el _despliegue en Branch_. Al crear un Branch y añadirla al repositorio, Netlify para cada branch una URL única para probar los cambios sin afectar el sitio principal. Una vez que el branch se incorpore a `main`, se ejecutará un despliegue en el sitio principal. Para habilitar los Desplegamientos de Branch, vaya a **Site settings** > **Build & deploy** > **Continuous deployment** y en la sección **Deploy contexts** haga clic en **Edit settings** y cambie el valor de **Branch deploy** a "All" (todos). También puede habilitar _Deploy preview_ para crear un despliegue para cada Pull Request del repo.

![Captura de pantalla de ajustes en Netlify](https://user-images.githubusercontent.com/30793/90886476-c1016780-e3b2-11ea-851a-3014257484fd.png)

> También se puede "bloquear" el branch `main` para evitar despliegues automáticos en cada push, deberá indicarle a Netlify cuando desplegar lo más último, a través del sitio o utilizando el [cliente de Netlify](https://cli.netlify.com/).

### Temas de base de datos

#### Conexiones

En este tutorial las funciones serverless se conectarán a la base de datos. Dado que Postgres acepta un número limitado de conexiones simultáneas, esto no escala — imagine si tiene una gran cantidad de tráfico causando un aumento de 100 veces las llamadas. Netlify (y detrás de las escenas, AWS) creará más de 100 instancias serverless Lambda para atender el tráfico. El problema es que cada llamada abrirá su propia conexión a la base de datos hasta agotar las conexiones disponibles. Una mejor solución sería agrupación de conexiones en un pool y que las funciones lambda se conecten a a través de ese a Postgres. Para aprender a hacer eso, consulta la guía de [Connection pooling](https://redwoodjs.com/docs/connection-pooling).

#### Seguridad

La base de datos estará accesible al mundo entero pues no sabe que dirección IP tendrá la función serverless al ejecutar. Podrías obtener el bloque CIDR para TODAS las direcciones IP del proveedor de hosting y sólo permitir conexiones de ese rango, pero esos rangos suelen cambiar con el tiempo y mantenerlos sincronizados no es trivial. Mientras proteja el nombre de usuario/contraseña la base de datos estaría segura, pero no es una solución ideal.

A medida que Jamstack gana más relevancia contaremos con proveedores de bases de datos con soluciones más robustas y seguras que abordarán estos problemas. Nuestro equipo trabaja estrechamente con varios de ellos y esperamos tener buenas noticias pronto!

