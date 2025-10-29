// AI Insights Functions
async function loadInsights(period = 'week') {
    try {
        const response = await fetch(`/api/insights?period=${period}`);
        const result = await response.json();
        
        if (result.success) {
            displayInsights(result.data);
        } else {
            displayInsightsError(result.error || 'Failed to load insights');
        }
    } catch (error) {
        console.error('Error loading insights:', error);
        displayInsightsError('Failed to load insights');
    }
}

function displayInsights(data) {
    const insightsContent = document.getElementById('insightsContent');
    
    if (!data || !data.analytics) {
        displayInsightsError('No insights data available');
        return;
    }
    
    const { analytics, insights, recommendations, patterns, alerts } = data;
    
    let html = `
        <div class="row mb-4">
            <div class="col-md-3 mb-3">
                <div class="analytics-card text-center">
                    <div class="analytics-value">Rs. ${analytics.total_amount}</div>
                    <div class="analytics-label">Total Spending</div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="analytics-card text-center">
                    <div class="analytics-value">${analytics.total_expenses}</div>
                    <div class="analytics-label">Transactions</div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="analytics-card text-center">
                    <div class="analytics-value">Rs. ${analytics.avg_daily_spending}</div>
                    <div class="analytics-label">Daily Average</div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="analytics-card text-center">
                    <div class="analytics-value">${Object.keys(analytics.category_breakdown).length}</div>
                    <div class="analytics-label">Categories</div>
                </div>
            </div>
        </div>
    `;
    
    // Display insights
    if (insights && insights.length > 0) {
        html += '<div class="mb-4"><h6 class="text-primary mb-3"><i class="bi bi-lightbulb me-2"></i>Key Insights</h6>';
        insights.forEach(insight => {
            html += `
                <div class="insight-item insight d-flex align-items-start">
                    <div class="insight-icon insight">
                        <i class="bi bi-lightbulb"></i>
                    </div>
                    <div class="insight-content">
                        <p class="insight-text">${insight}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Display recommendations
    if (recommendations && recommendations.length > 0) {
        html += '<div class="mb-4"><h6 class="text-warning mb-3"><i class="bi bi-bullseye me-2"></i>Recommendations</h6>';
        recommendations.forEach(recommendation => {
            html += `
                <div class="insight-item recommendation d-flex align-items-start">
                    <div class="insight-icon recommendation">
                        <i class="bi bi-bullseye"></i>
                    </div>
                    <div class="insight-content">
                        <p class="insight-text">${recommendation}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Display patterns
    if (patterns && patterns.length > 0) {
        html += '<div class="mb-4"><h6 class="text-info mb-3"><i class="bi bi-graph-up me-2"></i>Spending Patterns</h6>';
        patterns.forEach(pattern => {
            html += `
                <div class="insight-item pattern d-flex align-items-start">
                    <div class="insight-icon pattern">
                        <i class="bi bi-graph-up"></i>
                    </div>
                    <div class="insight-content">
                        <p class="insight-text">${pattern}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Display alerts
    if (alerts && alerts.length > 0) {
        html += '<div class="mb-4"><h6 class="text-danger mb-3"><i class="bi bi-exclamation-triangle me-2"></i>Alerts</h6>';
        alerts.forEach(alert => {
            const severityClass = alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'info';
            html += `
                <div class="insight-item alert d-flex align-items-start">
                    <div class="insight-icon alert">
                        <i class="bi bi-exclamation-triangle"></i>
                    </div>
                    <div class="insight-content">
                        <p class="insight-text">${alert.message}</p>
                    </div>
                    <span class="alert-badge ${severityClass}">${alert.severity.toUpperCase()}</span>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Show category breakdown if available
    if (analytics.category_percentages && Object.keys(analytics.category_percentages).length > 0) {
        html += '<div class="mb-4"><h6 class="text-secondary mb-3"><i class="bi bi-pie-chart me-2"></i>Category Breakdown</h6>';
        html += '<div class="row">';
        
        Object.entries(analytics.category_percentages)
            .sort((a, b) => b[1] - a[1])
            .forEach(([category, percentage]) => {
                html += `
                    <div class="col-md-6 mb-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-medium">${category}</span>
                            <span class="badge bg-primary">${percentage.toFixed(1)}%</span>
                        </div>
                        <div class="progress mt-1" style="height: 6px;">
                            <div class="progress-bar" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            });
        
        html += '</div></div>';
    }
    
    insightsContent.innerHTML = html;
}

function displayInsightsError(message) {
    const insightsContent = document.getElementById('insightsContent');
    insightsContent.innerHTML = `
        <div class="text-center py-4">
            <i class="bi bi-exclamation-circle text-muted" style="font-size: 3rem;"></i>
            <p class="mt-3 text-muted">${message}</p>
            <button class="btn btn-outline-primary" onclick="loadInsights('week')">
                <i class="bi bi-arrow-clockwise me-2"></i>Retry
            </button>
        </div>
    `;
}

function handleInsightPeriodChange(event) {
    const period = event.target.value;
    loadInsights(period);
}

// Update insights when expenses change
function updateInsights() {
    const selectedPeriod = document.querySelector('input[name="insightPeriod"]:checked');
    if (selectedPeriod) {
        loadInsights(selectedPeriod.value);
    }
}
