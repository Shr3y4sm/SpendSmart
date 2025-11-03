// Receipt OCR Page (Tesseract-only)
let currentReceiptImage = null;
let parsedReceiptData = null; // { merchant, amount, date, items[] }
let lastOcrRawText = '';

function initReceiptOCR() {
    const fileInput = document.getElementById('receiptUpload');
    if (!fileInput) return;

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) handleReceiptUpload(file);
    });
}

function handleReceiptUpload(file) {
    if (!file.type.startsWith('image/')) {
        showAlert('Please select a valid image file', 'warning');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showAlert('Image file is too large. Please select an image smaller than 10MB', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Preprocess: upscale x2, grayscale, contrast boost for better OCR
            const blobPromise = preprocessImage(img);
            blobPromise.then((blob) => {
                const previewUrl = URL.createObjectURL(blob);
                currentReceiptImage = previewUrl;
                showImagePreview(previewUrl);
            }).catch(() => {
                // Fallback: no preprocessing
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width; canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    const previewUrl = URL.createObjectURL(blob);
                    currentReceiptImage = previewUrl;
                    showImagePreview(previewUrl);
                }, 'image/png', 0.95);
            });
        };
        img.onerror = () => showAlert('Failed to load image. Please try a different image.', 'danger');
        img.src = e.target.result;
    };
    reader.onerror = () => showAlert('Failed to read image file', 'danger');
    reader.readAsDataURL(file);
}

function showImagePreview(imageSrc) {
    const previewDiv = document.getElementById('receiptPreview');
    const previewImage = document.getElementById('previewImage');
    previewImage.src = imageSrc;
    previewDiv.style.display = 'block';
}

function showProcessingState(show) {
    const processingDiv = document.getElementById('receiptProcessing');
    const previewDiv = document.getElementById('receiptPreview');
    if (show) { processingDiv.style.display = 'block'; previewDiv.style.display = 'none'; }
    else { processingDiv.style.display = 'none'; previewDiv.style.display = 'block'; }
}

async function processReceiptOCR() {
    if (!currentReceiptImage) {
        showAlert('No receipt image selected', 'warning');
        return;
    }
    showProcessingState(true);
    try {
        await processReceiptWithTesseract();
    } catch (err) {
        console.error('OCR failed:', err);
        showAlert('Failed to process receipt. Please try again with a clearer image.', 'danger');
    } finally {
        showProcessingState(false);
    }
}

async function processReceiptWithTesseract() {
    if (typeof Tesseract === 'undefined') throw new Error('Tesseract.js not loaded');
    const response = await fetch(currentReceiptImage);
    const blob = await response.blob();
    const { data: { text } } = await Tesseract.recognize(blob, 'eng', {
        logger: m => { if (m.status === 'recognizing text') console.log('OCR Progress:', Math.round(m.progress * 100) + '%'); },
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:/-₹Rs INR() ' 
    });

    if (!text || !text.trim()) {
        showAlert('No text could be extracted from the image.', 'warning');
        return;
    }

    lastOcrRawText = text;
    // Build parsed data
    parsedReceiptData = buildParsedData(text);
    renderDetectedItems(parsedReceiptData);
    showAlert('OCR complete. Review items and add selected.', 'success');
}

// Basic preprocessing: upscale, grayscale, and contrast
function preprocessImage(img) {
    return new Promise((resolve, reject) => {
        try {
            const scale = 2; // upscale 2x
            const canvas = document.createElement('canvas');
            const w = img.width * scale; const h = img.height * scale;
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            const data = imageData.data;
            // grayscale + contrast/brightness tweak
            const contrast = 1.3; // >1 increases contrast
            const brightness = 10; // shift
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                let y = 0.299*r + 0.587*g + 0.114*b; // luma
                y = (y - 128) * contrast + 128 + brightness;
                y = Math.max(0, Math.min(255, y));
                data[i] = data[i+1] = data[i+2] = y;
            }
            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('blob failed')), 'image/png', 0.95);
        } catch (e) { reject(e); }
    });
}

