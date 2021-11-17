import { db } from 'src/lib/db'

import RedwoodRecord from '../RedwoodRecord'
import RelationProxy from '../RelationProxy'

class Post extends RedwoodRecord {}
class User extends RedwoodRecord {}
class Comment extends RedwoodRecord {}
class Category extends RedwoodRecord {}

global.console.warn = jest.fn()

beforeEach(() => {
  Post.requiredModels = [User, Comment, Category]
  User.requiredModels = [Post, Comment]
  Category.requiredModels = [Post]
})

afterEach(() => {
  global.console.warn.mockClear()
})

describe('belongsTo', () => {
  it('adds nothing if model has no belongsTo relations', () => {
    const record = new User()

    RelationProxy.addRelations(record)

    expect(record.user).toEqual(undefined)
  })

  it('logs a warning if model does not require needed model', () => {
    Post.requiredModels = []
    const record = new Post()
    RelationProxy.addRelations(record)

    // one warning for user, comments, categories
    expect(console.warn).toBeCalledTimes(3)
  })

  scenario('instantiates belongsTo record', async (scenario) => {
    const record = new Post()
    record.userId = scenario.user.rob.id

    RelationProxy.addRelations(record)
    const user = await record.user

    expect(user instanceof User).toEqual(true)
    expect(user.id).toEqual(scenario.user.rob.id)
  })
})

describe('hasMany', () => {
  it('adds nothing if model has no hasMany relations', () => {
    const record = new Post()
    RelationProxy.addRelations(record)

    expect(record.posts).toEqual(undefined)
  })

  it('logs a warning if model does not require needed model', () => {
    User.requiredModels = []
    const record = new User()
    RelationProxy.addRelations(record)

    // one warning for posts and one for comments
    expect(console.warn).toBeCalledTimes(2)
  })

  it('instantiates hasMany proxy', () => {
    const record = new User()
    record.id = 1

    RelationProxy.addRelations(record)
    const proxy = record.posts

    expect(proxy instanceof RelationProxy).toEqual(true)
    expect(proxy.model).toEqual(Post)
    expect(proxy.relation).toEqual({ where: { userId: 1 } })
  })

  scenario('create hasMany record linked by foreign key', async (scenario) => {
    const user = await User.find(scenario.user.rob.id)
    const newPost = await user.posts.create({ title: 'My second post' })
    const userPostIds = (await user.posts.all()).map((u) => u.id)

    expect(newPost.userId).toEqual(user.id)
    expect(userPostIds.includes(newPost.id)).toEqual(true)
  })

  scenario('fetches related records with find()', async (scenario) => {
    const record = await User.find(scenario.user.rob.id)
    const post = await record.posts.find(scenario.post.rob.id)

    expect(post.id).toEqual(scenario.post.rob.id)
  })

  scenario('fetches related records with findBy()', async (scenario) => {
    const record = await User.find(scenario.user.rob.id)
    const post = await record.posts.findBy({ title: scenario.post.rob.title })

    expect(post.id).toEqual(scenario.post.rob.id)
  })

  scenario('fetches related records with where()', async (scenario) => {
    const record = await User.find(scenario.user.rob.id)
    const posts = await record.posts.where()

    expect(posts.length).toEqual(1)
    expect(posts[0].id).toEqual(scenario.post.rob.id)
  })
})

describe('implicit many-to-many', () => {
  it('instantiates hasMany proxy', () => {
    const record = new Post()
    record.id = 1

    RelationProxy.addRelations(record)
    const proxy = record.categories

    expect(proxy instanceof RelationProxy).toEqual(true)
    expect(proxy.model).toEqual(Category)
    expect(proxy.relation).toEqual({
      where: { posts: { some: { id: 1 } } },
      create: { posts: { connect: [{ id: record.id }] } },
    })
  })

  scenario('create connects manyToMany record', async (scenario) => {
    const post = await Post.find(scenario.post.rob.id)
    const newCategory = await post.categories.create({ name: 'Sample' })
    const postAttachedCategoryIds = (await post.categories.all()).map(
      (cat) => cat.id
    )

    expect(postAttachedCategoryIds.includes(newCategory.id)).toEqual(true)
    expect((await newCategory.posts.all())[0].id).toEqual(post.id)
  })

  scenario('fetches related records with find()', async (scenario) => {
    const record = await Post.find(scenario.post.rob.id)
    const category = await record.categories.find(scenario.category.wood.id)

    expect(category.id).toEqual(scenario.category.wood.id)
  })

  scenario('fetches related records with where()', async (scenario) => {
    const record = await Post.find(scenario.post.rob.id)
    const categories = await record.categories.where()

    expect(categories.length).toEqual(1)
    expect(categories[0].id).toEqual(scenario.category.wood.id)
  })
})
