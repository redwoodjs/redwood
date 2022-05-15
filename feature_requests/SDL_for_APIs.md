# Request for scaffolding based on API specs instead of DB schema (Prism)

Request for comment on generating scaffolding based on API specs instead of DB schema

# Problem: 
Users of RedwoodJS love the ‘scaffold’ capability. Such a Great way to get a significant amount of functionality with very little work.

Scaffold currently needs to be driven by the Prisma schema, and modern projects also need to work with existing or third party APIs, not just databases.
Heck, some modern applications have to work with SaaS databases that requiring APIs only.

Here's one example. That the 'contact us' example in the Redwood Tutorial. We could send those entries straight to Sendgrid APIs to get emailed the 
Contact Us entries rather than storing in them in the database.

Another Example: What if the Front-end and backend teams agreed on an API interface, but they are moving at different speeds from one another?
How could we use that API contract as the spec instead of Prism DB schema?

It is important to note that when working with a database we can assume CRUD actions, so if we remove a Prism schema from the equation, what are we generating? 
Could API schema defintions answer what we needed to generate?


# RFC Solution:

Provide another option for building the scaffolding from an API Spec, not just a DB schema. 

A database naturally assumes CRUD, but if we drive the scaffolding off an open API spec ( see https://redux-toolkit.js.org/rtk-query/usage/code-generation )
then not only can we understand the schema (entities/types) but we can also understand the 'actions' (e.g., verbs) that are needed for scaffolding.

## For generating SDL from DB schema 

* `yarn rw generate sdl fromDB Contacts`

## For generating SDL from API Spec 

* `yarn rw generate sdl fromOAS src/services/contracts/SendgridOAS.json`

## Stories from the field
I ran into a similar problem when I was working on the Redwood events discord bot. I didn’t really want a database table because I was interacting directly with a 3rd party service but you can’t generate an sdl 
without a model. For instance when running yarn rw g sdl discord it errors and says no model with name discord. 

In the simplest scenario, it could give you the sdl file and the services files. 
Then after you generate those you could fill out the sdl and run the scaffold against the sdl to interact directly with 3rd party apis.

### For generating SDL from no schema or contracts 

* `yarn rw generate sdl fromName Contacts`


# Workaround
If you created a Prisma model which you Scaffolded, could you then modify some things (including reverting the Prisma migration and model) to used 
the Scaffold with the 3rd party API?

Or you could do this by creating scaffolding in a new, empty rwjs project and then just copy/pasting those pieces that are useful in my sdl driven 
version. 


FAQ
* Since scaffolds typically have CRUD functionality do you still plan to generate a service that the db Prisma client to insert, update and fetch data?
And if so, then what model would these use? Or, would they simple stub out empty services to define?

* ` Answer: Look to the API specs to define the actions to generate..CRUD is logical set of actions for a database. API spec can better define intended actions for an API `


