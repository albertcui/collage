const Picasa = require('picasa');
const express = require('express');
const session = require('cookie-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const picasa = new Picasa()
const app = express();

app.use('/', express.static('public'))

// Set CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
})

/***** Passport/Auth Boilerplate *****/
const sessOptions = {
  domain: process.env.COOKIE_DOMAIN,
  maxAge: 52 * 7 * 24 * 60 * 60 * 1000,
  secret: 'this is a secret',
};

app.use(session(sessOptions));

/***** Passport/Auth Boilerplate *****/
app.use(passport.initialize());
app.use(passport.session());
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://dev.albertcui.com:8999/oauth2callback"
  },
  (accessToken, refreshToken, profile, cb) => {
    cb(null, {
      name: profile.displayName,
      photos: profile.photos,
      accessToken: accessToken,
      refreshToken: refreshToken
    });
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return cb(err, user);
    // });
  }
));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

app.route("/login")
.get(passport.authenticate('google', { scope: ['profile https://picasaweb.google.com/data/'] }))

app.route("/oauth2callback")
.get(passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
  // Successful authentication, redirect home.
  res.redirect('/photos');
});

app.route("/photos")
.get((req, res, next) => {
  console.log("logged in");
  if (req.user.accessToken) {
    picasa.getPhotos(req.user.accessToken, {maxResults : 10}, (err, photos) => {
      if (err) {
        return next(err);
      }
      res.json(photos).end();
      // res.send(photos.reduce((a, i) => {
      //   return a + "<img src=" + i.content.src + ">";
      // }, "")).end();
    }) 
  } else {
    return next("no session");
  }
})


// Error handler
app.use((err, res, req, next) => {
  if (err.statusCode === 403) {
    // TODO: Refactor Picasa library to request token?
    console.log("need to update token?");
    
  }
  req.send(err).end();
})
app.listen(8999);