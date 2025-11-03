// Receipt Scanner Functions
let currentReceiptImage = null;

// Initialize receipt scanner
function initReceiptScanner() {
    const fileInput = document.getElementById('receiptUpload');
    
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            handleReceiptUpload(file);
        }
    });
}

// Handle receipt image upload
function handleReceiptUpload(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showAlert('Please select a valid image file', 'warning');
        return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showAlert('Image file is too large. Please select an image smaller than 10MB', 'warning');
        return;
    }
    
    // Create image preview and process for OCR
    const reader = new FileReader();
    reader.onload = function(e) {
        // Create a new image to ensure proper format
        const img = new Image();
        img.onload = function() {
            // Convert to canvas for better OCR compatibility
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image to canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert canvas to blob for OCR
            canvas.toBlob(function(blob) {
                // Create object URL for preview
                const previewUrl = URL.createObjectURL(blob);
                currentReceiptImage = previewUrl;
                showImagePreview(previewUrl);
            }, 'image/png', 0.95);
        };
        
        img.onerror = function() {
            showAlert('Failed to load image. Please try a different image.', 'danger');
        };
        
        img.src = e.target.result;
    };
    
    reader.onerror = function() {
        showAlert('Failed to read image file', 'danger');
    };
    
    reader.readAsDataURL(file);
}

// Show image preview
function showImagePreview(imageSrc) {
    const previewDiv = document.getElementById('receiptPreview');
    const previewImage = document.getElementById('previewImage');
    
    previewImage.src = imageSrc;
    previewDiv.style.display = 'block';
}

// Process receipt using Gemini Vision API (with Tesseract.js fallback)
async function processReceipt() {
    if (!currentReceiptImage) {
        showAlert('No receipt image selected', 'warning');
        return;
    }
    
    // Show processing state
    showProcessingState(true);
    
    try {
        console.log('Starting receipt processing with Gemini Vision API...');
        
        // Get the file from the input
        const fileInput = document.getElementById('receiptUpload');
        const file = fileInput.files[0];
        
        if (!file) {
            showAlert('No file selected', 'warning');
            return;
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('receipt', file);
        
        // Try Gemini Vision API first
        try {
            const response = await fetch('/api/receipt/scan', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('Gemini Vision extracted data:', result.data);
                
                // Show confidence level
                const confidence = result.data.confidence || 'medium';
                const confidenceMsg = confidence === 'high' ? '✨ High confidence' : 
                                     confidence === 'medium' ? '⚡ Medium confidence' : 
                                     '⚠️ Low confidence - please verify';
                
                // Auto-fill form with extracted data
                autoFillExpenseFormAdvanced(result.data);
                
                showAlert(`Receipt processed successfully! ${confidenceMsg}`, 'success');
                return;
            } else {
                throw new Error(result.error || 'API failed');
            }
        } catch (apiError) {
            console.warn('Gemini Vision API failed, falling back to Tesseract.js:', apiError);
            showAlert('Using backup OCR method...', 'info');
            
            // Fallback to Tesseract.js
            await processReceiptWithTesseract();
        }
        
    } catch (error) {
        console.error('Receipt processing error:', error);
        showAlert('Failed to process receipt. Please try again with a clearer image.', 'danger');
    } finally {
        showProcessingState(false);
    }
}

// Fallback: Process receipt using Tesseract.js OCR
async function processReceiptWithTesseract() {
    try {
        console.log('Starting Tesseract.js OCR processing...');
        
        // Convert object URL to blob for OCR
        const response = await fetch(currentReceiptImage);
        const blob = await response.blob();
        
        // Check if Tesseract is available
        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js not loaded');
        }
        
        // Use Tesseract.js for OCR
        const { data: { text } } = await Tesseract.recognize(
            blob,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log('OCR Progress:', Math.round(m.progress * 100) + '%');
                    }
                },
                tessedit_pageseg_mode: Tesseract.PSM.AUTO,
                tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:/-₹Rs '
            }
        );
        
        console.log('Extracted text:', text);
        
        if (!text || text.trim().length === 0) {
            showAlert('No text could be extracted from the image. Please try a clearer image.', 'warning');
            return;
        }
        
        // Parse the extracted text and auto-fill form
        const parsedData = parseReceiptText(text);
        autoFillExpenseForm(parsedData);
        
        showAlert('Receipt processed successfully! (Basic OCR)', 'success');
        
    } catch (error) {
        console.error('Tesseract OCR error:', error);
        throw error;
    }
}

// Quick path: Force basic OCR (Tesseract-only) with proper UI state handling
async function quickProcessReceipt() {
    if (!currentReceiptImage) {
        showAlert('No receipt image selected', 'warning');
        return;
    }
    // Show processing spinner explicitly for the quick OCR flow
    showProcessingState(true);
    try {
        await processReceiptWithTesseract();
    } catch (err) {
        console.error('Quick OCR failed:', err);
        showAlert('Basic OCR failed. Try "Extract Text" for the AI-assisted method or use a clearer image.', 'danger');
    } finally {
        showProcessingState(false);
    }
}

