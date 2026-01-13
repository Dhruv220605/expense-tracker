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

// Insights Modal Elements
const insightsBtn = document.getElementById("insightsBtn");
const insightsModal = document.getElementById("insightsModal");
const closeInsights = document.getElementById("closeInsights");
const insightsLoading = document.getElementById("insightsLoading");
const insightsContent = document.getElementById("insightsContent");
const weeklyTrendValue = document.getElementById("weeklyTrendValue");
const monthlyTrendValue = document.getElementById("monthlyTrendValue");
const highestDayValue = document.getElementById("highestDayValue");
const topCategoryValue = document.getElementById("topCategoryValue");
const recommendation1Text = document.getElementById("recommendation1Text");
const recommendation2Text = document.getElementById("recommendation2Text");

// Currency Modal Elements
const currencyBtn = document.getElementById("currencyBtn");
const currencyModal = document.getElementById("currencyModal");
const closeCurrency = document.getElementById("closeCurrency");
const currencySelect = document.getElementById("currencySelect");
const ratesLoading = document.getElementById("ratesLoading");
const ratesContent = document.getElementById("ratesContent");
const usdRate = document.getElementById("usdRate");
const eurRate = document.getElementById("eurRate");
const gbpRate = document.getElementById("gbpRate");
const jpyRate = document.getElementById("jpyRate");
const cadRate = document.getElementById("cadRate");
const audRate = document.getElementById("audRate");
const resetCurrencyBtn = document.getElementById("resetCurrencyBtn");
const applyCurrencyBtn = document.getElementById("applyCurrencyBtn");

// Currency state
let currentCurrency = localStorage.getItem("currentCurrency") || "INR";
let exchangeRates = JSON.parse(localStorage.getItem("exchangeRates")) || {};
let lastRatesUpdate = localStorage.getItem("lastRatesUpdate") || null;

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
    const currentTotalText = totalExpenseEl.textContent.replace(/[^0-9.-]/g, '');
    animateValue(totalExpenseEl, parseFloat(currentTotalText) || 0, total, 600);
    
    // Animate average update
    const currentAverageText = averageExpenseEl.textContent.replace(/[^0-9.-]/g, '');
    animateValue(averageExpenseEl, parseFloat(currentAverageText) || 0, average, 600);
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
                <span class="amount">${formatCurrency(e.amount)}</span>
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
        
        element.textContent = formatCurrency(Math.round(current * 100) / 100);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatCurrency(end);
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

function formatCurrency(amount) {
    const currencySymbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$'
    };
    
    const symbol = currencySymbols[currentCurrency] || '₹';
    const convertedAmount = convertCurrency(amount);
    
    return `${symbol}${formatNumber(convertedAmount)}`;
}

function convertCurrency(amount) {
    if (currentCurrency === 'INR' || !exchangeRates[currentCurrency]) {
        return amount;
    }
    
    // Convert from INR to target currency
    const rate = exchangeRates[currentCurrency];
    return amount * rate;
}

function convertToINR(amount, fromCurrency) {
    if (fromCurrency === 'INR' || !exchangeRates[fromCurrency]) {
        return amount;
    }
    
    // Convert from target currency to INR
    const rate = exchangeRates[fromCurrency];
    return amount / rate;
}

function updateCurrencyDisplay() {
    const currencySymbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$'
    };
    
    const symbol = currencySymbols[currentCurrency] || '₹';
    
    // Update form label
    const amountLabel = document.querySelector('label[for="expenseAmount"]');
    if (amountLabel) {
        amountLabel.innerHTML = `Amount <span class="currency-symbol">${symbol}</span>`;
    }
    
    // Update header button
    const currencyDisplay = document.getElementById('currencyDisplay');
    if (currencyDisplay) {
        currencyDisplay.textContent = currentCurrency;
    }
}

function loadExchangeRates() {
    ratesLoading.style.display = 'flex';
    ratesContent.style.display = 'none';
    
    // For demo purposes, using static exchange rates
    // In a real app, you'd fetch from an API like exchangerate-api.com
    const mockRates = {
        'USD': 0.012,
        'EUR': 0.011,
        'GBP': 0.0096,
        'JPY': 1.75,
        'CAD': 0.016,
        'AUD': 0.018
    };
    
    // Simulate API delay
    setTimeout(() => {
        exchangeRates = mockRates;
        localStorage.setItem('exchangeRates', JSON.stringify(exchangeRates));
        localStorage.setItem('lastRatesUpdate', Date.now().toString());
        
        // Update UI
        usdRate.textContent = `1 USD = ₹${formatNumber(1 / mockRates.USD)}`;
        eurRate.textContent = `1 EUR = ₹${formatNumber(1 / mockRates.EUR)}`;
        gbpRate.textContent = `1 GBP = ₹${formatNumber(1 / mockRates.GBP)}`;
        jpyRate.textContent = `1 JPY = ₹${formatNumber(1 / mockRates.JPY)}`;
        cadRate.textContent = `1 CAD = ₹${formatNumber(1 / mockRates.CAD)}`;
        audRate.textContent = `1 AUD = ₹${formatNumber(1 / mockRates.AUD)}`;
        
        ratesLoading.style.display = 'none';
        ratesContent.style.display = 'block';
    }, 1500);
}

