const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
//Connecting to the db
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
//Creating the models for the data collection
const Users = mongoose.model('user', { username: String});
const Execrises = mongoose.model('execrise', { userId: String, description: String, duration: Number, date: Date});
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
// Create a New User
app.post('/api/exercise/new-user', (req, res) => {
    const username = req.body.username
    Users.findOne({ username }, (err, user) => {
    if(err) return console.log(err)
    if(!user) {
      const newUser = new Users({ username })
      newUser.save().then(() => {
        console.log('New user has been saved')
        res.json({
          username: newUser.username,
          _id: newUser.id
        })
      })
    }else {
      res.send('Username already taken')
    }
  })
})
//Get All Users
app.get('/api/exercise/users', (req, res) => {
  Users.find({}, (err, result) => {
    if(err) return console.log(err)
    else {
      res.json(result)
    }
  })
})
//Add exercises
app.post('/api/exercise/add', (req, res) => {
    const userId = req.body.userId
    Users.findById(userId, (err, user) => {
      if(err) {
        res.send(`Can't Find user with the id:"${userId}"`)
        return console.log(err)
      }
      if(user) {
        const newExecrise = new Execrises({
          userId,
          description: req.body.description,
          duration: +req.body.duration,
          date: req.body.date ? new Date(req.body.date) : new Date(Date.now())
        })
        newExecrise.save().then(() => {
          console.log('New Execrise Added!')
          res.json({
            _id: userId,
            username: user.username,
            date: newExecrise.date.toString().split(' ').splice(0,4).join(' '),
            duration: newExecrise.duration,
            description: newExecrise.description
          })
        })
      }
    })
})
//Get all the execrsies of the user
app.get('/api/exercise/log', (req, res) => {
  const userId = req.query.userId
  Users.findById(userId, (err, user) => {
    if(err) {
      res.send(`Can't Find user with the id:"${userId}"`)
      return console.log(err)
    }if(user) {
      const username = user.username
      const from = req.query.from ? new Date(req.query.from) : undefined
      const to = req.query.to ? new Date(req.query.to) : undefined
      let query = { userId }
      let jsonRes = {}
      if(from) {
        query.date = { $gte: from }
        jsonRes.from = from.toString().split(' ').splice(0,4).join(' ')
      }
      if(to) {
        query.date = { $lte: to }
        jsonRes.to = to.toString().split(' ').splice(0,4).join(' ')
      }
      if(from && to) {
        query = {
          userId,
          $and: [
            { date: { $lte: to } },
            { date: { $gte: from } }
          ]
        }
        jsonRes.from = from.toString().split(' ').splice(0,4).join(' ')
        jsonRes.to = to.toString().split(' ').splice(0,4).join(' ')
      }
      Execrises.find(query, (err, result) => {
        if(err) return console.log(err)
        if(result.length > 0) {
          res.json({
            _id: userId,
            username,
            ...jsonRes,
            count: result.length,
            log: result.map(item => {
              return ({
                description: item.description,
                duration: item.duration,
                date: item.date.toString().split(' ').splice(0,4).join(' ')
              })
            })
        })
        }else {
          res.send('No Execrises Found')
        }
      }).limit(+req.query.limit)
    }
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
