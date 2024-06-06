import type { Prisma } from '@prisma/client'
import { db } from 'api/src/lib/db'

export default async () => {
  try {
    const users = [
      {
        id: 1,
        email: 'user.one@example.com',
        hashedPassword: 'fake_hash',
        fullName: 'User One',
        salt: 'fake_salt',
      },
      {
        id: 2,
        email: 'user.two@example.com',
        hashedPassword: 'fake_hash',
        fullName: 'User Two',
        salt: 'fake_salt',
      },
    ]

    if ((await db.user.count()) === 0) {
      await Promise.all(users.map((user) => db.user.create({ data: user })))
    } else {
      console.log('Users already seeded')
    }
  } catch (error) {
    console.error(error)
  }

  try {
    const posts = [
      {
        title: 'Welcome to the blog!',
        body: "I'm baby single- origin coffee kickstarter lo - fi paleo skateboard.Tumblr hashtag austin whatever DIY plaid knausgaard fanny pack messenger bag blog next level woke.Ethical bitters fixie freegan,helvetica pitchfork 90's tbh chillwave mustache godard subway tile ramps art party. Hammock sustainable twee yr bushwick disrupt unicorn, before they sold out direct trade chicharrones etsy polaroid hoodie. Gentrify offal hoodie fingerstache.",
        authorId: 1,
      },
      {
        title: 'A little more about me',
        body: "Raclette shoreditch before they sold out lyft. Ethical bicycle rights meh prism twee. Tote bag ennui vice, slow-carb taiyaki crucifix whatever you probably haven't heard of them jianbing raw denim DIY hot chicken. Chillwave blog succulents freegan synth af ramps poutine wayfarers yr seitan roof party squid. Jianbing flexitarian gentrify hexagon portland single-origin coffee raclette gluten-free. Coloring book cloud bread street art kitsch lumbersexual af distillery ethical ugh thundercats roof party poke chillwave. 90's palo santo green juice subway tile, prism viral butcher selvage etsy pitchfork sriracha tumeric bushwick.",
        authorId: 1,
      },
      {
        title: 'What is the meaning of life?',
        body: 'Meh waistcoat succulents umami asymmetrical, hoodie post-ironic paleo chillwave tote bag. Trust fund kitsch waistcoat vape, cray offal gochujang food truck cloud bread enamel pin forage. Roof party chambray ugh occupy fam stumptown. Dreamcatcher tousled snackwave, typewriter lyft unicorn pabst portland blue bottle locavore squid PBR&B tattooed.',
        authorId: 2,
      },
    ]

    if ((await db.post.count()) === 0) {
      await Promise.all(
        posts.map(async (post) => {
          const newPost = await db.post.create({ data: post })

          console.log(newPost)
        })
      )
    } else {
      console.log('Posts already seeded')
    }
  } catch (error) {
    console.error(error)
  }

  try {
    const stalls = [
      {
        id: 'clr0zv6ow000012nvo6r09vog',
        name: 'Salad Veggies',
        stallNumber: '1',
      },
      {
        id: 'clr0zvne2000112nvyhzf1ifk',
        name: 'Pie Veggies',
        stallNumber: '2',
      },
      {
        id: 'clr0zvne3000212nv6boae9qw',
        name: 'Root Veggies',
        stallNumber: '3',
      },
    ]

    if ((await db.stall.count()) === 0) {
      await Promise.all(
        stalls.map(async (stall) => {
          const newStall = await db.stall.create({ data: stall })

          console.log(newStall)
        })
      )
    } else {
      console.log('Stalls already seeded')
    }

    const produce = [
      {
        id: 'clr0zwyoq000312nvfsu1efcw',
        name: 'Lettuce',
        quantity: 10,
        price: 2,
        ripenessIndicators: null,
        region: '',
        isSeedless: false,
        vegetableFamily: 'Asteraceae',
        stallId: 'clr0zv6ow000012nvo6r09vog',
      },
      {
        id: 'clr0zy32x000412nvsya5g8q0',
        name: 'Strawberries',
        quantity: 24,
        price: 3,
        ripenessIndicators: 'Vitamin C',
        region: 'California',
        isSeedless: false,
        vegetableFamily: 'Soft',
        stallId: 'clr0zvne2000112nvyhzf1ifk',
      },
    ]

    if ((await db.produce.count()) === 0) {
      await Promise.all(
        produce.map(async (produce) => {
          const newProduce = await db.produce.create({ data: produce })

          console.log(newProduce)
        })
      )
    } else {
      console.log('Produce already seeded')
    }
  } catch (error) {
    console.error(error)
  }

  try {
    // Create your database records here! For example, seed some users:
    //
    // const users = [
    //   { name: 'Alice', email: 'alice@redwoodjs.com },
    //   { name: 'Bob', email: 'bob@redwoodjs.com },
    // ]
    //
    // await db.user.createMany({ data: users })

    console.info(
      '\n  No seed data, skipping. See scripts/seed.ts to start seeding your database!\n'
    )
  } catch (error) {
    console.error(error)
  }
}
