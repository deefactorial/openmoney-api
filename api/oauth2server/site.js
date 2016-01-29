/**
 * Module dependencies.
 */
var passport = require('passport')
  , login = require('connect-ensure-login')


exports.index = function(req, res) {
  res.send('OAuth 2.0 Server');
};

exports.loginForm = function(req, res) {
  res.render('login');
};

exports.login = function(req, res, next) {
  // generate the authenticate method and pass the req/res
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/V2/stewards/'+ req.swagger.params.stewardname.value + '/login'); }

    // req / res held in closure
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      //return res.send(user);
      return res.redirect('/V2/stewards/' + req.swagger.params.stewardname.value + '/account');
    });

  })(req, res, next);
  //passport.authenticate('local', { successReturnToOrRedirect: '/V2/stewards/' + req.swagger.params.stewardname.value + '/account', failureRedirect: '/V2/stewards/'+ req.swagger.params.stewardname.value + '/login' });
};
//exports.login = passport.authenticate('local', { successReturnToOrRedirect: '/V2/stewards/{stewardname}/account', failureRedirect: '/V2/stewards/{stewardname}/login' });

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

exports.account = [
  login.ensureLoggedIn(),
  function(req, res) {
    res.render('account', { user: req.user });
  }
];
