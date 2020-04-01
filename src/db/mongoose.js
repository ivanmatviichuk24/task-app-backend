const mongoose = require("mongoose");

const url = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";

mongoose.connect(`${url}heroku_bx162mvm`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});
