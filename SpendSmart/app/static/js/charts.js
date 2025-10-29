// Chart Filter Functions
function setupChartFilters() {
    // Setup filter event listeners
    document.querySelectorAll('input[name="chartFilter"]').forEach(radio => {
        radio.addEventListener('change', handleChartFilterChange);
    });
}

function handleChartFilterChange(event) {
    const selectedPeriod = event.target.value;
    updateVisualizations(selectedPeriod);
}

async function updateVisualizations(period = 'month') {
    try {
        const response = await fetch(`/api/visualization/data?period=${period}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Update pie chart
            updatePieChart(data.pie_chart);
            
            // Update trend chart
            updateTrendChart(data.trends, period);
        } else {
            console.error('Failed to load visualization data:', result.error);
        }
    } catch (error) {
        console.error('Error loading visualization data:', error);
    }
}

function updatePieChart(data) {
    if (!pieChart) {
        // Initialize pie chart if it doesn't exist
        const ctx = document.getElementById('pieChart').getContext('2d');
        pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const item = data[context.dataIndex];
                                return `${item.label}: Rs. ${item.value} (${item.percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Update chart data
    pieChart.data.labels = data.map(item => item.label);
    pieChart.data.datasets[0].data = data.map(item => item.value);
    pieChart.data.datasets[0].backgroundColor = data.map(item => item.color);
    pieChart.update();
}

function updateTrendChart(data, period) {
    if (!trendChart) {
        // Initialize trend chart if it doesn't exist
        const ctx = document.getElementById('trendChart').getContext('2d');
        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Spending',
                    data: [],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#007bff',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Spent: Rs. ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return 'Rs. ' + value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
    }
    
    // Update chart data
    trendChart.data.labels = data.map(item => item.label || item.period);
    trendChart.data.datasets[0].data = data.map(item => item.amount);
    
    // Update chart title based on period
    trendChart.options.plugins.title.text = period === 'week' ? 'Weekly Trends (Last 7 Days)' : 
                                            period === 'month' ? 'Monthly Trends (Last 30 Days)' : 
                                            period === 'year' ? 'Yearly Trends (All Months)' : 'Spending Trends';
    
    trendChart.update();
}
