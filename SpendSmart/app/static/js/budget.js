// Budget Management Functions
window.currentBudget = window.currentBudget || null;
let budgetInitDone = false;
let isBudgetSubmitting = false;

// Initialize budget management
function initBudgetManagement() {
    if (budgetInitDone) return; // prevent double-binding
    const form = document.getElementById('budgetForm');
    if (!form) return;
    // Setup budget form submission (single binding)
    form.addEventListener('submit', handleBudgetSubmit);
    budgetInitDone = true;
    // Load existing budget on page load
    loadBudgetStatus();
}

// Handle budget form submission
async function handleBudgetSubmit(e) {
    e.preventDefault();
    if (isBudgetSubmitting) return; // prevent duplicate POSTs
    isBudgetSubmitting = true;
    
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
        
        let result = null;
        try {
            result = await response.json();
        } catch (parseErr) {
            console.error('Failed to parse budget response:', parseErr);
        }
        
        if (response.ok && result && result.success) {
            showAlert('Budget set successfully!', 'success');
            window.currentBudget = result.data;
            
            // Update budget status display
            loadBudgetStatus();
            
            // Refresh charts to show new budget threshold line
            if (typeof updateVisualizations === 'function') {
                const selectedPeriod = document.querySelector('input[name="chartFilter"]:checked')?.value || 'month';
                updateVisualizations(selectedPeriod);
            }
            
            // Reset form
            document.getElementById('budgetForm').reset();
            document.getElementById('budgetAlertThreshold').value = 80;
            
        } else {
            const errMsg = (result && (result.error || result.message)) || `Failed to set budget (HTTP ${response.status})`;
            showAlert(errMsg, 'danger');
        }
    } catch (error) {
        console.error('Error setting budget:', error);
        showAlert('Failed to set budget', 'danger');
    } finally {
        isBudgetSubmitting = false;
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
        if (budgetAlertsSection) budgetAlertsSection.style.display = 'none';
        return;
    }
    
    // Budget is set - show status (minimal design, no Bootstrap grid)
    const statusColor = data.status === 'exceeded' ? 'danger' : 
                       data.status === 'warning' ? 'warning' : 'success';
    const statusIcon = data.status === 'exceeded' ? 'bi-exclamation-triangle-fill' :
                      data.status === 'warning' ? 'bi-exclamation-triangle' : 'bi-check-circle-fill';
    const statusText = data.status === 'exceeded' ? 'Budget Exceeded' :
                      data.status === 'warning' ? 'Budget Warning' : 'On Track';

    const pct = Math.min(data.spent_percentage, 100);

    budgetStatusDiv.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 0.75rem;">
            <h6 style="margin:0; font-weight:600;">${data.month}</h6>
            <span class="badge bg-${statusColor}" style="display:inline-flex; align-items:center; gap:6px;">
                <i class="bi ${statusIcon}"></i><span>${statusText}</span>
            </span>
        </div>
        <div style="margin-bottom: 0.75rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                <span style="font-weight:500;">Spent</span>
                <span class="text-${statusColor}" style="font-weight:600;">₹ ${data.total_spent.toFixed(2)}</span>
            </div>
            <div class="progress" style="height:8px;">
                <div class="progress-bar bg-${statusColor}" style="width:${pct}%"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:6px;">
                <small class="text-muted">${data.spent_percentage.toFixed(1)}% of budget</small>
                <small class="text-muted">₹ ${data.budget_amount.toFixed(2)}</small>
            </div>
        </div>
        <div style="display:flex; gap: 16px; text-align:center;">
            <div style="flex:1; padding-right:8px; border-right:1px solid rgba(0,0,0,0.08);">
                <div class="text-success" style="font-weight:600;">₹ ${data.remaining_amount.toFixed(2)}</div>
                <small class="text-muted">Remaining</small>
            </div>
            <div style="flex:1; padding-left:8px;">
                <div class="text-primary" style="font-weight:600;">${data.alert_threshold}%</div>
                <small class="text-muted">Alert Threshold</small>
            </div>
        </div>
    `;
    
    // Show alerts if any
    if (data.alerts && data.alerts.length > 0) {
        if (budgetAlertsDiv) {
            budgetAlertsDiv.innerHTML = data.alerts.map(alert => `
                <div class="alert alert-${alert.type} alert-dismissible fade show mb-2" role="alert">
                    <i class="bi ${alert.icon} me-2"></i>
                    ${alert.message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `).join('');
        }
        if (budgetAlertsSection) {
            budgetAlertsSection.style.display = 'block';
        }
        // Always show toast notifications even if section elements are absent
        data.alerts.forEach(alert => {
            if (typeof showAlert === 'function') {
                showAlert(alert.message, alert.type);
            }
        });
    } else {
        if (budgetAlertsSection) budgetAlertsSection.style.display = 'none';
    }
}

// Load existing budget on page load
async function loadExistingBudget() {
    try {
        const response = await fetch('/api/budget');
        const result = await response.json();
        
        if (result.success && result.data) {
            window.currentBudget = result.data;
            
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
