# Fullstack Driven Design

Design in isolation, leveraging Redwood's integration of Storybook with mock data capabilities.
Free your design process from the restraint of pre-existing data structures.

## The End, at the Beginning.

### The Reason

Ship features frequently, continually, and as soon as possible.
### The Goal

Incorporate the fullstack driven design process into your workflow.
Design front-end components in isolation, then copy the constructed data models to the api side for setup and integration.

This workflow results in, essentially, a two-for-one:
1) Fully designed, functional component(s)
2) Data model(s) ready for your prisma schema

* _Also_: [Tests can be developed during this process]([https://redwoodjs.com/docs/tutorial/chapter5/testing)

 ### The (Condensed) Steps

 The process is described more fully in the sections below.
 More mature workflows may differ distinctly than the below.
 In-fact, the [Tutorial, Part II](https://redwoodjs.com/docs/tutorial/intermission) differs from below by taking a slightly longer design path.

 However, the main steps revolve around this workflow:
 1) Start Storybook `yarn rw sb`.
 2) Generate a cell `yarn rw g cell item` and shape your initial Storybook mock data structure in `itemCell.mock.ts`.
 3) Generate a component `yarn rw g component` to import into the cell. [\*]
 4) Design and develop your component using the mock data passed from the cell.
 5) ***Iterate*** on both the data structure and component design.

 6) _When Finished_: Convert your data structure into prisma models.

\* A recommended best practice is to avoid design work in the cell itself.
Do this by importing a component into the cell and designing on the component.
Pass the props from the cell to the component like normal react components.

### Assumptions

You are familiar with Redwood cli commands, Prisma schema, and Storybook.

### Gotchas

Seeing: `Error: Unexpected token < in JSON at position 0` on your generated page? Try going to your terminal and restarting the Storybook server. When Pages contain Mock data from a Cell [they do not hot-reload.](https://github.com/redwoodjs/redwood/issues/4717)

### Other Notes

This document was foremost intended as a process checklist and morphed into another explainer.
This workflow is explained in much more detail in the second part of the [Tutorial, starting at Chapter 5](https://redwoodjs.com/docs/tutorial/chapter5/storybook).

While this is a powerful design process, it does not complete everything.
There will still be a need for services, scripts, directives, and other backend functions to be developed.

## Why design this way?

A primary focus of startups is often product design.
Developing, shipping and iterating on feature design is important, especially for young applications.
This approach speeds up this process for small teams.
Designing components around data structures or API's is not a new concept.
Teams have been successfully working this way for years.
Fullstack Driven Design tweaks this approach slightly by putting mock data files between your design and the api layer.

Using mock data allows you to more 'freely' design your components, without being bound to the 'contract' of an existing api structure or data model.
This freedom allows you to iterate on your design, without worrying about fitting the design to the data structure.
You are free to shape, and reshape, your data structure and display logic while you work through your design.
This workflow also reduces the mental overhead associated with context switching between the api and web sides.
Using mock data means you do not have to leave the design space to update back-end models, relations, services, sdl's, etc.

When you are done, you can take the data structure to your prisma schema file and connect everything together.
Then, when everything is connected, ship your design so it can go live!

As your team and application mature, this approach may not work for all situations.
Also see: Atomic Design Structure

## Start with Mock Data

Redwood provides mock data and Storybook integration out of the box.
The mock data file mimics the data structure that would be returned from your GraphQL query.
However, it is completely separate from the backend.
This somewhat changes the api design process from a **pre-design requirement** into a _**design-time**_ process.
This is a solid first step in the Fullstack Driven Design process.

Start by creating some mock data in your `<name>Cell.mock.ts` file.
Once an initial data structure is in place, you can move forward and design against this data.
At times, your workflow may have you constantly weaving between the mock data file and the component files.
It is perfectly OK to do so.
The fact that you can do this, and the ease at which you can, is why this process is so powerful.

Getting into this step first does two things.

> 1) _This is a pseudo schema modeling step._
> Schema modeling is sometimes a natural first step for outlining application data needs.
> However, design is often an iterative process.
> As you design your component, you may realize that you want to reshape your data.
> Reshaping mock data structure is easier than changing a model with existing sdls, and services that will need to be regenerated.
> It is important to keep a loose idea of your overall data model during design.

> 2) _This method keeps your data structure flexible._
> When designing a component layout, it is liberating to be free of a strict data structure.
> If you are designing based on an existing api model, then your schema and data structure have already been developed.
> This may limit your options or give you tunnel vision.
> Being flexible allows you to mold the data structure as you iterate on your design.

### Mock Data Structure

