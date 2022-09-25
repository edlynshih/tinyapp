const { assert } = require('chai');

const { getUserByEmail, generateRandomString, urlsForUser } = require('../helpers.js');

// -------------------- Feed Data -------------------- //

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testUrlDatabase = {
  "1x3v5b": { longURL: "http://www.twitter.com", userID: "userRandomID" },
  "0b5n22": { longURL: "http://www.facebook.com", userID: "user2RandomID" },
  "12m56b": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

// -------------------- Test getUserByEmail -------------------- //

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it('should return undefined with an invalid email', function() {
    const user = getUserByEmail("u@example.com", testUsers);
    assert.isUndefined(user);
  });
});

// -------------------- Test generateRandomString -------------------- //

describe('generateRandomString', () => {
  it('should return length of 6', function() {
    const randomString = generateRandomString();
    const expectedOutput = 6;
    assert.strictEqual(randomString.length, expectedOutput);
  });
});

// -------------------- Test urlsForUser -------------------- //

describe("urlsForUser", () => {
  it("return the URLs where the userID is equal to the id of the user", function() {
    const urls = urlsForUser(testUrlDatabase, "user2RandomID");
    const expectedOutput = { 
      "0b5n22": { longURL: "http://www.facebook.com", userID: "user2RandomID" },
      "12m56b": { longURL: "http://www.google.com", userID: "user2RandomID" } 
    };
    assert.deepEqual(urls, expectedOutput);
  });

  it("should return an empty object when an id is undefined", function() {
    const urls = urlsForUser(testUrlDatabase, "1234");
    const expectedOutput = {};
    assert.deepEqual(urls, expectedOutput);
  });
});
