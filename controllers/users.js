const User = require("../models/user.js");

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs"); // Changed from sg.ejs to signup.ejs
};

module.exports.signup = async (req, res, next) => {
  // Added 'next' parameter
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash(
        "success",
        "Welcome to Infora! Your account has been created successfully."
      );
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs"); // Changed from sg.ejs to login.ejs
};

module.exports.login = async (req, res) => {
  req.flash("success", `Welcome back, ${req.user.username}!`); // More personalized message
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  // Added 'next' parameter
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You have been logged out successfully!");
    res.redirect("/listings");
  });
};