function buildParsedData(text) {
    const lines = text.split('\n').map(s => s.trim()).filter(Boolean);

    // Total and date and merchant
    let amount = getTotalAmountFromLines(lines);
    if (!amount) {
        // fallback search anywhere
        const amountPatterns = [
            /(?:grand\s*total|total|amount|sum|rs\.?|₹)\s*:?[\s]*([\d]+(?:\.[\d]{2})?)/i,
            /([\d]+(?:\.[\d]{2})?)[\s]*(?:rs\.?|₹)/i
        ];
        for (const p of amountPatterns) { const m = text.match(p); if (m) { amount = m[1]; break; } }
    }

    const datePatterns = [/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/, /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/];
    let date = '';
    for (const p of datePatterns) { const m = text.match(p); if (m) { date = formatDate(m[1]); break; } }

    let merchant = '';
    const skip = ['receipt', 'invoice', 'bill', 'thank', 'you', 'visit', 'total', 'amount', 'cash', 'change', 'tax', 'delivery', 'charges', 'charge'];
    for (let i = 0; i < Math.min(6, lines.length); i++) {
        const l = lines[i].toLowerCase();
        // Prefer a line without trailing price/qty
        const endsWithNumber = /\d+[\d,]*\.?\d*$/.test(lines[i]);
        if (!skip.some(w => l.includes(w)) && lines[i].length > 3 && !endsWithNumber) {
            merchant = lines[i];
            break;
        }
    }
    if (!merchant && lines.length) merchant = lines[0];
    // Clean stray digits from merchant
    merchant = merchant.replace(/\s+\d[\d\s]+$/, '').trim();

    // Heuristic item detection: look for lines with price patterns
    const items = [];
    const itemLines = lines.filter(l => /\d+[\d,]*\.?\d{0,2}$/.test(l) || /-\s*\$?\d+[\d,]*\.\d{2}/.test(l));
    for (const l of itemLines) {
        const lower = l.toLowerCase();
        if (/(grand\s*total|total|subtotal|tax|cgst|sgst|igst|round\s*off)/.test(lower)) continue;
        const parsed = parseItemLineAdvanced(l, amount);
        if (parsed.name) items.push(parsed);
    }

    // Fallback single item if none parsed
    if (!items.length) {
        items.push({ name: merchant || 'Receipt Item', price: amount || null });
    }

    return { merchant, amount: (amount ? toFixedAmount(amount) : '0.00'), date: date || new Date().toISOString().split('T')[0], items };
}

function parseItemLineAdvanced(line, totalHint) {
    // Clean rupee symbols and artifacts first
    let cleaned = line.replace(/[₹]/g, '').replace(/\bRs\.?\b/gi, '');
    
    // Pattern: "ItemName  Qty  UnitPrice  TotalPrice"
    // Look for rightmost number as price; if multiple numbers with spacing, parse carefully
    const allNumbers = cleaned.match(/(\d+(?:\.\d{1,2})?)/g);
    if (!allNumbers || allNumbers.length === 0) {
        return { name: cleaned.trim(), price: null };
    }
    
    // Strategy: last number is total price; second-to-last might be unit price or qty
    const priceCandidate = allNumbers[allNumbers.length - 1];
    
    // Find position of last number to extract item name before it
    const lastNumIdx = cleaned.lastIndexOf(priceCandidate);
    let itemName = cleaned.substring(0, lastNumIdx).trim();
    
    // If there are 3+ numbers, middle ones are likely qty + unit price
    // Remove qty pattern: single digit or "1" at end of item name
    itemName = itemName.replace(/\s+\d+\s*$/, '').trim();
    
    // Also remove unit price if present (e.g., "Item 1 260" -> "Item")
    if (allNumbers.length >= 2) {
        const unitPriceCandidate = allNumbers[allNumbers.length - 2];
        const unitIdx = itemName.lastIndexOf(unitPriceCandidate);
        if (unitIdx > 0) {
            itemName = itemName.substring(0, unitIdx).trim();
        }
    }
    
    // Remove trailing quantity markers
    itemName = itemName.replace(/\s+\d+\s*$/, '').trim();
    
    return { 
        name: itemName || 'Item', 
        price: normalizePrice(priceCandidate, totalHint) 
    };
}

