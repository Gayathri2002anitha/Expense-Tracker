
const API_URL = "http://localhost:5000";

// HTML ELEMENTS
const expenseForm = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");

const totalExpense = document.getElementById("totalExpense");
const monthlyExpense = document.getElementById("monthlyExpense");
const foodExpense = document.getElementById("foodExpense");
const travelExpense = document.getElementById("travelExpense");

const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const dateInput = document.getElementById("date");

const searchInput = document.getElementById("search");
const filterCategory = document.getElementById("filterCategory");
const filterDate = document.getElementById("filterDate");

let editingRow = null;
let expenses = [];

let monthlyChart = null;
let categoryChart = null;

// AUTHENTICATION
if (!localStorage.getItem("token")) {
    window.location.replace("login.html");
}

// API REQUEST
async function apiRequest(url, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(url, {
        ...options,
        headers
    });
}

// CATEGORY ICON
function getCategoryIcon(category) {
    const icons = {
        food: "🍔",
        travel: "🚗",
        shopping: "🛍️",
        education: "🎓",
        bills: "💡",
        entertainment: "🎬"
    };

    return icons[(category || "").toLowerCase()] || "📦";
}

// DISPLAY EXPENSE
function displayExpense(expense) {
    const row = document.createElement("tr");
    row.dataset.id = expense._id;

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(expense.date);

    const categoryCell = document.createElement("td");
    const badge = document.createElement("span");

    badge.className = "category-badge";
    badge.dataset.category = expense.category;
    badge.textContent =
        getCategoryIcon(expense.category) + " " + expense.category;

    categoryCell.appendChild(badge);

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = expense.description || "";

    const amountCell = document.createElement("td");
    amountCell.textContent =
        "₹" + (Number(expense.amount) || 0).toLocaleString("en-IN");

    const actionCell = document.createElement("td");

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", function () {
        editExpense(this);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
        deleteExpense(this);
    });

    actionCell.append(editButton, deleteButton);

    row.append(
        dateCell,
        categoryCell,
        descriptionCell,
        amountCell,
        actionCell
    );

    expenseList.appendChild(row);
}

// FORMAT DATE FOR DISPLAY
function formatDate(dateValue) {
    if (!dateValue) return "";

    const parts = String(dateValue).split("-");

    if (parts.length !== 3) return dateValue;

    // YYYY-MM-DD to DD-MM-YYYY
    if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return dateValue;
}

// PARSE DATE SAFELY
function parseExpenseDate(dateValue) {
    if (!dateValue) return null;

    const parts = String(dateValue).split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return null;
    }

    let year;
    let month;
    let day;

    if (parts[0] > 1000) {
        year = parts[0];
        month = parts[1];
        day = parts[2];
    } else {
        day = parts[0];
        month = parts[1];
        year = parts[2];
    }

    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

// LOAD EXPENSES FROM BACKEND
async function loadExpenses() {
    try {
        const response = await apiRequest(`${API_URL}/expenses`);

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.replace("login.html");
            return;
        }

        if (!response.ok) {
            throw new Error("Could not load expenses. Status: " + response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Backend response is not an expense list.");
        }

        expenses = data;

        expenseList.innerHTML = "";

        expenses.forEach(displayExpense);

        updateTotalExpense();
        updateMonthlyExpense();
        updateCategoryExpense();
        updateCharts();
        filterExpenses();

    } catch (error) {
        console.error("Load expenses error:", error);
    }
}

