var express = require('express');
var path = require('path');
const { title } = require('process');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware functions
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// handling get requests

app.get('/',(req,res)=>{
  res.render('login')
});
app.get('/hiking',(req,res)=>{
  res.render('hiking')
});
app.get('/cities',(req,res)=>{
  res.render('cities')
});
app.get('/islands',(req,res)=>{
  res.render('islands')
});
app.get('/wanttogo',(req,res)=>{
  res.render('wanttogo')
});
app.get('/rome',(req,res)=>{
  res.render('rome')
});
app.get('/santorini',(req,res)=>{
  res.render('santorini')
});
app.get('/bali',(req,res)=>{
  res.render('bali')
});
app.get('/paris',(req,res)=>{
  res.render('paris')
});
app.get('/annapurna',(req,res)=>{
  res.render('annapurna')
});
app.get('/inca',(req,res)=>{
  res.render('inca')
});
app.get('/home',(req,res)=>{
  res.render('home')
});
app.get('/registration',(req,res)=>{
  res.render('registration')
});
app.get('/search',(req,res)=>{
  res.render('searchresults')
});
app.get('register',(req,res)=>{
  res.render('login')
})


// handling post requests
app.post('/',(req,res)=>{
  var loginName = req.body.username;
  res.render('home',{name:loginName});
});

app.listen(3000);


