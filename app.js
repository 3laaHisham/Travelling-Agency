const express = require('express');
const path = require('path');
const { readFileSync } = require('fs');
const { title } = require('process');
const MongoClient = require('mongodb').MongoClient;
const session = require('express-session')

const homePage = readFileSync(path.resolve(__dirname, './views/home.ejs'));
const dataBaseURL = "mongodb://0.0.0.0:27017";
const dataBaseName = 'TravellingWebsite';
const usersCollectionName = 'UsersDB';
const app = express();
const pr = console.log;
const port = 3000;
const distinations = [
  "Paris",
  "Rome",
  "Bali Island",
  "Santorini Island",
  "Inca Trail to Machu Picchu",
  "Annapurna Circuit"
];
const links = [
  "http://localhost:3000/home"
]
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

--- req.session.userID represents the id of the user

*/

var userID = Math.floor(Math.random() * (1e7));

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
          users.insertOne({ id: userID, username, password, wanToGoList: [] });
          next();
        }
      } else {
        req.session.message = 'Invalid Credentials';
        res.redirect('registration');
      }
    } catch (err) {
      console.log(err);
    }
  });
}

// validates the username and password and adds the user id to the session.
const validateUser = (req, res, next) => {
  const { username, password } = req.body;
  MongoClient.connect(dataBaseURL, async (err, client) => {
    if (err) throw err;
    try {
      const users = client.db(dataBaseName).collection(usersCollectionName);
      let user = (await users.find({ username, password }).toArray());
      console.log(user.wanToGoList);
      if (username && password && user.length !== 0) {
        req.session.userID = user[0].id;
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

// not complete yet!
const addNewDestination = (req, res, next) => {
  MongoClient.connect("mongodb://0.0.0.0:27017", async (err, client) => {
    if (err) throw err;
    try {
      const users = client.db('TravellingWebsite').collection('UsersDB');
      let user = (await users.find({ id: req.session.userID }).toArray());

      // here...
      let Destination = '?... Whatever'

      user[0].wanToGoList.push(Destination);
      users.updateOne({ id: req.session.userID }, { $set: { wanToGoList: user[0].wanToGoList } })
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
app.get('/hiking', (req, res) => {
  res.render('hiking')
});
app.get('/cities', (req, res) => {
  res.render('cities')
});
app.get('/islands', (req, res) => {
  res.render('islands')
});
app.get('/login', (req, res) => {
  let message = req.session.message;
  req.session.message = "";
  res.render('login', { message })
});
app.get('/wanttogo', (req, res) => {
  res.render('wanttogo')
});
app.get('/rome', (req, res) => {
  res.render('rome')
});
app.get('/santorini', (req, res) => {
  res.render('santorini')
});
app.get('/bali', (req, res) => {
  res.render('bali')
});
app.get('/paris', (req, res) => {
  res.render('paris')
});
app.get('/annapurna', (req, res) => {
  res.render('annapurna')
});
app.get('/inca', (req, res) => {
  res.render('inca')
});

app.get('/home', (req, res) => {
  res.render('home')
});
app.get('/registration', (req, res) => {
  let message = req.session.message;
  req.session.message = "";
  res.render('registration', { message })
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
app.listen(port);




