require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const Note = require('./models/note')

app.use(express.json())
app.use(cors())

// Serve static files from frontend build
// Try local copy first (Render), then fallback to original location (local dev)
const distPath = path.join(__dirname, 'dist')
const distPathLocal = path.join(__dirname, '../../osa2/kokrende/dist')
const staticPath = fs.existsSync(distPath) ? distPath : distPathLocal
app.use(express.static(staticPath))

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/notes', (request, response) => {
  Note.find({}).then(notes => {
    response.json(notes)
  })
})

app.get('/api/notes/:id', (request, response) => {
  const id = request.params.id
  Note.findById(id).then(note => {
    if (note) {
      response.json(note)
    } else {
      response.status(404).end()
    }
  })
})

app.post('/api/notes', (request, response) => {
  const body = request.body

  if (!body.content) {
    return response.status(400).json({ 
      error: 'content missing' 
    })
  }

  const note = new Note({
    content: body.content,
    important: body.important || false,
  })

  note.save().then(savedNote => {
    response.json(savedNote)
  })
})

app.delete('/api/notes/:id', (request, response) => {
  const id = request.params.id
  Note.deleteOne({ _id: id }).then(() => {
    response.status(204).end()
  })
})

// Fallback to index.html for SPA routing (after API routes, before 404)
app.use((req, res, next) => {
  if (req.method !== 'GET') return next()
  if (req.path.startsWith('/api')) return next()
  const indexPath = fs.existsSync(distPath) ? path.join(distPath, 'index.html') : path.join(distPathLocal, 'index.html')
  res.sendFile(indexPath)
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})