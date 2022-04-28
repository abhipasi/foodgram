const mongoose = require("mongoose");

const url = `mongodb+srv://hetul:hello@project.8prig.mongodb.net/foodogram?retryWrites=true&w=majority`;
async function dbConnect() {
  // use mongoose to connect this app to our database on mongoDB using the DB_URL (connection string)
  mongoose
    .connect(url)
    .then(() => {
      console.log("Successfully connected to MongoDB Atlas!");
    })
    .catch((error) => {
      console.log("Unable to connect to MongoDB Atlas!");
      console.error(error);
    });
}

module.exports = dbConnect;
