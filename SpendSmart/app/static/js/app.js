// SpendSmart - Expense Tracker JavaScript

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    // Load expenses on page load
    loadExpenses();
    
    // Setup form submit handler
    document.getElementById('expenseForm').addEventListener('submit', handleFormSubmit);
    
    // Setup AI categorization
    document.getElementById('aiCategorizeBtn').addEventListener('click', handleAICategorization);
    
    // Setup item name input for auto-categorization
    document.getElementById('itemName').addEventListener('blur', handleAutoCategorization);
    
    // Setup insights period selector
    document.querySelectorAll('input[name="insightPeriod"]').forEach(radio => {
        radio.addEventListener('change', handleInsightPeriodChange);
    });
    
    // Setup chart filters
    if (typeof setupChartFilters === 'function') {
        setupChartFilters();
    }
    
    // Load initial insights
    loadInsights('week');
    
    // Initialize budget management
    if (typeof initBudgetManagement === 'function') {
        initBudgetManagement();
    }
});

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const itemName = document.getElementById('itemName').value.trim();
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    
    // Validate inputs
    if (!itemName || !amount || !date) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }
    
    let finalCategory = category;
    
    // If no category is selected, try AI categorization before submitting
    if (!category && itemName) {
        try {
            const response = await fetch('/api/categorize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ item: itemName })
            });
            
            const result = await response.json();
            
            if (result.success) {
                finalCategory = result.data.category;
                document.getElementById('category').value = finalCategory;
                
                // Show AI reasoning
                showAlert(`AI categorized as: ${finalCategory} (${Math.round(result.data.confidence * 100)}% confidence)`, 'info');
            }
        } catch (error) {
            console.error('AI categorization error:', error);
        }
    }
    
    // If still no category, show error
    if (!finalCategory) {
        showAlert('Please select a category', 'danger');
        return;
    }
    
    // Create expense object
    const expense = {
        item: itemName,
        category: finalCategory,
        amount: amount,
        date: date
    };
    
    try {
        // Add expense via API
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expense)
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showAlert('Expense added successfully!', 'success');
                document.getElementById('expenseForm').reset();
                document.getElementById('date').valueAsDate = new Date();
                
                    // Hide AI suggestions if visible
                    document.getElementById('aiSuggestions').style.display = 'none';
                    
                    loadExpenses();
                    loadBudgetStatus();
            } else {
                showAlert(result.error || 'Failed to add expense', 'danger');
            }
        } else {
            const errorResult = await response.json();
            showAlert(errorResult.error || 'Failed to add expense', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('An error occurred', 'danger');
    }
}

// Load all expenses
async function loadExpenses() {
    try {
        const response = await fetch('/api/expenses');
        const result = await response.json();
        
        // Handle new API response format
        const expenses = result.success ? result.data : [];
        
        // Store in localStorage as backup
        localStorage.setItem('expenses', JSON.stringify(expenses));
        
        displayExpenses(expenses);
        updateStatistics(expenses);
        updateCategoryBreakdown(expenses);
        updateVisualizations('month');
        updateInsights();
        loadBudgetStatus();
    } catch (error) {
        console.error('Error loading expenses:', error);
        // Fallback to localStorage
        const localExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        displayExpenses(localExpenses);
        updateStatistics(localExpenses);
        updateCategoryBreakdown(localExpenses);
    }
}

