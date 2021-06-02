const posts = `const POSTS = [
  {
    title: 'Welcome to the blog!',
    body:
      "I'm baby single- origin coffee kickstarter lo - fi paleo skateboard.Tumblr hashtag austin whatever DIY plaid knausgaard fanny pack messenger bag blog next level woke.Ethical bitters fixie freegan,helvetica pitchfork 90's tbh chillwave mustache godard subway tile ramps art party. Hammock sustainable twee yr bushwick disrupt unicorn, before they sold out direct trade chicharrones etsy polaroid hoodie. Gentrify offal hoodie fingerstache.",
  },
  {
    title: 'A little more about me',
    body:
      "Raclette shoreditch before they sold out lyft. Ethical bicycle rights meh prism twee. Tote bag ennui vice, slow-carb taiyaki crucifix whatever you probably haven't heard of them jianbing raw denim DIY hot chicken. Chillwave blog succulents freegan synth af ramps poutine wayfarers yr seitan roof party squid. Jianbing flexitarian gentrify hexagon portland single-origin coffee raclette gluten-free. Coloring book cloud bread street art kitsch lumbersexual af distillery ethical ugh thundercats roof party poke chillwave. 90's palo santo green juice subway tile, prism viral butcher selvage etsy pitchfork sriracha tumeric bushwick.",
  },
  {
    title: 'What is the meaning of life?',
    body:
      'Meh waistcoat succulents umami asymmetrical, hoodie post-ironic paleo chillwave tote bag. Trust fund kitsch waistcoat vape, cray offal gochujang food truck cloud bread enamel pin forage. Roof party chambray ugh occupy fam stumptown. Dreamcatcher tousled snackwave, typewriter lyft unicorn pabst portland blue bottle locavore squid PBR&B tattooed.',
  },
]
`
const body = `const existing = await db.post.findMany()

for (let i = 0; i < POSTS.length; i++) {
  const post = POSTS[i]

  // only inserts a post if one with the exact same title doesn't already exist
  if (!existing.find((ex) => ex.title === post.title)) {
    await db.post.create({ data: post })
  }
}
`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  root.find(j.FunctionDeclaration).insertBefore(posts)

  return root
    .find(j.FunctionDeclaration, {
      id: {
        type: 'Identifier',
        name: 'main',
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.body.body = [body]
      return node
    })
    .toSource()
}
