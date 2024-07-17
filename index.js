const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const { Schema } = mongoose

mongoose.connect('mongodb+srv://chukwukadiemma:' + process.env.DB_PSD + '@cluster1.lpcsfos.mongodb.net/db1?retryWrites=true&w=majority&appName=Cluster1')

app.use(cors())
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new Schema({
  username: String
})
const exerciseSchema = new Schema({
    user_id: String,
    description: String,
    duration: Number,
    date: String
})
const collection = mongoose.model('User', userSchema);
const Exercise = mongoose.model('exercise', exerciseSchema);


app.route('/api/users')
.post(async (req, res) => {
  let username = req.body.username;
  const newUser = collection({username: username}); 
  const doc = await newUser.save();
  console.log(doc)
  if (!doc) 
    console.log("failed to fetch")
  else 
      res.json({
        username: username,
        _id: doc._id
        })
    
})
.get(async (req, res) => {
 let allUsers = await collection.find({});
 if (!allUsers)
  console.log("failed to get all users");
else 
  res.send(allUsers)
})
app.route('/api/users/:_id/exercises')
.post(async (req, res) => {
  const _id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date

  try {
    let user = await collection.findById(_id);
    if (!user) console.log('cannot find user')
    let newExercise = new Exercise({
      user_id: _id,
      description: description,
      duration: Number(duration),
      date: date ? new Date(date) : new Date()
    })
    let doc = await newExercise.save();
    doc && res.json({
      username: user.username,
      description: doc.description,
      duration: doc.duration,
      date: new Date(date).toDateString(),
      _id: doc.user_id
    });
  } catch (err)
  {
    console.log(err);
  }
})


app.get("/api/users/:_id/logs", async (req, res) => {
  
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await collection.findById(id);
  if(!user){
    res.send("Could not find user")
    return;
  }
  let dateObj = {}
  if (from) {
    dateObj["$gte"] = new Date(from)
  }
  if (to){
    dateObj["$lte"] = new Date(to)
  }
  let filter = {
    user_id: id
  }
  if(from || to){
    filter.date = dateObj;
  }

  const exercises = await Exercise.find(filter).limit(new Number(limit) ?? 500)

  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: new Date(e.date).toDateString(),
  }))
  
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log,
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
