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
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Setup item name input for auto-categorization (built-in)
    const itemNameInput = document.getElementById('itemName');
    if (itemNameInput && typeof handleAutoCategorization === 'function') {
        itemNameInput.addEventListener('blur', handleAutoCategorization);
        // Also trigger on Enter key
        itemNameInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAutoCategorization();
            }
        });
    }
    
    // Setup insights period selector
    const insightRadios = document.querySelectorAll('input[name="insightPeriod"]');
    if (insightRadios.length > 0 && typeof handleInsightPeriodChange === 'function') {
        insightRadios.forEach(radio => {
            radio.addEventListener('change', handleInsightPeriodChange);
        });
    }
    
    // Setup chart filters
    if (typeof setupChartFilters === 'function') {
        setupChartFilters();
    }
    
    // Load initial insights if function exists
    if (typeof loadInsights === 'function') {
        loadInsights('week');
    }
    
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
        console.log('Adding expense:', expense);
        
        // Add expense via API
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expense)
        });
        
        console.log('Add expense response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Add expense failed:', response.status, errorText);
            showAlert('Failed to add expense', 'danger');
            return;
        }
        
        const result = await response.json();
        console.log('Add expense result:', result);
        
        if (result.success) {
            showAlert('Expense added successfully!', 'success');
            
            // Reset form
            document.getElementById('expenseForm').reset();
            document.getElementById('date').valueAsDate = new Date();
            
            // Hide AI suggestions if visible
            const aiSuggestions = document.getElementById('aiSuggestions');
            if (aiSuggestions) {
                aiSuggestions.style.display = 'none';
            }
            
            // Reload expenses
            await loadExpenses();
        } else {
            console.error('Add expense unsuccessful:', result);
            showAlert(result.error || 'Failed to add expense', 'danger');
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        showAlert('Error occurred while adding expense', 'danger');
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
        
        // Update visualizations if function exists
        if (typeof updateVisualizations === 'function') {
            updateVisualizations('month');
        }
        
        // Update insights if function exists
        if (typeof updateInsights === 'function') {
            updateInsights();
        }
        
        // Load budget status if function exists
        if (typeof loadBudgetStatus === 'function') {
            loadBudgetStatus();
        }
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
    const tbody = document.getElementById('expensesTableBody');
    
    if (!tbody) return;
    
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted" style="padding: 2rem;">
                    No expenses yet
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort expenses by date (newest first)
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = expenses.map(expense => `
        <tr>
            <td>${formatDate(expense.date)}</td>
            <td style="font-weight: 600;">${expense.item}</td>
            <td style="color: var(--color-text-light);">${expense.category}</td>
            <td style="font-weight: 700;">₹${parseFloat(expense.amount).toFixed(2)}</td>
            <td>
                <button class="btn btn-ghost" onclick="editExpense(${expense.id})" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">Edit</button>
                <button class="btn btn-ghost" onclick="deleteExpense(${expense.id})" style="padding: 0.25rem 0.5rem; font-size: 0.875rem; color: var(--color-danger);">Delete</button>
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
    const todayEl = document.getElementById('todayTotal');
    const weekEl = document.getElementById('weekTotal');
    const monthEl = document.getElementById('monthTotal');
    const totalEl = document.getElementById('totalExpenses');
    
    if (todayEl) todayEl.textContent = `₹${todayTotal.toFixed(0)}`;
    if (weekEl) weekEl.textContent = `₹${weekTotal.toFixed(0)}`;
    if (monthEl) monthEl.textContent = `₹${monthTotal.toFixed(0)}`;
    if (totalEl) totalEl.textContent = expenses.length.toString();
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
        console.log('Deleting expense:', id);
        const response = await fetch(`/api/expenses/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Delete response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delete failed:', response.status, errorText);
            showAlert('Failed to delete expense', 'danger');
            return;
        }
        
        const result = await response.json();
        console.log('Delete result:', result);
        
        if (result.success) {
            showAlert('Expense deleted successfully!', 'success');
            // Reload expenses to update the table
            await loadExpenses();
        } else {
            console.error('Delete unsuccessful:', result);
            showAlert(result.error || 'Failed to delete expense', 'danger');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        showAlert('Error occurred while deleting expense', 'danger');
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
    const container = document.getElementById('alertContainer') || document.body;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.marginBottom = '1rem';
    alertDiv.style.transition = 'opacity 0.15s ease';
    
    container.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 150);
    }, 3000);
}

// Auto-Categorization Function (Built-in)
async function handleAutoCategorization() {
    const itemNameInput = document.getElementById('itemName');
    const categorySelect = document.getElementById('category');
    const aiHint = document.getElementById('aiHint');
    
    if (!itemNameInput || !categorySelect) return;
    
    const itemName = itemNameInput.value.trim();
    const category = categorySelect.value;
    
    // Only auto-categorize if no category is selected and item name is provided
    if (!category && itemName && itemName.length >= 3) {
        console.log('Auto-categorizing item:', itemName);
        
        // Show loading hint
        if (aiHint) {
            aiHint.textContent = 'AI analyzing...';
            aiHint.style.display = 'inline';
        }
        
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
                const suggestedCategory = result.data.category;
                categorySelect.value = suggestedCategory;
                
                // Show AI hint
                if (aiHint) {
                    aiHint.textContent = `✓ AI suggested (${Math.round(result.data.confidence * 100)}% confidence)`;
                    aiHint.style.display = 'inline';
                    aiHint.style.color = 'var(--color-accent)';
                }
                
                console.log(`AI categorized as: ${suggestedCategory} (${Math.round(result.data.confidence * 100)}% confidence)`);
            }
        } catch (error) {
            console.error('Auto-categorization error:', error);
            if (aiHint) {
                aiHint.style.display = 'none';
            }
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