function generateInsights() {
    insightsLoading.style.display = 'flex';
    insightsContent.style.display = 'none';
    
    // Simulate processing delay
    setTimeout(() => {
        const filteredExpenses = getFilteredExpenses();
        
        if (filteredExpenses.length === 0) {
            weeklyTrendValue.textContent = 'No data';
            weeklyTrendValue.className = 'insight-value neutral';
            monthlyTrendValue.textContent = 'No data';
            monthlyTrendValue.className = 'insight-value neutral';
            highestDayValue.textContent = 'No data';
            topCategoryValue.textContent = 'No data';
            recommendation1Text.textContent = 'Add some expenses to see insights!';
            recommendation2Text.textContent = 'Track your spending to get personalized recommendations.';
        } else {
            // Calculate insights
            const insights = calculateInsights(filteredExpenses);
            
            // Update UI
            weeklyTrendValue.textContent = insights.weeklyTrend;
            weeklyTrendValue.className = `insight-value ${insights.weeklyTrendClass}`;
            
            monthlyTrendValue.textContent = insights.monthlyTrend;
            monthlyTrendValue.className = `insight-value ${insights.monthlyTrendClass}`;
            
            highestDayValue.textContent = insights.highestDay;
            topCategoryValue.textContent = insights.topCategory;
            
            recommendation1Text.textContent = insights.recommendation1;
            recommendation2Text.textContent = insights.recommendation2;
        }
        
        insightsLoading.style.display = 'none';
        insightsContent.style.display = 'block';
    }, 2000);
}

function calculateInsights(expenses) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter expenses by time periods
    const thisWeekExpenses = expenses.filter(e => new Date(e.date) >= weekAgo);
    const lastWeekExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && date < weekAgo;
    });
    
    const thisMonthExpenses = expenses.filter(e => new Date(e.date) >= monthAgo);
    const lastMonthExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date >= new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000) && date < monthAgo;
    });
    
    // Calculate totals
    const thisWeekTotal = thisWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastWeekTotal = lastWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Weekly trend
    let weeklyTrend = 'No data';
    let weeklyTrendClass = 'neutral';
    if (lastWeekTotal > 0) {
        const weeklyChange = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
        if (weeklyChange > 5) {
            weeklyTrend = `↑ ${weeklyChange.toFixed(1)}%`;
            weeklyTrendClass = 'negative';
        } else if (weeklyChange < -5) {
            weeklyTrend = `↓ ${Math.abs(weeklyChange).toFixed(1)}%`;
            weeklyTrendClass = 'positive';
        } else {
            weeklyTrend = 'Stable';
            weeklyTrendClass = 'neutral';
        }
    }
    
    // Monthly trend
    let monthlyTrend = 'No data';
    let monthlyTrendClass = 'neutral';
    if (lastMonthTotal > 0) {
        const monthlyChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        if (monthlyChange > 5) {
            monthlyTrend = `↑ ${monthlyChange.toFixed(1)}%`;
            monthlyTrendClass = 'negative';
        } else if (monthlyChange < -5) {
            monthlyTrend = `↓ ${Math.abs(monthlyChange).toFixed(1)}%`;
            monthlyTrendClass = 'positive';
        } else {
            monthlyTrend = 'Stable';
            monthlyTrendClass = 'neutral';
        }
    }
    
    // Highest spending day
    const dayTotals = {};
    expenses.forEach(e => {
        const day = new Date(e.date).toLocaleDateString('en-US', { weekday: 'long' });
        dayTotals[day] = (dayTotals[day] || 0) + e.amount;
    });
    
    const highestDay = Object.entries(dayTotals).reduce((max, [day, total]) => 
        total > max.total ? { day, total } : max, 
        { day: 'None', total: 0 }
    );
    
    const highestDayStr = highestDay.total > 0 ? 
        `${highestDay.day} (${formatCurrency(highestDay.total)})` : 'No data';
    
    // Top category
    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    
    const topCategory = Object.entries(categoryTotals).reduce((max, [cat, total]) => 
        total > max.total ? { cat, total } : max, 
        { cat: 'None', total: 0 }
    );
    
    const topCategoryStr = topCategory.total > 0 ? 
        `${topCategory.cat} (${formatCurrency(topCategory.total)})` : 'No data';
    
    // Generate recommendations
    let recommendation1 = 'Keep tracking your expenses regularly!';
    let recommendation2 = 'Try to categorize all your expenses properly.';
    
    if (thisWeekTotal > lastWeekTotal * 1.2) {
        recommendation1 = 'Your spending increased significantly this week. Consider reviewing your budget.';
    } else if (thisWeekTotal < lastWeekTotal * 0.8) {
        recommendation1 = 'Great job reducing your spending this week!';
    }
    
    const avgExpense = thisWeekTotal / thisWeekExpenses.length;
    if (avgExpense > 500) {
        recommendation2 = 'Your average expense per transaction is high. Look for ways to reduce costs.';
    } else if (thisWeekExpenses.length < 3) {
        recommendation2 = 'You have few expenses this week. Consider adding more transactions for better insights.';
    }
    
    return {
        weeklyTrend,
        weeklyTrendClass,
        monthlyTrend,
        monthlyTrendClass,
        highestDay: highestDayStr,
        topCategory: topCategoryStr,
        recommendation1,
        recommendation2
    };
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
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
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

