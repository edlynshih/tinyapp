// -------------------- DEPENDENCIES -------------------- //

const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { generateRandomString, getUserByEmail, urlsForUser } = require('./helpers');
const PORT = 8080;

// -------------------- MIDDLEWARE -------------------- //

//Tells express to use EJS as its templating engine
app.set("view engine", "ejs");
//Body-parser library which converts the request body from a Buffer into string that we can read
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
})
);

// -------------------- DATABASES -------------------- //

const urlDatabase = {};
const users = {};

// -------------------- ROUTES -------------------- //

// homepage
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  };
});

// route handler for "/urls" and use res.render() to pass the URL data to our template
app.get("/urls", (req, res) => {
  const userid = req.session.user_id;
  const user = users[userid];
  const templateVars = {
    urls: urlsForUser(urlDatabase, userid),
    user
  };

  if (!userid) {
    res.status(401).send("Please log in or register to create shortened URLs.");
  } else {
    res.render("urls_index", templateVars); //res.render takes name of template and an obj, so we can use the key of that obj (urls) to access the data within our template
  };

});

// get route to show user the form to submit new URLs to be shortened
app.get("/urls/new", (req, res) => {
  const userid = req.session.user_id;
  const user = users[userid];
  const templateVars = { user };
  
  if (!userid) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  };

});

//Use the id from the route parameter to lookup it's associated longURL from the urlDatabase
app.get("/urls/:id", (req, res) => { //: infront of the id indicates that id the route parameter
  const userid = req.session.user_id;
  const user = users[userid];

  if (!urlDatabase[req.params.id]) {
    res.status(404).send("This tiny URL does not exist.");
  } else if (!userid) {
    res.status(401).send("Please log in to see your tiny URLs.");
  } else if (userid !== urlDatabase[req.params.id].userID) {
    res.status(403).send("You are not authorized to access this tinyURL.");
  } 
  
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user
  };
  res.render("urls_show", templateVars);

});

//requests to the endpoint "/u/:id" will redirect to its longURL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;

  if (!urlDatabase[id]) {
    res.status(404).send("This tiny URL does not exist.");
  } else {
    res.redirect(urlDatabase[id].longURL);
  };

});

//get route to show user registration form
app.get("/register", (req, res) => {
  const userid = req.session.user_id;
  const user = users[userid];
  const templateVars = { user };

  if (userid) {
    res.redirect("/urls");
  } else {
    res.render("urls_registration", templateVars);
  };
  
});

//get route to show user login form
app.get("/login", (req, res) => {
  const userid = req.session.user_id;
  const user = users[userid];
  const templateVars = { user };

  if (userid) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  };

});

//post route to handle the form submission
app.post("/urls", (req, res) => {
  const userid = req.session.user_id;

  if (!userid) {
    res.status(401).send("Please log in to create new URL.");
  } else {
    const id = generateRandomString();
    const longURL = req.body.longURL; //post req has a body, data in the input field is avaialble in the req.body
    const userID = req.session.user_id;
    urlDatabase[id] = { 
      longURL: longURL,
      userID: userID
    }; //save longURL and userID keys to our urlDatabase
    res.redirect(`/urls/${id}`); //redirect the user to a new page that shows the short url. Browser makes a GET request to /urls/:id (urls_show)
  };

});

//post route that removes a URL resource
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userid = req.session.user_id;
  
  if (!urlDatabase[id]) {
    res.status(404).send("This tiny URL does not exist.");
  } else if (!userid) {
    res.status(401).send("Please log in to delete your tinyURL!");
  } else if (userid !== urlDatabase[req.params.id].userID) {
    res.status(403).send("You are not authorized to delete this tinyURL.");
  } else {
    delete urlDatabase[id];
    res.redirect("/urls");
  };

});

//post route to update the value of the stored long URL based on the new value in req.body
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id].longURL = longURL;
  const userid = req.session.user_id;

  if (!userid) {
    return res.status(401).send("Please log in to see your tinyURLs.");
  } else if (!urlDatabase[id]) {
    return res.status(404).send("This tiny URL does not exist.");
  } else if (userid !== urlDatabase[req.params.id].userID) {
    return res.status(403).send("You are not authorized to access this tinyURL.");
  } else {
    res.redirect("/urls");
  };
  
});

//post route to handle login and set a cookie
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(403).send("The email cannot be found.");
  } else if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Incorrect credentials. Try again.");
  } else if (!email || !password) {
    return res.status(400).send("The email or password cannot be blank. Please try again.");
  } else {
    req.session.user_id = user.id;
    res.redirect("/urls");
  };

});

//post route to handle logout and clear cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//post route to handle registration form data
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10); //converts the plain-text password to an unintelligible string with a salt

  if (!email || !password) {
    res.status(400).send("The email or password cannot be blank. Please try again.");
  } else if (getUserByEmail(email, users)){
    res.status(400).send("The email has already been registered.");
  } else {
    const uniqueID = generateRandomString();
    users[uniqueID] = {
      id: uniqueID,
      email: req.body.email,
      password: hashedPassword
    };
    req.session.user_id = uniqueID;
    res.redirect("/urls");
  };

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