// Display expenses in table
function displayExpenses(expenses) {
    const tbody = document.getElementById('expenseTableBody');
    const expenseCount = document.getElementById('expenseCount');
    
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <div class="empty-state">
                        <i class="bi bi-receipt text-muted"></i>
                        <p class="text-muted">No expenses yet. Add your first expense above!</p>
                    </div>
                </td>
            </tr>
        `;
        expenseCount.textContent = '0 expenses';
        return;
    }
    
    // Sort expenses by date (newest first)
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    expenseCount.textContent = `${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`;
    
    tbody.innerHTML = expenses.map(expense => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="date-badge me-2">
                        <small class="text-muted">${formatDate(expense.date)}</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="item-icon me-2">
                        <i class="bi bi-receipt text-primary"></i>
                    </div>
                    <span class="fw-medium">${expense.item}</span>
                </div>
            </td>
            <td>
                <span class="badge bg-light text-dark border">${expense.category}</span>
            </td>
            <td class="text-end">
                <span class="fw-bold text-success">Rs. ${parseFloat(expense.amount).toFixed(2)}</span>
            </td>
            <td class="text-center">
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editExpense(${expense.id})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense(${expense.id})" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update statistics
function updateStatistics(expenses) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate today's total
    const todayTotal = expenses
        .filter(e => {
            const expenseDate = new Date(e.date);
            expenseDate.setHours(0, 0, 0, 0);
            return expenseDate.getTime() === today.getTime();
        })
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    // Calculate this week's total
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday
    
    const weekTotal = expenses
        .filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= weekStart;
        })
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    // Calculate this month's total
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthTotal = expenses
        .filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= monthStart;
        })
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    // Calculate total
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    // Update DOM
    document.getElementById('todayTotal').textContent = `Rs. ${todayTotal.toFixed(2)}`;
    document.getElementById('weekTotal').textContent = `Rs. ${weekTotal.toFixed(2)}`;
    document.getElementById('monthTotal').textContent = `Rs. ${monthTotal.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = expenses.length.toString();
}

// Update category breakdown
function updateCategoryBreakdown(expenses) {
    const breakdownDiv = document.getElementById('categoryBreakdown');
    
    // Check if element exists (may not be on all pages)
    if (!breakdownDiv) {
        return;
    }
    
    if (expenses.length === 0) {
        breakdownDiv.innerHTML = '<p class="text-muted text-center">No expenses added yet</p>';
        return;
    }
    
    // Calculate category totals
    const categoryTotals = {};
    let grandTotal = 0;
    
    expenses.forEach(expense => {
        const category = expense.category;
        const amount = parseFloat(expense.amount);
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        grandTotal += amount;
    });
    
    // Sort categories by amount (descending)
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);
    
    // Generate HTML
    breakdownDiv.innerHTML = sortedCategories.map(([category, amount]) => {
        const percentage = (amount / grandTotal * 100).toFixed(1);
        return `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span class="fw-medium">${category}</span>
                    <span class="h2 mb-0">Rs. ${amount.toFixed(2)} (${percentage}%)</span>
                </div>
                <div class="progress" style="height: 10px;">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${percentage}%;" 
                         aria-valuenow="${percentage}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Delete expense
async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/expenses/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const result = await response.json();
        if (result.success) {
            showAlert('Expense deleted successfully!', 'success');
            loadExpenses();
            loadBudgetStatus();
        } else {
            showAlert(result.error || 'Failed to delete expense', 'danger');
        }
        } else {
            const errorResult = await response.json();
            showAlert(errorResult.error || 'Failed to delete expense', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('An error occurred', 'danger');
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// AI Categorization Functions
async function handleAICategorization() {
    const itemName = document.getElementById('itemName').value.trim();
    const amount = document.getElementById('amount').value;
    
    if (!itemName) {
        showAlert('Please enter an item name first', 'warning');
        return;
    }
    
    // Show loading state
    const aiIcon = document.getElementById('aiIcon');
    const aiLoading = document.getElementById('aiLoading');
    const aiBtn = document.getElementById('aiCategorizeBtn');
    
    aiIcon.classList.add('d-none');
    aiLoading.classList.remove('d-none');
    aiBtn.disabled = true;
    
    try {
        const response = await fetch('/api/categorize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item: itemName,
                amount: amount ? parseFloat(amount) : null
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const category = result.data.category;
            document.getElementById('category').value = category;
            
            // Show AI reasoning
            showAlert(`AI categorized as: ${category} (${Math.round(result.data.confidence * 100)}% confidence)`, 'info');
        } else {
            showAlert('AI categorization not available. Please set GEMINI_API_KEY.', 'warning');
        }
    } catch (error) {
        console.error('AI categorization error:', error);
        showAlert('AI categorization failed', 'danger');
    } finally {
        // Hide loading state
        aiIcon.classList.remove('d-none');
        aiLoading.classList.add('d-none');
        aiBtn.disabled = false;
    }
}

async function handleAutoCategorization() {
    const itemName = document.getElementById('itemName').value.trim();
    const category = document.getElementById('category').value;
    
    // Only auto-categorize if no category is selected and item name is provided
    if (!category && itemName) {
        // Show loading state
        const aiIcon = document.getElementById('aiIcon');
        const aiLoading = document.getElementById('aiLoading');
        const aiBtn = document.getElementById('aiCategorizeBtn');
        
        aiIcon.classList.add('d-none');
        aiLoading.classList.remove('d-none');
        aiBtn.disabled = true;
        
        try {
            const response = await fetch('/api/categorize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ item: itemName })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const category = result.data.category;
                document.getElementById('category').value = category;
                
                // Show AI reasoning
                showAlert(`AI auto-categorized as: ${category} (${Math.round(result.data.confidence * 100)}% confidence)`, 'info');
            }
        } catch (error) {
            console.error('Auto-categorization error:', error);
        } finally {
            // Hide loading state
            aiIcon.classList.remove('d-none');
            aiLoading.classList.add('d-none');
            aiBtn.disabled = false;
        }
    }
}

function showAISuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('aiSuggestions');
    const buttonsDiv = document.getElementById('suggestionButtons');
    
    buttonsDiv.innerHTML = '';
    
    suggestions.forEach((suggestion, index) => {
        const button = document.createElement('button');
        button.className = 'btn btn-sm btn-outline-secondary';
        button.textContent = `${suggestion.category} (${Math.round(suggestion.confidence * 100)}%)`;
        button.title = suggestion.reason;
        
        button.addEventListener('click', () => {
            document.getElementById('category').value = suggestion.category;
            suggestionsDiv.style.display = 'none';
        });
        
        buttonsDiv.appendChild(button);
    });
    
    suggestionsDiv.style.display = 'block';
}

// Chart functions moved to charts.js for consolidation
