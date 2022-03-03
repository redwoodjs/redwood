---
id: installation-starting-development
title: "Instalación y comienzo del desarrollo"
sidebar_label: "Instalación y comienzo del desarrollo"
---

Utilizaremos yarn ([yarn](https://yarnpkg.com/en/docs/install) requerido) para crear la estructura básica de nuestra aplicación:

    yarn create redwood-app ./redwoodblog

Este comando creará un directorio `redwoodblog` con varios archivos y directorios. Cambie a ese directorio, cree la base de datos e inicie el servidor en modo desarrollo:

    cd redwoodblog
    yarn redwood dev

Su navegador debería abrir http://localhost:8910 donde verá la página de bienvenida de Redwood:

![Página de bienvenida de Redwood](https://user-images.githubusercontent.com/300/73012647-97a43d00-3dcb-11ea-8554-42df29c36e4a.png)

> Recuerde que el número de puerto es tan fácil como contar: 8, 9, 10.

### Primer Commit

Ahora que tiene el esqueleto de su aplicación Redwood en su lugar, sería una buena idea guardar el estado actual como su primer commit, por si las moscas.

    git init
    git add .
    git commit -m 'Primer commit'

