// Enhanced POS Integration to properly map Sales Person to POS Invoice
console.log("Enhanced POS Integration loaded for Sales Person mapping");

// Global variables for better state management
window.diva_pos_integration = {
    selectedSalesPersonName: null,
    selectedSalesPersonDisplayName: null,
    initialized: false,
    pos_ready: false
};

// Initialize when document is ready
$(document).ready(function() {
    if (window.location.href.includes('point-of-sale')) {
        initializePOSIntegration();
    }
});

// Also initialize when frappe is ready
frappe.ready(function() {
    if (window.location.href.includes('point-of-sale')) {
        setTimeout(() => {
            initializePOSIntegration();
        }, 1000);
    }
});

function initializePOSIntegration() {
    console.log("Initializing POS Integration for Sales Person mapping");
    
    if (window.diva_pos_integration.initialized) {
        console.log("POS integration already initialized");
        return;
    }
    
    // Wait for POS to be fully loaded
    let initAttempts = 0;
    let maxInitAttempts = 30;
    
    let checkPOSReady = setInterval(() => {
        initAttempts++;
        console.log(`Checking if POS is ready... Attempt ${initAttempts}`);
        
        // Check multiple indicators that POS is ready
        let posReady = (
            (typeof cur_pos !== 'undefined' && cur_pos) ||
            (typeof frappe !== 'undefined' && frappe.ui && frappe.ui.form) ||
            $('.pos-wrapper').length > 0 ||
            $('.cart-container').length > 0
        );
        
        if (posReady) {
            console.log("POS is ready, setting up integration");
            clearInterval(checkPOSReady);
            setupPOSIntegration();
        } else if (initAttempts >= maxInitAttempts) {
            console.log("POS readiness timeout, using fallback setup");
            clearInterval(checkPOSReady);
            setupFallbackIntegration();
        }
    }, 500);
}

function setupPOSIntegration() {
    console.log("Setting up POS integration with cur_pos");
    
    // Hook into POS invoice creation/saving
    if (typeof cur_pos !== 'undefined' && cur_pos) {
        window.diva_pos_integration.pos_ready = true;
        
        // Override the frm.save method if it exists
        if (cur_pos.frm && cur_pos.frm.save) {
            let originalSave = cur_pos.frm.save.bind(cur_pos.frm);
            
            cur_pos.frm.save = function(callback, btn, btn_label, show_alert) {
                console.log("Intercepted frm.save, adding sales person");
                
                // Set the selected sales person before saving
                if (window.diva_pos_integration.selectedSalesPersonName) {
                    console.log("Setting sales person:", window.diva_pos_integration.selectedSalesPersonName);
                    this.doc.custom_sales_person = window.diva_pos_integration.selectedSalesPersonName;
                    
                    if (window.diva_pos_integration.selectedSalesPersonDisplayName) {
                        this.doc.custom_sales_persons_name = window.diva_pos_integration.selectedSalesPersonDisplayName;
                    }
                }
                
                // Call original save method
                return originalSave(callback, btn, btn_label, show_alert);
            };
        }
        
        // Also override submit_invoice if it exists
        if (cur_pos.submit_invoice) {
            let originalSubmit = cur_pos.submit_invoice.bind(cur_pos);
            
            cur_pos.submit_invoice = function() {
                console.log("Intercepted submit_invoice, ensuring sales person is set");
                
                if (window.diva_pos_integration.selectedSalesPersonName && this.frm && this.frm.doc) {
                    this.frm.doc.custom_sales_person = window.diva_pos_integration.selectedSalesPersonName;
                    
                    if (window.diva_pos_integration.selectedSalesPersonDisplayName) {
                        this.frm.doc.custom_sales_persons_name = window.diva_pos_integration.selectedSalesPersonDisplayName;
                    }
                }
                
                return originalSubmit();
            };
        }
        
        // Hook into payment processing
        if (cur_pos.make_payment) {
            let originalMakePayment = cur_pos.make_payment.bind(cur_pos);
            
            cur_pos.make_payment = function() {
                console.log("Intercepted make_payment, setting sales person");
                
                if (window.diva_pos_integration.selectedSalesPersonName && this.frm && this.frm.doc) {
                    this.frm.doc.custom_sales_person = window.diva_pos_integration.selectedSalesPersonName;
                    
                    if (window.diva_pos_integration.selectedSalesPersonDisplayName) {
                        this.frm.doc.custom_sales_persons_name = window.diva_pos_integration.selectedSalesPersonDisplayName;
                    }
                    
                    // Also set it in the form field if it exists
                    if (this.frm.set_value) {
                        this.frm.set_value('custom_sales_person', window.diva_pos_integration.selectedSalesPersonName);
                    }
                }
                
                return originalMakePayment();
            };
        }
    }
    
    // Set up form event handlers
    setupFormEventHandlers();
    
    window.diva_pos_integration.initialized = true;
    console.log("POS integration setup complete");
}

