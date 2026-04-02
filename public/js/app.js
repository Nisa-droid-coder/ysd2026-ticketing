// public/js/app.js
// Main application logic - Direct Firebase Access with Security Rules

// ============================================
// YSD2026 UPM - Ticket Registration System
// Direct Firebase Version - Relies on Security Rules
// ============================================

// Global variables
let currentPage = 1;
let ticketQuantity = 1;
const SINGLE_PRICE = 70.00;
const BUNDLE_PRICE = 260.00;

let participants = [];
let currentBookingId = null;
let currentBookingRef = null;

// DOM elements
let loadingOverlay, loadingText, quantityInput, totalAmountElement, totalSavingsElement;
let priceBreakdownDiv, previewQuantityElement, previewTotalElement, bookingTicketPriceElement;
let previewTicketTypeElement, paymentContactElement, paymentAmountElement, paymentReferenceElement;
let paymentParticipantsElement, participantsSummaryElement, payNowAmount;
let confirmationContactElement, confirmationDateElement;
let confirmationQuantityElement, confirmationBookingRefElement, confirmationPaymentMethodElement;
let confirmationRefElement, confirmationParticipantsElement, confirmationPaymentStatusElement;

// ============================================
// INITIALIZATION
// ============================================
export function initializeApp() {
    console.log('🚀 Initializing YSD2026 Ticket Registration');
    
    initializeDOMElements();
    loadPageContent(1);
    setupEventListeners();
    updateStepIndicators();
    if (window.hideLoading) window.hideLoading();
}

function initializeDOMElements() {
    loadingOverlay = document.getElementById('loadingOverlay');
    loadingText = document.getElementById('loadingText');
    quantityInput = document.getElementById('quantity');
    totalAmountElement = document.getElementById('totalAmount');
    totalSavingsElement = document.getElementById('totalSavings');
    priceBreakdownDiv = document.getElementById('priceBreakdown');
    bookingTicketPriceElement = document.getElementById('bookingTicketPrice');
    previewQuantityElement = document.getElementById('previewQuantity');
    previewTotalElement = document.getElementById('previewTotal');
    previewTicketTypeElement = document.getElementById('previewTicketType');
    paymentContactElement = document.getElementById('paymentContact');
    paymentAmountElement = document.getElementById('paymentAmount');
    paymentReferenceElement = document.getElementById('paymentReference');
    paymentParticipantsElement = document.getElementById('paymentParticipants');
    participantsSummaryElement = document.getElementById('participantsSummary');
    payNowAmount = document.getElementById('payNowAmount');
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
    initializeDOMElements();
    
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
    }
    if (pageNumber === 5) {
        setTimeout(() => updateEvidencePage(), 50);
    }
    if (pageNumber === 6) {
        updateConfirmationPage();
    }
    
    updateStepIndicators();
    window.scrollTo(0, 0);
}

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
    const input = document.getElementById('quantity');
    if (input) {
        ticketQuantity = parseInt(input.value) + 1;
        input.value = ticketQuantity;
        updateTotalAmount();
    }
};

window.decreaseQuantity = function() {
    const input = document.getElementById('quantity');
    if (input && ticketQuantity > 1) {
        ticketQuantity = parseInt(input.value) - 1;
        input.value = ticketQuantity;
        updateTotalAmount();
    }
};

