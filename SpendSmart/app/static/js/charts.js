// Global chart instances
let pieChart = null;
let trendChart = null;
let currentBudget = null;

// Initialize charts on page load
function setupChartFilters() {
    console.log('[Charts] Initializing...');
    
    // Verify Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('[Charts] Chart.js library not found!');
        return;
    }
    
    // Setup filter event listeners
    const filterRadios = document.querySelectorAll('input[name="chartFilter"]');
    filterRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateVisualizations(e.target.value);
        });
    });
    
    // Load initial charts
    updateVisualizations('month');
}

// Update all visualizations
async function updateVisualizations(period = 'month') {
    try {
        console.log('[Charts] Loading data for period:', period);
        
        const response = await fetch(`/api/visualization/data?period=${period}`);
        const result = await response.json();
        
        if (!result.success) {
            console.error('[Charts] API error:', result.error);
            showEmptyCharts();
            return;
        }
        
        console.log('[Charts] Data received:', result.data);
        
        // Update budget from API response
        currentBudget = result.data.budget;
        
        // Update both charts
        updatePieChart(result.data.pie_chart);
        updateTrendChart(result.data.trends, period);
        
    } catch (error) {
        console.error('[Charts] Error:', error);
        showEmptyCharts();
    }
}

// Update pie chart
function updatePieChart(data) {
    const canvas = document.getElementById('pieChart');
    if (!canvas) {
        console.error('[PieChart] Canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (pieChart) {
        pieChart.destroy();
        pieChart = null;
    }
    
    // Handle empty data
    if (!data || data.length === 0) {
        console.log('[PieChart] No data available');
        return;
    }
    
    console.log('[PieChart] Creating chart with', data.length, 'categories');
    
    // Create new chart
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item.label),
            datasets: [{
                data: data.map(item => Number(item.value)),
                backgroundColor: data.map(item => item.color),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif"
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const item = data[context.dataIndex];
                            return `${item.label}: ₹${Number(item.value).toFixed(2)} (${item.percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    console.log('[PieChart] Created successfully');
}

// Update trend chart with budget threshold line
function updateTrendChart(data, period) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) {
        console.error('[TrendChart] Canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }
    
    // Handle empty data
    if (!data || data.length === 0) {
        console.log('[TrendChart] No data available');
        return;
    }
    
    const titleText = period === 'week' ? 'Weekly Trends (Last 7 Days)' : 
                      period === 'month' ? 'Monthly Trends (Last 30 Days)' : 
                      'Yearly Trends';
    
    console.log('[TrendChart] Creating chart:', titleText, 'with', data.length, 'points');
    
    // Prepare datasets
    const datasets = [{
        label: 'Daily Spending',
        data: data.map(item => Number(item.amount)),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
    }];
    
    // Add budget threshold line if budget is set
    if (currentBudget && currentBudget.amount) {
        const budgetAmount = Number(currentBudget.amount);
        
        // Calculate daily budget for month/week periods
        let thresholdValue = budgetAmount;
        if (period === 'month') {
            thresholdValue = budgetAmount / 30; // Daily budget for month
        } else if (period === 'week') {
            thresholdValue = budgetAmount / 7; // Daily budget for week
        }
        
        datasets.push({
            label: 'Budget Limit',
            data: new Array(data.length).fill(thresholdValue),
            borderColor: '#ef4444',
            borderWidth: 2,
            borderDash: [10, 5],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0
        });
        
        console.log('[TrendChart] Budget threshold added:', thresholdValue);
    }
    
    // Create chart
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.label),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif"
                        }
                    }
                },
                title: {
                    display: true,
                    text: titleText,
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: "'Inter', sans-serif"
                    },
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = Number(context.parsed.y).toFixed(2);
                            return `${label}: ₹${value}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return '₹' + Number(value).toFixed(0);
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            }
        }
    });
    
    console.log('[TrendChart] Created successfully');
}

// Show empty state for charts
function showEmptyCharts() {
    if (pieChart) {
        pieChart.destroy();
        pieChart = null;
    }
    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }
    console.log('[Charts] Cleared due to no data');
}
