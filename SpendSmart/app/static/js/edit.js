// Edit Expense Functions
function editExpense(id) {
    // Find the expense by ID
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    const expense = expenses.find(exp => exp.id === id);
    
    if (!expense) {
        showAlert('Expense not found', 'danger');
        return;
    }
    
    // Populate the edit form
    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('editItemName').value = expense.item;
    document.getElementById('editAmount').value = expense.amount;
    document.getElementById('editCategory').value = expense.category;
    document.getElementById('editDate').value = expense.date;
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('editExpenseModal'));
    modal.show();
    
    // Setup AI categorization for edit form
    setupEditAICategorization();
}

function setupEditAICategorization() {
    // Setup AI categorization button
    document.getElementById('editAiCategorizeBtn').onclick = handleEditAICategorization;
    
    // Setup auto-categorization on blur
    document.getElementById('editItemName').onblur = handleEditAutoCategorization;
}

async function handleEditAICategorization() {
    const itemName = document.getElementById('editItemName').value.trim();
    const amount = document.getElementById('editAmount').value;
    
    if (!itemName) {
        showAlert('Please enter an item name first', 'warning');
        return;
    }
    
    // Show loading state
    const aiIcon = document.getElementById('editAiIcon');
    const aiLoading = document.getElementById('editAiLoading');
    const aiBtn = document.getElementById('editAiCategorizeBtn');
    
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
            document.getElementById('editCategory').value = category;
            
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

async function handleEditAutoCategorization() {
    const itemName = document.getElementById('editItemName').value.trim();
    const category = document.getElementById('editCategory').value;
    
    // Only auto-categorize if no category is selected and item name is provided
    if (!category && itemName) {
        // Show loading state
        const aiIcon = document.getElementById('editAiIcon');
        const aiLoading = document.getElementById('editAiLoading');
        const aiBtn = document.getElementById('editAiCategorizeBtn');
        
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
                document.getElementById('editCategory').value = category;
                
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

function showEditAISuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('editAiSuggestions');
    const buttonsDiv = document.getElementById('editSuggestionButtons');
    
    buttonsDiv.innerHTML = '';
    
    suggestions.forEach((suggestion, index) => {
        const button = document.createElement('button');
        button.className = 'btn btn-sm btn-outline-secondary';
        button.textContent = `${suggestion.category} (${Math.round(suggestion.confidence * 100)}%)`;
        button.title = suggestion.reason;
        
        button.addEventListener('click', () => {
            document.getElementById('editCategory').value = suggestion.category;
            suggestionsDiv.style.display = 'none';
        });
        
        buttonsDiv.appendChild(button);
    });
    
    suggestionsDiv.style.display = 'block';
}

async function saveEditExpense() {
    const id = document.getElementById('editExpenseId').value;
    const item = document.getElementById('editItemName').value.trim();
    const amount = parseFloat(document.getElementById('editAmount').value);
    const category = document.getElementById('editCategory').value;
    const date = document.getElementById('editDate').value;
    
    // Validation
    if (!item || !amount || !category || !date) {
        showAlert('Please fill in all fields', 'warning');
        return;
    }
    
    if (amount <= 0) {
        showAlert('Amount must be greater than 0', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/expenses/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item: item,
                amount: amount,
                category: category,
                date: date
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Expense updated successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editExpenseModal'));
            modal.hide();
            
            // Refresh the expenses list
            loadExpenses();
        } else {
            showAlert(result.error || 'Failed to update expense', 'danger');
        }
    } catch (error) {
        console.error('Error updating expense:', error);
        showAlert('Failed to update expense', 'danger');
    }
}