// Insights Modal functionality
insightsBtn.addEventListener("click", () => {
    insightsModal.classList.add("active");
    generateInsights();
});

closeInsights.addEventListener("click", () => {
    insightsModal.classList.remove("active");
});

insightsModal.addEventListener("click", (e) => {
    if (e.target === insightsModal || e.target.classList.contains("insights-overlay")) {
        insightsModal.classList.remove("active");
    }
});

// Currency Modal functionality
currencyBtn.addEventListener("click", () => {
    currencyModal.classList.add("active");
    currencySelect.value = currentCurrency;
    loadExchangeRates();
});

closeCurrency.addEventListener("click", () => {
    currencyModal.classList.remove("active");
});

currencyModal.addEventListener("click", (e) => {
    if (e.target === currencyModal || e.target.classList.contains("currency-overlay")) {
        currencyModal.classList.remove("active");
    }
});

// Currency selection change
currencySelect.addEventListener("change", () => {
    loadExchangeRates();
});

// Reset currency button
resetCurrencyBtn.addEventListener("click", () => {
    currentCurrency = "INR";
    localStorage.setItem("currentCurrency", currentCurrency);
    currencySelect.value = currentCurrency;
    updateCurrencyDisplay();
    saveAndRender();
    currencyModal.classList.remove("active");
});

