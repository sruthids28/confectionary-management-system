const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/Startproject")
  .then(() => {
    console.log("mongodb connected");
  })
  .catch(() => {
    console.log("Failed to connect");
  });

const LogInSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

const LogIn =
 mongoose.model("login", LogInSchema);

const SweetItemSchema = new mongoose.Schema({
  sweetItem: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
});


const SweetItem = mongoose.model("insert", SweetItemSchema);

const LogSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  no: {
    type: String,
    required: true
  }
  
});

const Log =
 mongoose.model("user-login", LogSchema);

 const orderSchema = new mongoose.Schema({
  username: String,
  address: String,
  phone: String,
  sweetItem: String,
  price: Number, // Add price field
  quantity: Number,
  totalPrice: Number // Add totalPrice field
});

// Create a model for the order schema
const Order = mongoose.model('Order', orderSchema);

module.exports = { LogIn, SweetItem, Log, Order };


