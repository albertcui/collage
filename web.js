const Picasa = require('picasa');
const express = require('express');
const session = require('cookie-session');

const picasa = new Picasa()
const app = express();

const sessOptions = {
  domain: process.env.COOKIE_DOMAIN,
  maxAge: 52 * 7 * 24 * 60 * 60 * 1000,
  secret: 'this is a secret',
};

app.use(session(sessOptions));

const config = {
  clientId     : process.env.CLIENT_ID,
  redirectURI  : 'http://dev.albertcui.com:8999/oauth2callback',
  clientSecret : process.env.CLIENT_SECRET
}

const authURL = picasa.getAuthURL(config);

app.route("/")
.get((req, res) => {
  res.send("<html><body>yo</body></html>").end();
})

app.route("/login")
.get((req, res) => {
  res.redirect(authURL);
})

app.route("/oauth2callback")
.get((req, res) => {
  if (req.query.code) {
      picasa.getAccessToken(config, req.query.code, (err, accessToken) => {
        if (accessToken) {
            req.session.token = accessToken;
            console.log("got token");
            return res.redirect("/photos");
        } else {
          console.log(err);
          console.log("no access token");
        }
      })
  } else {
    res.redirect(authURL);
  }
})

app.route("/photos")
.get((req, res, next) => {
  console.log("logged in");
  if (req.session.token) {
    picasa.getPhotos(req.session.token, {maxResults : 10}, (err, photos) => {
      if (err) {
        return next(err);
      }
      res.send(photos.reduce((a, i) => {
        return a + "<img src=" + i.content.src + ">";
      }, "")).end();
    }) 
  } else {
    return next("no session");
  }
})


// Error handler
app.use((err, res, req, next) => {
  req.send(err).end();
})
app.listen(8999);