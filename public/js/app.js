// public/js/app.js
// Main application logic - UPM FPX Only Version with Fake Payment

// ============================================
// YSD2026 UPM - Ticket Registration System
// Firebase + Fake FPX + Brevo Integration
// ============================================

// Global variables
let currentPage = 1;
let ticketQuantity = 1;
const SINGLE_PRICE = 70.00;
const BUNDLE_PRICE = 260.00;

let participants = [];
let currentBookingId = null;
let currentBookingRef = null;
let paymentInProgress = false;
let evidenceFile = null;

// DOM elements
let loadingOverlay, loadingText, quantityInput, totalAmountElement, totalSavingsElement;
let priceBreakdownDiv, previewQuantityElement, previewTotalElement, bookingTicketPriceElement;
let previewTicketTypeElement, paymentContactElement, paymentAmountElement, paymentReferenceElement;
let paymentParticipantsElement, participantsSummaryElement, payNowAmount, evidenceBookingRef;
let evidenceAmount, confirmationContactElement, confirmationDateElement;
let confirmationQuantityElement, confirmationBookingRefElement, confirmationPaymentMethodElement;
let confirmationRefElement, confirmationParticipantsElement, confirmationPaymentStatusElement;
let paymentMainContent, paymentProcessing, processingStatus, successStatus, failedStatus, processingMessage;

// Initialize the application
export function initializeApp() {
    console.log('🚀 Initializing YSD2026 Ticket Registration');
    
    // Get DOM elements
    initializeDOMElements();
    
    // Load the first page
    loadPageContent(1);
    
    // Set up event listeners
    setupEventListeners();
    
    // Update step indicators
    updateStepIndicators();
    
    // Hide any loading states
    if (window.hideLoading) window.hideLoading();
    
    // Run Firebase status check after 2 seconds
    setTimeout(() => {
        console.log('🔄 Running Firebase status check...');
        window.checkFirebaseStatus();
    }, 2000);
}

function initializeDOMElements() {
    // Loading elements
    loadingOverlay = document.getElementById('loadingOverlay');
    loadingText = document.getElementById('loadingText');
    
    // Page 2 elements
    quantityInput = document.getElementById('quantity');
    totalAmountElement = document.getElementById('totalAmount');
    totalSavingsElement = document.getElementById('totalSavings');
    priceBreakdownDiv = document.getElementById('priceBreakdown');
    bookingTicketPriceElement = document.getElementById('bookingTicketPrice');
    
    // Page 3 elements
    previewQuantityElement = document.getElementById('previewQuantity');
    previewTotalElement = document.getElementById('previewTotal');
    previewTicketTypeElement = document.getElementById('previewTicketType');
    
    // Page 4 elements
    paymentContactElement = document.getElementById('paymentContact');
    paymentAmountElement = document.getElementById('paymentAmount');
    paymentReferenceElement = document.getElementById('paymentReference');
    paymentParticipantsElement = document.getElementById('paymentParticipants');
    participantsSummaryElement = document.getElementById('participantsSummary');
    payNowAmount = document.getElementById('payNowAmount');
    paymentMainContent = document.getElementById('paymentMainContent');
    paymentProcessing = document.getElementById('paymentProcessing');
    processingStatus = document.getElementById('processingStatus');
    successStatus = document.getElementById('successStatus');
    failedStatus = document.getElementById('failedStatus');
    processingMessage = document.getElementById('processingMessage');
    
    // Page 5 elements
    evidenceBookingRef = document.getElementById('evidenceBookingRef');
    evidenceAmount = document.getElementById('evidenceAmount');
    
    // Page 6 elements
    confirmationContactElement = document.getElementById('confirmationContact');
    confirmationDateElement = document.getElementById('confirmationDate');
    confirmationQuantityElement = document.getElementById('confirmationQuantity');
    confirmationBookingRefElement = document.getElementById('confirmationBookingRef');
    confirmationPaymentMethodElement = document.getElementById('confirmationPaymentMethod');
    confirmationRefElement = document.getElementById('confirmationRef');
    confirmationParticipantsElement = document.getElementById('confirmationParticipants');
    confirmationPaymentStatusElement = document.getElementById('confirmationPaymentStatus');
}

function loadPageContent(pageNumber) {
    // Page content HTML
    const pages = {
        1: getPage1HTML(),
        2: getPage2HTML(),
        3: getPage3HTML(),
        4: getPage4HTML(),
        5: getPage5HTML(),
        6: getPage6HTML()
    };
    
    document.getElementById('mainContent').innerHTML = pages[pageNumber];
    currentPage = pageNumber;
    
    // Re-initialize DOM elements after content load
    initializeDOMElements();
    
    // Update page-specific logic
    if (pageNumber === 2) {
        updateTotalAmount();
        setupQuantityListeners();
    }
    if (pageNumber === 3) {
        updateParticipantForms();
        updateBookingSummary();
    }
    if (pageNumber === 4) {
        updatePaymentSummary();
        resetPaymentUI();
    }
    if (pageNumber === 5) {
        updateEvidencePage();
    }
    if (pageNumber === 6) {
        updateConfirmationPage();
    }
    
    updateStepIndicators();
    window.scrollTo(0, 0);
}

// Navigation functions
window.goToPage = function(pageNumber) {
    loadPageContent(pageNumber);
};

function updateStepIndicators() {
    for (let i = 1; i <= 6; i++) {
        const stepElement = document.getElementById(`step${i}`);
        if (stepElement) {
            stepElement.classList.remove('active', 'completed');
            
            if (i < currentPage) {
                stepElement.classList.add('completed');
            } else if (i === currentPage) {
                stepElement.classList.add('active');
            }
        }
    }
}

function setupEventListeners() {
    if (quantityInput) {
        quantityInput.addEventListener('change', validateQuantity);
    }
}

function setupQuantityListeners() {
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('change', validateQuantity);
    }
}

