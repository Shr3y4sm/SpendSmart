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

// Process receipt using OCR
async function processReceipt() {
    if (!currentReceiptImage) {
        showAlert('No receipt image selected', 'warning');
        return;
    }
    
    // Show processing state
    showProcessingState(true);
    
    try {
        console.log('Starting OCR processing...');
        
        // Convert object URL to blob for OCR
        const response = await fetch(currentReceiptImage);
        const blob = await response.blob();
        
        // Use Tesseract.js for OCR with better error handling
        const { data: { text } } = await Tesseract.recognize(
            blob,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log('OCR Progress:', Math.round(m.progress * 100) + '%');
                    }
                },
                // Add OCR engine options for better compatibility
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
        
        showAlert('Receipt processed successfully! Form auto-filled.', 'success');
        
    } catch (error) {
        console.error('OCR processing error:', error);
        
        // Provide more specific error messages
        if (error.message.includes('read image')) {
            showAlert('Failed to read image. Please try a different image format (JPG, PNG recommended).', 'danger');
        } else if (error.message.includes('network')) {
            showAlert('Network error during processing. Please check your internet connection.', 'danger');
        } else {
            showAlert('Failed to process receipt. Please try again with a clearer image.', 'danger');
        }
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

// Auto-fill expense form with parsed data
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initReceiptScanner();
});