Creating your mock data structure is very similar to creating a prisma schema model.
However, instead of defining fields and types, you define fields and sample values.
The mock data structure resembles the JSON response you would expect from a GraphQL query.
Unlike the `Field: Type` structure of prisma models, you create the `field: property` or `field: 'value'` structure of objects.
You add actual values so that your components will be able to use and/or display the data in Storybook.

Redwood generates mock data files when cells are generated.
The mock data is then provided as a property of the cell exports.

* Generate a cell: `yarn rw g cell inspectionItem`
* Edit the standard export in the mock data file:

```
InspectionItemCell.mock.ts

// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  inspection: {
    id: 42,
    contractor: {
      id: 2,
      name: 'Nickson Twoson',
    },
    date: '2011-10-05T14:48:00.000Z',
    startTime: '2011-10-05T14:48:00.000Z',
    endTime: '2011-10-05T15:36:00.000Z',
    inspector: {
      id: 5,
      name: 'Jerry Whitehead',
    },
    site: {
      id: 24,
      name: 'Water Valley Water Plant',
    },
    permitFound: true,
    swpppFound: true,
    bmpInstalled: false,
    inspReportsFound: true,
    inspType: 'Default',
    description:
      'This was a normal inspection, not before or after a specific rain event.',
    title: 'Chuckabee Inspection',
    severity: ' None',
    violations: 'None',
    notes: 'There are no notes to speak of.',
    bmp: [
      {
        name: 'bmp 1',
        custom: false,
        implemented: true,
        maintenance: false,
      },
      {
        name: 'bmp 2',
        custom: true,
        implemented: false,
        notes:
          'This is a note saying that maintenance bmp needs to be implemented. It has not been',
      },
    ],
  },
})
```

This is a mildly complex mock data structure, developed after several design iterations.
It is representative of how the component wants to consume the data.
This process can be a little slow, since you need to mock out an initial data structure and possible return values.
Integers and strings are simple enough to mock.
Dates are complicated more complicated to remember the exact format that Redwood expects.
Using a fake data generator such as copycat or faker can make mocking some values easier, but may not be worth the extra steps of setup and use.


### Passing Mock Data through Cells & Components

Storybook passes the mock data to the cell as a mocked query response [through the cell's stories file](https://redwoodjs.com/docs/tutorial/chapter5/first-story).

```
import { Loading, Empty, Failure, Success } from './InspectionItemCell'
import { standard } from './InspectionItemCell.mock'

export const loading = (args) => {
  return Loading ? <Loading {...args} /> : null
}

export const empty = (args) => {
  return Empty ? <Empty {...args} /> : null
}

export const failure = (args) => {
  return Failure ? <Failure error={new Error('Oh no')} {...args} /> : null
}

export const success = (args) => {
  return Success ? <Success {...standard()} {...args} /> : null
}

export default { title: 'Cells/InspectionItemCell' }
```

The `standard` export in the mock data file is imported at the top of the stories file, and passed to the `success` export.

## Building your Component

Get started designing your component.

`yarn rw g component InspectionItem`

Keep Storybook, `yarn rw sb`, running while in design.
Storybook will hot-reload as you update your design files.
Any changes to your mock data files or components are automatically updated in Storybook.
(Help needed on design blurb)

Using templates is a quick way to get started with layout structuring.
TailwindUI provides nice pre-defined templates for different data structures.
However, RedwoodJS also makes it easy to pick a component library and build your own layout from scratch.
Either way, this is the point where you enter your [Cell](https://redwoodjs.com/docs/cells) and start to integrate your mock data with your component design.

Revisit the [Tutorial, Part II](https://redwoodjs.com/docs/tutorial/chapter6/the-redwood-way) to work through the design process.

# Resources

## DDFS Workflow Resources

[Design-Driven Full-Stack: GitNation 2021](https://portal.gitnation.org/contents/design-driven-full-stack-an-end-to-end-dev-workflow-that-scales)

[Design-Driven Full-Stack: YouTube Demo](https://youtu.be/dWWFZV6ML3k)

[What is Design-driven Full-stack Development?](https://community.redwoodjs.com/t/what-is-design-driven-full-stack-development/2966)

## Mock Data Resources

Mock data is essentially what you expect to be returned from the GraphQL queries. This becomes the Props that your component needs.

[RW How-To: Mocking GraphQL in Storybook](https://redwoodjs.com/docs/how-to/mocking-graphql-in-storybook)

[RW Tutorial: Our First Cell](https://redwoodjs.com/docs/tutorial/chapter2/cells#our-first-cell)

## Storybook Resources

[Advanced RW Storybook Integration Demo](https://youtu.be/tHW7Gn6WCSc)

[Storybook Demo with Redwood](https://www.youtube.com/watch?v=zYm1a39Lpgs)