// ============================================
// PAGE 1: SELECT TICKET
// ============================================
function getPage1HTML() {
    return `
        <h2>Select Admission Ticket</h2>
        <p class="note"><i class="fas fa-info-circle"></i> Special bundle: 4 tickets for RM260 (save RM20). Individual ticket RM70.</p>
        
        <div class="ticket-option">
            <h3>Kids (5 to 12 years of age)</h3>
            <p>Admission ticket for children between 5 to 12 years old. Includes access to all YSD2026 activities at Universiti Putra Malaysia.</p>
            <div class="ticket-price">RM 70.00 per person</div>
            <p style="margin: 10px 0; background:#f0f7f0; padding:10px; border-radius:5px;"><i class="fas fa-tag"></i> <strong>Bundle offer:</strong> 4 tickets for RM260 (effectively RM65 each)</p>
            <button class="btn btn-primary" onclick="selectTicket()">SELECT TICKETS</button>
        </div>
        
        <div class="note">
            <p><strong>Pricing explained:</strong> Each ticket is RM70. For every 4 tickets, the total for those 4 is RM260 (RM65 each).</p>
        </div>
    `;
}

window.selectTicket = function() {
    ticketQuantity = 1;
    if (quantityInput) quantityInput.value = 1;
    goToPage(2);
};

// ============================================
// PAGE 2: BOOKING OPTIONS
// ============================================
function getPage2HTML() {
    return `
        <h2>Booking Options</h2>
        
        <div class="ticket-option">
            <h3>Kids (5 to 12 years of age)</h3>
            <p>Individual ticket RM70 | Bundle: 4 tickets for RM260</p>
            <div class="ticket-price" id="bookingTicketPrice">RM 70.00 each</div>
            
            <div class="quantity-selector">
                <label>Select Quantity:</label>
                <div style="display: flex; align-items: center; margin-top: 10px;">
                    <button class="quantity-btn" onclick="decreaseQuantity()">-</button>
                    <input type="number" class="quantity-input" id="quantity" value="1" min="1" max="20" onchange="validateQuantity()">
                    <button class="quantity-btn" onclick="increaseQuantity()">+</button>
                </div>
                <p style="margin-top: 10px; color: #666; font-size: 0.9rem;"><i class="fas fa-info-circle"></i> You can book up to 20 tickets.</p>
                
                <div id="priceBreakdown" style="margin-top: 15px; padding: 15px; background-color: #e8f5e8; border-radius: 5px;"></div>
            </div>
            
            <div class="total-section">
                <div class="total-label">Total Amount</div>
                <div class="total-amount" id="totalAmount">RM 70.00</div>
                <div class="total-savings" id="totalSavings" style="display: none;">You save: RM 0.00</div>
            </div>
            
            <div class="navigation-buttons">
                <button class="btn btn-secondary" onclick="goToPage(1)">Back</button>
                <div>
                    <button class="btn btn-primary" onclick="bookNow()">BOOK NOW</button>
                </div>
            </div>
        </div>
    `;
}

window.increaseQuantity = function() {
    ticketQuantity = parseInt(quantityInput.value) + 1;
    quantityInput.value = ticketQuantity;
    updateTotalAmount();
};

window.decreaseQuantity = function() {
    if (ticketQuantity > 1) {
        ticketQuantity = parseInt(quantityInput.value) - 1;
        quantityInput.value = ticketQuantity;
        updateTotalAmount();
    }
};

window.validateQuantity = function() {
    let value = parseInt(quantityInput.value);
    if (isNaN(value) || value < 1) value = 1;
    if (value > 20) value = 20;
    quantityInput.value = value;
    ticketQuantity = value;
    updateTotalAmount();
};

function calculateTotal(qty) {
    const bundles = Math.floor(qty / 4);
    const singles = qty % 4;
    const total = bundles * BUNDLE_PRICE + singles * SINGLE_PRICE;
    const saving = bundles * (4 * SINGLE_PRICE - BUNDLE_PRICE);
    return { total, saving, bundles, singles };
}

function updateTotalAmount() {
    if (!quantityInput || !totalAmountElement || !priceBreakdownDiv) return;
    
    ticketQuantity = parseInt(quantityInput.value);
    const { total, saving, bundles, singles } = calculateTotal(ticketQuantity);
    
    totalAmountElement.textContent = `RM ${total.toFixed(2)}`;
    
    let breakdownHtml = `<p><strong>Price breakdown:</strong></p>`;
    if (bundles > 0) {
        breakdownHtml += `<p>${bundles} × 4-ticket bundle @ RM260 = RM ${(bundles * BUNDLE_PRICE).toFixed(2)}</p>`;
    }
    if (singles > 0) {
        breakdownHtml += `<p>${singles} × single ticket @ RM70 = RM ${(singles * SINGLE_PRICE).toFixed(2)}</p>`;
    }
    breakdownHtml += `<p><strong>Total: RM ${total.toFixed(2)}</strong>`;
    if (saving > 0) {
        breakdownHtml += ` <span style="color:#ff5722;">(You save RM ${saving.toFixed(2)})</span>`;
        if (totalSavingsElement) {
            totalSavingsElement.textContent = `You save: RM ${saving.toFixed(2)}`;
            totalSavingsElement.style.display = 'block';
        }
    } else {
        if (totalSavingsElement) totalSavingsElement.style.display = 'none';
    }
    breakdownHtml += `</p>`;
    priceBreakdownDiv.innerHTML = breakdownHtml;
}

window.bookNow = function() {
    updateBookingSummary();
    goToPage(3);
};

