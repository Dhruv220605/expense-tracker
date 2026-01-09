let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let selectedWeekStart = null; // Store selected week start date

const form = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");
const totalExpenseEl = document.getElementById("totalExpense");
const averageExpenseEl = document.getElementById("averageExpense");
const expenseCountEl = document.getElementById("expenseCount");
const expenseChart = document.getElementById("expenseChart");
const currentWeekEl = document.getElementById("currentWeek");
const clearAllBtn = document.getElementById("clearAllBtn");
const calendarBtn = document.getElementById("calendarBtn");
const calendarModal = document.getElementById("calendarModal");
const closeCalendar = document.getElementById("closeCalendar");
const weekDatePicker = document.getElementById("weekDatePicker");
const prevWeekBtn = document.getElementById("prevWeek");
const nextWeekBtn = document.getElementById("nextWeek");
const todayBtn = document.getElementById("todayBtn");
const currentWeekBtn = document.getElementById("currentWeekBtn");
const applyWeekBtn = document.getElementById("applyWeekBtn");
const weekDisplay = document.getElementById("weekDisplay");
const calendarMonthYear = document.getElementById("calendarMonthYear");
const chartCard = document.getElementById("chartCard");
const graphModal = document.getElementById("graphModal");
const closeGraph = document.getElementById("closeGraph");
const expandedExpenseChart = document.getElementById("expandedExpenseChart");
const expandedExpenseList = document.getElementById("expandedExpenseList");
const tabButtons = document.querySelectorAll(".tab-btn");
const chartTab = document.getElementById("chartTab");
const listTab = document.getElementById("listTab");
const submitBtn = document.getElementById("submitBtn");
const submitBtnLabel = document.getElementById("submitBtnLabel");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let chart;
let expandedChart;
let currentCalendarDate = new Date();
let editingId = null;

// Ensure every expense has a unique id (backward compatibility)
function ensureExpenseIds() {
    let mutated = false;
    expenses = expenses.map(exp => {
        if (exp.id) return exp;
        mutated = true;
        return { ...exp, id: `exp-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}` };
    });
    if (mutated) {
        localStorage.setItem("expenses", JSON.stringify(expenses));
    }
}
ensureExpenseIds();

// Get start of week for a given date
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
}

// Get end of week for a given date
function getEndOfWeek(date) {
    const start = getStartOfWeek(date);
    const endOfWeek = new Date(start);
    endOfWeek.setDate(start.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
}

// Initialize current week display
function updateCurrentWeek() {
    const weekStart = selectedWeekStart || getStartOfWeek(new Date());
    const weekEnd = getEndOfWeek(weekStart);
    
    const options = { month: 'short', day: 'numeric' };
    const startStr = weekStart.toLocaleDateString('en-US', options);
    const endStr = weekEnd.toLocaleDateString('en-US', options);
    
    currentWeekEl.textContent = `${startStr} - ${endStr}`;
    
    // Update calendar display
    updateCalendarDisplay(weekStart);
}

// Update calendar display
function updateCalendarDisplay(date) {
    const weekStart = getStartOfWeek(date);
    const weekEnd = getEndOfWeek(weekStart);
    
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const startStr = weekStart.toLocaleDateString('en-US', options);
    const endStr = weekEnd.toLocaleDateString('en-US', options);
    
    weekDisplay.textContent = `${startStr} - ${endStr}`;
    
    // Update month/year display
    const monthYearOptions = { month: 'long', year: 'numeric' };
    calendarMonthYear.textContent = weekStart.toLocaleDateString('en-US', monthYearOptions);
    
    // Set date picker to Monday of the week
    const mondayDate = new Date(weekStart);
    weekDatePicker.value = mondayDate.toISOString().split('T')[0];
    
    currentCalendarDate = new Date(weekStart);
}

// Form submission (add / update)
form.addEventListener("submit", e => {
    e.preventDefault();

    const expense = {
        name: expenseName.value.trim(),
        amount: Number(expenseAmount.value),
        category: expenseCategory.value,
    };

    if (!expense.name || !expense.amount || !expense.category) {
        return;
    }

    if (editingId) {
        const idx = expenses.findIndex(exp => exp.id === editingId);
        if (idx !== -1) {
            expenses[idx] = { ...expenses[idx], ...expense };
        }
        resetEditState();
    } else {
        expenses.push({
            ...expense,
            id: `exp-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`,
            date: new Date().toISOString()
        });
    }

    saveAndRender();
    form.reset();
    
    // Add success animation
    submitBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        submitBtn.style.transform = '';
    }, 150);
});