window.validateQuantity = function() {
    const input = document.getElementById('quantity');
    if (!input) return;
    
    let value = parseInt(input.value);
    if (isNaN(value) || value < 1) value = 1;
    if (value > 20) value = 20;
    input.value = value;
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

// ============================================
// VALIDATE PARTICIPANT DETAILS - DIRECT FIREBASE
// ============================================
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
    const bookingRef = `YSD${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    
    if (window.showLoading) window.showLoading('Creating your booking...');
    
    try {
        const bookingData = {
            bookingRef,
            contactPerson,
            contactEmail,
            contactPhone,
            totalAmount: total,
            ticketQuantity: ticketQuantity,
            participants: participants,
            paymentMethod: 'UPM Payment Gateway',
            paymentStatus: 'pending',
            attendance: [],
            certificates: [],
            evidenceUploaded: false,
            evidenceFileName: null,
            evidenceData: null,
            evidenceUploadedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const docRef = await window.db.collection('bookings').add(bookingData);
        
        console.log('✅ Booking created:', bookingRef, docRef.id);
        
        currentBookingId = docRef.id;
        currentBookingRef = bookingRef;
        
        sessionStorage.setItem('currentBookingId', docRef.id);
        sessionStorage.setItem('bookingRef', bookingRef);
        sessionStorage.setItem('contactEmail', contactEmail);
        sessionStorage.setItem('contactPerson', contactPerson);
        sessionStorage.setItem('contactPhone', contactPhone);
        sessionStorage.setItem('totalAmount', total.toString());
        sessionStorage.setItem('ticketQuantity', ticketQuantity.toString());
        sessionStorage.setItem('participants', JSON.stringify(participants));
        
        if (window.hideLoading) window.hideLoading();
        goToPage(4);
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error creating booking: ' + error.message);
        if (window.hideLoading) window.hideLoading();
    }
};

// ============================================
// PAGE 4: PAYMENT - UPM GATEWAY REDIRECT
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
            
            <div style="background: linear-gradient(135deg, #00653e 0%, #2c7a4b 100%); border-radius: 12px; padding: 30px; margin: 25px 0; color: white; text-align: center;">
                <i class="fas fa-university" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h3 style="margin-bottom: 10px;">UPM Payment Gateway</h3>
                <p style="margin-bottom: 20px; opacity: 0.9;">You will be redirected to the official UPM payment portal to complete your transaction securely.</p>
                <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 15px; margin-top: 10px;">
                    <i class="fas fa-shield-alt"></i> Secured by UPM • SSL Encrypted
                </div>
            </div>
            
            <div class="note" style="background-color: #fff3cd; border-left-color: #ffc107;">
                <i class="fas fa-info-circle"></i> <strong>Important:</strong> After clicking "Pay Now", you will be directed to the UPM payment gateway. 
                Complete your payment there, then return to this page and click "Continue to Upload Evidence" to submit your payment receipt.
            </div>
            
            <div class="navigation-buttons">
                <button class="btn btn-secondary" onclick="goToPage(3)">Back</button>
                <div>
                    <button class="btn btn-success" id="payNowBtn" onclick="window.redirectToUPMPayment()">
                        <i class="fas fa-external-link-alt"></i> PAY NOW • RM <span id="payNowAmount">70.00</span>
                    </button>
                    <button class="btn btn-primary" id="continueAfterPaymentBtn" onclick="window.goToEvidenceUpload()" style="margin-left: 10px;">
                        <i class="fas fa-arrow-right"></i> Continue to Upload Evidence
                    </button>
                </div>
            </div>
        </div>
    `;
}

function updatePaymentSummary() {
    const total = parseFloat(sessionStorage.getItem('totalAmount')) || calculateTotal(ticketQuantity).total;
    const contactPerson = sessionStorage.getItem('contactPerson') || '-';
    const bookingRef = sessionStorage.getItem('bookingRef') || 'YSD-2026-001';
    const ticketQty = parseInt(sessionStorage.getItem('ticketQuantity')) || ticketQuantity;
    
    if (paymentContactElement) paymentContactElement.textContent = contactPerson;
    if (paymentAmountElement) paymentAmountElement.textContent = `RM ${total.toFixed(2)}`;
    if (paymentReferenceElement) paymentReferenceElement.textContent = bookingRef;
    if (paymentParticipantsElement) paymentParticipantsElement.textContent = ticketQty;
    if (payNowAmount) payNowAmount.textContent = total.toFixed(2);
    
    let savedParticipants = sessionStorage.getItem('participants');
    if (savedParticipants && participantsSummaryElement) {
        try {
            const parsedParticipants = JSON.parse(savedParticipants);
            let summaryHtml = '<div style="margin-top: 15px;"><strong>Participants:</strong></div>';
            parsedParticipants.forEach(p => {
                summaryHtml += `
                    <div class="participant-item">
                        <span>${p.number}. ${p.name}</span>
                        <span>Age: ${p.age}</span>
                    </div>
                `;
            });
            participantsSummaryElement.innerHTML = summaryHtml;
        } catch (e) {
            console.error('Error parsing participants:', e);
        }
    }
}