// ============================================
// PAGE 3: PARTICIPANT DETAILS
// ============================================
function getPage3HTML() {
    return `
        <h2>Participant Details</h2>
        <p class="note"><i class="fas fa-ticket-alt"></i> Please provide names and ages for all participants. This information will be used for certificate preparation.</p>
        
        <div class="form-group">
            <label for="contactPerson">Contact Person (Mother/Father/Guardian) *</label>
            <input type="text" id="contactPerson" class="form-control" placeholder="Enter full name">
        </div>
        
        <div class="form-group">
            <label for="contactEmail">Email Address *</label>
            <input type="email" id="contactEmail" class="form-control" placeholder="Enter email address">
        </div>
        
        <div class="form-group">
            <label for="contactPhone">Phone Number *</label>
            <input type="tel" id="contactPhone" class="form-control" placeholder="Enter phone number">
        </div>
        
        <h3 style="margin: 30px 0 20px;">Participants Information <span style="font-size: 1rem; color: #666;">(for certificate preparation)</span></h3>
        
        <div id="participantsContainer"></div>
        
        <div class="ticket-preview">
            <h4>Booking Summary</h4>
            <div class="preview-item">
                <span class="preview-label">Ticket Type:</span>
                <span class="preview-value" id="previewTicketType">Kids (5-12 years)</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Event Date:</span>
                <span class="preview-value">13th June 2026</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Number of Tickets:</span>
                <span class="preview-value" id="previewQuantity">1</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Total Amount:</span>
                <span class="preview-value" id="previewTotal">RM 70.00</span>
            </div>
        </div>
        
        <div class="navigation-buttons">
            <button class="btn btn-secondary" onclick="goToPage(2)">Back</button>
            <button class="btn btn-primary" onclick="validateParticipantDetails()">PROCEED TO PAYMENT</button>
        </div>
        
        <p style="margin-top: 20px; color: #666; font-size: 0.9rem; text-align: center;">
            <i class="fas fa-lock"></i> Your information is secure and encrypted
        </p>
    `;
}

function updateParticipantForms() {
    const container = document.getElementById('participantsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 1; i <= ticketQuantity; i++) {
        addParticipantForm(i);
    }
}

function addParticipantForm(index) {
    const container = document.getElementById('participantsContainer');
    if (!container) return;
    
    const participantForm = document.createElement('div');
    participantForm.className = 'participant-form';
    participantForm.innerHTML = `
        <h4>Participant ${index} Details</h4>
        <div class="participant-row">
            <div class="participant-number">${index}.</div>
            <div class="participant-field">
                <label for="participantName${index}">Full Name *</label>
                <input type="text" id="participantName${index}" class="form-control" placeholder="Enter participant's full name">
            </div>
            <div class="participant-field">
                <label for="participantAge${index}">Age *</label>
                <input type="number" id="participantAge${index}" class="form-control" placeholder="Age" min="5" max="12">
            </div>
        </div>
    `;
    
    container.appendChild(participantForm);
}

function updateBookingSummary() {
    const { total } = calculateTotal(ticketQuantity);
    
    if (previewQuantityElement) previewQuantityElement.textContent = ticketQuantity;
    if (previewTotalElement) previewTotalElement.textContent = `RM ${total.toFixed(2)}`;
    if (previewTicketTypeElement) previewTicketTypeElement.textContent = 'Kids (5-12 years)';
}

