const notesRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Note = require('../models/note')
const User = require('../models/user')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

notesRouter.get('/', async (request, response, next) => {
  try {
    const notes = await Note.find({}).populate('user', { username: 1, name: 1 })
    response.json(notes)
  } catch (error) {
    next(error)
  }
})

notesRouter.get('/:id', async (request, response, next) => {
  try {
    const note = await Note.findById(request.params.id)
    if (note) {
      response.json(note)
    } else {
      response.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

notesRouter.post('/', async (request, response, next) => {
  try {
    const body = request.body
    const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)

    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const user = await User.findById(decodedToken.id)

    if (!user) {
      return response.status(400).json({ error: 'UserId missing or not valid' })
    }

    const note = new Note({
      content: body.content,
      important: body.important || false,
      user: user._id,
    })

    const savedNote = await note.save()

    user.notes = user.notes.concat(savedNote._id)
    await user.save()

    response.status(201).json(savedNote)
  } catch (error) {
    next(error)
  }
})

notesRouter.delete('/:id', async (request, response) => {
  await Note.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

notesRouter.put('/:id', async (request, response, next) => {
  try {
    const { content, important } = request.body
    const note = await Note.findById(request.params.id)
    if (!note) {
      return response.status(404).end()
    }

    note.content = content
    note.important = important
    const updatedNote = await note.save()
    response.json(updatedNote)
  } catch (error) {
    next(error)
  }
})

module.exports = notesRouter
