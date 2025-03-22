import express from "express";
import passport from "passport";
import { body, validationResult } from "express-validator";

import User from "./models/user.mjs"; 
const router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash("info", "You must be logged in to see this page.");
    res.redirect("/login");
  }
}

router.use(function (req, res, next) {
  console.log(req.user);
  res.locals.currentUser = req.user;
  res.locals.errors = req.flash("error");
  res.locals.infos = req.flash("info");
  next();
});

router.get("/", function (req, res, next) {
  User.find()
    .sort({ createdAt: "descending" })
    .exec()
    .then((users) => {
      res.render("index", { users: users });
    })
    .catch((err) => {
      next(err);
    });
});

router.get("/login", function (req, res, next) {
  try {
    res.render("login", { csrfToken: req.csrfToken() });
  } catch (err) {
    next(err); // Passa l'errore al middleware di gestione errori
  }
});

// chiamata da login.ejs
router.post(
  "/login",
  [
    body("_csrf").trim().escape(), // Protegge il login da CSRF
  ],
  passport.authenticate("login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err); // Passa l'errore al middleware di gestione errori
    }
    res.redirect("/");
  });
});

router.get("/signup", function (req, res, next) {
  try {
    res.render("signup", { csrfToken: req.csrfToken() });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/signup",
  [
    body("username").trim().escape(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("bio").trim().escape(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash(
        "error",
        errors
          .array()
          .map((err) => err.msg)
          .join(" ")
      );
      return res.redirect("/signup");
    }

    const newUser = new User({
      username: req.body.username,
      password: req.body.password,
      bio: req.body.bio,
    });

    newUser
      .save()
      .then(() => res.redirect("/"))
      .catch((err) => next(err));
  }
);

router.get("/users/:username", async function (req, res, next) {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    res.render("profile", { user: user });
  } catch (err) {
    next(err);
  }
});

router.get("/edit", ensureAuthenticated, function (req, res) {
  res.render("edit");
});

router.post("/edit", ensureAuthenticated, body("_csrf").trim().escape(), function (req, res, next) {
  req.user.displayName = req.body.displayname;
  req.user.bio = req.body.bio;

  req.user
    .save()
    .then(() => {
      req.flash("info", "Profile updated!");
      res.redirect("/edit");
    })
    .catch((err) => next(err));
});

router.post("/delete-account", ensureAuthenticated, function (req, res, next) {
  User.deleteOne({ _id: req.user._id })
    .then(() => {
      req.logout(function (err) {
        if (err) {
          return next(err);
        }
        req.flash("info", "Account deleted successfully.");
        res.redirect("/");
      });
    })
    .catch((err) => next(err));
});

export default router;