window.validateParticipantDetails = async function() {
    const contactPerson = document.getElementById('contactPerson')?.value;
    const contactEmail = document.getElementById('contactEmail')?.value;
    const contactPhone = document.getElementById('contactPhone')?.value;
    
    if (!contactPerson || !contactEmail || !contactPhone) {
        alert('Please fill in all contact person details.');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    const participantCount = document.getElementById('participantsContainer')?.children.length || 0;
    participants = [];
    
    for (let i = 1; i <= participantCount; i++) {
        const name = document.getElementById(`participantName${i}`)?.value;
        const age = document.getElementById(`participantAge${i}`)?.value;
        
        if (!name || !age) {
            alert(`Please fill in all details for Participant ${i}`);
            return;
        }
        
        if (parseInt(age) < 5 || parseInt(age) > 12) {
            alert(`Participant ${i} age must be between 5 and 12 years old.`);
            return;
        }
        
        participants.push({
            number: i,
            name: name,
            age: parseInt(age)
        });
    }
    
    const { total } = calculateTotal(ticketQuantity);
    const bookingId = 'YSD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    
    if (window.showLoading) window.showLoading('Saving booking details...');
    
    try {
        // Save booking to Firebase
        if (window.db && window.firebaseModules) {
            const { collection, addDoc } = window.firebaseModules;
            
            const bookingData = {
                bookingRef: bookingId,
                contactPerson: contactPerson,
                contactEmail: contactEmail,
                contactPhone: contactPhone,
                totalAmount: total,
                ticketQuantity: ticketQuantity,
                participants: participants,
                paymentMethod: 'FPX',
                paymentStatus: 'pending',
                selectedBank: null,
                // NEW FIELDS FOR ADMIN DASHBOARD
                attendance: [],           // Empty array for attendance tracking
                certificates: [],          // Empty array for certificate tracking
                evidenceUploaded: false,   // No evidence yet
                evidenceFileName: null,    // No evidence file yet
                evidenceUploadedAt: null,  // No evidence upload time yet
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            console.log('Attempting to save:', bookingData);
            
            const docRef = await addDoc(collection(window.db, "bookings"), bookingData);
            console.log("✅ Booking saved with ID: ", docRef.id);
            
            currentBookingId = docRef.id;
            currentBookingRef = bookingId;
            
            // Store in session for later use
            sessionStorage.setItem('currentBookingId', docRef.id);
            sessionStorage.setItem('bookingRef', bookingId);
            sessionStorage.setItem('contactEmail', contactEmail);
            sessionStorage.setItem('contactPerson', contactPerson);
            
            // Send confirmation email
            await sendConfirmationEmail({
                contactPerson,
                contactEmail,
                bookingRef: bookingId,
                ticketQuantity,
                totalAmount: total,
                participants
            });
        } else {
            console.error('Firebase not initialized');
            throw new Error('Firebase not ready');
        }
        
        if (window.hideLoading) window.hideLoading();
        goToPage(4);
        
    } catch (error) {
        console.error('❌ Detailed error:', error);
        alert('Error saving booking: ' + error.message);
        if (window.hideLoading) window.hideLoading();
    }
};

// ============================================
// PAGE 4: PAYMENT (UPM FPX ONLY - FAKE PAYMENT)
// ============================================
function getPage4HTML() {
    return `
        <div id="paymentMainContent">
            <h2>Payment</h2>
            <p>Complete your payment using UPM secure payment gateway.</p>
            
            <div class="ticket-preview">
                <h4>Payment Summary</h4>
                <div class="preview-item">
                    <span class="preview-label">Contact Person:</span>
                    <span class="preview-value" id="paymentContact">-</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Amount to Pay:</span>
                    <span class="preview-value" id="paymentAmount">RM 70.00</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Booking Reference:</span>
                    <span class="preview-value" id="paymentReference">YSD-2026-001</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Number of Participants:</span>
                    <span class="preview-value" id="paymentParticipants">1</span>
                </div>
                
                <div class="participants-summary" id="participantsSummary"></div>
            </div>
            
            <!-- UPM FPX Payment - No Bank Selection -->
            <div class="payment-methods" style="justify-content: center;">
                <div class="payment-method selected" id="upmMethod" style="max-width: 300px; margin:0 auto;">
                    <i class="fas fa-university"></i>
                    <h4>UPM FPX Payment</h4>
                    <p>Secure Online Banking</p>
                </div>
            </div>
            
            <div class="payment-detail-form active" id="upmForm">
                <div class="secure-badge">
                    <i class="fas fa-lock"></i> Secured by UPM • 256-bit SSL Encryption
                </div>
                
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-university" style="font-size: 3rem; color: #4CAF50; margin-bottom: 15px;"></i>
                    <h3 style="margin-bottom: 15px;">UPM FPX Payment Gateway</h3>
                    <p style="color: #666; margin-bottom: 20px;">
                        You will be redirected to the UPM secure FPX payment page.<br>
                        All major Malaysian banks are supported.
                    </p>
                    <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin-top: 15px;">
                        <i class="fas fa-info-circle" style="color: #4CAF50;"></i>
                        <strong>TEST MODE:</strong> This is a simulated payment for testing purposes.
                    </div>
                </div>
                
                <p style="margin: 20px 0; color: #666; text-align: center;">
                    <i class="fas fa-info-circle"></i> Click Pay Now to test the payment simulation.
                </p>
            </div>
            
            <div class="navigation-buttons">
                <button class="btn btn-secondary" onclick="goToPage(3)">Back</button>
                <button class="btn btn-success" id="payNowBtn" onclick="window.processFPXPayment()">
                    <i class="fas fa-lock"></i> PAY NOW • RM <span id="payNowAmount">70.00</span>
                </button>
            </div>
        </div>
        
        <!-- Payment Processing Status -->
        <div id="paymentProcessing" style="display: none;">
            <div class="payment-status active" id="processingStatus">
                <div class="spinner"></div>
                <h3>Processing Payment</h3>
                <p id="processingMessage">Connecting to UPM FPX Gateway...</p>
                <div style="margin-top: 20px; color: #666;">
                    <i class="fas fa-clock"></i> Please do not close this window
                </div>
            </div>
            
            <div class="payment-status" id="successStatus">
                <i class="fas fa-check-circle" style="font-size: 5rem; color: #4CAF50; margin-bottom: 20px;"></i>
                <h3>Payment Successful!</h3>
                <p>Your FPX transaction has been completed.</p>
                <button class="btn btn-primary" onclick="goToEvidenceUpload()" style="margin-top: 20px;">
                    Continue to Upload Evidence
                </button>
            </div>
            
            <div class="payment-status" id="failedStatus">
                <i class="fas fa-times-circle" style="font-size: 5rem; color: #dc3545; margin-bottom: 20px;"></i>
                <h3>Payment Failed</h3>
                <p id="failedMessage">Transaction could not be processed. Please try again.</p>
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="window.retryPayment()">Try Again</button>
                    <button class="btn btn-secondary" onclick="goToPage(3)">Back to Details</button>
                </div>
            </div>
        </div>
    `;
}

function updatePaymentSummary() {
    const { total } = calculateTotal(ticketQuantity);
    const contactPerson = document.getElementById('contactPerson')?.value || '-';
    const bookingRef = sessionStorage.getItem('bookingRef') || 'YSD-2026-001';
    
    if (paymentContactElement) paymentContactElement.textContent = contactPerson;
    if (paymentAmountElement) paymentAmountElement.textContent = `RM ${total.toFixed(2)}`;
    if (paymentReferenceElement) paymentReferenceElement.textContent = bookingRef;
    if (paymentParticipantsElement) paymentParticipantsElement.textContent = ticketQuantity;
    if (payNowAmount) payNowAmount.textContent = total.toFixed(2);
    
    // Update participants summary
    if (participantsSummaryElement && participants.length > 0) {
        let summaryHtml = '<div style="margin-top: 15px;"><strong>Participants:</strong></div>';
        participants.forEach(p => {
            summaryHtml += `
                <div class="participant-item">
                    <span>${p.number}. ${p.name}</span>
                    <span>Age: ${p.age}</span>
                </div>
            `;
        });
        participantsSummaryElement.innerHTML = summaryHtml;
    }
}

function resetPaymentUI() {
    if (paymentMainContent) paymentMainContent.style.display = 'block';
    if (paymentProcessing) paymentProcessing.style.display = 'none';
    paymentInProgress = false;
}

// ============================================
// FAKE FPX PAYMENT SIMULATION (No real payment)
// ============================================
window.processFPXPayment = function() {
    console.log('💰 processFPXPayment called');
    if (paymentInProgress) return;
    
    paymentInProgress = true;
    
    // Hide main content, show processing
    if (paymentMainContent) paymentMainContent.style.display = 'none';
    if (paymentProcessing) paymentProcessing.style.display = 'block';
    
    if (processingStatus) processingStatus.style.display = 'block';
    if (successStatus) successStatus.style.display = 'none';
    if (failedStatus) failedStatus.style.display = 'none';
    
    // Fake payment processing messages
    let progress = 0;
    const messages = [
        'Connecting to FPX...',
        'Redirecting to bank...',
        'Processing payment...',
        'Verifying transaction...',
        'Almost done...'
    ];
    
    const interval = setInterval(() => {
        if (progress < messages.length && processingMessage) {
            processingMessage.textContent = messages[progress];
            progress++;
        }
    }, 1000);
    
    // Fake payment processing - 90% success rate for testing
    setTimeout(() => {
        clearInterval(interval);
        
        // Random success (90% chance) or failure (10% chance)
        const isSuccess = Math.random() < 0.9;
        
        if (isSuccess) {
            // Fake successful payment
            if (processingStatus) processingStatus.style.display = 'none';
            if (successStatus) successStatus.style.display = 'block';
            
            // Log fake transaction for demo
            console.log('✅ FAKE PAYMENT SUCCESSFUL', {
                bookingRef: paymentReferenceElement ? paymentReferenceElement.textContent : 'unknown',
                amount: paymentAmountElement ? paymentAmountElement.textContent : 'unknown',
                transactionId: 'TXN' + Date.now(),
                timestamp: new Date().toISOString()
            });
            
            // Store fake payment info in session
            sessionStorage.setItem('paymentStatus', 'success');
            sessionStorage.setItem('paymentAmount', paymentAmountElement ? paymentAmountElement.textContent : 'RM 70.00');
            sessionStorage.setItem('transactionId', 'TXN' + Date.now());
            
        } else {
            // Fake failed payment (10% chance)
            if (processingStatus) processingStatus.style.display = 'none';
            if (failedStatus) {
                const failedMessage = document.getElementById('failedMessage');
                if (failedMessage) {
                    failedMessage.textContent = 'Payment failed. This is a test failure - please try again.';
                }
                failedStatus.style.display = 'block';
            }
            paymentInProgress = false;
            
            console.log('❌ FAKE PAYMENT FAILED (test scenario)');
        }
    }, 5000);
};

window.retryPayment = function() {
    resetPaymentUI();
    console.log('🔄 Retrying fake payment...');
};

// ============================================
// PAGE 5: UPLOAD EVIDENCE
// ============================================
function getPage5HTML() {
    return `
        <div class="evidence-upload-page">
            <h2>Upload Payment Evidence</h2>
            <p class="note"><i class="fas fa-info-circle"></i> Your FPX payment was successful. Please upload your payment receipt as evidence for admin verification.</p>
            
            <div class="ticket-preview">
                <h4>Booking Information</h4>
                <div class="preview-item">
                    <span class="preview-label">Booking Reference:</span>
                    <span class="preview-value" id="evidenceBookingRef">YSD-2026-001</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Amount Paid:</span>
                    <span class="preview-value" id="evidenceAmount">RM 70.00</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Payment Method:</span>
                    <span class="preview-value">UPM FPX (Online Banking)</span>
                </div>
            </div>
            
            <div class="evidence-upload-area">
                <i class="fas fa-cloud-upload-alt"></i>
                <h3>Upload Payment Receipt</h3>
                <p>Please upload a screenshot or PDF of your FPX transaction receipt.</p>
                
                <input type="file" id="evidenceFile" accept=".png,.jpg,.jpeg,.pdf" style="display: none;" onchange="handleEvidenceFile(event)">
                <div class="file-upload-btn" onclick="document.getElementById('evidenceFile').click()">
                    <i class="fas fa-upload"></i> Choose File
                </div>
                
                <div class="file-info" id="evidenceFileInfo">
                    <div class="file-details">
                        <i class="fas fa-file"></i>
                        <span class="file-name" id="evidenceFileName"></span>
                        <span class="file-size" id="evidenceFileSize"></span>
                        <span class="remove-file" onclick="removeEvidenceFile()"><i class="fas fa-times"></i> Remove</span>
                    </div>
                </div>
                
                <div class="upload-note">
                    <i class="fas fa-info-circle"></i>
                    <strong>Accepted formats:</strong> PNG, JPG, PDF (Max 5MB)<br>
                    <i class="fas fa-clock"></i>
                    <strong>Note:</strong> Your booking will be confirmed after admin verifies your payment evidence.
                </div>
            </div>
            
            <div class="navigation-buttons">
                <button class="btn btn-secondary" onclick="goToPage(4)">Back to Payment</button>
                <button class="btn btn-success" onclick="window.submitEvidence()">
                    <i class="fas fa-check"></i> SUBMIT EVIDENCE
                </button>
            </div>
        </div>
    `;
}

function updateEvidencePage() {
    const bookingRef = sessionStorage.getItem('bookingRef') || 'YSD-2026-001';
    const { total } = calculateTotal(ticketQuantity);
    
    if (evidenceBookingRef) evidenceBookingRef.textContent = bookingRef;
    if (evidenceAmount) evidenceAmount.textContent = `RM ${total.toFixed(2)}`;
}

window.handleEvidenceFile = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        document.getElementById('evidenceFile').value = '';
        return;
    }
    
    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        alert('Please upload PNG, JPG, or PDF file only');
        document.getElementById('evidenceFile').value = '';
        return;
    }
    
    evidenceFile = file;
    
    // Display file info
    const fileName = document.getElementById('evidenceFileName');
    const fileSize = document.getElementById('evidenceFileSize');
    const fileInfo = document.getElementById('evidenceFileInfo');
    
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = `(${(file.size / 1024).toFixed(1)} KB)`;
    if (fileInfo) fileInfo.classList.add('active');
    
    console.log('📎 File selected:', file.name, file.size, file.type);
};

