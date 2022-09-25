// -------------------- DEPENDENCIES -------------------- //

const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");
const PORT = 8080;

// -------------------- MIDDLEWARE -------------------- //

//Tells express to use EJS as its templating engine
app.set("view engine", "ejs");
//Body-parser library which converts the request body from a Buffer into string that we can read
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// -------------------- FEED DATA -------------------- //

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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
    urls: urlsForUser(urlDatabase, userid),
    user
  };

  if (!userid) { //not sure if this is correct
    return res.send("Please log in or register to create tinyURL.");
  } else {
    res.render("urls_index", templateVars); //res.render takes name of template and an obj, so we can use the key of that obj (urls) to access the data within our template
  };

});

// get route to show user the form to submit new URLs to be shortened
app.get("/urls/new", (req, res) => {
  const userid = req.cookies["user_id"];
  const user = users[userid];
  const templateVars = { user };
  
  if (!templateVars.user) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  };

});

//Use the id from the route parameter to lookup it's associated longURL from the urlDatabase
app.get("/urls/:id", (req, res) => { //: infront of the id indicates that id the route parameter
  const userid = req.cookies["user_id"];
  const user = users[userid];
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user
  };

  if (!userid) {
    res.send("Please log in to see your tinyURL!");
  } else if (userid !== urlDatabase[req.params.id].userID) {
    res.send("You are not authorized to access this tinyURL.")
  } else {
    res.render("urls_show", templateVars);
  };

});

//requests to the endpoint "/u/:id" will redirect to its longURL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  
  if (!urlDatabase[id]) {
    return res.status(404).send("This tiny URL does not exist.");
  } 

  res.redirect(longURL);

});

//get route to show user registration form
app.get("/register", (req, res) => {
  const userid = req.cookies["user_id"];
  const user = users[userid];
  const templateVars = { user };

  if (templateVars.user) {
    res.redirect("/urls");
  } else {
    res.render("urls_registration", templateVars);
  };
  
});

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

  if (!req.cookies["user_id"]) { //not sure if this is correct
    res.send("Please log in to create new URL.");
  } else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL; //post req has a body, data in the input field is avaialble in the req.body.longURL variable (can store in the urlDatabase obj)
    const userID = req.cookies["user_id"];
    urlDatabase[shortURL] = { 
      longURL: longURL,
      userID: userID
    }; //save longURL and userID keys to our urlDatabase
    res.redirect(`/urls/${shortURL}`); //redirect the user to a new page that shows the short url. Browser makes a GET request to /urls/:id (urls_show)
  };

});

//post route that removes a URL resource
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userid = req.cookies["user_id"];
  
  if (!urlDatabase[id]) {
    res.send("This tiny URL does not exist.");
  } else if (!userid) {
    res.send("Please log in to delete your tinyURL!");
  } else if (userid !== urlDatabase[req.params.id].userID) {
    res.send("You are not authorized to delete this tinyURL.");
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
  const userid = req.cookies["user_id"];

  if (!userid) {
    res.send("Please log in to see your tinyURL!");
  } else if (!urlDatabase[id]) {
    res.send("This tiny URL does not exist.");
  } else if (userid !== urlDatabase[req.params.id].userID) {
    res.send("You are not authorized to access this tinyURL.");
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
  const hashedPassword = bcrypt.hashSync(password, 10); //converts the plain-text password to an unintelligible string with a salt

  if (!email || !password) {
    return res.status(400).send("The email or password cannot be blank. Please try again.");
  } else if (getUserByEmail(email, users)){
      return res.status(400).send("The email has already been registered.");
  } else {
    const uniqueID = generateRandomString();
    users[uniqueID] = {
      id: uniqueID,
      email: req.body.email,
      password: hashedPassword
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

//return the URLs where the userID is equal to the id of the currently logged in user
function urlsForUser(urlDatabase, userID) {
  const filteredURLS = {};
  for (let shortURL in urlDatabase) {
    if (userID === urlDatabase[shortURL].userID) {
      filteredURLS[shortURL] = urlDatabase[shortURL];
    }
  };
  return filteredURLS;
};
