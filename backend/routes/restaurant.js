const express = require("express");
const router = express.Router();

// TEST ROUTE (optional)
router.get("/", (req, res) => {
  res.send("Restaurants route working");
});

// MENU API
router.get("/:id/menu", (req, res) => {
  const menu = [
    {
      name: "Chicken Biryani",
      price: 120,
      desc: "Full spicy dum biryani",
      image: "images/biryani.jpg"
    },
    {
      name: "Paneer Burger",
      price: 90,
      desc: "Cheesy burger",
      image: "images/burger.jpg"
    }
  ];

  res.json(menu);
});

module.exports = router;