// ADD OR UPDATE EXPENSE
if (expenseForm) {
    expenseForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const expenseData = {
            amount: Number(amountInput.value),
            category: categoryInput.value,
            description: descriptionInput.value.trim(),
            date: dateInput.value
        };

        if (
            expenseData.amount <= 0 ||
            !expenseData.category ||
            !expenseData.description ||
            !expenseData.date
        ) {
            alert("Please enter all expense details.");
            return;
        }

        const isEditing = editingRow !== null;
        const id = isEditing ? editingRow.dataset.id : null;

        if (isEditing && !id) {
            alert("Expense ID missing. Refresh and try again.");
            return;
        }

        try {
            const response = await apiRequest(
                isEditing
                    ? `${API_URL}/expenses/${id}`
                    : `${API_URL}/expenses`,
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(expenseData)
                }
            );

            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.replace("login.html");
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message || "Save failed. Status: " + response.status
                );
            }

            editingRow = null;
            expenseForm.reset();

            const submitButton = expenseForm.querySelector(
                "button[type='submit']"
            );

            if (submitButton) {
                submitButton.textContent = "Add Expense";
            }

            await loadExpenses();

            alert(
                isEditing
                    ? "Expense Updated Successfully!"
                    : "Expense Added Successfully!"
            );

        } catch (error) {
            console.error("Save expense error:", error);
            alert("Expense save aagala: " + error.message);
        }
    });
}

// DELETE EXPENSE
async function deleteExpense(button) {
    const row = button.closest("tr");
    const id = row?.dataset.id;

    if (!id) {
        alert("Expense ID missing. Refresh the page and try again.");
        return;
    }

    if (!confirm("Do you want to delete this expense?")) {
        return;
    }

    try {
        const response = await apiRequest(
            `${API_URL}/expenses/${id}`,
            {
                method: "DELETE"
            }
        );

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.replace("login.html");
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || "Delete failed. Status: " + response.status
            );
        }

        if (editingRow === row) {
            editingRow = null;
            expenseForm.reset();

            const submitButton = expenseForm.querySelector(
                "button[type='submit']"
            );

            if (submitButton) {
                submitButton.textContent = "Add Expense";
            }
        }

        await loadExpenses();
        alert("Expense Deleted Successfully!");

    } catch (error) {
        console.error("Delete expense error:", error);
        alert("Delete aagala: " + error.message);
    }
}

// EDIT EXPENSE
function editExpense(button) {
    const row = button.closest("tr");

    if (!row) return;

    const expense = expenses.find(
        item => item._id === row.dataset.id
    );

    if (!expense) {
        alert("Expense details not found. Refresh the page.");
        return;
    }

    amountInput.value = expense.amount;
    categoryInput.value = expense.category;
    descriptionInput.value = expense.description;
    dateInput.value = formatDateForInput(expense.date);

    editingRow = row;

    const submitButton = expenseForm.querySelector(
        "button[type='submit']"
    );

    if (submitButton) {
        submitButton.textContent = "Update Expense";
    }

    expenseForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// DATE FOR HTML DATE INPUT
function formatDateForInput(dateValue) {
    if (!dateValue) return "";

    const parts = String(dateValue).split("-");

    if (parts.length !== 3) return "";

    if (parts[0].length === 4) {
        return dateValue;
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// TOTAL EXPENSE
function updateTotalExpense() {
    const total = expenses.reduce(function (sum, item) {
        return sum + (Number(item.amount) || 0);
    }, 0);

    if (totalExpense) {
        totalExpense.textContent =
            "₹" + total.toLocaleString("en-IN");
    }
}

// CURRENT MONTH EXPENSE
function updateMonthlyExpense() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const total = expenses.reduce(function (sum, item) {
        const date = parseExpenseDate(item.date);

        if (
            date &&
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
        ) {
            return sum + (Number(item.amount) || 0);
        }

        return sum;
    }, 0);

    if (monthlyExpense) {
        monthlyExpense.textContent =
            "₹" + total.toLocaleString("en-IN");
    }
}

// FOOD AND TRAVEL TOTALS
function updateCategoryExpense() {
    let foodTotal = 0;
    let travelTotal = 0;

    expenses.forEach(function (item) {
        const category = (item.category || "").toLowerCase();
        const amount = Number(item.amount) || 0;

        if (category === "food") {
            foodTotal += amount;
        }

        if (category === "travel") {
            travelTotal += amount;
        }
    });

    if (foodExpense) {
        foodExpense.textContent =
            "₹" + foodTotal.toLocaleString("en-IN");
    }

    if (travelExpense) {
        travelExpense.textContent =
            "₹" + travelTotal.toLocaleString("en-IN");
    }
}

// MONTHLY BAR CHART
function updateMonthlyChart() {
    const canvas = document.getElementById("monthlyExpenseChart");

    if (!canvas) {
        console.error("Canvas missing: monthlyExpenseChart");
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }

    const monthlyTotals = Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    expenses.forEach(function (item) {
        const date = parseExpenseDate(item.date);

        if (date && date.getFullYear() === currentYear) {
            monthlyTotals[date.getMonth()] +=
                Number(item.amount) || 0;
        }
    });

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ],
            datasets: [{
                label: "Expenses (₹)",
                data: monthlyTotals,
                backgroundColor: "#827aff",
                borderRadius: 7,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return "₹" +
                                Number(context.parsed.y).toLocaleString("en-IN");
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return "₹" +
                                Number(value).toLocaleString("en-IN");
                        }
                    }
                }
            }
        }
    });
}

