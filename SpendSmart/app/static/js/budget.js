// Budget Management Functions
let currentBudget = null;

// Initialize budget management
function initBudgetManagement() {
    // Setup budget form submission
    document.getElementById('budgetForm').addEventListener('submit', handleBudgetSubmit);
    
    // Load existing budget on page load
    loadBudgetStatus();
}

// Handle budget form submission
async function handleBudgetSubmit(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    const alertThreshold = parseInt(document.getElementById('budgetAlertThreshold').value);
    
    // Validation
    if (!amount || amount <= 0) {
        showAlert('Please enter a valid budget amount', 'warning');
        return;
    }
    
    if (alertThreshold < 50 || alertThreshold > 100) {
        showAlert('Alert threshold must be between 50% and 100%', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/budget', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                alert_threshold: alertThreshold
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Budget set successfully!', 'success');
            currentBudget = result.data;
            
            // Update budget status display
            loadBudgetStatus();
            
            // Reset form
            document.getElementById('budgetForm').reset();
            document.getElementById('budgetAlertThreshold').value = 80;
            
        } else {
            showAlert(result.error || 'Failed to set budget', 'danger');
        }
    } catch (error) {
        console.error('Error setting budget:', error);
        showAlert('Failed to set budget', 'danger');
    }
}

// Load budget status
async function loadBudgetStatus() {
    try {
        const response = await fetch('/api/budget/status');
        const result = await response.json();
        
        if (result.success) {
            updateBudgetStatus(result.data);
        } else {
            console.error('Failed to load budget status:', result.error);
        }
    } catch (error) {
        console.error('Error loading budget status:', error);
    }
}

// Update budget status display
function updateBudgetStatus(data) {
    const budgetStatusDiv = document.getElementById('budgetStatus');
    const budgetAlertsSection = document.getElementById('budgetAlertsSection');
    const budgetAlertsDiv = document.getElementById('budgetAlerts');
    
    if (!data.budget_set) {
        // No budget set
        budgetStatusDiv.innerHTML = `
            <div class="text-center text-muted">
                <i class="bi bi-wallet2" style="font-size: 2rem;"></i>
                <p class="mt-2 mb-0">No budget set</p>
                <small>Set a monthly budget to track your spending</small>
            </div>
        `;
        budgetAlertsSection.style.display = 'none';
        return;
    }
    
    // Budget is set - show status
    const statusColor = data.status === 'exceeded' ? 'danger' : 
                       data.status === 'warning' ? 'warning' : 'success';
    
    const statusIcon = data.status === 'exceeded' ? 'bi-exclamation-triangle-fill' :
                      data.status === 'warning' ? 'bi-exclamation-triangle' : 'bi-check-circle-fill';
    
    const statusText = data.status === 'exceeded' ? 'Budget Exceeded' :
                      data.status === 'warning' ? 'Budget Warning' : 'On Track';
    
    budgetStatusDiv.innerHTML = `
        <div class="row">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 fw-bold">${data.month}</h6>
                    <span class="badge bg-${statusColor}">
                        <i class="bi ${statusIcon} me-1"></i>${statusText}
                    </span>
                </div>
                
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="fw-medium">Spent</span>
                        <span class="fw-bold text-${statusColor}">Rs. ${data.total_spent.toFixed(2)}</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-${statusColor}" 
                             style="width: ${Math.min(data.spent_percentage, 100)}%" 
                             role="progressbar">
                        </div>
                    </div>
                    <div class="d-flex justify-content-between mt-1">
                        <small class="text-muted">${data.spent_percentage.toFixed(1)}% of budget</small>
                        <small class="text-muted">Rs. ${data.budget_amount.toFixed(2)}</small>
                    </div>
                </div>
                
                <div class="row text-center">
                    <div class="col-6">
                        <div class="border-end">
                            <h6 class="mb-0 text-success">Rs. ${data.remaining_amount.toFixed(2)}</h6>
                            <small class="text-muted">Remaining</small>
                        </div>
                    </div>
                    <div class="col-6">
                        <h6 class="mb-0 text-primary">${data.alert_threshold}%</h6>
                        <small class="text-muted">Alert Threshold</small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Show alerts if any
    if (data.alerts && data.alerts.length > 0) {
        budgetAlertsDiv.innerHTML = data.alerts.map(alert => `
            <div class="alert alert-${alert.type} alert-dismissible fade show mb-2" role="alert">
                <i class="bi ${alert.icon} me-2"></i>
                ${alert.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `).join('');
        
        budgetAlertsSection.style.display = 'block';
        
        // Show toast notification for alerts
        data.alerts.forEach(alert => {
            showAlert(alert.message, alert.type);
        });
    } else {
        budgetAlertsSection.style.display = 'none';
    }
}

// Load existing budget on page load
async function loadExistingBudget() {
    try {
        const response = await fetch('/api/budget');
        const result = await response.json();
        
        if (result.success && result.data) {
            currentBudget = result.data;
            
            // Pre-fill form with existing budget
            document.getElementById('budgetAmount').value = result.data.amount;
            document.getElementById('budgetAlertThreshold').value = result.data.alert_threshold;
        }
    } catch (error) {
        console.error('Error loading existing budget:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initBudgetManagement();
    loadExistingBudget();
});