function stripQty(name) {
    return name.replace(/\b(?:x\s*)?\d+\b\s*$/i, '');
}

function formatDate(dateStr) {
    try {
        let date;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts[2].length === 2) parts[2] = '20' + parts[2];
            date = new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts[0].length === 4) date = new Date(parts[0], parts[1] - 1, parts[2]);
            else date = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
            date = new Date(dateStr);
        }
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch (e) { return ''; }
}

function renderDetectedItems(data) {
    const card = document.getElementById('detectedItemsCard');
    const meta = document.getElementById('receiptMeta');
    const list = document.getElementById('itemsList');
    if (!card || !meta || !list) return;

    meta.innerHTML = `Merchant: <strong>${escapeHtml(data.merchant || 'Unknown')}</strong> · Date: <strong>${data.date}</strong> · Total: <strong>Rs. ${toFixedAmount(data.amount)}</strong>
        <details style="margin-top:6px;"><summary class="text-muted">Show OCR text</summary><pre style="white-space:pre-wrap; text-align:left;">${escapeHtml(lastOcrRawText || '')}</pre></details>`;

    list.innerHTML = data.items.map((it, idx) => `
        <label class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <input class="form-check-input me-2" type="checkbox" value="${idx}" checked>
                <strong>${escapeHtml(it.name)}</strong>
            </div>
            ${it.price ? `<span class="badge bg-primary">Rs. ${toFixedAmount(it.price)}</span>` : ''}
        </label>
    `).join('');

    card.style.display = 'block';
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

function clearReceiptPage() {
    if (currentReceiptImage && currentReceiptImage.startsWith('blob:')) URL.revokeObjectURL(currentReceiptImage);
    currentReceiptImage = null; parsedReceiptData = null;
    document.getElementById('receiptPreview').style.display = 'none';
    document.getElementById('receiptProcessing').style.display = 'none';
    const input = document.getElementById('receiptUpload'); if (input) input.value = '';
    clearDetectedItems();
}

function clearDetectedItems() {
    const card = document.getElementById('detectedItemsCard');
    const list = document.getElementById('itemsList');
    const meta = document.getElementById('receiptMeta');
    if (list) list.innerHTML = '';
    if (meta) meta.innerHTML = '';
    if (card) card.style.display = 'none';
}

async function addSelectedItemsFromPage() {
    if (!parsedReceiptData) { showAlert('No items to add. Please run OCR first.', 'warning'); return; }
    const checkboxes = document.querySelectorAll('#itemsList input[type="checkbox"]:checked');
    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.value));
    if (!selectedIndices.length) { showAlert('Please select at least one item', 'warning'); return; }

    const progressDiv = document.createElement('div');
    progressDiv.className = 'alert alert-info mt-3';
    progressDiv.innerHTML = `<div class="d-flex align-items-center"><div class="spinner-border spinner-border-sm me-2" role="status"></div><span>Adding ${selectedIndices.length} item(s)...</span></div>`;
    const card = document.getElementById('detectedItemsCard');
    card.parentNode.insertBefore(progressDiv, card.nextSibling);

    let success = 0, fail = 0;
    for (const idx of selectedIndices) {
        const it = parsedReceiptData.items[idx];
        const expenseData = {
            item: it.name,
            amount: toFixedAmount(it.price || parsedReceiptData.amount || '0.00'),
            category: 'Others',
            date: parsedReceiptData.date
        };
        try {
            const resp = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expenseData) });
            const res = await resp.json();
            if (res.success) success++; else fail++;
        } catch (e) { console.error('Add failed:', e); fail++; }
        await new Promise(r => setTimeout(r, 100));
    }

    progressDiv.remove();
    if (success) showAlert(`Successfully added ${success} item(s).`, 'success');
    if (fail) showAlert(`Failed to add ${fail} item(s). Please add manually.`, 'warning');
    if (success && typeof loadExpenses === 'function') loadExpenses();
}

