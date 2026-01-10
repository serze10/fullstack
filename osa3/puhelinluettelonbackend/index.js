const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const logger = require('./utils/logger')
const config = require('./utils/config')
const Person = require('./models/person')
const personsRouter = require('./controllers/persons')
const app = express()

app.use(cors())
app.use(express.json())

// Serve static files from frontend build
const distPath = path.join(__dirname, 'dist')
const distPathLocal = path.join(__dirname, '../../osa2/puhelinluettelo/dist')
const staticPath = fs.existsSync(distPath) ? distPath : distPathLocal
app.use(express.static(staticPath))

morgan.token('body', (request) => {
  return JSON.stringify(request.body)
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

app.get('/api/info', (request, response) => {
  Person.countDocuments({}).then(count => {
    response.send(`<p>Phonebook has info for ${count} people</p><p>${new Date()}</p>`)
  })
})

app.use('/api/persons', personsRouter)

// Fallback to index.html for SPA routing
app.use((req, res, next) => {
  if (req.method !== 'GET') return next()
  if (req.path.startsWith('/api')) return next()
  const indexPath = fs.existsSync(distPath) ? path.join(distPath, 'index.html') : path.join(distPathLocal, 'index.html')
  res.sendFile(indexPath)
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = config.PORT
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})