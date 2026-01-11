const express = require('express')
const mongoose = require('mongoose')
const config = require('./utils/config')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const notesRouter = require('./controllers/notes')

const app = express()

mongoose.set('strictQuery', false)

logger.info('connecting to', config.MONGODB_URI)

mongoose
  .connect(config.MONGODB_URI, { family: 4 })
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

app.use(express.static('dist'))
app.use(express.json())
app.use(middleware.requestLogger)

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.use('/api/notes', notesRouter)

// Fallback to index.html for SPA routing (after API routes, before 404)
app.use((req, res, next) => {
  if (req.method !== 'GET') return next()
  if (req.path.startsWith('/api')) return next()
  const fs = require('fs')
  const distPath = __dirname + '/dist'
  const distPathLocal = require('path').join(__dirname, '../../osa2/kokrende/dist')
  const indexPath = fs.existsSync(distPath) ? require('path').join(distPath, 'index.html') : require('path').join(distPathLocal, 'index.html')
  res.sendFile(indexPath)
})

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