window.removeEvidenceFile = function() {
    evidenceFile = null;
    document.getElementById('evidenceFile').value = '';
    const fileInfo = document.getElementById('evidenceFileInfo');
    if (fileInfo) fileInfo.classList.remove('active');
    console.log('🗑️ File removed');
};

// ============================================
// SUBMIT EVIDENCE WITH FAKE DATA - FIXED VERSION
// ============================================
window.submitEvidence = async function() {
    console.log('📤 submitEvidence called');
    
    if (!evidenceFile) {
        alert('Please upload your payment evidence.');
        return;
    }
    
    if (window.showLoading) window.showLoading('Uploading evidence and finalizing booking...');
    
    try {
        console.log('📤 Submitting evidence...', {
            fileName: evidenceFile.name,
            fileSize: evidenceFile.size,
            fileType: evidenceFile.type
        });
        
        // Try to update Firebase if available
        let firebaseUpdateSuccess = false;
        
        if (window.db && window.firebaseModules) {
            try {
                const { doc, updateDoc } = window.firebaseModules;
                const bookingId = sessionStorage.getItem('currentBookingId');
                
                if (bookingId) {
                    console.log('Updating Firebase booking:', bookingId);
                    const bookingRef = doc(window.db, "bookings", bookingId);
                    await updateDoc(bookingRef, {
                        paymentStatus: 'evidence_uploaded',
                        evidenceUploaded: true,
                        evidenceFileName: evidenceFile.name,
                        evidenceUploadedAt: new Date().toISOString()
                    });
                    console.log('✅ Firebase updated successfully');
                    firebaseUpdateSuccess = true;
                } else {
                    console.warn('No booking ID found in session');
                }
            } catch (fbError) {
                console.error('Firebase update failed (continuing anyway):', fbError);
                // Continue even if Firebase fails - we'll still show success to user
            }
        } else {
            console.warn('Firebase not available - skipping update');
        }
        
        // Get contact details
        const contactPerson = document.getElementById('contactPerson')?.value || 
                              sessionStorage.getItem('contactPerson') || 'Customer';
        const contactEmail = sessionStorage.getItem('contactEmail') || 'test@example.com';
        const bookingRef = sessionStorage.getItem('bookingRef') || 'YSD-2026-001';
        
        // Get fake transaction data from session
        const transactionId = sessionStorage.getItem('transactionId') || 'TXN' + Date.now();
        const paymentAmount = sessionStorage.getItem('paymentAmount') || 'RM 70.00';
        
        // Update confirmation page
        if (confirmationContactElement) confirmationContactElement.textContent = contactPerson;
        
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        if (confirmationDateElement) confirmationDateElement.textContent = now.toLocaleDateString('en-US', options);
        
        if (confirmationPaymentMethodElement) confirmationPaymentMethodElement.textContent = 'UPM FPX (Test Mode)';
        if (confirmationPaymentStatusElement) confirmationPaymentStatusElement.textContent = 'Payment Verified (Test)';
        
        if (confirmationBookingRefElement) confirmationBookingRefElement.textContent = bookingRef;
        if (confirmationRefElement) confirmationRefElement.textContent = bookingRef;
        if (confirmationQuantityElement) confirmationQuantityElement.textContent = ticketQuantity || '1';
        
        // Update participants list
        updateConfirmationParticipants();
        
        // Send payment received email (try but don't wait for it)
        if (contactEmail && contactEmail !== 'test@example.com') {
            sendPaymentReceivedEmail({
                contactPerson,
                contactEmail,
                bookingRef,
                ticketQuantity,
                totalAmount: calculateTotal(ticketQuantity).total,
                participants
            }).catch(err => console.warn('Email sending failed:', err));
        }
        
        // Log fake transaction
        console.log('📎 FAKE TRANSACTION COMPLETE', {
            bookingRef: bookingRef,
            transactionId: transactionId,
            amount: paymentAmount,
            evidenceFile: evidenceFile.name,
            firebaseUpdated: firebaseUpdateSuccess,
            status: 'SIMULATED - NOT REAL PAYMENT'
        });
        
        if (window.hideLoading) window.hideLoading();
        
        // Clear evidence file
        removeEvidenceFile();
        
        // Go to confirmation page
        goToPage(6);
        
    } catch (error) {
        console.error('❌ Error in submitEvidence:', error);
        
        if (window.hideLoading) window.hideLoading();
        
        // Show user-friendly error but still allow retry
        alert('There was an issue submitting your evidence. Please try again. (Error: ' + error.message + ')');
        
        // Don't clear the file so user can retry
    }
};

