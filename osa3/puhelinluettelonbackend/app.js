const express = require('express')
const mongoose = require('mongoose')
const morgan = require('morgan')
const config = require('./utils/config')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const personsRouter = require('./controllers/persons')

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

morgan.token('body', (request) => {
  return JSON.stringify(request.body)
})

app.use(express.static('dist'))
app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))
app.use(middleware.requestLogger)

app.get('/api/info', (request, response) => {
  const Person = require('./models/person')
  Person.countDocuments({}).then(count => {
    response.send(`<p>Phonebook has info for ${count} people</p><p>${new Date()}</p>`)
  })
})

app.use('/api/persons', personsRouter)

// Fallback to index.html for SPA routing (after API routes, before 404)
app.use((req, res, next) => {
  if (req.method !== 'GET') return next()
  if (req.path.startsWith('/api')) return next()
  const fs = require('fs')
  const distPath = __dirname + '/dist'
  const distPathLocal = require('path').join(__dirname, '../../osa2/puhelinluettelo/dist')
  const indexPath = fs.existsSync(distPath) ? require('path').join(distPath, 'index.html') : require('path').join(distPathLocal, 'index.html')
  res.sendFile(indexPath)
})

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
