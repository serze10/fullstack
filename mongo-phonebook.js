const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]
const name = process.argv[3]
const number = process.argv[4]
// Atlas connection string (cluster1)
const url = `mongodb+srv://serze10:${encodeURIComponent(password)}@cluster1.oul5ynt.mongodb.net/phonebook?retryWrites=true&w=majority`

mongoose.set('strictQuery', false)

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})

const Person = mongoose.model('Person', personSchema)

const listPersons = () => {
  return Person.find({}).then(result => {
    console.log('phonebook:')
    result.forEach(person => {
      console.log(`${person.name} ${person.number}`)
    })
  })
}

const addPerson = () => {
  const person = new Person({ name, number })
  return person.save().then(() => {
    console.log(`added ${person.name} number ${person.number} to phonebook`)
  })
}

mongoose
  .connect(url, { family: 4 })
  .then(() => {
    if (!name || !number) {
      return listPersons()
    }
    return addPerson()
  })
  .catch(err => {
    console.error('Mongo connection or query error:', err.message)
  })
  .finally(() => {
    mongoose.connection.close()
  })