// ============================================
// PAGE 6: CONFIRMATION
// ============================================
function getPage6HTML() {
    return `
        <div class="success-message">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2>Booking Submitted Successfully!</h2>
            <p>Your payment evidence has been received and is pending admin verification.</p>
            <p>You will receive a confirmation email once your payment is verified.</p>
            
            <div class="booking-id" id="confirmationRef">YSD-2026-001</div>
            
            <div class="ticket-preview" style="max-width: 500px; margin: 30px auto;">
                <h4>Booking Summary</h4>
                <div class="preview-item">
                    <span class="preview-label">Contact Person:</span>
                    <span class="preview-value" id="confirmationContact">-</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Date Submitted:</span>
                    <span class="preview-value" id="confirmationDate">-</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Quantity of Tickets:</span>
                    <span class="preview-value" id="confirmationQuantity">1</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Payment Method:</span>
                    <span class="preview-value" id="confirmationPaymentMethod">UPM FPX</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Booking Reference ID:</span>
                    <span class="preview-value" id="confirmationBookingRef">-</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Payment Status:</span>
                    <span class="preview-value" id="confirmationPaymentStatus">Pending Verification</span>
                </div>
                
                <div class="participants-summary" id="confirmationParticipants"></div>
            </div>
            
            <div style="margin-top: 20px; background-color: #f0f9f0; padding: 15px; border-radius: 5px;">
                <i class="fas fa-clock" style="color: #ff9800;"></i>
                <strong>Payment Pending Verification!</strong> Your payment evidence has been uploaded. Admin will verify within 24 hours.
            </div>
            
            <p style="margin-top: 30px;">
                <button class="btn btn-primary" onclick="printSummary()"><i class="fas fa-print"></i> Print Summary</button>
                <button class="btn btn-secondary" onclick="goToPage(1)"><i class="fas fa-home"></i> Back to Home</button>
            </p>
        </div>
    `;
}

