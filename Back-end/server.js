
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from the .env file");
}

// ==============================
// DATABASE SCHEMAS
// ==============================

const expenseSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        category: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        date: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);

// ==============================
// AUTHENTICATION MIDDLEWARE
// ==============================

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Please login to continue."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please login again."
        });
    }
}

// ==============================
// HOME ROUTE
// ==============================

app.get("/", (req, res) => {
    res.send("Expense Tracker Backend is Running!");
});

// ==============================
// SIGNUP API
// ==============================

app.post("/auth/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            password.length < 8
        ) {
            return res.status(400).json({
                message: "Enter a valid name, email and password (minimum 8 characters)."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered. Please login."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        const token = jwt.sign(
            { userId: user._id.toString() },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(201).json({
            message: "Signup successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already registered. Please login."
            });
        }

        console.error("Signup error:", error.message);

        return res.status(500).json({
            message: "Signup failed. Please try again."
        });
    }
});

// ==============================
// LOGIN API
// ==============================

app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (
            !user ||
            !(await bcrypt.compare(password, user.password))
        ) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            { userId: user._id.toString() },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Login failed. Please try again."
        });
    }
});

// ==============================
// GET LOGGED-IN USER
// ==============================

app.get("/auth/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select("name email");

        if (!user) {
            return res.status(401).json({
                message: "User account not found."
            });
        }

        res.json({
            id: user._id,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch user profile."
        });
    }
});

// ==============================
// GET USER'S EXPENSES
// ==============================

app.get("/expenses", authenticateToken, async (req, res) => {
    try {
        const expenses = await Expense.find({
            user: req.userId
        }).sort({ date: -1, createdAt: -1 });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch expenses."
        });
    }
});

// ==============================
// ADD EXPENSE
// ==============================

app.post("/expenses", authenticateToken, async (req, res) => {
    try {
        const { amount, category, description, date } = req.body;

        if (
            amount === undefined ||
            amount === null ||
            amount === "" ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) < 0 ||
            typeof category !== "string" ||
            !category.trim() ||
            typeof description !== "string" ||
            !description.trim() ||
            typeof date !== "string" ||
            !date.trim()
        ) {
            return res.status(400).json({
                message: "Please provide valid expense details."
            });
        }

        const expense = await Expense.create({
            user: req.userId,
            amount: Number(amount),
            category: category.trim(),
            description: description.trim(),
            date: date.trim()
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({
            message: "Unable to add expense.",
            error: error.message
        });
    }
});

// ==============================
// EDIT OWN EXPENSE
// ==============================

app.put("/expenses/:id", authenticateToken, async (req, res) => {
    try {
        const { amount, category, description, date } = req.body;

        if (
            amount === undefined ||
            amount === null ||
            amount === "" ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) < 0 ||
            typeof category !== "string" ||
            !category.trim() ||
            typeof description !== "string" ||
            !description.trim() ||
            typeof date !== "string" ||
            !date.trim()
        ) {
            return res.status(400).json({
                message: "Please provide valid expense details."
            });
        }

        const expense = await Expense.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.userId
            },
            {
                amount: Number(amount),
                category: category.trim(),
                description: description.trim(),
                date: date.trim()
            },
            {
                returnDocument : "after" 
            }
        );

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found."
            });
        }

        res.json(expense);
    } catch (error) {
        res.status(400).json({
            message: "Unable to update expense."
        });
    }
});

// ==============================
// DELETE OWN EXPENSE
// ==============================

app.delete("/expenses/:id", authenticateToken, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({
            _id: req.params.id,
            user: req.userId
        });

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found."
            });
        }

        res.json({
            message: "Expense deleted successfully."
        });
    } catch (error) {
        res.status(400).json({
            message: "Unable to delete expense."
        });
    }
});

// ==============================
// START SERVER
// ==============================

mongoose.connect(
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/expenseTracker"
)
.then(() => {
    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
})
.catch((error) => {
    console.error("MongoDB connection error:", error.message);
});
