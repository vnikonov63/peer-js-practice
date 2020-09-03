require("dotenv").config();
const User = require("./models/user");

const mongoose = require("mongoose");
const db = mongoose.connect(process.env.MONGO, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

db.then(async ({ connection }) => {
  connection.db.dropDatabase();
  await User.create({
    email: "user1",
    password: "1",
  });
  mongoose.connection.close();
});