// Parse receipt text to extract relevant information
function parseReceiptText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let parsedData = {
        item: '',
        amount: '',
        category: '',
        date: ''
    };
    
    // Extract amount (look for currency patterns)
    const amountPatterns = [
        /(?:total|amount|sum|rs\.?|₹)\s*:?\s*(\d+(?:\.\d{2})?)/i,
        /(\d+(?:\.\d{2})?)\s*(?:rs\.?|₹)/i,
        /(\d+(?:\.\d{2})?)\s*$/m
    ];
    
    for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match) {
            parsedData.amount = match[1];
            break;
        }
    }
    
    // Extract date (look for date patterns)
    const datePatterns = [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
        /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
        /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/i
    ];
    
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            parsedData.date = formatDate(match[1]);
            break;
        }
    }
    
    // Extract item/merchant name (usually the first or second line)
    if (lines.length > 0) {
        // Skip common receipt headers
        const skipWords = ['receipt', 'invoice', 'bill', 'thank', 'you', 'visit'];
        for (let i = 0; i < Math.min(3, lines.length); i++) {
            const line = lines[i].toLowerCase();
            if (!skipWords.some(word => line.includes(word)) && line.length > 3) {
                parsedData.item = lines[i];
                break;
            }
        }
    }
    
    // If no specific item found, use merchant name or first meaningful line
    if (!parsedData.item && lines.length > 0) {
        parsedData.item = lines[0];
    }
    
    return parsedData;
}

// Format date string to YYYY-MM-DD format
function formatDate(dateStr) {
    try {
        // Handle different date formats
        let date;
        
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts[2].length === 2) {
                parts[2] = '20' + parts[2];
            }
            date = new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts[0].length === 4) {
                date = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        } else {
            date = new Date(dateStr);
        }
        
        if (isNaN(date.getTime())) {
            return '';
        }
        
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Date formatting error:', error);
        return '';
    }
}

// Auto-fill expense form with parsed data (basic version for Tesseract)
function autoFillExpenseForm(data) {
    console.log('Auto-filling form with data:', data);
    
    // Fill item name
    if (data.item) {
        document.getElementById('itemName').value = data.item;
    }
    
    // Fill amount
    if (data.amount) {
        document.getElementById('amount').value = data.amount;
    }
    
    // Fill date
    if (data.date) {
        document.getElementById('date').value = data.date;
    } else {
        // Default to today's date if no date found
        document.getElementById('date').valueAsDate = new Date();
    }
    
    // Trigger auto-categorization if item name is filled
    if (data.item) {
        setTimeout(() => {
            handleAutoCategorization();
        }, 500);
    }
    
    // Show success message
    showAlert('Form auto-filled from receipt! Please review and adjust if needed.', 'info');
}

// Auto-fill expense form with advanced data from Gemini Vision API
function autoFillExpenseFormAdvanced(data) {
    console.log('Auto-filling form with advanced data:', data);
    
    // Fill item name (use merchant name or first item)
    const itemName = data.merchant || (data.items && data.items.length > 0 ? data.items[0] : '');
    if (itemName) {
        document.getElementById('itemName').value = itemName;
    }
    
    // Fill amount
    if (data.amount && data.amount !== '0.00') {
        document.getElementById('amount').value = data.amount;
    }
    
    // Fill date
    if (data.date) {
        document.getElementById('date').value = data.date;
    } else {
        document.getElementById('date').valueAsDate = new Date();
    }
    
    // Fill category (Gemini already categorized it!)
    if (data.category) {
        const categorySelect = document.getElementById('category');
        // Find matching option
        for (let option of categorySelect.options) {
            if (option.value === data.category) {
                categorySelect.value = data.category;
                break;
            }
        }
    }
    
    // Show confidence indicator
    const confidence = data.confidence || 'medium';
    let confidenceColor = confidence === 'high' ? 'success' : 
                         confidence === 'medium' ? 'info' : 'warning';
    
    // Add visual indicator to form
    const formElement = document.getElementById('expenseForm');
    const existingBadge = formElement.querySelector('.confidence-badge');
    if (existingBadge) existingBadge.remove();
    
    const badge = document.createElement('div');
    badge.className = `alert alert-${confidenceColor} confidence-badge mt-2`;
    badge.innerHTML = `
        <small>
            <i class="bi bi-robot me-1"></i>
            <strong>AI Confidence:</strong> ${confidence.toUpperCase()}
            ${confidence !== 'high' ? '- Please verify the extracted data' : ''}
        </small>
    `;
    formElement.appendChild(badge);
    
    // Remove badge after 5 seconds
    setTimeout(() => {
        if (badge && badge.parentNode) {
            badge.remove();
        }
    }, 5000);
    
    // Handle multiple items
    if (data.items && data.items.length > 1) {
        console.log('Multiple items detected:', data.items);
        showMultipleItemsModal(data);
    } else if (!itemName && data.items && data.items.length === 1) {
        // Single item case - already handled above
        document.getElementById('itemName').value = data.items[0];
    }
}

