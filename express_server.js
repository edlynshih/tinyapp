// -------------------- DEPENDENCIES -------------------- //

const express = require("express");
const app = express();
const cookieParser = require('cookie-parser')
const PORT = 8080;

// -------------------- MIDDLEWARE -------------------- //

//Tells express to use EJS as its templating engine
app.set("view engine", "ejs");
//Body-parser library which converts the request body from a Buffer into string that we can read
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// -------------------- FEED DATA -------------------- //

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// -------------------- ROUTES -------------------- //

// route handler for "/urls" and use res.render() to pass the URL data to our template
app.get("/urls", (req, res) => {
  const userid = req.cookies["user_id"];
  const user = users[userid];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_index", templateVars); //res.render takes name of template and an obj, so we can use the key of that obj (urls) to access the data within our template
});

// get route to show user the form to submit new URLs to be shortened
app.get("/urls/new", (req, res) => {
  const userid = req.cookies["user_id"];
  const user = users[userid];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

//Use the id from the route parameter to lookup it's associated longURL from the urlDatabase
app.get("/urls/:id", (req, res) => { //: infront of the id indicates that id the route parameter
  const userid = req.cookies["user_id"];
  const user = users[userid];
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user
  };
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
  const userid = req.cookies["user_id"];
  const user = users[userid];
  const templateVars = { user };
  res.render("urls_registration", templateVars);
})

//get route to show user login form
app.get("/login", (req, res) => {
  const userid = req.cookies["user_id"];
  const user = users[userid];
  const templateVars = { user };
  if (templateVars.user) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  };
});

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
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(403).send("The email cannot be found.");
  } else if (user.password !== password) {
    return res.status(403).send("Incorrect credentials. Try again.");
  } else {
    res.cookie("user_id", user.id)
    res.redirect("/urls");
  };
});

//post route to handle logout and clear cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//post route to handle registration form data
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("The email or password cannot be blank. Please try again.");
  } else if (getUserByEmail(email, users)){
      return res.status(400).send("The email has already been registered.");
  } else {
    const uniqueID = generateRandomString();
    users[uniqueID] = {
      id: uniqueID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie("user_id", users[uniqueID].id);
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// -------------------- HELPER FUNCTIONS -------------------- //

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
};

//return user obj with matching email
function getUserByEmail(email, users) {
  return Object.values(users).find(user => user.email === email);
};
