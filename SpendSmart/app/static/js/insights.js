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
    
    // Display insights in vertical columns
    html += '<div class="row g-3 mb-3">';
    
    // Column 1: Key Insights
    if (insights && insights.length > 0) {
        html += '<div class="col-md-6 col-lg-3">';
        html += '<div class="insights-column">';
        html += '<h6 class="insights-header text-primary mb-3"><i class="bi bi-lightbulb me-2"></i>Key Insights</h6>';
        insights.forEach(insight => {
            html += `
                <div class="insight-compact mb-2">
                    <i class="bi bi-check-circle-fill text-primary me-2"></i>
                    <span class="insight-brief">${shortenInsight(insight)}</span>
                </div>
            `;
        });
        html += '</div></div>';
    }
    
    // Column 2: Recommendations
    if (recommendations && recommendations.length > 0) {
        html += '<div class="col-md-6 col-lg-3">';
        html += '<div class="insights-column">';
        html += '<h6 class="insights-header text-warning mb-3"><i class="bi bi-bullseye me-2"></i>Recommendations</h6>';
        recommendations.forEach(recommendation => {
            html += `
                <div class="insight-compact mb-2">
                    <i class="bi bi-lightbulb-fill text-warning me-2"></i>
                    <span class="insight-brief">${shortenInsight(recommendation)}</span>
                </div>
            `;
        });
        html += '</div></div>';
    }
    
    // Column 3: Spending Patterns
    if (patterns && patterns.length > 0) {
        html += '<div class="col-md-6 col-lg-3">';
        html += '<div class="insights-column">';
        html += '<h6 class="insights-header text-info mb-3"><i class="bi bi-graph-up me-2"></i>Spending Patterns</h6>';
        patterns.forEach(pattern => {
            html += `
                <div class="insight-compact mb-2">
                    <i class="bi bi-bar-chart-fill text-info me-2"></i>
                    <span class="insight-brief">${shortenInsight(pattern)}</span>
                </div>
            `;
        });
        html += '</div></div>';
    }
    
    // Column 4: Alerts
    if (alerts && alerts.length > 0) {
        html += '<div class="col-md-6 col-lg-3">';
        html += '<div class="insights-column">';
        html += '<h6 class="insights-header text-danger mb-3"><i class="bi bi-exclamation-triangle me-2"></i>Alerts</h6>';
        alerts.forEach(alert => {
            const severityClass = alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'info';
            html += `
                <div class="insight-compact mb-2">
                    <i class="bi bi-exclamation-circle-fill text-${severityClass} me-2"></i>
                    <span class="insight-brief">${shortenInsight(alert.message)}</span>
                    <span class="severity-badge badge bg-${severityClass} badge-sm ms-2">${alert.severity.charAt(0).toUpperCase()}</span>
                </div>
            `;
        });
        html += '</div></div>';
    }
    
    html += '</div>';
    
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

// Helper function to shorten long insights
function shortenInsight(text) {
    // Extract key information and make it more concise
    if (text.length <= 100) return text;
    
    // Try to find the main point (usually after ":" or before ".")
    const colonIndex = text.indexOf(':');
    const firstSentence = text.split('.')[0];
    
    if (colonIndex > 0 && colonIndex < 80) {
        const afterColon = text.substring(colonIndex + 1).trim();
        const shortened = afterColon.split('.')[0];
        return shortened.length < 100 ? shortened : shortened.substring(0, 100) + '...';
    }
    
    // Return first sentence if it's reasonable length
    if (firstSentence.length <= 120) {
        return firstSentence + '.';
    }
    
    // Otherwise truncate intelligently
    return text.substring(0, 100) + '...';
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