// Show/hide processing state
function showProcessingState(show) {
    const processingDiv = document.getElementById('receiptProcessing');
    const previewDiv = document.getElementById('receiptPreview');
    
    if (show) {
        processingDiv.style.display = 'block';
        previewDiv.style.display = 'none';
    } else {
        processingDiv.style.display = 'none';
        previewDiv.style.display = 'block';
    }
}

// Clear receipt data
function clearReceipt() {
    // Clean up object URL to prevent memory leaks
    if (currentReceiptImage && currentReceiptImage.startsWith('blob:')) {
        URL.revokeObjectURL(currentReceiptImage);
    }
    
    currentReceiptImage = null;
    
    // Hide preview and processing
    document.getElementById('receiptPreview').style.display = 'none';
    document.getElementById('receiptProcessing').style.display = 'none';
    
    // Clear file input
    document.getElementById('receiptUpload').value = '';
    
    // Clear form fields
    document.getElementById('itemName').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('category').value = '';
    document.getElementById('date').valueAsDate = new Date();
    
    showAlert('Receipt cleared', 'info');
}

// Show modal for multiple items selection
function showMultipleItemsModal(data) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="multipleItemsModal" tabindex="-1" aria-labelledby="multipleItemsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="multipleItemsModalLabel">
                            <i class="bi bi-receipt me-2"></i>
                            Multiple Items Detected
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted mb-3">
                            We found <strong>${data.items.length} items</strong> in this receipt. 
                            Select which items you want to add as expenses:
                        </p>
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Receipt Details:</strong><br>
                            Merchant: ${data.merchant || 'Unknown'}<br>
                            Date: ${data.date || 'Today'}<br>
                            Category: ${data.category || 'Others'}<br>
                            Total: ${data.amount || '0.00'}
                        </div>
                        <div id="itemsList" class="list-group">
                            ${data.items.map((item, index) => {
                                const parsed = parseItemString(item);
                                return `
                                    <label class="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <input class="form-check-input me-2" type="checkbox" value="${index}" checked>
                                            <strong>${parsed.name}</strong>
                                            <small class="text-muted ms-2">(${data.category})</small>
                                        </div>
                                        ${parsed.price ? `<span class="badge bg-primary">$${parsed.price}</span>` : ''}
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>
                            Cancel
                        </button>
                        <button type="button" class="btn btn-primary" onclick="addSelectedItems()">
                            <i class="bi bi-check-circle me-1"></i>
                            Add Selected Items
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.getElementById('multipleItemsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Store data for later use
    window.receiptData = data;
    
    // Show modal using Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('multipleItemsModal'));
    modal.show();
}

// Parse item string to extract name and price
function parseItemString(itemStr) {
    // Try to extract price from item string (format: "ItemName - $Price" or "ItemName - Price")
    const priceMatch = itemStr.match(/(.+?)\s*-\s*\$?([\d.]+)/);
    
    if (priceMatch) {
        return {
            name: priceMatch[1].trim(),
            price: priceMatch[2]
        };
    }
    
    // No price found, return just the item name
    return {
        name: itemStr.trim(),
        price: null
    };
}

// Add selected items as expenses
async function addSelectedItems() {
    const data = window.receiptData;
    if (!data) return;
    
    // Get selected items
    const checkboxes = document.querySelectorAll('#itemsList input[type="checkbox"]:checked');
    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (selectedIndices.length === 0) {
        showAlert('Please select at least one item', 'warning');
        return;
    }
    
    // Close modal overlay
    closeMultipleItemsModal();
    
    // Show progress
    const progressDiv = document.createElement('div');
    progressDiv.className = 'alert alert-info mt-3';
    progressDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            <span>Adding ${selectedIndices.length} item(s)...</span>
        </div>
    `;
    const previewArea = document.getElementById('receiptPreview');
    if (previewArea) {
        previewArea.prepend(progressDiv);
    } else {
        document.body.appendChild(progressDiv);
    }
    
    // Add each selected item
    let successCount = 0;
    let failCount = 0;
    
    for (const index of selectedIndices) {
        const itemString = data.items[index];
        const parsedItem = parseItemString(itemString);
        
        // Determine amount: use item price if available, otherwise split total if only one item, else 0
        let amount = '0.00';
        if (parsedItem.price) {
            amount = parsedItem.price;
        } else if (data.amount && selectedIndices.length === 1) {
            amount = data.amount;
        }
        
        // Prepare expense data
        const expenseData = {
            item: parsedItem.name,
            amount: amount,
            category: data.category || 'Others',
            date: data.date || new Date().toISOString().split('T')[0]
        };
        
        try {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(expenseData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            console.error('Error adding item:', parsedItem.name, error);
            failCount++;
        }
        
        // Small delay between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Remove progress indicator
    progressDiv.remove();
    
    // Show results
    if (successCount > 0) {
        showAlert(`Successfully added ${successCount} item(s)!`, 'success');
        
        // Refresh the expense list if the function exists
        if (typeof loadExpenses === 'function') {
            loadExpenses();
        }
        
        // Clear receipt
        clearReceipt();
    }
    
    if (failCount > 0) {
        showAlert(`Failed to add ${failCount} item(s). Please add them manually.`, 'warning');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initReceiptScanner();
});