function updateConfirmationPage() {
    const contactPerson = sessionStorage.getItem('contactPerson') || '-';
    const bookingRef = sessionStorage.getItem('bookingRef') || 'YSD-2026-001';
    const { total } = calculateTotal(ticketQuantity);
    
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', options);
    
    if (confirmationContactElement) confirmationContactElement.textContent = contactPerson;
    if (confirmationDateElement) confirmationDateElement.textContent = formattedDate;
    if (confirmationQuantityElement) confirmationQuantityElement.textContent = ticketQuantity;
    if (confirmationBookingRefElement) confirmationBookingRefElement.textContent = bookingRef;
    if (confirmationRefElement) confirmationRefElement.textContent = bookingRef;
    if (confirmationPaymentMethodElement) confirmationPaymentMethodElement.textContent = 'UPM FPX';
    if (confirmationPaymentStatusElement) confirmationPaymentStatusElement.textContent = 'Pending Verification';
    
    // Update participants list
    if (confirmationParticipantsElement && participants.length > 0) {
        let participantsHtml = '<div style="margin-top: 15px;"><strong>Participants:</strong></div>';
        participants.forEach(p => {
            participantsHtml += `
                <div class="participant-item">
                    <span>${p.number}. ${p.name}</span>
                    <span>Age: ${p.age}</span>
                </div>
            `;
        });
        confirmationParticipantsElement.innerHTML = participantsHtml;
    }
}

// ============================================
// EMAIL FUNCTIONS
// ============================================
async function sendConfirmationEmail(bookingDetails) {
    try {
        const emailContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; max-width: 600px; margin: 0 auto; }
                    .booking-ref { font-size: 24px; color: #4CAF50; font-weight: bold; margin: 20px 0; }
                    .details { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>YSD2026 UPM</h1>
                    <h2>Booking Confirmation</h2>
                </div>
                <div class="content">
                    <p>Dear ${bookingDetails.contactPerson},</p>
                    <p>Thank you for registering for YSD2026 at Universiti Putra Malaysia!</p>
                    
                    <div class="booking-ref">${bookingDetails.bookingRef}</div>
                    
                    <div class="details">
                        <h3>Booking Details:</h3>
                        <table>
                            <tr>
                                <th>Tickets:</th>
                                <td>${bookingDetails.ticketQuantity} × Youth Sports Day Entry</td>
                            </tr>
                            <tr>
                                <th>Total Amount:</th>
                                <td><strong>RM ${bookingDetails.totalAmount.toFixed(2)}</strong></td>
                            </tr>
                            <tr>
                                <th>Payment Method:</th>
                                <td>UPM FPX (Online Banking)</td>
                            </tr>
                            <tr>
                                <th>Payment Status:</th>
                                <td><span style="color: #ff9800; font-weight: bold;">Pending Payment</span></td>
                            </tr>
                        </table>
                    </div>
                    
                    <h3>Participants:</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Age</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bookingDetails.participants.map(p => `
                                <tr>
                                    <td>${p.number}</td>
                                    <td>${p.name}</td>
                                    <td>${p.age}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <h3>Next Steps:</h3>
                    <ol>
                        <li>Complete your payment via UPM FPX gateway</li>
                        <li>Upload your payment receipt</li>
                        <li>Wait for admin verification (within 24 hours)</li>
                        <li>Receive final confirmation email</li>
                    </ol>
                    
                    <p style="margin-top: 30px; text-align: center;">
                        <a href="${window.location.origin}/?booking=${bookingDetails.bookingRef}" 
                           style="background: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            PROCEED TO PAYMENT
                        </a>
                    </p>
                    
                    <p><strong>Event Details:</strong><br>
                    📅 Date: 13th June 2026<br>
                    ⏰ Time: 9:00 AM - 4:30 PM<br>
                    📍 Venue: Universiti Putra Malaysia, Serdang</p>
                </div>
                <div class="footer">
                    <p>For inquiries: ysd@upm.edu.my | Tel: 03-1234 5678</p>
                    <p>© 2026 Universiti Putra Malaysia</p>
                </div>
            </body>
            </html>
        `;

        const response = await fetch('/api/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: bookingDetails.contactEmail,
                subject: `YSD2026 Booking Confirmation - ${bookingDetails.bookingRef}`,
                htmlContent: emailContent,
                bookingRef: bookingDetails.bookingRef
            })
        });

        const result = await response.json();
        if (result.success) {
            console.log('✅ Confirmation email sent');
        }
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
}

