const { test, beforeEach, after, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcryptjs')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const User = require('../models/user')

const api = supertest(app)
let token
let userId
let secondToken
let secondUserId

describe('when there are initially some blogs saved', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', name: 'Superuser', passwordHash })
    const savedUser = await user.save()
    userId = savedUser._id.toString()

    const blogsWithUser = helper.initialBlogs.map(blog => ({
      ...blog,
      user: savedUser._id,
    }))

    const savedBlogs = await Blog.insertMany(blogsWithUser)
    savedUser.blogs = savedBlogs.map(blog => blog._id)
    await savedUser.save()

    const loginResponse = await api
      .post('/api/login')
      .send({ username: 'root', password: 'sekret' })

    token = loginResponse.body.token

    const secondPasswordHash = await bcrypt.hash('salainen', 10)
    const secondUser = new User({ username: 'testuser', name: 'Test User', passwordHash: secondPasswordHash })
    const savedSecondUser = await secondUser.save()
    secondUserId = savedSecondUser._id.toString()

    const secondLoginResponse = await api
      .post('/api/login')
      .send({ username: 'testuser', password: 'salainen' })

    secondToken = secondLoginResponse.body.token
  })

  describe('fetching blogs', () => {
    test('blogs are returned as json', async () => {
      await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    test('all blogs are returned', async () => {
      const response = await api.get('/api/blogs')

      assert.strictEqual(response.body.length, helper.initialBlogs.length)
    })

    test('blog creator is populated', async () => {
      const response = await api.get('/api/blogs')

      assert(response.body[0].user)
      assert(response.body[0].user.username)
      assert(response.body[0].user.name)
    })

    test('blog has id field and not _id', async () => {
      const response = await api.get('/api/blogs')

      assert(response.body[0].id)
      assert(!response.body[0]._id)
    })
  })

  describe('adding a blog', () => {
    test('a valid blog can be added', async () => {
      const newBlog = {
        title: 'Async patterns in Node.js',
        author: 'Jane Doe',
        url: 'https://asyncpatterns.dev',
        likes: 3,
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

      const titles = blogsAtEnd.map(n => n.title)
      assert(titles.includes('Async patterns in Node.js'))

      const addedBlog = blogsAtEnd.find(blog => blog.title === 'Async patterns in Node.js')
      assert.strictEqual(addedBlog.user.toString(), userId)
    })

    test('blog is not added without token', async () => {
      const newBlog = {
        title: 'No Token Blog',
        author: 'Unauthorized',
        url: 'https://notoken.dev',
        likes: 1,
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })

    test('if likes is missing, it defaults to 0', async () => {
      const newBlog = {
        title: 'No likes provided',
        author: 'Default Value',
        url: 'https://defaults.dev',
      }

      const response = await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(response.body.likes, 0)
    })

    test('blog without title is not added', async () => {
      const newBlog = {
        author: 'Missing Title',
        url: 'https://missing-title.dev',
        likes: 1,
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })

    test('blog without url is not added', async () => {
      const newBlog = {
        title: 'Missing URL',
        author: 'Missing URL Author',
        likes: 1,
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
  })

  describe('deletion of a blog', () => {
    test('succeeds with status code 204 if id is valid and user is the creator', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      const ids = blogsAtEnd.map(b => b.id)
      assert(!ids.includes(blogToDelete.id))

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)
    })

    test('fails with status code 401 if token is missing', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(401)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })

    test('fails with status code 403 if user is not the blog creator', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${secondToken}`)
        .expect(403)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
  })

  describe('updating a blog', () => {
    test('succeeds in updating likes of an existing blog', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToUpdate = blogsAtStart[0]

      const updatedBlog = {
        ...blogToUpdate,
        likes: blogToUpdate.likes + 1,
      }

      const response = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(response.body.likes, blogToUpdate.likes + 1)

      const blogsAtEnd = await helper.blogsInDb()
      const changedBlog = blogsAtEnd.find(blog => blog.id === blogToUpdate.id)
      assert.strictEqual(changedBlog.likes, blogToUpdate.likes + 1)
    })
  })

  describe('users listing', () => {
    test('shows blogs created by user', async () => {
      const response = await api
        .get('/api/users')
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(response.body.length, 2)
      const rootUser = response.body.find(u => u.username === 'root')
      assert(rootUser.blogs)
      assert.strictEqual(rootUser.blogs.length, helper.initialBlogs.length)
      assert(rootUser.blogs[0].title)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})
