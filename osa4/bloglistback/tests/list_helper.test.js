const { test, describe } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')
const testBlogs = require('./test_data')

test('dummy returns one', () => {
  const blogs = []

  const result = listHelper.dummy(blogs)
  assert.strictEqual(result, 1)
})

describe('total likes', () => {
  const listWithOneBlog = [
    {
      _id: '5a422aa71b54a676234d17f8',
      title: 'Go To Statement Considered Harmful',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
      likes: 5,
      __v: 0
    }
  ]

  test('when list has only one blog equals the likes of that', () => {
    const result = listHelper.totalLikes(listWithOneBlog)
    assert.strictEqual(result, 5)
  })

  test('when list has multiple blogs equals the sum of likes', () => {
    const result = listHelper.totalLikes(testBlogs)
    assert.strictEqual(result, 36)
  })

  test('of empty list is zero', () => {
    const result = listHelper.totalLikes([])
    assert.strictEqual(result, 0)
  })
})

describe('favorite blog', () => {
  test('when list has one blog, returns that blog', () => {
    const oneBlog = [testBlogs[0]]
    const result = listHelper.favoriteBlog(oneBlog)
    assert.deepStrictEqual(result, testBlogs[0])
  })

  test('when list has multiple blogs, returns the one with most likes', () => {
    const result = listHelper.favoriteBlog(testBlogs)
    assert.deepStrictEqual(result, testBlogs[2])
  })

  test('when list is empty, returns null', () => {
    const result = listHelper.favoriteBlog([])
    assert.strictEqual(result, null)
  })
})

describe('most blogs', () => {
  test('returns author with most blogs', () => {
    const result = listHelper.mostBlogs(testBlogs)
    assert.deepStrictEqual(result, {
      author: 'Robert C. Martin',
      blogs: 3
    })
  })

  test('when list is empty, returns null', () => {
    const result = listHelper.mostBlogs([])
    assert.strictEqual(result, null)
  })
})

describe('most likes', () => {
  test('returns author whose blogs have most likes', () => {
    const result = listHelper.mostLikes(testBlogs)
    assert.deepStrictEqual(result, {
      author: 'Edsger W. Dijkstra',
      likes: 17
    })
  })

  test('when list is empty, returns null', () => {
    const result = listHelper.mostLikes([])
    assert.strictEqual(result, null)
  })
})

