const tough = require('tough-cookie');
const rp = require('request-promise-native');
let cookie_dpass = new tough.Cookie({
  key: "dpass",
  value: "",
  domain: '.rda.ucar.edu',
  httpOnly: false,
  maxAge: 3153600000,
});
let cookie_duser = new tough.Cookie({
  key: "duser",
  value: "yourEmail@gmail.com",
  domain: '.rda.ucar.edu',
  httpOnly: false,
  maxAge: 3153600000,
});
let cookie_ruser = new tough.Cookie({
  key: "ruser",
  value: "yourEmail@gmail.com",
  domain: '.rda.ucar.edu',
  httpOnly: false,
  maxAge: 3153600000,
});

// Put cookie in an jar which can be used across multiple requests
let cookiejar = rp.jar();
cookiejar.setCookie(cookie_dpass.toString(), 'https://rda.ucar.edu');
cookiejar.setCookie(cookie_duser.toString(), 'https://rda.ucar.edu');
cookiejar.setCookie(cookie_ruser.toString(), 'https://rda.ucar.edu');

module.exports = {
  cookiejar,
};