// CATEGORY DOUGHNUT CHART
function updateCategoryChart() {
    const canvas = document.getElementById("categoryExpenseChart");

    if (!canvas) {
        console.error("Canvas missing: categoryExpenseChart");
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }

    const categoryTotals = {};

    expenses.forEach(function (item) {
        const category = item.category || "Others";

        categoryTotals[category] =
            (categoryTotals[category] || 0) +
            (Number(item.amount) || 0);
    });

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: labels.length ? labels : ["No Expenses Yet"],
            datasets: [{
                data: values.length ? values : [1],
                backgroundColor: [
                    "#6c63ff",
                    "#00c9a7",
                    "#ffb84d",
                    "#ff6b8a",
                    "#5da9ff",
                    "#a78bfa",
                    "#ff9b71"
                ],
                borderWidth: 3,
                borderColor: "#ffffff",
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
                legend: {
                    position: "bottom"
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = Number(context.parsed) || 0;

                            if (context.label === "No Expenses Yet") {
                                return "No expenses added";
                            }

                            return context.label + ": ₹" +
                                value.toLocaleString("en-IN");
                        }
                    }
                }
            }
        }
    });
}

// UPDATE BOTH CHARTS
function updateCharts() {
    updateMonthlyChart();
    updateCategoryChart();
}

// SEARCH AND FILTER
if (searchInput) {
    searchInput.addEventListener("input", filterExpenses);
}

if (filterCategory) {
    filterCategory.addEventListener("change", filterExpenses);
}

if (filterDate) {
    filterDate.addEventListener("change", filterExpenses);
}

function filterExpenses() {
    if (!expenseList) return;

    const searchText = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const selectedCategory = filterCategory
        ? filterCategory.value.toLowerCase()
        : "";

    const selectedDate = filterDate ? filterDate.value : "";

    expenseList.querySelectorAll("tr").forEach(function (row) {
        if (!row.cells.length) return;

        const dateText = row.cells[0].textContent.trim();
        const dateForFilter = formatDateForInput(dateText);

        const badge = row.querySelector(".category-badge");
        const category = badge
            ? (badge.dataset.category || "").toLowerCase()
            : "";

        const description = row.cells[2]
            ? row.cells[2].textContent.toLowerCase()
            : "";

        const matchesSearch =
            category.includes(searchText) ||
            description.includes(searchText);

        const matchesCategory =
            !selectedCategory || category === selectedCategory;

        const matchesDate =
            !selectedDate || dateForFilter === selectedDate;

        row.style.display =
            matchesSearch && matchesCategory && matchesDate ? "" : "none";
    });
}

// DEFAULT DATE AND FOOTER
if (dateInput && !dateInput.value) {
    const today = new Date();
    const localDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];

    dateInput.value = localDate;
}

const todayDate = document.getElementById("todayDate");

if (todayDate) {
    todayDate.textContent = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

const footerYear = document.getElementById("footerYear");

if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
}

// LOGOUT
const logoutLink = document.getElementById("logoutLink");

if (logoutLink) {
    logoutLink.addEventListener("click", function (event) {
        event.preventDefault();

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "login.html";
    });
}

// INITIAL LOAD
loadExpenses();
updateTotalExpense();
updateMonthlyExpense();
updateCategoryExpense();
updateCharts();
filterExpenses();