function setupFallbackIntegration() {
    console.log("Setting up fallback POS integration");
    
    // Monitor for form submissions
    $(document).on('submit', 'form', function(e) {
        let form = $(this);
        
        // Check if this might be a POS invoice form
        if (form.find('input[name="doctype"]').val() === 'POS Invoice' || 
            window.location.href.includes('point-of-sale')) {
            
            console.log("POS form submission detected");
            
            if (window.diva_pos_integration.selectedSalesPersonName) {
                // Add/update hidden field for sales person
                let existingField = form.find('input[name="custom_sales_person"]');
                if (existingField.length > 0) {
                    existingField.val(window.diva_pos_integration.selectedSalesPersonName);
                } else {
                    form.append(`<input type="hidden" name="custom_sales_person" value="${window.diva_pos_integration.selectedSalesPersonName}">`);
                }
                
                // Add sales person name field
                if (window.diva_pos_integration.selectedSalesPersonDisplayName) {
                    let existingNameField = form.find('input[name="custom_sales_persons_name"]');
                    if (existingNameField.length > 0) {
                        existingNameField.val(window.diva_pos_integration.selectedSalesPersonDisplayName);
                    } else {
                        form.append(`<input type="hidden" name="custom_sales_persons_name" value="${window.diva_pos_integration.selectedSalesPersonDisplayName}">`);
                    }
                }
            }
        }
    });
    
    setupFormEventHandlers();
    
    window.diva_pos_integration.initialized = true;
    console.log("Fallback POS integration setup complete");
}

function setupFormEventHandlers() {
    console.log("Setting up form event handlers");
    
    // Hook into frappe form events if available
    if (typeof frappe !== 'undefined' && frappe.ui && frappe.ui.form) {
        
        // Hook into POS Invoice form events
        frappe.ui.form.on('POS Invoice', {
            before_save: function(frm) {
                console.log("POS Invoice before_save event triggered");
                
                if (window.diva_pos_integration.selectedSalesPersonName) {
                    console.log("Setting sales person in before_save:", window.diva_pos_integration.selectedSalesPersonName);
                    frm.set_value('custom_sales_person', window.diva_pos_integration.selectedSalesPersonName);
                    
                    if (window.diva_pos_integration.selectedSalesPersonDisplayName) {
                        frm.set_value('custom_sales_persons_name', window.diva_pos_integration.selectedSalesPersonDisplayName);
                    }
                }
            },
            
            before_submit: function(frm) {
                console.log("POS Invoice before_submit event triggered");
                
                if (window.diva_pos_integration.selectedSalesPersonName) {
                    console.log("Setting sales person in before_submit:", window.diva_pos_integration.selectedSalesPersonName);
                    frm.set_value('custom_sales_person', window.diva_pos_integration.selectedSalesPersonName);
                    
                    if (window.diva_pos_integration.selectedSalesPersonDisplayName) {
                        frm.set_value('custom_sales_persons_name', window.diva_pos_integration.selectedSalesPersonDisplayName);
                    }
                }
            }
        });
    }
    
    // Also monitor for any invoice-related API calls
    if (typeof frappe !== 'undefined' && frappe.call) {
        let originalCall = frappe.call;
        
        frappe.call = function(opts) {
            // Check if this is a POS Invoice related call
            if (opts.method && (
                opts.method.includes('pos_invoice') || 
                opts.method.includes('submit') ||
                (opts.args && opts.args.doctype === 'POS Invoice')
            )) {
                console.log("Intercepted frappe.call for POS Invoice:", opts.method);
                
                // Add sales person to the args if not already present
                if (window.diva_pos_integration.selectedSalesPersonName) {
                    if (opts.args && opts.args.doc) {
                        opts.args.doc.custom_sales_person = window.diva_pos_integration.selectedSalesPersonName;
                        
                        if (window.diva_pos_integration.selectedSalesPersonDisplayName) {
                            opts.args.doc.custom_sales_persons_name = window.diva_pos_integration.selectedSalesPersonDisplayName;
                        }
                    } else if (opts.args) {
                        opts.args.custom_sales_person = window.diva_pos_integration.selectedSalesPersonName;
                        
                        if (window.diva_pos_integration.selectedSalesPersonDisplayName) {
                            opts.args.custom_sales_persons_name = window.diva_pos_integration.selectedSalesPersonDisplayName;
                        }
                    }
                }
            }
            
            return originalCall(opts);
        };
    }
}

