import bcrypt from "bcrypt";
import mongoose from "mongoose";

var SALT_FACTOR = 10; // creazione hash bcrypt

var userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  displayName: String,
  bio: String
});

userSchema.pre("save", async function (done) {
  if (!this.isModified("password")) {
    return done();
  }

  try {
    const salt = await bcrypt.genSalt(SALT_FACTOR);
    this.password = await bcrypt.hash(this.password, salt);
    done();
  } catch (err) {
    done(err);
  }
});

userSchema.methods.validatePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.name = function() {
  return this.displayName || this.username;
};

var User = mongoose.model("User", userSchema);

export default User;
