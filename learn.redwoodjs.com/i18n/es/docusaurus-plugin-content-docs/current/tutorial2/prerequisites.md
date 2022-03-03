---
id: prerequisites
title: "Requisitos"
sidebar_label: "Requisitos"
---

Necesitará una versión 0.25 o superior de Redwood para hacer este tutorial.

Recomendamos encarecidamente hacer el primer tutorial o haber construido una aplicación de Redwood por tu cuenta. Esperemos que tenga experiencia en:

* Autorización
* Células
* GraphQL & SDLs
* Servicios

Si ha hecho la primera parte del tutorial, puede continuar donde lo dejó y continuar luego con la parte 2. O, puede empezar desde un [repositorio de ejemplo](https://github.com/redwoodjs/redwood-tutorial) que incluye el final de la parte 1, ya con estilos y unas pruebas básicas.

### Usando su propio repo

Para usar las mismas clases de CSS que usamos en los siguientes ejemplos añada Tailwind al repo:

```bash
yarn rw setup tailwind
```

Le recomendamos usar el repo de ejemplo pues las capturas de pantalla que están a continuación difieren de lo vería en su repo (excepto para componentes aislados construidos en Storybook).

También se perdería un conjunto de pruebas que hemos añadido al [repositorio de ejemplo](https://github.com/redwoodjs/redwood-tutorial).

Si implementó la Parte 1 en un servicio como Netlify, habrá cambiado el proveedor de la base de datos en `schema.prisma` de `postgres` a `mysql`. Si es así, asegúrese de cambiarlo en el entorno de desarrollo local. Consulte la [guía de configuración de Postgres](https://redwoodjs.com/docs/local-postgres-setup) para obtener ayuda.

Una vez que esté listo, inicie el servidor de desarrollo:

```bash
yarn rw dev
```

### Usando el repo de ejemplo

Si no ha hecho el primer tutorial, o si lo hizo en una versión anterior a 0.25, puede clonar [este repositorio](https://github.com/redwoodjs/redwood-tutorial) que contiene todo lo construido en la parte 1 y añade algo de estilo para que sea más agradable de ver. Lo hecho en la Parte 1 es muy útil. Solo lo "acicalamos" con unos detalles de estilo. Usamos [TailwindCSS](https://tailwindcss.com) para dar estilo y añadimos unos `<div>` para tener algunos hooks adicionales y asociar estilos.

```bash
git clone https://github.com/redwoodjs/redwood-tutorial
cd redwood-tutorial
yarn install
yarn rw prisma migrate dev
yarn rw prisma db seed
yarn rw dev
```

Eso clonará el repo, instalará las dependencias, creará una base de datos local, la llenará con algunos posts e iniciará el servidor de desarrollo.

### Inicio

En el navegador debería ver una nueva aplicación del blog:

![imagen](https://user-images.githubusercontent.com/300/101423176-54e93780-38ad-11eb-9230-ba8557764eb4.png)

Primero ejecutaremos las pruebas para asegurarnos de que todo funciona como es de esperar (detenga el servidor o ejecute el comando en otra terminal):

```bash
yarn rw test
```

El comando `test` inicia un proceso que controla cambios en los archivos y ejecuta automáticamente las pruebas asociada con los archivos cambiados (es decir, al cambiar un componente *o* sus pruebas asociadas).

Como acabamos de empezar y no hemos cambiado nada, puede que no ejecute prueba alguna. Presione `a` (all) para ejecutar **todas** las pruebas y deberíamos verlas ejecutar con éxito:

![imagen](https://user-images.githubusercontent.com/300/96655360-21991c00-12f2-11eb-9394-c34c39b69f01.png)

Si comenzó con su propio repositorio de la Parte 1 podría ver algún error. Otra razón más para usar [el repo de ejemplo](#using-the-example-repo).

Más información sobre las pruebas más adelante, por ahora sólo recuerde que lo que queremos es que la columna izquierda esté siempre verde. De hecho, las buenas prácticas dicen que no deberíamos confirmar código sin que las pruebas pasen localmente. No todo el mundo es tan estricto con este...*&lt;ejem&gt;*