// Init
document.addEventListener('DOMContentLoaded', initReceiptOCR);

// Helpers
function toFixedAmount(val) {
    const n = parseFloat(String(val).replace(/[,]/g, ''));
    if (isNaN(n)) return '0.00';
    return n.toFixed(2);
}

function normalizePrice(str, totalHint) {
    // Remove everything except digits and dot
    let cleaned = String(str).replace(/[^\d.]/g, '');
    
    // Handle cases where rupee symbol was OCR'd as leading digit
    // Common artifacts: ₹260 -> "2260" or "1260" 
    // If string starts with 1 or 2 followed by sensible price, try dropping it
    if (cleaned.length >= 4 && /^[12]/.test(cleaned)) {
        const withoutFirst = cleaned.slice(1);
        const candid = parseFloat(withoutFirst);
        if (!isNaN(candid) && candid < 1000) {
            // Likely artifact if original would be > 1000
            const original = parseFloat(cleaned);
            if (original > candid * 5) {
                cleaned = withoutFirst;
            }
        }
    }
    
    let n = parseFloat(cleaned);
    if (!isNaN(n)) {
        const totalNum = totalHint ? parseFloat(String(totalHint).replace(/[,]/g, '')) || 0 : 0;
        return fixLeadingDigitArtifacts(n, cleaned, totalNum).toFixed(2);
    }
    return '0.00';
}

function getTotalAmountFromLines(lines) {
    // Prefer line containing total keywords; pick rightmost number
    const totalLine = lines.find(l => /grand\s*total|total\s*amount|total\b/i.test(l));
    if (totalLine) {
        const m = totalLine.match(/([\d][\d,]*(?:\.[\d]{2})?)\s*$/);
        if (m) return normalizeTotalCandidate(m[1]);
        const m2 = totalLine.match(/([\d][\d,]*(?:\.[\d]{2})?)/g);
        if (m2 && m2.length) return normalizeTotalCandidate(m2[m2.length - 1]);
    }
    return '';
}

function fixLeadingDigitArtifacts(n, cleaned, totalNum) {
    // Fix cases like 2180->180, 230->30, 316->16 using context of total
    if (totalNum > 0 && n > totalNum) {
        const candidates = [];
        if (cleaned.length > 1) candidates.push(parseFloat(cleaned.slice(1)));
        if (cleaned.length > 2) candidates.push(parseFloat(cleaned.slice(2)));
        if (cleaned.length > 3) candidates.push(parseFloat(cleaned.slice(3)));
        candidates.push(n / 10);
        candidates.push(n / 100);
        const feasible = candidates.filter(x => !isNaN(x) && x <= totalNum + 10 && x > 0);
        if (feasible.length) {
            // pick the largest feasible (most conservative reduction)
            return Math.max(...feasible);
        }
    }
    
    // Also handle cases where OCR mistakes like 1260 should be 260
    if (n > 1000 && cleaned.length === 4 && cleaned[0] === '1') {
        const drop1 = parseFloat(cleaned.slice(1));
        if (!isNaN(drop1) && drop1 < 500) return drop1;
    }
    if (n > 1000 && cleaned.length === 4 && cleaned[0] === '2') {
        const drop1 = parseFloat(cleaned.slice(1));
        if (!isNaN(drop1) && drop1 < 500) return drop1;
    }
    
    return n;
}

function normalizeTotalCandidate(str) {
    const cleaned = String(str).replace(/[,]/g, '');
    let n = parseFloat(cleaned);
    if (isNaN(n)) return '';
    // If absurdly high total like 1149.50 (should be 149.50), try trimming first digit
    if (n > 500 && cleaned.length >= 4) {
        const drop1 = parseFloat(cleaned.slice(1));
        if (!isNaN(drop1) && drop1 <= 500) return drop1.toFixed(2);
        const div10 = n / 10;
        if (div10 <= 500) return div10.toFixed(2);
    }
    return n.toFixed(2);
}
