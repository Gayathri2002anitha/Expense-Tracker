# 💰 Expense Tracker

A full-stack web application designed to manage daily expenses, track spending habits, and visualize financial data through interactive charts.

## 📌 Project Overview

The Expense Tracker helps users record, update, delete, and monitor their daily expenses. It provides a dashboard with total expenses, monthly spending, category-wise summaries, a monthly bar chart, and a category-wise doughnut chart.

## ✨ Features

- 🔐 User Registration and Login
- 🔑 JWT-Based Authentication
- 📊 Interactive Dashboard
- 💵 Total and Monthly Expense Summary
- 🍔 Category-Wise Expense Tracking
- 📈 Monthly Expense Bar Chart
- 🍩 Category-Wise Doughnut Chart
- ➕ Add New Expenses
- ✏️ Edit Existing Expenses
- 🗑️ Delete Expenses
- 🔍 Search and Filter Expenses
- 📅 Filter Transactions by Date
- 🗄️ MongoDB Database Integration
- 🎨 Responsive and Professional UI

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript
- Chart.js

### Backend
- Node.js
- Express.js
- REST API
- JSON Web Token (JWT)

### Database
- MongoDB
- Mongoose

### Tools
- Visual Studio Code
- Git
- GitHub

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone http://github.com/Gayathri2002anitha/Expense-Tracker.git
```

### 2. Navigate to the Project Folder

```bash
cd Expense-Tracker
```

### 3. Install Backend Dependencies

```bash
cd Back-end
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the backend folder and add your own configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Use the exact environment variable names required by your backend code. Never upload your actual `.env` file or database password to GitHub.

### 5. Start the Backend Server

Use the start command configured in your backend `package.json`, for example:

```bash
npm start
```

If your project uses a different script, run the corresponding command.

### 6. Run the Frontend

Open the frontend `index.html` using the VS Code Live Server extension after starting the backend.

## 📊 Dashboard Modules

- **Dashboard:** Displays total, monthly, food, and travel expenses.
- **Expense Overview:** Shows monthly spending in a bar chart.
- **Spending Breakdown:** Visualizes category-wise expenses using a doughnut chart.
- **Add Expense:** Records expense amount, category, description, and date.
- **Recent Transactions:** Supports searching, filtering, editing, and deleting expense records.
- **Authentication:** Restricts dashboard access to authenticated users.

## 🎯 Project Objective

The main objective of this project is to simplify personal expense management, improve spending awareness, and provide a clear visual representation of financial activities.

## 🚀 Future Enhancements

- Monthly budget planning
- Downloadable expense reports
- PDF and Excel export
- Advanced financial analytics
- Recurring expense reminders

## 👩‍💻 Author

**Gayathri A.**

MCA Student | Aspiring Java Full Stack Developer

## 📄 License

This project was developed for learning and portfolio purposes.