// Cancel edit
cancelEditBtn.addEventListener("click", () => {
    resetEditState();
    form.reset();
});

// Clear all expenses
clearAllBtn.addEventListener("click", () => {
    if (expenses.length === 0) return;
    
    if (confirm(`Are you sure you want to delete all ${expenses.length} expenses?`)) {
        expenses = [];
        resetEditState();
        saveAndRender();
    }
});

function deleteExpense(id) {
    const item = expenseList.querySelector(`li[data-id="${id}"]`);
    const idx = expenses.findIndex(exp => exp.id === id);
    const removeExpense = () => {
        if (idx !== -1) {
            expenses.splice(idx, 1);
            // If we were editing this one, reset state
            if (editingId === id) resetEditState();
    saveAndRender();
        }
    };

    if (item && item.classList.contains('expense-item')) {
        item.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(removeExpense, 300);
    } else {
        removeExpense();
    }
}

function startEditExpense(id) {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;

    if (graphModal.classList.contains("active")) {
        graphModal.classList.remove("active");
    }

    editingId = id;
    expenseName.value = exp.name;
    expenseAmount.value = exp.amount;
    expenseCategory.value = exp.category;

    submitBtnLabel.textContent = "Update Expense";
    submitBtn.querySelector("i").className = "fas fa-save";
    cancelEditBtn.classList.add("visible");

    // Scroll into view for visibility
    expenseName.focus({ preventScroll: false });
}

function resetEditState() {
    editingId = null;
    submitBtnLabel.textContent = "Add Expense";
    submitBtn.querySelector("i").className = "fas fa-arrow-right";
    cancelEditBtn.classList.remove("visible");
}

function saveAndRender() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    renderExpenses();
    updateChart();
    updateExpenseCount();
    updateSummary();
    
    // Update expanded views if modal is open
    if (graphModal.classList.contains("active")) {
        if (chartTab.classList.contains("active")) {
            renderExpandedChart();
        } else {
            renderExpandedExpenses();
        }
    }
}

function updateExpenseCount() {
    const filteredExpenses = getFilteredExpenses();
    const count = filteredExpenses.length;
    const totalCount = expenses.length;
    
    if (selectedWeekStart && totalCount > count) {
        expenseCountEl.textContent = `${count} of ${totalCount} items`;
    } else {
        expenseCountEl.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    }
    
    // Show/hide clear button
    if (totalCount === 0) {
        clearAllBtn.style.opacity = '0.5';
        clearAllBtn.style.pointerEvents = 'none';
    } else {
        clearAllBtn.style.opacity = '1';
        clearAllBtn.style.pointerEvents = 'auto';
    }
}

function getFilteredExpenses() {
    if (!selectedWeekStart) {
        return expenses;
    }
    
    const weekStart = getStartOfWeek(selectedWeekStart);
    const weekEnd = getEndOfWeek(weekStart);
    
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= weekStart && expenseDate <= weekEnd;
    });
}

function updateSummary() {
    const filteredExpenses = getFilteredExpenses();
    let total = 0;
    filteredExpenses.forEach(e => {
        total += e.amount;
    });
    
    const average = filteredExpenses.length > 0 ? total / filteredExpenses.length : 0;
    
    // Animate total update
    animateValue(totalExpenseEl, parseFloat(totalExpenseEl.textContent.replace('₹', '').replace(/,/g, '')) || 0, total, 600);
    
    // Animate average update
    animateValue(averageExpenseEl, parseFloat(averageExpenseEl.textContent.replace('₹', '').replace(/,/g, '')) || 0, average, 600);
}