async function sendPaymentReceivedEmail(bookingDetails) {
    try {
        const emailContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; max-width: 600px; margin: 0 auto; }
                    .booking-ref { font-size: 24px; color: #4CAF50; font-weight: bold; margin: 20px 0; }
                    .details { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
                    .success-badge { background: #4CAF50; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>YSD2026 UPM</h1>
                    <h2>Payment Evidence Received</h2>
                </div>
                <div class="content">
                    <p>Dear ${bookingDetails.contactPerson},</p>
                    <p>Thank you! We have received your payment evidence for YSD2026.</p>
                    
                    <div class="booking-ref">${bookingDetails.bookingRef}</div>
                    
                    <div class="details">
                        <h3>Submission Details:</h3>
                        <table>
                            <tr>
                                <th>Tickets:</th>
                                <td>${bookingDetails.ticketQuantity} × Youth Sports Day Entry</td>
                            </tr>
                            <tr>
                                <th>Amount Paid:</th>
                                <td><strong>RM ${bookingDetails.totalAmount.toFixed(2)}</strong></td>
                            </tr>
                            <tr>
                                <th>Payment Method:</th>
                                <td>UPM FPX (Online Banking)</td>
                            </tr>
                            <tr>
                                <th>Status:</th>
                                <td><span class="success-badge">Pending Verification</span></td>
                            </tr>
                        </table>
                    </div>
                    
                    <p><strong>What happens next?</strong></p>
                    <p>Our admin will verify your payment within <strong>24 hours</strong>. You will receive a final confirmation email once verified.</p>
                    
                    <p>If you have any questions, please contact us at ysd@upm.edu.my</p>
                    
                    <p><strong>Event Details:</strong><br>
                    📅 Date: 13th June 2026<br>
                    ⏰ Time: 9:00 AM - 4:30 PM<br>
                    📍 Venue: Universiti Putra Malaysia, Serdang</p>
                </div>
                <div class="footer">
                    <p>For inquiries: ysd@upm.edu.my | Tel: 03-1234 5678</p>
                    <p>© 2026 Universiti Putra Malaysia</p>
                </div>
            </body>
            </html>
        `;

        const response = await fetch('/api/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: bookingDetails.contactEmail,
                subject: `YSD2026 Payment Received - ${bookingDetails.bookingRef}`,
                htmlContent: emailContent,
                bookingRef: bookingDetails.bookingRef
            })
        });

        const result = await response.json();
        if (result.success) {
            console.log('✅ Payment received email sent');
        }
    } catch (error) {
        console.error('❌ Failed to send payment received email:', error);
    }
}

// ============================================
// UPDATE CONFIRMATION PARTICIPANTS
// ============================================
function updateConfirmationParticipants() {
    if (!confirmationParticipantsElement) return;
    
    confirmationParticipantsElement.innerHTML = '';
    
    if (participants.length === 0) return;
    
    const summaryTitle = document.createElement('div');
    summaryTitle.innerHTML = '<strong>Participants:</strong>';
    summaryTitle.style.marginTop = '15px';
    summaryTitle.style.marginBottom = '10px';
    confirmationParticipantsElement.appendChild(summaryTitle);
    
    participants.forEach(participant => {
        const participantDiv = document.createElement('div');
        participantDiv.className = 'participant-item';
        participantDiv.innerHTML = `
            <span>${participant.number}. ${participant.name}</span>
            <span>Age: ${participant.age}</span>
        `;
        confirmationParticipantsElement.appendChild(participantDiv);
    });
}

// ============================================
// PRINT SUMMARY WITH TEST NOTICE
// ============================================
window.printSummary = function() {
    let participantsHTML = '';
    participants.forEach(p => {
        participantsHTML += `
            <tr>
                <td>${p.number}</td>
                <td>${p.name}</td>
                <td>${p.age}</td>
            </tr>
        `;
    });
    
    const paymentMethod = confirmationPaymentMethodElement?.textContent || 'UPM FPX';
    const paymentStatus = confirmationPaymentStatusElement?.textContent || 'Pending Verification';
    const contactPerson = confirmationContactElement?.textContent || '-';
    const bookingRef = confirmationBookingRefElement?.textContent || '-';
    const dateSubmitted = confirmationDateElement?.textContent || '-';
    const quantity = confirmationQuantityElement?.textContent || '1';
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>YSD2026 UPM Booking Summary</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .summary { border: 2px solid #2c3e50; border-radius: 10px; padding: 20px; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #2c3e50; margin-bottom: 5px; }
                .header h2 { color: #4CAF50; margin-top: 0; }
                .info { margin-bottom: 20px; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
                .label { font-weight: bold; color: #666; }
                .value { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
                td { padding: 10px; border-bottom: 1px solid #eee; }
                .footer { text-align: center; margin-top: 30px; font-size: 0.9rem; color: #666; }
                .badge { display: inline-block; background-color: #ff9800; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.8rem; margin-bottom: 15px; }
                .test-notice { background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 10px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="summary">
                <div class="header">
                    <div class="test-notice">
                        ⚠️ TEST MODE - NOT A REAL PAYMENT ⚠️
                    </div>
                    <div class="badge">${paymentStatus}</div>
                    <h1>YOUNG Scientist DAY 2026</h1>
                    <h2>Universiti Putra Malaysia</h2>
                    <p>13th June 2026 | Universiti Putra Malaysia, Serdang</p>
                </div>
                
                <div class="info">
                    <div class="info-row">
                        <span class="label">Contact Person:</span>
                        <span class="value">${contactPerson}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Booking Reference ID:</span>
                        <span class="value">${bookingRef}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Date Submitted:</span>
                        <span class="value">${dateSubmitted}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Payment Method:</span>
                        <span class="value">${paymentMethod}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Number of Tickets:</span>
                        <span class="value">${quantity}</span>
                    </div>
                </div>
                
                <h3>Participant Details</h3>
                <table>
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Name</th>
                            <th>Age</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${participantsHTML}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>For inquiries: ysd@upm.edu.my | Tel: 03-1234 5678</p>
                </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()">Print</button>
                <button onclick="window.close()">Close</button>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
};

// ============================================
// DEBUG FUNCTION - Check Firebase Status
// ============================================
window.checkFirebaseStatus = function() {
    console.log('🔍 Firebase Status Check:', {
        dbAvailable: !!window.db,
        modulesAvailable: !!window.firebaseModules,
        bookingId: sessionStorage.getItem('currentBookingId'),
        bookingRef: sessionStorage.getItem('bookingRef'),
        contactEmail: sessionStorage.getItem('contactEmail'),
        contactPerson: sessionStorage.getItem('contactPerson')
    });
    return 'Check console for details';
};

// ============================================
// NAVIGATION HELPERS
// ============================================
window.goToEvidenceUpload = function() {
    goToPage(5);
};