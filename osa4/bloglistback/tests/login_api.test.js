const { test, beforeEach, after, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcryptjs')
const app = require('../app')
const User = require('../models/user')

const api = supertest(app)

describe('login', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({
      username: 'root',
      name: 'Superuser',
      passwordHash,
    })

    await user.save()
  })

  test('succeeds with valid credentials', async () => {
    const response = await api
      .post('/api/login')
      .send({ username: 'root', password: 'sekret' })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert(response.body.token)
    assert.strictEqual(response.body.username, 'root')
    assert.strictEqual(response.body.name, 'Superuser')
  })

  test('fails with status code 401 for invalid credentials', async () => {
    const response = await api
      .post('/api/login')
      .send({ username: 'root', password: 'wrongpassword' })
      .expect(401)
      .expect('Content-Type', /application\/json/)

    assert(response.body.error.includes('invalid username or password'))
  })
})

after(async () => {
  await mongoose.connection.close()
})
