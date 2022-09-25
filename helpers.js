function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
};

//return user obj with matching email
function getUserByEmail(email, database) {
  return Object.values(database).find(user => user.email === email);
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

module.exports = { generateRandomString, getUserByEmail, urlsForUser };