// Updated function to be called when sales person is selected in the dropdown
function setSalesPersonForPOS(salesPersonName, salesPersonDisplayName) {
    console.log("Setting sales person for POS:", salesPersonName, salesPersonDisplayName);
    
    // Store the selection globally
    window.diva_pos_integration.selectedSalesPersonName = salesPersonName;
    window.diva_pos_integration.selectedSalesPersonDisplayName = salesPersonDisplayName;
    
    // Also set in legacy global variables for backward compatibility
    window.selectedSalesPerson = salesPersonName;
    
    // If POS is ready, set it directly in the current document
    if (window.diva_pos_integration.pos_ready && typeof cur_pos !== 'undefined' && cur_pos && cur_pos.frm && cur_pos.frm.doc) {
        console.log("Setting sales person directly in current POS document");
        cur_pos.frm.doc.custom_sales_person = salesPersonName;
        
        if (salesPersonDisplayName) {
            cur_pos.frm.doc.custom_sales_persons_name = salesPersonDisplayName;
        }
        
        // Also try to set it using frm.set_value if available
        if (cur_pos.frm.set_value) {
            cur_pos.frm.set_value('custom_sales_person', salesPersonName);
            
            if (salesPersonDisplayName) {
                cur_pos.frm.set_value('custom_sales_persons_name', salesPersonDisplayName);
            }
        }
    }
    
    console.log("Sales person set successfully for POS integration");
}

// Function to clear sales person selection
function clearSalesPersonForPOS() {
    console.log("Clearing sales person for POS");
    
    window.diva_pos_integration.selectedSalesPersonName = null;
    window.diva_pos_integration.selectedSalesPersonDisplayName = null;
    window.selectedSalesPerson = null;
    
    // Clear from current document if available
    if (window.diva_pos_integration.pos_ready && typeof cur_pos !== 'undefined' && cur_pos && cur_pos.frm && cur_pos.frm.doc) {
        cur_pos.frm.doc.custom_sales_person = '';
        cur_pos.frm.doc.custom_sales_persons_name = '';
        
        if (cur_pos.frm.set_value) {
            cur_pos.frm.set_value('custom_sales_person', '');
            cur_pos.frm.set_value('custom_sales_persons_name', '');
        }
    }
}

// Export functions for external use
window.setSalesPersonForPOS = setSalesPersonForPOS;
window.clearSalesPersonForPOS = clearSalesPersonForPOS;

// Function to get current selection
window.getSelectedSalesPersonForPOS = function() {
    return {
        name: window.diva_pos_integration.selectedSalesPersonName,
        display_name: window.diva_pos_integration.selectedSalesPersonDisplayName
    };
};

// Clean up when leaving POS
$(window).on('beforeunload', function() {
    window.diva_pos_integration.initialized = false;
    window.diva_pos_integration.pos_ready = false;
    clearSalesPersonForPOS();
});

// Route change detection
$(window).on('hashchange', function() {
    if (!window.location.href.includes('point-of-sale')) {
        window.diva_pos_integration.initialized = false;
        window.diva_pos_integration.pos_ready = false;
        clearSalesPersonForPOS();
    } else {
        setTimeout(() => {
            if (!window.diva_pos_integration.initialized) {
                initializePOSIntegration();
            }
        }, 1000);
    }
});

console.log("Enhanced POS Integration for Sales Person mapping loaded successfully");