function renderExpenses() {
    expenseList.innerHTML = "";

    const filteredExpenses = getFilteredExpenses();

    if (filteredExpenses.length === 0) {
        const message = expenses.length === 0 
            ? "Start tracking your expenses by adding one above"
            : "No expenses found for the selected week";
        expenseList.innerHTML = `
            <li class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <p>No expenses yet</p>
                <span>${message}</span>
            </li>
        `;
        return;
    }

    // Sort expenses by date (newest first)
    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
        return new Date(b.date || 0) - new Date(a.date || 0);
    });

    sortedExpenses.forEach((e, i) => {
        const li = document.createElement("li");
        li.className = "expense-item";
        li.style.animationDelay = `${i * 0.03}s`;
        li.dataset.id = e.id;
        
        const categoryEmoji = {
            'Food': '🍔',
            'Drinks': '🥤',
            'Shopping': '🛍️',
            'Travel': '✈️',
            'Other': '📦'
        }[e.category] || '📦';

        li.innerHTML = `
            <div class="expense-info">
                <div class="expense-name">${escapeHtml(e.name)}</div>
                <div class="expense-meta">
                    <span class="badge">${categoryEmoji} ${e.category}</span>
                </div>
            </div>
            <div class="expense-amount-group">
                <span class="amount">₹${formatNumber(e.amount)}</span>
                <button class="edit-btn" onclick="startEditExpense('${e.id}')" aria-label="Edit expense">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="delete-btn" onclick="deleteExpense('${e.id}')" aria-label="Delete expense">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        expenseList.appendChild(li);
    });
}

function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOut;
        
        element.textContent = `₹${formatNumber(Math.round(current * 100) / 100)}`;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = `₹${formatNumber(end)}`;
        }
    }
    
    requestAnimationFrame(update);
}

function formatNumber(num) {
    return num.toLocaleString('en-IN', { 
        maximumFractionDigits: 2,
        minimumFractionDigits: num % 1 === 0 ? 0 : 2
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateChart() {
    const categories = ["Food", "Drinks", "Shopping", "Travel", "Other"];
    const categoryEmojis = {
        'Food': '🍔',
        'Drinks': '🥤',
        'Shopping': '🛍️',
        'Travel': '✈️',
        'Other': '📦'
    };
    
    const filteredExpenses = getFilteredExpenses();
    
    const data = categories.map(c =>
        filteredExpenses.filter(e => e.category === c)
                .reduce((s, e) => s + e.amount, 0)
    );

    const hasData = data.some(d => d > 0);

    if (chart) chart.destroy();

    const colors = [
        'rgba(102, 126, 234, 0.85)',
        'rgba(250, 112, 154, 0.85)',
        'rgba(255, 206, 84, 0.85)',
        'rgba(79, 172, 254, 0.85)',
        'rgba(162, 155, 254, 0.85)'
    ];

    const hoverColors = [
        'rgba(102, 126, 234, 1)',
        'rgba(250, 112, 154, 1)',
        'rgba(255, 206, 84, 1)',
        'rgba(79, 172, 254, 1)',
        'rgba(162, 155, 254, 1)'
    ];

    chart = new Chart(expenseChart, {
        type: "doughnut",
        data: {
            labels: categories.map(c => `${categoryEmojis[c]} ${c}`),
            datasets: [{
                data: hasData ? data : [1],
                backgroundColor: hasData ? colors : ['rgba(255, 255, 255, 0.1)'],
                borderColor: hasData ? colors.map(c => c.replace('0.85', '1')) : ['rgba(255, 255, 255, 0.2)'],
                borderWidth: 3,
                hoverBackgroundColor: hasData ? hoverColors : ['rgba(255, 255, 255, 0.2)'],
                hoverBorderWidth: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            layout: {
                padding: {
                    top: 10,
                    bottom: 50,
                    left: 10,
                    right: 10
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.95)',
                        font: {
                            family: "'Inter', sans-serif",
                            size: 14,
                            weight: '600'
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        pointStyleWidth: 8,
                        boxWidth: 12,
                        boxHeight: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 16,
                    titleFont: {
                        family: "'Inter', sans-serif",
                        size: 15,
                        weight: '700'
                    },
                    bodyFont: {
                        family: "'Inter', sans-serif",
                        size: 14,
                        weight: '500'
                    },
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 16,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ₹${formatNumber(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200,
                easing: 'easeOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Add CSS animation for slide out
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// Calendar functionality
calendarBtn.addEventListener("click", () => {
    calendarModal.classList.add("active");
    updateCalendarDisplay(selectedWeekStart || new Date());
});

closeCalendar.addEventListener("click", () => {
    calendarModal.classList.remove("active");
});

calendarModal.addEventListener("click", (e) => {
    if (e.target === calendarModal || e.target.classList.contains("calendar-overlay")) {
        calendarModal.classList.remove("active");
    }
});

// Date picker change
weekDatePicker.addEventListener("change", (e) => {
    const selectedDate = new Date(e.target.value);
    updateCalendarDisplay(selectedDate);
});

// Previous week
prevWeekBtn.addEventListener("click", () => {
    currentCalendarDate.setDate(currentCalendarDate.getDate() - 7);
    updateCalendarDisplay(currentCalendarDate);
});

// Next week
nextWeekBtn.addEventListener("click", () => {
    currentCalendarDate.setDate(currentCalendarDate.getDate() + 7);
    updateCalendarDisplay(currentCalendarDate);
});

// Today button
todayBtn.addEventListener("click", () => {
    const today = new Date();
    updateCalendarDisplay(today);
});

// Apply week selection
applyWeekBtn.addEventListener("click", () => {
    const selectedDate = new Date(weekDatePicker.value);
    selectedWeekStart = getStartOfWeek(selectedDate);
    updateCurrentWeek();
    saveAndRender();
    calendarModal.classList.remove("active");
});


// Current Week button functionality
currentWeekBtn.addEventListener("click", () => {
    selectedWeekStart = null;
    updateCurrentWeek();
    saveAndRender();
    calendarModal.classList.remove("active");
});

// Graph Modal functionality
chartCard.addEventListener("click", () => {
    graphModal.classList.add("active");
    renderExpandedChart();
    renderExpandedExpenses();
});

closeGraph.addEventListener("click", () => {
    graphModal.classList.remove("active");
});

graphModal.addEventListener("click", (e) => {
    if (e.target === graphModal || e.target.classList.contains("graph-overlay")) {
        graphModal.classList.remove("active");
    }
});

// Tab switching
tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        
        // Update active tab button
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        // Update active tab content
        chartTab.classList.remove("active");
        listTab.classList.remove("active");
        
        if (tab === "chart") {
            chartTab.classList.add("active");
            setTimeout(() => renderExpandedChart(), 100);
        } else {
            listTab.classList.add("active");
            renderExpandedExpenses();
        }
    });
});

// Render expanded chart (shows all expenses, not filtered)
function renderExpandedChart() {
    const categories = ["Food", "Drinks", "Shopping", "Travel", "Other"];
    const categoryEmojis = {
        'Food': '🍔',
        'Drinks': '🥤',
        'Shopping': '🛍️',
        'Travel': '✈️',
        'Other': '📦'
    };
    
    // Use ALL expenses, not filtered
    const data = categories.map(c =>
        expenses.filter(e => e.category === c)
                .reduce((s, e) => s + e.amount, 0)
    );

    const hasData = data.some(d => d > 0);

    if (expandedChart) expandedChart.destroy();

    const colors = [
        'rgba(102, 126, 234, 0.85)',
        'rgba(250, 112, 154, 0.85)',
        'rgba(255, 206, 84, 0.85)',
        'rgba(79, 172, 254, 0.85)',
        'rgba(162, 155, 254, 0.85)'
    ];

    const hoverColors = [
        'rgba(102, 126, 234, 1)',
        'rgba(250, 112, 154, 1)',
        'rgba(255, 206, 84, 1)',
        'rgba(79, 172, 254, 1)',
        'rgba(162, 155, 254, 1)'
    ];

    expandedChart = new Chart(expandedExpenseChart, {
        type: "doughnut",
        data: {
            labels: categories.map(c => `${categoryEmojis[c]} ${c}`),
            datasets: [{
                data: hasData ? data : [1],
                backgroundColor: hasData ? colors : ['rgba(255, 255, 255, 0.1)'],
                borderColor: hasData ? colors.map(c => c.replace('0.85', '1')) : ['rgba(255, 255, 255, 0.2)'],
                borderWidth: 3,
                hoverBackgroundColor: hasData ? hoverColors : ['rgba(255, 255, 255, 0.2)'],
                hoverBorderWidth: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.3,
            cutout: '65%',
            layout: {
                padding: {
                    top: 20,
                    bottom: 40,
                    left: 20,
                    right: 20
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.95)',
                        font: {
                            family: "'Inter', sans-serif",
                            size: 16,
                            weight: '600'
                        },
                        padding: 25,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        pointStyleWidth: 10,
                        boxWidth: 14,
                        boxHeight: 14
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 16,
                    titleFont: {
                        family: "'Inter', sans-serif",
                        size: 16,
                        weight: '700'
                    },
                    bodyFont: {
                        family: "'Inter', sans-serif",
                        size: 15,
                        weight: '500'
                    },
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 16,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ₹${formatNumber(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200,
                easing: 'easeOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Render all expenses in expanded view
function renderExpandedExpenses() {
    expandedExpenseList.innerHTML = "";

    if (expenses.length === 0) {
        expandedExpenseList.innerHTML = `
            <li class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <p>No expenses yet</p>
                <span>Start tracking your expenses by adding one above</span>
            </li>
        `;
        return;
    }

    // Sort expenses by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => {
        return new Date(b.date || 0) - new Date(a.date || 0);
    });

    sortedExpenses.forEach((e, i) => {
        const li = document.createElement("li");
        li.className = "expense-item";
        li.style.animationDelay = `${i * 0.02}s`;
        li.dataset.id = e.id;
        
        const categoryEmoji = {
            'Food': '🍔',
            'Drinks': '🥤',
            'Shopping': '🛍️',
            'Travel': '✈️',
            'Other': '📦'
        }[e.category] || '📦';

        // Format date
        const expenseDate = new Date(e.date);
        const dateStr = expenseDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        li.innerHTML = `
            <div class="expense-info">
                <div class="expense-name">${escapeHtml(e.name)}</div>
                <div class="expense-meta">
                    <span class="badge">${categoryEmoji} ${e.category}</span>
                    <span class="expense-date">${dateStr}</span>
                </div>
            </div>
            <div class="expense-amount-group">
                <span class="amount">₹${formatNumber(e.amount)}</span>
                <button class="edit-btn" onclick="startEditExpense('${e.id}')" aria-label="Edit expense">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="delete-btn" onclick="deleteExpense('${e.id}')" aria-label="Delete expense">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        expandedExpenseList.appendChild(li);
    });
}

// Close graph modal on Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (calendarModal.classList.contains("active")) {
            calendarModal.classList.remove("active");
        }
        if (graphModal.classList.contains("active")) {
            graphModal.classList.remove("active");
        }
    }
});

// Initialize
updateCurrentWeek();
renderExpenses();
updateChart();
updateExpenseCount();
updateSummary();
