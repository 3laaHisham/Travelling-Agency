const express = require('express');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const session = require('express-session');

const dataBaseURL = "mongodb://0.0.0.0:27017";
const dataBaseName = 'myDB';
const usersCollectionName = 'myCollection';
const port = process.env.port || 3000;
const distinations = [
  "Paris",
  "Rome",
  "Bali Island",
  "Santorini Island",
  "Inca Trail to Machu Picchu",
  "Annapurna Circuit"
];
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Helper functions

// Middleware functions
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'superSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: true,
    secure: false
  }
}))

// handling get requests

app.get('/', isLogged, (req, res) => {
  res.redirect('/home');
});
app.get('/hiking', isLogged,(req, res) => {
  res.render('hiking')
});
app.get('/home', isLogged,(req, res) => {
  res.render('home')
});
app.get('/search', isLogged, (req, res) => {
  res.redirect('home');
});
app.get('/cities', isLogged,(req, res) => {
  res.render('cities')
});
app.get('/islands', isLogged,(req, res) => {
  res.render('islands')
});
app.get('/wanttogo', isLogged, renderWantToGo);

app.get('/login',(req, res) => {console.log("get login"); handleGetMessage(req, res, 'login'); });
app.get('/rome', isLogged,(req, res) => handleGetMessage(req, res, 'rome'));
app.get('/santorini', isLogged,(req, res) => handleGetMessage(req, res, 'santorini'));
app.get('/bali', isLogged,(req, res) => handleGetMessage(req, res, 'bali'));
app.get('/paris', isLogged,(req, res) => handleGetMessage(req, res, 'paris'));
app.get('/annapurna', isLogged,(req, res) => handleGetMessage(req, res, 'annapurna'));
app.get('/inca', isLogged,(req, res) => handleGetMessage(req, res, 'inca'));
app.get('/registration',(req, res) => handleGetMessage(req, res, 'registration'));


// handling post requests
app.post('/', validateUser, (req, res) => {
  res.redirect('/home')
});
app.post('/login', validateUser, (req, res) => {
  res.redirect('/home')
});
app.post('/register', addNewUser, (req, res) => {
  console.log('post reg 1');
  req.session.message = 'registration completed successfully'
  console.log('post reg 2');
  res.redirect('/login');
  console.log('post reg 3');
});
app.post('/search', search)


app.post('/rome', (req, res) => addToWanToGO(req, res, 'Rome'));
app.post('/paris', (req, res) => addToWanToGO(req, res, 'Paris'));
app.post('/inca', (req, res) => addToWanToGO(req, res, 'Inca'));
app.post('/annapurna', (req, res) => addToWanToGO(req, res, 'Annapurna'));
app.post('/bali', (req, res) => addToWanToGO(req, res, 'Bali'));
app.post('/santorini', (req, res) => addToWanToGO(req, res, 'Santorini'));


function isLogged(req, res, next) {
  if (req.session && req.session.username)
    next()
  else 
    res.redirect('/login');
}

function handleGetMessage(req, res, url) {
  console.log("1 handle get" + url);
  let message = req.session.message;
  req.session.message = "";
  res.render(url, { message })
  console.log("2 handle get" + url);
}

function addToWanToGO(req, res, Destination) {
  let url = Destination.toLowerCase();
  MongoClient.connect(dataBaseURL, async (err, client) => {
    if (err) throw err;
    
    try {
      const users = client.db(dataBaseName).collection(usersCollectionName);
      req.session.message = 'Added Successfully'
      
      if (await users.find({
        username: req.session.username,
        wanToGoList: { $in: [Destination] },
      }).count() > 0)
        req.session.message = 'You can not add the same destination twice'

      await users.updateOne({ username: req.session.username }, { $addToSet: { wanToGoList: Destination } })
      handleGetMessage(req, res, url);
    } catch (err) {
      console.log(err);
    } finally {
      client.close();
    }
  })
}

/* 
Notes:

--- userID is a Global variable for UsersIDs then it's incremented by 1

--- req.session.message is a placeholder for messages displayed in different ejs files

*/


// adds a new user to the database if it is not already there
function addNewUser(req, res, next) {
  console.log('addnewUser');

  const { username, password } = req.body;
  MongoClient.connect(dataBaseURL, async (err, client) => {
    if (err) throw err;
    
    try {
      const users = client.db(dataBaseName).collection(usersCollectionName);
      if (username && password) {
        if ((await users.find({ username }).toArray()).length !== 0) {
          req.session.message = 'username is already token';
          res.redirect('/registration');
        } else {
          await users.insertOne({ username, password, wanToGoList: [] });
          next();
        }
      } else {
        req.session.message = 'Invalid Credentials';
        res.redirect('/registration');
      }
    } catch (err) {
      console.log(err);
    } finally {
      client.close();
    }
  });
}

// displays the want to go list 

function renderWantToGo (req, res) {
  const username = req.session.username;
  MongoClient.connect(dataBaseURL, async (err, client) => {
  if (err) throw err;

  try {
    const users = client.db(dataBaseName).collection(usersCollectionName);
    let user = (await users.find({ username }).toArray());

    var mylist =  user[0].wanToGoList;
    let result_list = [];
    mylist.forEach(item => {
      let word = item.split(" ")[0].toLowerCase().trim();
      let link = `/${word}`
      result_list.push({ link: link, name: item });
    });

    res.render('wanttogo', {list : result_list});
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
  }
})
}


// validates the username and password and adds the user id to the session.
function validateUser (req, res, next) {
  const { username, password } = req.body;
  if (username == 'admin' && password == 'admin')
    req.session.username = 'admin';
    next();

  MongoClient.connect(dataBaseURL, async (err, client) => {
    if (err) throw err;

    try {
      const users = client.db(dataBaseName).collection(usersCollectionName);
      let user = (await users.find({ username, password }).toArray());
      if (username && password && user.length !== 0) {
        req.session.username = user[0].username;
        next();
      } else {
        req.session.message = 'invalid username or password';
        return res.redirect('/login');
      }
    } catch (err) {
      console.log(err);
    } finally {
      client.close();
    }
  })
}

function search (req, res) {

  const searchTerm = req.body.Search;
  let searchResults = [];

  if (searchTerm !== null && typeof searchTerm !== "undefined" && searchTerm !== '')
    distinations.forEach(destination => {
      let currValue = destination.toLowerCase();
      if (currValue.includes(searchTerm)) {
        let word = destination.split(" ")[0].toLowerCase().trim();
        let link = `/${word}`
        searchResults.push({ link, name: destination });
      }
    });
  res.render('searchresults', { list: searchResults, searchTerm });
}



app.listen(port);


