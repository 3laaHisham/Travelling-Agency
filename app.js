const express = require('express');
const path = require('path');
const { readFileSync } = require('fs');
const { title } = require('process');
const MongoClient = require('mongodb').MongoClient;
const session = require('express-session');
const { Console } = require('console');

const homePage = readFileSync(path.resolve(__dirname, './views/home.ejs'));
const dataBaseURL = "mongodb://0.0.0.0:27017";
const dataBaseName = 'TravellingWebsite';
const usersCollectionName = 'UsersDB';
const port = 3000;
const distinations = [
  "Paris",
  "Rome",
  "Bali Island",
  "Santorini Island",
  "Inca Trail to Machu Picchu",
  "Annapurna Circuit"
];
const app = express();
const isLogged = (req, res, next) => {
  if (req.session && req.session.username) {
    next()
  } else {
    res.redirect('/login');
  }
}
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

/* 
Notes:

--- userID is a Global variable for UsersIDs then it's incremented by 1

--- req.session.message is a placeholder for messages displayed in different ejs files

*/


// adds a new user to the database if it is not already there
const addNewUser = (req, res, next) => {
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
          users.insertOne({ username, password, wanToGoList: [] });
          next();
        }
      } else {
        req.session.message = 'Invalid Credentials';
        res.redirect('/registration');
      }
    } catch (err) {
      console.log(err);
    }
  });
}

// displays the want to go list 

const get_myDis_list = (req, res) => {
  const username = req.session.username;
  MongoClient.connect(dataBaseURL, async (err, client) => {
  if (err) throw err;
  try {
    let protocol = req.protocol ? req.protocol : 'http';
    let hostname = req.hostname;
    const users = client.db(dataBaseName).collection(usersCollectionName);
    let user = (await users.find({ username }).toArray());
    var mylist =  user[0].wanToGoList;
    let result_list = [];
    for (let i = 0; i < mylist.length; i++) {
      let word = mylist[i].split(" ")[0].toLowerCase().trim();
      let link = `${protocol}://${hostname}:${port}/${word}`
      result_list.push({ link: link, name: mylist[i] });
    }
    console.log(mylist);
    res.render('wanttogo', {list : result_list});
  } catch (err) {
    console.log(err);
  }
})
}


// validates the username and password and adds the user id to the session.
const validateUser = (req, res, next) => {
  const { username, password } = req.body;
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
    }
  })
}


// The Search
const search = (req, res, next) => {
  let protocol = req.protocol ? req.protocol : 'http';
  let hostname = req.hostname;

  const searchTerm = req.body.Search;
  let searchResults = [];
  req.searchResults = [];
  for (let i = 0; searchTerm !== null && typeof searchTerm !== "undefined" && searchTerm !== '' && i < distinations.length; i++) {
    let currValue = distinations[i].toLowerCase().trim();
    if (currValue.includes(searchTerm)) {
      let word = distinations[i].split(" ")[0].toLowerCase().trim();
      let link = `${protocol}://${hostname}:${port}/${word}`
      searchResults.push({ link: link, name: distinations[i] });
    }
  }
  req.searchResults = searchResults;
  next();

}
app.get('/search', (req, res) => {
  const list = req.session.searchResults
  res.render('searchresults', { list });
});
app.post('/search', search, (req, res) => {
  const list = req.searchResults;
  const searchTerm = req.body.Search;
  res.render('searchresults', { list, searchTerm: searchTerm });
})


// handling get requests

app.get('/', (req, res) => {
  res.render('login', { message: "" })
});
app.get('/hiking', isLogged,(req, res) => {
  res.render('hiking')
});
app.get('/cities', isLogged,(req, res) => {
  res.render('cities')
});
app.get('/islands', isLogged,(req, res) => {
  res.render('islands')
});

app.get('/wanttogo', (req, res) => {
  get_myDis_list(req, res);
});


app.get('/login',(req, res) => handleGetMessage(req, res, 'login'));
app.get('/rome', isLogged,(req, res) => handleGetMessage(req, res, 'rome'));
app.get('/santorini', isLogged,(req, res) => handleGetMessage(req, res, 'santorini'));
app.get('/bali', isLogged,(req, res) => handleGetMessage(req, res, 'bali'));
app.get('/paris', isLogged,(req, res) => handleGetMessage(req, res, 'paris'));
app.get('/annapurna', isLogged,(req, res) => handleGetMessage(req, res, 'annapurna'));
app.get('/inca', isLogged,(req, res) => handleGetMessage(req, res, 'inca'));
app.get('/registration',(req, res) => handleGetMessage(req, res, 'registration'));

app.get('/home', isLogged,(req, res) => {
  console.log('hello');
  res.render('home')
});


// handling post requests
app.post('/', validateUser, (req, res) => {
  res.redirect('/home')

});

app.post('/login', validateUser, (req, res) => {

  res.redirect('/home')

});

app.post('/register', addNewUser, (req, res) => {
  req.session.message = 'registration completed successfully'
  res.redirect('/login')
});

app.post('/rome', (req, res) => addToWanToGO(req, res, 'Rome', 'rome'));
app.post('/paris', (req, res) => addToWanToGO(req, res, 'Paris', 'paris'));

app.post('/inca', (req, res) => addToWanToGO(req, res, 'Inca', 'inca'));
app.post('/annapurna', (req, res) => addToWanToGO(req, res, 'Annapurna', 'annapurna'));

app.post('/bali', (req, res) => addToWanToGO(req, res, 'Bali', 'bali'));
app.post('/santorini', (req, res) => addToWanToGO(req, res, 'Santorini', 'santorini'));


function addToWanToGO(req, res, Destination, url) {
  MongoClient.connect(dataBaseURL, async (err, client) => {
    if (err) throw err;
    try {
      const users = client.db(dataBaseName).collection(usersCollectionName);
      req.session.message = 'Added Successfully'
      if (await users.find({
        username: req.session.username,
        wanToGoList: { $in: [Destination] },
      })
        .count() > 0)
        req.session.message = 'You can not add the same destination twice'
      users.updateOne({ username: req.session.username }, { $addToSet: { wanToGoList: Destination } })
      handleGetMessage(req, res, url)
    } catch (err) {
      console.log(err);
    }
  })
}

function handleGetMessage(req, res, url) {
  let message = req.session.message;
  req.session.message = "";
  res.render(url, { message: message })
}

app.listen(port);


