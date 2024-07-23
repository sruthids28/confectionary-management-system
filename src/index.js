const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const opn = require('opn');
const pdf = require("pdf-creator-node");
const bcrypt = require('bcryptjs');
const router = express.Router();
const crypto = require('crypto');
const {Log, LogIn, SweetItem , Order } = require("./mongodb");
const sweetItems = require("./data"); 

const templatePath = path.join(__dirname, '../templates'); // Corrected the spelling of 'templates'
app.use(express.json());
//app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.set("view engine", "hbs");
app.set('views', path.join(__dirname, 'views'));
app.set("views", templatePath);
//app.use(express.urlencoded({ extended: false }));



// Homepage route
app.get("/", (req, res) => {
    res.render("dashboard");
});

// Admin login route
app.get("/admin", (req, res) => {
    res.render("login");
});

// User login route
app.get("/user", (req, res) => {
    res.render("user-login");
});

app.get("/user-dashboard", (req, res) => {
    res.render("user-dashboard");
});

app.get("/home", (req, res) => {
    res.render("home");
});

//app.get("/order-detail", (req, res) => {
  //  res.render("order-detail");
//});

app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Order page route
app.get("/order", (req, res) => {
    res.render("order");
});
app.post("/order", async (req, res) => {
    try {
        const { sweetItem, quantity } = req.body;
        // Check if the sweet item exists in the database
        const item = await SweetItem.findOne({ sweetItem });
        if (!item) {
          return res.status(404).render("order-not-available", {
            sweetItem,
            cssPath: path.join(__dirname, "public", "styles.css"),
          });
        }
  
      // Calculate total price
      //const totalPrice = item.price * quantity;
      const price = item.price;
      const totalPrice = item.price * quantity;

      // Save order to the database
      const order = new Order({
        username: req.body.username,
        address: req.body.address,
        phone: req.body.no,
        sweetItem: req.body.sweetItem,
        price,
        quantity:req.body.quantity,
        totalPrice
    });
      await order.save();

        // Save the order to the database
        await order.save();
  
      // Generate PDF bill
      const html = fs.readFileSync(path.join(__dirname, "../templates/bill.hbs"), "utf8");
      
      const bill = {
        html: html,
        data: {
          user: { name: req.body.username, address: req.body.address, phone: req.body.no },
          items: [{sweetItem, quantity, price: item.price}],
          totalPrice
        },
        path: "./order_bill.pdf"
      };
      pdf.create(bill).then(() => {
        res.render("order", { errorMessage: "Order placed successfully. PDF bill generated." });
        console.log("PDF bill generated");
       // res.send("Order placed successfully. PDF bill generated.");
        opn(`./order_bill.pdf`, { wait: false }).catch((err) => {
            console.error(`Error occurred while trying to open the bill: ${err}`);
          });
      }).catch((error) => {
        console.error("Error generating PDF:", error);
        res.send("Error placing order. Please try again.");
      });
    } catch (error) {
      console.error(error);
      res.send("An error occurred");
    }
  });

  app.post("/user-login", async (req, res) => {
    try {
        // Secure username lookup (avoid exposing usernames in error messages)
        const user = await Log.findOne({ username: req.body.username });

        if (!user) {
            // Generic login failed message
            return res.render("user-login", { errorMessage: "User not found. Sign in first" });
        }

        // Check if the password is correct (plaintext comparison)
        if (user.password === req.body.password) {
            // Login successful!
            // ... (redirect to protected content, generate session token, etc.)
            return res.render("user-dashboard"); // Assuming "order" is the protected page
        } else {
            return res.render("user-login", { errorMessage: "Incorrect password" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error"); // Generic error for security
    }
});

app.get("/forgot-password", (req, res) => {
    res.render("forgot-password");
});
app.get("/view", (req, res) => {
    res.render("view");
});
app.post("/view", async (req, res) => {
    try {
        const { username } = req.body;
        const user = await Order.findOne({ username })

        // Find the user by username
     if (user){
    
        try {
            const items = await Order.find({}, " username address phone sweetItem price quantity totalPrice");
            res.render("view", { items });
        } catch (error) {
            console.error(error);
            res.send("An error occurred");
        }
      }
     else {
            // User not found
            return res.render('view', { errorMessage: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// Route to handle password reset form submission
app.post("/forgot-password", async (req, res) => {
    try {
        const { username, newPassword } = req.body;

        // Find the user by username
        const user = await Log.findOne({ username });

        if (!user) {
            // User not found
            return res.render('forgot-password', { errorMessage: 'User not found' });
        }

        // Update the password in the database
        user.password = newPassword;
        await user.save();

        // Redirect to login page or any other appropriate page
        res.redirect('/user');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});




app.get("/sign", (req, res) => {
    res.render("sign");
});

app.post("/sign", async (req, res) => {
    const data = {
        username: req.body.username,
        password: req.body.password,
        address : req.body.address,
        no   : req.body.no
    };

    try {
        const newUser = new Log(data);
        await newUser.save();
        res.render("user-login");
    } catch (error) {
        console.error(error);
        res.send("An error occurred");
    }
});

// GET route for update page
app.get("/update", (req, res) => {
    res.render("update"); // Assuming you have an update.hbs file in your views directory
});

// Login route
app.post("/login", async (req, res) => {
    try {
        const user = await LogIn.findOne({ name: req.body.name });
        if (user && user.password === req.body.password) {
            res.redirect("/home");
        } else {
            res.send("NOT SIGNED IN!! PLEASE SIGN IN FIRST");
        }
    } catch (error) {
        
        console.error(error);
        res.send("An error occurred");
    }
});

// Insert route
app.get("/insert", (req, res) => {
    res.render("insert");
});

app.post("/insert", async (req, res) => {
    const { sweetItem, price } = req.body;
    try {
        const newItem = new SweetItem({ sweetItem, price });
        await newItem.save();
        res.redirect("/display");
    } catch (error) {
        console.error(error);
        res.send("An error occurred");
    }
});

// Display route
app.get("/display", async (req, res) => {
    try {
        const items = await SweetItem.find({}, "sweetItem price");
        res.render("display", { items });
    } catch (error) {
        console.error(error);
        res.send("An error occurred");
    }
});

// Delete route
app.get("/delete/:id", async (req, res) => {
    try {
        await SweetItem.findByIdAndDelete(req.params.id);
        res.redirect("/display");
    } catch (error) {
        console.error(error);
        res.send("An error occurred");
    }
});

// GET route for delete page
app.get("/delete", (req, res) => {
    res.render("delete"); // Assuming you have a delete.hbs file in your views directory
});

// GET route for update page
app.get("/update", async (req, res) => {
    try {
        const item = await SweetItem.findById(req.params.id);
        res.render("update", { item });
    } catch (error) {
        console.error(error);
        res.send("An error occurred");
    }
});

// Update route
// Update route
app.post("/update", async (req, res) => {
    try {
        const { sweetItem, price } = req.body;
        // Find the item by name and update its price
        await SweetItem.findOneAndUpdate({ sweetItem }, { price });
        res.redirect("/display");
    } catch (error) {
        console.error(error);
        res.send("An error occurred");
    }
});

// Signup route
app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async (req, res) => {
    const data = {
        name: req.body.name,
        password: req.body.password
    };

    try {
        const newUser = new LogIn(data);
        await newUser.save();
        res.render("login");
    } catch (error) {
        console.error(error);
        res.send("An error occurred");
    }
});

// Delete route based on sweet item name
app.post("/delete", async (req, res) => {
    try {
        const { sweetItem } = req.body;
        // Find and delete the item based on the sweet item name
        await SweetItem.deleteOne({ sweetItem });
        res.redirect("/display");
    } catch (error) {
        console.error(error);
        res.send("An error occurred");
    }
});


// Place order route
app.post("/place-order", (req, res) => {
    // Add logic to handle placing orders here
    res.send("Place Order Page");
});

// Display orders route
//app.get("/display-orders", (req, res) => {
    // Add logic to display orders here
  //  res.send("Display Orders Page");
//});

// Endpoint to get the price of the selected item
app.get("/get-price/:item", async (req, res) => {
    try {
        // Fetch the price of the item from the database based on the item name
        const item = await SweetItem.findOne({ sweetItem: req.params.item });
        if (item) {
            res.json({ price: item.price });
        } else {
            res.status(404).json({ error: "Item not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.get("/order-detail", async (req, res) => {
    try {
        const items = await Order.find({}, "username address phone sweetItem price quantity totalPrice");
        res.render("order-detail", { items });
    } catch (error) {
        console.error(error);
        res.send("An error occurred");
    }
});

const port = 3300;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

