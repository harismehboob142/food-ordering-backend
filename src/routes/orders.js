const express = require("express");
const {
  verifyToken,
  checkRole,
  checkCountryAccess,
} = require("../middleware/auth");
const Order = require("../models/Order");
const FoodItem = require("../models/FoodItem");
const { check, validationResult } = require("express-validator");

const router = express.Router();

// @route   GET /api/orders
// @desc    Get all orders (filtered by country for non-admin roles)
// @access  Private - All roles
router.get("/", [verifyToken, checkCountryAccess], async (req, res) => {
  try {
    // For admin, get all orders
    // For manager and member, get only orders from their country
    const filter =
      req.user.role === "admin" ? {} : { country: req.user.country };

    const orders = await Order.find(filter)
      .populate("user", "username role country")
      .populate({
        path: "items.foodItem",
        select: "name price restaurant",
        populate: {
          path: "restaurant",
          select: "name country",
        },
      });

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID (with country check)
// @access  Private - All roles
router.get("/:id", [verifyToken, checkCountryAccess], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "username role country")
      .populate({
        path: "items.foodItem",
        select: "name price restaurant",
        populate: {
          path: "restaurant",
          select: "name country",
        },
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user has access to this order based on country
    if (req.user.role !== "admin" && order.country !== req.user.country) {
      return res
        .status(403)
        .json({ message: "Access denied: Country restriction" });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(500).send("Server error");
  }
});

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private - Admin, Manager
router.post(
  "/",
  [
    verifyToken,
    checkRole(["admin", "manager"]),
    checkCountryAccess,
    [
      check("items", "Items are required").isArray({ min: 1 }),
      check("items.*.foodItem", "Food item ID is required").notEmpty(),
      check("items.*.quantity", "Quantity must be a positive number").isInt({
        min: 1,
      }),
    ],
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, paymentMethod } = req.body;

    try {
      // Calculate total amount and verify all food items
      let totalAmount = 0;
      const itemsWithDetails = [];

      for (const item of items) {
        const foodItem = await FoodItem.findById(item.foodItem);
        if (!foodItem) {
          return res
            .status(404)
            .json({ message: `Food item with ID ${item.foodItem} not found` });
        }

        // Check if user has access to this food item based on country
        if (
          req.user.role !== "admin" &&
          foodItem.country !== req.user.country
        ) {
          return res.status(403).json({
            message: `Access denied: Cannot order food items from different country (${foodItem.name})`,
          });
        }

        totalAmount += foodItem.price * item.quantity;
        itemsWithDetails.push({
          foodItem: foodItem._id,
          quantity: item.quantity,
          country: foodItem.country,
        });
      }

      // Create new order
      console.log("item with details", itemsWithDetails);
      const order = new Order({
        user: req.user.userId,
        items: itemsWithDetails,
        totalAmount,
        paymentMethod: paymentMethod || "credit_card",
        country:
          req.user.role === "admin"
            ? itemsWithDetails[0].country
            : req.user.country, // For admin, use the country of the first food item
      });

      await order.save();

      res.status(201).json(order);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private - Admin, Manager
router.put(
  "/:id/cancel",
  [verifyToken, checkRole(["admin", "manager"]), checkCountryAccess],
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user has access to this order based on country
      if (req.user.role !== "admin" && order.country !== req.user.country) {
        return res
          .status(403)
          .json({ message: "Access denied: Country restriction" });
      }

      // Check if order can be cancelled
      if (order.status === "cancelled") {
        return res.status(400).json({ message: "Order is already cancelled" });
      }

      if (order.status === "delivered") {
        return res
          .status(400)
          .json({ message: "Cannot cancel a delivered order" });
      }

      // Update order status
      order.status = "cancelled";
      await order.save();

      res.json(order);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({ message: "Order not found" });
      }
      res.status(500).send("Server error");
    }
  }
);

// @route   PUT /api/orders/:id/payment
// @desc    Update payment method
// @access  Private - Admin only
router.put(
  "/:id/payment",
  [
    verifyToken,
    checkRole(["admin"]),
    [check("paymentMethod", "Payment method is required").notEmpty()],
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentMethod } = req.body;

    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update payment method
      order.paymentMethod = paymentMethod;
      await order.save();

      res.json(order);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({ message: "Order not found" });
      }
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