// Apply currency button
applyCurrencyBtn.addEventListener("click", () => {
    currentCurrency = currencySelect.value;
    localStorage.setItem("currentCurrency", currentCurrency);
    updateCurrencyDisplay();
    saveAndRender();
    currencyModal.classList.remove("active");
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
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
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
                <span class="amount">${formatCurrency(e.amount)}</span>
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

// Insights generation function
function generateInsights() {
    insightsLoading.style.display = "flex";
    insightsContent.style.display = "none";
    
    setTimeout(() => {
        const filteredExpenses = getFilteredExpenses();
        
        if (filteredExpenses.length === 0) {
            weeklyTrendValue.textContent = "No data";
            monthlyTrendValue.textContent = "No data";
            highestDayValue.textContent = "No data";
            topCategoryValue.textContent = "No data";
            recommendation1Text.textContent = "Add some expenses to see insights!";
            recommendation2Text.textContent = "Track your spending to get personalized recommendations.";
        } else {
            // Calculate weekly trend
            const thisWeek = getThisWeekExpenses();
            const lastWeek = getLastWeekExpenses();
            const thisWeekTotal = thisWeek.reduce((sum, exp) => sum + exp.amount, 0);
            const lastWeekTotal = lastWeek.reduce((sum, exp) => sum + exp.amount, 0);
            
            if (lastWeekTotal > 0) {
                const weeklyChange = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
                weeklyTrendValue.textContent = `${weeklyChange >= 0 ? '↑' : '↓'} ${Math.abs(weeklyChange).toFixed(1)}%`;
                weeklyTrendValue.className = `insight-value ${weeklyChange >= 0 ? 'positive' : 'negative'}`;
            } else {
                weeklyTrendValue.textContent = "New week";
                weeklyTrendValue.className = "insight-value neutral";
            }
            
            // Calculate monthly trend (simplified)
            const thisMonth = getThisMonthExpenses();
            const lastMonth = getLastMonthExpenses();
            const thisMonthTotal = thisMonth.reduce((sum, exp) => sum + exp.amount, 0);
            const lastMonthTotal = lastMonth.reduce((sum, exp) => sum + exp.amount, 0);
            
            if (lastMonthTotal > 0) {
                const monthlyChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
                monthlyTrendValue.textContent = `${monthlyChange >= 0 ? '↑' : '↓'} ${Math.abs(monthlyChange).toFixed(1)}%`;
                monthlyTrendValue.className = `insight-value ${monthlyChange >= 0 ? 'positive' : 'negative'}`;
            } else {
                monthlyTrendValue.textContent = "New month";
                monthlyTrendValue.className = "insight-value neutral";
            }
            
            // Find highest spending day
            const dayTotals = {};
            filteredExpenses.forEach(exp => {
                const date = new Date(exp.date).toDateString();
                dayTotals[date] = (dayTotals[date] || 0) + exp.amount;
            });
            
            const highestDay = Object.entries(dayTotals).reduce((max, [day, total]) => 
                total > max.total ? { day, total } : max, 
                { day: '', total: 0 }
            );
            
            if (highestDay.total > 0) {
                const dayName = new Date(highestDay.day).toLocaleDateString('en-US', { weekday: 'long' });
                highestDayValue.textContent = `${dayName} (${formatCurrency(highestDay.total)})`;
            } else {
                highestDayValue.textContent = "No data";
            }
            
            // Find top category
            const categoryTotals = {};
            filteredExpenses.forEach(exp => {
                categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
            });
            
            const topCategory = Object.entries(categoryTotals).reduce((max, [cat, total]) => 
                total > max.total ? { category: cat, total } : max, 
                { category: '', total: 0 }
            );
            
            if (topCategory.total > 0) {
                topCategoryValue.textContent = `${topCategory.category} (${formatCurrency(topCategory.total)})`;
            } else {
                topCategoryValue.textContent = "No data";
            }
            
            // Generate recommendations
            generateRecommendations(filteredExpenses, thisWeekTotal, lastWeekTotal);
        }
        
        insightsLoading.style.display = "none";
        insightsContent.style.display = "block";
    }, 1500); // Simulate loading time
}

function getThisWeekExpenses() {
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    return expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startOfWeek && expDate <= endOfWeek;
    });
}

function getLastWeekExpenses() {
    const now = new Date();
    const startOfLastWeek = getStartOfWeek(now);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
    
    return expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startOfLastWeek && expDate <= endOfLastWeek;
    });
}

function getThisMonthExpenses() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startOfMonth && expDate <= endOfMonth;
    });
}

function getLastMonthExpenses() {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startOfLastMonth && expDate <= endOfLastMonth;
    });
}

function generateRecommendations(expenses, thisWeekTotal, lastWeekTotal) {
    const recommendations = [];
    
    // Budget recommendation
    const dailyAverage = thisWeekTotal / 7;
    if (dailyAverage > 500) {
        recommendations.push("Consider setting a daily spending limit to better control your expenses.");
    } else if (dailyAverage < 100) {
        recommendations.push("Great job keeping your daily spending low!");
    } else {
        recommendations.push("Your spending is moderate. Keep tracking to maintain good habits.");
    }
    
    // Category recommendation
    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    
    const topCategory = Object.entries(categoryTotals).reduce((max, [cat, total]) => 
        total > max.total ? { category: cat, total } : max, 
        { category: '', total: 0 }
    );
    
    if (topCategory.category === 'Food') {
        recommendations.push("Food is your biggest expense. Try meal planning to reduce costs.");
    } else if (topCategory.category === 'Shopping') {
        recommendations.push("Shopping takes up most of your budget. Consider waiting periods before purchases.");
    } else if (topCategory.category === 'Travel') {
        recommendations.push("Travel expenses are high. Look for deals or alternative transportation.");
    } else {
        recommendations.push("Keep monitoring your expenses to identify saving opportunities.");
    }
    
    recommendation1Text.textContent = recommendations[0] || "Keep tracking your expenses!";
    recommendation2Text.textContent = recommendations[1] || "Add more expenses to get better insights.";
}

