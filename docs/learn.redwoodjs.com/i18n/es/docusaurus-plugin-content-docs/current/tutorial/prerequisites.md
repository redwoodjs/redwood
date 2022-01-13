---
id: prerequisites
title: "Requisitos"
sidebar_label: "Requisitos"
---

Este tutorial asume que está familiarizado con los siguientes conceptos:

- [React](https://reactjs.org/)
- [GraphQL](https://graphql.org/)
- [Jamstack](https://jamstack.org/)

Usted podría seguir este tutorial sin saber nada sobre esas tecnologías, pero puede que se pierda un poco en la terminología ya que no nos detenemos a explicarla. También le ayudará a entender dónde está la línea entre lo que incorpora React y las características adicionales que brinda Redwood.

### Versiones de Redwood

Necesitará la versión de Redwood 0.25 o superior para completar el tutorial. Si esta es su primera vez usando Redwood no se preocupe: ¡la última versión se instalará automáticamente cuando crees el esqueleto de la aplicación! Si tiene un sitio existente creado con una versión anterior a 0.25, necesitará actualizarla. Ejecute el siguiente comando en la directorio raíz de su aplicación y siga las instrucciones:

```bash
yarn redwood upgrade
```

### Versiones de Node.js y Yarn a utilizar

Durante la instalación, RedwoodJS comprueba si su sistema cumple con los requisitos mínimos de versión para Node.js y Yarn:

- node: "=14.x"
- yarn: ">=1.15"

Si las versiones de su sistema no se cumplen, _la instalación resultará en un ERROR._ Por favor compruebe que versiones tiene ejecutando los siguiente comandos desde su terminal:

```
node --version
yarn --version
```

Por favor, actualícelos si es necesario y proceda con la instalación de Redwood.

> **Instalando Node.js y Yarn**
> 
> Hay muchas formas de instalar y gestionar Node.js y Yarn. Si está instalando por primera vez, le recomendamos:
> 
> **Yarn**
> 
> - Siga las instrucciones [provistas por Yarnpkg.com](https://classic.yarnpkg.com/en/docs/install/).
> 
> **Node.js**
> 
> - Para **Linux** y **Mac**, utilice `nvm` pues facilita administrar múltiples versiones de Node.js aunque requiere un poco más de esfuerzo. Alternativamente puede instalar [la versión más reciente de Node.js](https://nodejs.org/en/). 
>     - Si es usuario de **Mac**  y tiene instalado Homebrew, puede usarlo para [instalar `nvm`](https://formulae.brew.sh/formula/nvm). De lo contrario, siga las instrucciones de instalación [de `nvm`](https://github.com/nvm-sh/nvm#installing-and-updating).
>     - Si es usuario de **Linux**, siga las [instrucciones de instalación de `nvm`](https://github.com/nvm-sh/nvm#installing-and-updating).
> - Para **Windows** visite [Nodejs.org](https://nodejs.org/en/) y siga los pasos de instalación.
> 
> Ante la duda le recomendamos usar la versión "par" más reciente, actualmente v14, porque tiene soporte a largo plazo (LTS).

