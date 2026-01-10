const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const logger = require('./utils/logger')
const config = require('./utils/config')
const notesRouter = require('./controllers/notes')

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

app.use(express.json())
app.use(cors())
app.use(requestLogger)

// Serve static files from frontend build
// Try local copy first (Render), then fallback to original location (local dev)
const distPath = path.join(__dirname, 'dist')
const distPathLocal = path.join(__dirname, '../../osa2/kokrende/dist')
const staticPath = fs.existsSync(distPath) ? distPath : distPathLocal
app.use(express.static(staticPath))



app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.use('/api/notes', notesRouter)

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