// Currency functions
function loadExchangeRates() {
    ratesLoading.style.display = "flex";
    ratesContent.style.display = "none";
    
    const selectedCurrency = currencySelect.value;
    
    if (selectedCurrency === "INR") {
        // No conversion needed for INR
        usdRate.textContent = "1 USD = 1 INR";
        eurRate.textContent = "1 EUR = 1 INR";
        gbpRate.textContent = "1 GBP = 1 INR";
        jpyRate.textContent = "1 JPY = 1 INR";
        cadRate.textContent = "1 CAD = 1 INR";
        audRate.textContent = "1 AUD = 1 INR";
        ratesLoading.style.display = "none";
        ratesContent.style.display = "block";
        return;
    }
    
    // Check if we have recent rates (within 24 hours)
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (exchangeRates[selectedCurrency] && lastRatesUpdate && (now - lastRatesUpdate) < oneDay) {
        displayExchangeRates(exchangeRates[selectedCurrency]);
        return;
    }
    
    // Fetch new rates (using a free API - in production, you'd want a more reliable service)
    fetch(`https://api.exchangerate-api.com/v4/latest/${selectedCurrency}`)
        .then(response => response.json())
        .then(data => {
            exchangeRates[selectedCurrency] = data.rates;
            lastRatesUpdate = now;
            localStorage.setItem("exchangeRates", JSON.stringify(exchangeRates));
            localStorage.setItem("lastRatesUpdate", lastRatesUpdate.toString());
            displayExchangeRates(data.rates);
        })
        .catch(error => {
            console.error("Failed to fetch exchange rates:", error);
            // Fallback to cached rates or show error
            if (exchangeRates[selectedCurrency]) {
                displayExchangeRates(exchangeRates[selectedCurrency]);
            } else {
                usdRate.textContent = "Error loading rates";
                eurRate.textContent = "Error loading rates";
                gbpRate.textContent = "Error loading rates";
                jpyRate.textContent = "Error loading rates";
                cadRate.textContent = "Error loading rates";
                audRate.textContent = "Error loading rates";
            }
            ratesLoading.style.display = "none";
            ratesContent.style.display = "block";
        });
}

function displayExchangeRates(rates) {
    const baseCurrency = currencySelect.value;
    
    usdRate.textContent = `1 ${baseCurrency} = ${rates.USD ? rates.USD.toFixed(2) : 'N/A'} USD`;
    eurRate.textContent = `1 ${baseCurrency} = ${rates.EUR ? rates.EUR.toFixed(2) : 'N/A'} EUR`;
    gbpRate.textContent = `1 ${baseCurrency} = ${rates.GBP ? rates.GBP.toFixed(2) : 'N/A'} GBP`;
    jpyRate.textContent = `1 ${baseCurrency} = ${rates.JPY ? rates.JPY.toFixed(2) : 'N/A'} JPY`;
    cadRate.textContent = `1 ${baseCurrency} = ${rates.CAD ? rates.CAD.toFixed(2) : 'N/A'} CAD`;
    audRate.textContent = `1 ${baseCurrency} = ${rates.AUD ? rates.AUD.toFixed(2) : 'N/A'} AUD`;
    
    ratesLoading.style.display = "none";
    ratesContent.style.display = "block";
}

function updateCurrencyDisplay() {
    const currencySymbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$'
    };
    
    const symbol = currencySymbols[currentCurrency] || '₹';
    
    // Update form label
    const amountLabel = document.querySelector('label[for="expenseAmount"]');
    if (amountLabel) {
        amountLabel.innerHTML = `Amount <span class="currency-symbol">${symbol}</span>`;
    }
    
    // Update header button
    const currencyDisplay = document.getElementById('currencyDisplay');
    if (currencyDisplay) {
        currencyDisplay.textContent = currentCurrency;
    }
}

function formatCurrency(amount) {
    const currencySymbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$'
    };
    
    const symbol = currencySymbols[currentCurrency] || '₹';
    
    if (currentCurrency === 'INR') {
        return `${symbol}${formatNumber(amount)}`;
    }
    
    // Convert amount if not INR
    const rate = exchangeRates[currentCurrency] ? exchangeRates[currentCurrency].INR : 1;
    const convertedAmount = amount / rate;
    
    return `${symbol}${formatNumber(convertedAmount)}`;
}

// Update formatNumber to handle currency conversion
function formatNumber(num) {
    return num.toLocaleString('en-IN', { 
        maximumFractionDigits: 2,
        minimumFractionDigits: num % 1 === 0 ? 0 : 2
    });
}

// Initialize
updateCurrentWeek();
renderExpenses();
updateChart();
updateExpenseCount();
updateSummary();
updateCurrencyDisplay();