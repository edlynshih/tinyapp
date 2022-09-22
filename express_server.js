const express = require("express");
const app = express();
const PORT = 8080; 

//Tells express to use EJS as its templating engine
app.set("view engine", "ejs");

var cookieParser = require('cookie-parser')

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Body-parser library which converts the request body from a Buffer into string that we can read
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//when user navigate to home page
app.get("/", (req, res) => {
  res.send("Hello!");
});

// //user will see JSON string representing the entire urlDatabase object
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

//user will see HTLM code in the client browser
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// route handler for "/urls" and use res.render() to pass the URL data to our template
app.get("/urls", (req, res) => {
  // let username = null;
  // if (req.cookies["username"]) {
  //   username = req.cookies['username']
  // }
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars); //res.render takes name of template and an obj, so we can use the key of that obj (urls) to access the data within our template
});

// get route to show user the form to submit URLs to be shortened
app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

//Use the id from the route parameter to lookup it's associated longURL from the urlDatabase
app.get("/urls/:id", (req, res) => { //: infront of the id indicates that id the route parameter
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

//requests to the endpoint "/u/:id" will redirect to its longURL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

//get route to show user registration form
app.get("/register", (req, res) => {
  res.render("urls_registration");
})

//post route to handle the form submission
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL; //post req has a body, data in the input field is avaialble in the req.body.longURL variable (can store in the urlDatabase obj)
  urlDatabase[shortURL] = longURL; //save longURL and shortURL id to our urlDatabase
  res.redirect(`/urls/${shortURL}`); //redirect the user to a new page that shows the short url. Browser makes a GET request to /urls/:id (urls_show)
});

//post route that removes a URL resource
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

//post route to update the value of the stored long URL based on the new value in req.body
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect("/urls");
});

//post route to handle login and set a cookie
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

//post route to handle logout and clear cookie
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  return Math.random().toString(36).substring(2, 7);
};