window.redirectToUPMPayment = function() {
    const bookingRef = sessionStorage.getItem('bookingRef') || 'YSD-2026-001';
    const totalAmount = sessionStorage.getItem('totalAmount') || calculateTotal(ticketQuantity).total;
    const contactPerson = sessionStorage.getItem('contactPerson') || 'Customer';
    const contactEmail = sessionStorage.getItem('contactEmail') || '';
    const contactPhone = sessionStorage.getItem('contactPhone') || '';
    
    showPaymentModal();
    
    const upmGatewayUrl = 'https://paygate.upm.edu.my/action.do';
    const params = new URLSearchParams({
        do: '',
        bahasa: 'bi',
        amount: totalAmount,
        billno: bookingRef,
        name: contactPerson,
        email: contactEmail,
        phone: contactPhone
    });
    
    const redirectUrl = `${upmGatewayUrl}?${params.toString()}`;
    
    console.log('Redirecting to UPM Payment Gateway:', { bookingRef, amount: totalAmount });
    
    sessionStorage.setItem('paymentInitiated', 'true');
    sessionStorage.setItem('paymentTimestamp', new Date().toISOString());
    sessionStorage.setItem('paymentAmount', totalAmount);
    
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 1500);
};

function showPaymentModal() {
    let modal = document.getElementById('paymentInstructions');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'paymentInstructions';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 2000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        modal.innerHTML = `
            <div style="background: white; max-width: 500px; margin: 20px; padding: 30px; border-radius: 12px; text-align: center;">
                <i class="fas fa-university" style="font-size: 3rem; color: #4CAF50; margin-bottom: 15px;"></i>
                <h3>Redirecting to UPM Payment Gateway</h3>
                <p style="margin: 15px 0;">Please wait while we redirect you to the secure UPM payment portal.</p>
                <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #4CAF50; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto;"></div>
                <p style="font-size: 0.9rem; color: #666;">If you are not redirected automatically, <a href="#" id="manualRedirectLink">click here</a></p>
            </div>
        `;
        document.body.appendChild(modal);
        
        const manualLink = document.getElementById('manualRedirectLink');
        if (manualLink) {
            manualLink.onclick = function(e) {
                e.preventDefault();
                window.location.href = 'https://paygate.upm.edu.my/action.do?do=&bahasa=bi';
            };
        }
    }
    modal.style.display = 'flex';
}

function hidePaymentModal() {
    const modal = document.getElementById('paymentInstructions');
    if (modal) modal.style.display = 'none';
}

