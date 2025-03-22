import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "./models/user.mjs";

function configurePassport() {
  passport.serializeUser((user, done) => done(null, user._id));

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  passport.use(
    "login",
    new LocalStrategy(
      { usernameField: "username", passwordField: "password" },
      async (username, password, done) => {
        try {
          const user = await User.findOne({ username });
          if (!user) {
            return done(null, false, { message: "Incorrect username." });
          }

          const isValid = await user.validatePassword(password);
          if (!isValid) {
            return done(null, false, { message: "Incorrect password." });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

export default configurePassport;
