require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')

const app = express()

const blogSchema = new mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number,
})

const Blog = mongoose.model('Blog', blogSchema)

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/bloglist'
mongoose.connect(MONGODB_URI, { family: 4 })
  .then(() => console.log('connected to MongoDB'))
  .catch(err => console.error('error connecting to MongoDB:', err.message))

app.use(express.json())

app.get('/api/blogs', (request, response) => {
  Blog.find({}).then(blogs => response.json(blogs))
})

app.post('/api/blogs', (request, response) => {
  const blog = new Blog(request.body)
  blog.save().then(result => response.status(201).json(result))
})

const PORT = process.env.PORT || 3003
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})