// ============================================
// PAGE 5: UPLOAD EVIDENCE
// ============================================
function getPage5HTML() {
    return `
        <div class="evidence-upload-page">
            <h2>Upload Payment Evidence</h2>
            <p class="note"><i class="fas fa-info-circle"></i> After completing your payment at the UPM payment gateway, please upload your payment receipt or transaction screenshot as evidence.</p>
            
            <div class="ticket-preview">
                <h4>Booking Information</h4>
                <div class="preview-item">
                    <span class="preview-label">Booking Reference:</span>
                    <span class="preview-value" id="evidenceBookingRef">YSD-2026-001</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Amount to Pay:</span>
                    <span class="preview-value" id="evidenceAmount">RM 70.00</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Payment Method:</span>
                    <span class="preview-value">UPM Payment Gateway</span>
                </div>
            </div>
            
            <div class="evidence-upload-area">
                <i class="fas fa-cloud-upload-alt"></i>
                <h3>Upload Payment Receipt</h3>
                <p>Please upload a screenshot or PDF of your UPM payment gateway transaction receipt.</p>
                
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
                    <strong>Accepted formats:</strong> PNG, JPG, PDF (Max 1MB for Firestore)<br>
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

let evidenceFileBase64 = null;
let evidenceFileName = null;

function updateEvidencePage() {
    const bookingRef = sessionStorage.getItem('bookingRef') || 'YSD-2026-001';
    const totalAmount = sessionStorage.getItem('totalAmount') || calculateTotal(ticketQuantity).total;
    
    const evidenceBookingRef = document.getElementById('evidenceBookingRef');
    const evidenceAmountElem = document.getElementById('evidenceAmount');
    
    if (evidenceBookingRef) evidenceBookingRef.textContent = bookingRef;
    if (evidenceAmountElem) evidenceAmountElem.textContent = `RM ${parseFloat(totalAmount).toFixed(2)}`;
}

window.handleEvidenceFile = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
        alert('File size must be less than 1MB for Firestore storage');
        document.getElementById('evidenceFile').value = '';
        return;
    }
    
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|pdf)$/i)) {
        alert('Please upload PNG, JPG, or PDF file only');
        document.getElementById('evidenceFile').value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        evidenceFileBase64 = e.target.result;
        evidenceFileName = file.name;
        
        const fileName = document.getElementById('evidenceFileName');
        const fileSize = document.getElementById('evidenceFileSize');
        const fileInfo = document.getElementById('evidenceFileInfo');
        
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = `(${(file.size / 1024).toFixed(1)} KB)`;
        if (fileInfo) fileInfo.classList.add('active');
        
        console.log('📎 File converted to base64:', file.name, file.size);
    };
    reader.readAsDataURL(file);
};

window.removeEvidenceFile = function() {
    evidenceFileBase64 = null;
    evidenceFileName = null;
    const fileInput = document.getElementById('evidenceFile');
    if (fileInput) fileInput.value = '';
    const fileInfo = document.getElementById('evidenceFileInfo');
    if (fileInfo) fileInfo.classList.remove('active');
    console.log('🗑️ File removed');
};

// ============================================
// SUBMIT EVIDENCE - DIRECT FIREBASE
// ============================================
window.submitEvidence = async function() {
    console.log('📤 submitEvidence called');
    
    if (!evidenceFileBase64) {
        alert('Please upload your payment evidence/receipt from UPM payment gateway.');
        return;
    }
    
    const bookingId = sessionStorage.getItem('currentBookingId');
    if (!bookingId) {
        alert('Booking information missing. Please restart the process.');
        goToPage(1);
        return;
    }
    
    if (window.showLoading) window.showLoading('Uploading evidence...');
    
    try {
        await window.db.collection('bookings').doc(bookingId).update({
            evidenceUploaded: true,
            evidenceFileName: evidenceFileName,
            evidenceData: evidenceFileBase64,
            evidenceUploadedAt: new Date().toISOString(),
            paymentStatus: 'evidence_uploaded',
            updatedAt: new Date().toISOString()
        });
        
        console.log('✅ Evidence uploaded successfully');
        
        const contactPerson = sessionStorage.getItem('contactPerson') || 'Customer';
        const bookingRef = sessionStorage.getItem('bookingRef') || 'YSD-2026-001';
        const ticketQty = sessionStorage.getItem('ticketQuantity') || ticketQuantity || '1';
        
        if (confirmationContactElement) confirmationContactElement.textContent = contactPerson;
        
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        if (confirmationDateElement) confirmationDateElement.textContent = now.toLocaleDateString('en-US', options);
        
        if (confirmationPaymentMethodElement) confirmationPaymentMethodElement.textContent = 'UPM Payment Gateway';
        if (confirmationPaymentStatusElement) confirmationPaymentStatusElement.textContent = 'Pending Verification';
        if (confirmationBookingRefElement) confirmationBookingRefElement.textContent = bookingRef;
        if (confirmationRefElement) confirmationRefElement.textContent = bookingRef;
        if (confirmationQuantityElement) confirmationQuantityElement.textContent = ticketQty;
        
        let savedParticipants = sessionStorage.getItem('participants');
        if (savedParticipants) {
            try {
                const participantsList = JSON.parse(savedParticipants);
                if (confirmationParticipantsElement && participantsList.length > 0) {
                    let participantsHtml = '<div style="margin-top: 15px;"><strong>Participants:</strong></div>';
                    participantsList.forEach(p => {
                        participantsHtml += `
                            <div class="participant-item">
                                <span>${p.number}. ${p.name}</span>
                                <span>Age: ${p.age}</span>
                            </div>
                        `;
                    });
                    confirmationParticipantsElement.innerHTML = participantsHtml;
                }
            } catch (e) {
                console.error('Error parsing participants:', e);
            }
        }
        
        if (window.hideLoading) window.hideLoading();
        removeEvidenceFile();
        hidePaymentModal();
        goToPage(6);
        
    } catch (error) {
        console.error('❌ Error uploading evidence:', error);
        alert('Error uploading evidence: ' + error.message);
        if (window.hideLoading) window.hideLoading();
    }
};

window.goToEvidenceUpload = function() {
    goToPage(5);
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
                    <span class="preview-value" id="confirmationPaymentMethod">UPM Payment Gateway</span>
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
    const ticketQty = sessionStorage.getItem('ticketQuantity') || ticketQuantity || '1';
    
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', options);
    
    if (confirmationContactElement) confirmationContactElement.textContent = contactPerson;
    if (confirmationDateElement) confirmationDateElement.textContent = formattedDate;
    if (confirmationQuantityElement) confirmationQuantityElement.textContent = ticketQty;
    if (confirmationBookingRefElement) confirmationBookingRefElement.textContent = bookingRef;
    if (confirmationRefElement) confirmationRefElement.textContent = bookingRef;
    if (confirmationPaymentMethodElement) confirmationPaymentMethodElement.textContent = 'UPM Payment Gateway';
    if (confirmationPaymentStatusElement) confirmationPaymentStatusElement.textContent = 'Pending Verification';
    
    let savedParticipants = sessionStorage.getItem('participants');
    if (savedParticipants && participants.length === 0) {
        try {
            participants = JSON.parse(savedParticipants);
        } catch (e) {
            console.error('Error parsing participants:', e);
        }
    }
    
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

function updateConfirmationParticipants() {
    if (!confirmationParticipantsElement) return;
    confirmationParticipantsElement.innerHTML = '';
    
    if (participants.length === 0) {
        let saved = sessionStorage.getItem('participants');
        if (saved) {
            try {
                participants = JSON.parse(saved);
            } catch (e) {}
        }
    }
    
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
// PRINT SUMMARY
// ============================================
window.printSummary = function() {
    let participantsHTML = '';
    let printParticipants = participants;
    if (printParticipants.length === 0) {
        const saved = sessionStorage.getItem('participants');
        if (saved) {
            try {
                printParticipants = JSON.parse(saved);
            } catch (e) {}
        }
    }
    
    printParticipants.forEach(p => {
        participantsHTML += `
            <tr>
                <td>${p.number}</td>
                <td>${p.name}</td>
                <td>${p.age}</td>
            </tr>
        `;
    });
    
    const paymentMethod = confirmationPaymentMethodElement?.textContent || 'UPM Payment Gateway';
    const paymentStatus = confirmationPaymentStatusElement?.textContent || 'Pending Verification';
    const contactPerson = confirmationContactElement?.textContent || sessionStorage.getItem('contactPerson') || '-';
    const bookingRef = confirmationBookingRefElement?.textContent || sessionStorage.getItem('bookingRef') || '-';
    const dateSubmitted = confirmationDateElement?.textContent || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const quantity = confirmationQuantityElement?.textContent || sessionStorage.getItem('ticketQuantity') || '1';
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>YSD2026 UPM Booking Summary</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .summary { border: 2px solid #00653e; border-radius: 10px; padding: 20px; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #00653e; margin-bottom: 5px; }
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
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="summary">
                <div class="header">
                    <div class="badge">${paymentStatus}</div>
                    <h1>YOUNG SCIENTIST DAY 2026</h1>
                    <h2>Universiti Putra Malaysia</h2>
                    <p>13th June 2026 | Department of Human Anatomy, Faculty of Medicine and Health Sciences, Universiti Putra Malaysia, 43400 UPM Serdang, Selangor Darul Ehsan.</p>
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
                    <p>For inquiries: ysd@upm.edu.my | Tel: 03-9769 2330 / 03-9769 3220</p>
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