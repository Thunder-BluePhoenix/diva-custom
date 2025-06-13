// console.log("Diva Custom POS script loaded");

$(document).ready(function() {
    console.log("Document ready - setting up POS customization");
    
    // Initial check
    handleRouteChange();
    
    // Monitor for route changes
    $(window).on('hashchange', function() {
        console.log("Route changed to:", window.location.href);
        setTimeout(handleRouteChange, 500);
    });
    
    // Monitor window resize for responsive positioning
    $(window).on('resize', function() {
        if (window.location.href.includes('point-of-sale') && $('.diva-pos-user').length > 0) {
            repositionUserName();
        }
    });
    
    // Periodic check as backup
    setInterval(function() {
        handleRouteChange();
    }, 3000);
});

function handleRouteChange() {
    if (window.location.href.includes('point-of-sale')) {
        // We're on POS page - add user name if not already there
        if ($('.diva-pos-user').length === 0) {
            addUserNameToPOS();
        }
        
        // Initialize discount logic if not already initialized
        if (!window.divaDiscountInitialized) {
            setTimeout(() => {
                initializePOSDiscountLogic();
                window.divaDiscountInitialized = true;
            }, 2000);
        }
    } else {
        // We're NOT on POS page - remove user name and reset discount logic
        removeUserNameFromPOS();
        window.divaDiscountInitialized = false;
    }
}


function addUserNameToPOS() {
    console.log("Adding user name to POS page");
    
    let attempts = 0;
    let maxAttempts = 15;
    
    let findElementsInterval = setInterval(function() {
        attempts++;
        console.log("Looking for POS elements, attempt:", attempts);
        
        // Look for both fullscreen button and menu button group
        let fullscreenBtn = $('.fullscreen-btn').first();
        let menuBtnGroup = $('.menu-btn-group').first();
        
        if (fullscreenBtn.length > 0 || menuBtnGroup.length > 0) {
            console.log("POS elements found!");
            clearInterval(findElementsInterval);
            positionUserNameResponsively(fullscreenBtn, menuBtnGroup);
        } else if (attempts >= maxAttempts) {
            console.log("POS elements not found, using fallback");
            clearInterval(findElementsInterval);
            addUserNameFallback();
        }
    }, 500);
}

function positionUserNameResponsively(fullscreenBtn, menuBtnGroup) {
    try {
        let userName = frappe.session.user_fullname || frappe.session.user || 'Current User';
        console.log("Positioning user name responsively for:", userName);
        
        // Check screen size and element visibility
        let windowWidth = $(window).width();
        let isSmallScreen = windowWidth <= 991; // md and below
        let useFullscreenBtn = fullscreenBtn.length > 0 && fullscreenBtn.is(':visible') && !isSmallScreen;
        
        console.log("Screen width:", windowWidth, "Using fullscreen button:", useFullscreenBtn);
        
        // Create user display element
        let userElement = $(`
            <div class="diva-pos-user" style="
                display: inline-block;
                background: ${isSmallScreen ? 'linear-gradient(135deg, #6f42c1 0%,rgb(232, 116, 62) 100%)' : 'linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)'};
                color: white;
                padding: ${isSmallScreen ? '4px 10px' : '4px 10px'};
                border-radius: 20px;
                font-size: ${isSmallScreen ? '10px' : '11px'};
                font-weight: 600;
                margin-right: ${isSmallScreen ? '8px' : '10px'};
                vertical-align: middle;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                border: 1px solid rgba(255,255,255,0.2);
                white-space: nowrap;
                transition: all 0.3s ease;
                z-index: 1050;
            ">
                <i class="fa fa-user-circle" style="margin-right: ${isSmallScreen ? '4px' : '6px'}; font-size: ${isSmallScreen ? '12px' : '13px'};"></i>
                <span>${userName}</span>
            </div>
        `);
        
        // Add hover effect
        userElement.hover(
            function() {
                $(this).css({
                    'transform': 'translateY(-1px) scale(1.02)',
                    'box-shadow': '0 4px 12px rgba(0,0,0,0.25)'
                });
            },
            function() {
                $(this).css({
                    'transform': 'translateY(0px) scale(1)',
                    'box-shadow': '0 2px 8px rgba(0,0,0,0.15)'
                });
            }
        );
        
        // Position based on screen size
        if (useFullscreenBtn) {
            // Large screen - insert BEFORE fullscreen button (left side)
            console.log("Inserting before fullscreen button");
            fullscreenBtn.before(userElement);
        } else if (menuBtnGroup.length > 0) {
            // Small screen - insert BEFORE menu button group (left side)
            console.log("Inserting before menu button group");
            menuBtnGroup.before(userElement);
        } else {
            console.log("No suitable target found");
            addUserNameFallback();
            return;
        }
        
        console.log("User name positioned successfully!");
        
    } catch (error) {
        console.error("Error positioning user name:", error);
        addUserNameFallback();
    }
}

function repositionUserName() {
    console.log("Repositioning user name due to window resize");
    
    // Remove existing user name
    $('.diva-pos-user').remove();
    
    // Add it again with correct positioning
    setTimeout(function() {
        let fullscreenBtn = $('.fullscreen-btn').first();
        let menuBtnGroup = $('.menu-btn-group').first();
        positionUserNameResponsively(fullscreenBtn, menuBtnGroup);
    }, 100);
}

function addUserNameFallback() {
    // Fallback position if target elements not found
    try {
        let userName = frappe.session.user_fullname || frappe.session.user || 'Current User';
        console.log("Using fallback position for:", userName);
        
        let userElement = $(`
            <div class="diva-pos-user" style="
                position: fixed;
                top: 20px;
                left: 20px;
                background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
                color: white;
                padding: 8px 15px;
                border-radius: 25px;
                font-size: 13px;
                font-weight: 600;
                z-index: 1060;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                border: 1px solid rgba(255,255,255,0.2);
            ">
                <i class="fa fa-user-circle" style="margin-right: 8px;"></i>
                <span>${userName}</span>
            </div>
        `);
        
        $('body').append(userElement);
        console.log("Fallback user name added!");
        
    } catch (error) {
        console.error("Error in fallback:", error);
    }
}

function removeUserNameFromPOS() {
    if ($('.diva-pos-user').length > 0) {
        console.log("Removing user name - not on POS page");
        $('.diva-pos-user').fadeOut(300, function() {
            $(this).remove();
        });
    }
}


// ===== DISCOUNT FUNCTIONS =====
function initializePOSDiscountLogic() {
    console.log("Initializing POS discount logic");
    
    // Monitor customer input field for changes
    let customerInputSelector = 'input[data-target="Customer"], input[placeholder*="customer"], input[placeholder*="Customer"]';
    
    // Remove any existing event handlers to prevent duplicates
    $(document).off('input change blur', customerInputSelector);
    $(document).off('awesomplete-selectcomplete', customerInputSelector);
    
    // Use event delegation to handle dynamically loaded elements
    $(document).on('input change blur', customerInputSelector, function() {
        let customerInput = $(this);
        let customerValue = customerInput.val();
        
        console.log("Customer input changed:", customerValue);
        
        if (customerValue && customerValue.trim() !== '') {
            // Delay to ensure customer is properly selected
            setTimeout(() => {
                handleCustomerSelection(customerValue);
            }, 1000);
        } else {
            // Clear discount if no customer selected
            clearDiscount();
            // Clear stored discount info
            window.currentDiscountInfo = null;
        }
    });
    
    // Also monitor for awesomplete selection (dropdown selection)
    $(document).on('awesomplete-selectcomplete', customerInputSelector, function() {
        let customerValue = $(this).val();
        console.log("Customer selected via dropdown:", customerValue);
        
        if (customerValue && customerValue.trim() !== '') {
            setTimeout(() => {
                handleCustomerSelection(customerValue);
            }, 500);
        }
    });
    
    // Start monitoring net total changes
    startNetTotalMonitoring();
    
    console.log("POS discount logic initialized");
}

function startNetTotalMonitoring() {
    console.log("Starting net total monitoring");
    
    let lastNetTotal = 0;
    
    // Clear any existing interval
    if (window.netTotalMonitorInterval) {
        clearInterval(window.netTotalMonitorInterval);
    }
    
    window.netTotalMonitorInterval = setInterval(() => {
        if (window.location.href.includes('point-of-sale') && window.currentDiscountInfo) {
            let netTotalContainer = $('.net-total-container');
            
            if (netTotalContainer.length > 0) {
                let netTotalText = netTotalContainer.find('div:last').text().trim();
                let currentNetTotal = parseFloat(netTotalText.replace(/[^\d.-]/g, ''));
                
                if (!isNaN(currentNetTotal) && currentNetTotal !== lastNetTotal && currentNetTotal > 0) {
                    console.log("Net total changed from", lastNetTotal, "to", currentNetTotal);
                    lastNetTotal = currentNetTotal;
                    
                    // Reapply discount based on stored info
                    if (window.currentDiscountInfo) {
                        console.log("Reapplying discount due to net total change");
                        applyDiscount(window.currentDiscountInfo);
                    }
                }
            }
        }
    }, 1500); // Check every 1.5 seconds
}

function handleCustomerSelection(customerName) {
    console.log("Handling customer selection:", customerName);
    
    // First, fetch customer details to get customer type
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Customer',
            name: customerName
        },
        callback: function(response) {
            if (response.message) {
                let customer = response.message;
                let customerType = customer.customer_type;
                
                console.log("Customer type:", customerType);
                
                if (customerType) {
                    checkDiscountSettings(customerType);
                } else {
                    console.log("No customer type found for customer:", customerName);
                    window.currentDiscountInfo = null;
                }
            } else {
                console.log("Customer not found:", customerName);
                window.currentDiscountInfo = null;
            }
        },
        error: function(error) {
            console.error("Error fetching customer:", error);
            window.currentDiscountInfo = null;
        }
    });
}

function checkDiscountSettings(customerType) {
    console.log("Checking discount settings for customer type:", customerType);
    
    // Fetch POS Discount Settings single doc
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'POS Discount Settings',
            name: 'POS Discount Settings' // Single doc name
        },
        callback: function(response) {
            if (response.message) {
                let discountSettings = response.message;
                
                console.log("Discount settings:", discountSettings);
                
                // Check if discount is enabled
                if (discountSettings.enable === 1) {
                    console.log("Discount is enabled, checking rates");
                    
                    // Look for matching customer type in the table
                    let discountRates = discountSettings.discount_rateamount || [];
                    let matchingRate = discountRates.find(rate => rate.customer_type === customerType);
                    
                    if (matchingRate) {
                        console.log("Found matching discount rate:", matchingRate);
                        // Store discount info for monitoring
                        window.currentDiscountInfo = matchingRate;
                        applyDiscount(matchingRate);
                    } else {
                        console.log("No matching discount rate found for customer type:", customerType);
                        clearDiscount();
                        window.currentDiscountInfo = null;
                    }
                } else {
                    console.log("Discount is not enabled");
                    clearDiscount();
                    window.currentDiscountInfo = null;
                }
            } else {
                console.log("POS Discount Settings not found");
                window.currentDiscountInfo = null;
            }
        },
        error: function(error) {
            console.error("Error fetching POS Discount Settings:", error);
            window.currentDiscountInfo = null;
        }
    });
}

function applyDiscount(discountRate) {
    console.log("Applying discount:", discountRate);
    
    let discountType = discountRate.discount_type;
    let discountValue = discountRate.discount_value;
    
    if (discountType === 'Percentage') {
        // Direct percentage application
        console.log("Applying percentage discount:", discountValue);
        setDiscountPercentage(discountValue);
    } else if (discountType === 'Flat Amount') {
        // Calculate percentage based on net total
        console.log("Calculating percentage from flat amount:", discountValue);
        calculatePercentageFromFlatAmount(discountValue);
    }
}

function setDiscountPercentage(percentage) {
    console.log("Setting discount percentage:", percentage);
    
    // First, check if discount input is already visible
    let discountInput = findDiscountInput();
    
    if (!discountInput || discountInput.length === 0) {
        console.log("Discount input not visible, looking for Add Discount button");
        
        // Try multiple selectors for the Add Discount button
        let addDiscountSelectors = [
            '.add-discount-wrapper',
            '.add-discount',
            '[title="Ctrl+D"]',
            'div:contains("Add Discount")',
            '.discount-wrapper',
            '[class*="discount"][class*="wrapper"]'
        ];
        
        let addDiscountBtn = null;
        
        for (let selector of addDiscountSelectors) {
            addDiscountBtn = $(selector).first();
            if (addDiscountBtn.length > 0) {
                console.log("Found Add Discount button with selector:", selector);
                break;
            }
        }
        
        if (addDiscountBtn && addDiscountBtn.length > 0) {
            console.log("Clicking Add Discount button");
            
            // Click the add discount button
            addDiscountBtn.click();
            
            // Wait for the input field to appear, then set the value
            let attempts = 0;
            let maxAttempts = 5;
            
            let checkForInput = setInterval(() => {
                attempts++;
                console.log("Checking for discount input, attempt:", attempts);
                
                let newDiscountInput = findDiscountInput();
                
                if (newDiscountInput && newDiscountInput.length > 0) {
                    console.log("Discount input now visible");
                    clearInterval(checkForInput);
                    applyDiscountValue(percentage);
                } else if (attempts >= maxAttempts) {
                    console.log("Max attempts reached waiting for discount input");
                    clearInterval(checkForInput);
                    
                    // Final attempt
                    applyDiscountValue(percentage);
                }
            }, 300);
            
        } else {
            console.log("Add Discount button not found, trying direct application");
            applyDiscountValue(percentage);
        }
    } else {
        console.log("Discount input already visible");
        applyDiscountValue(percentage);
    }
}

function findDiscountInput() {
    // Try multiple selectors to find the discount input field
    let selectors = [
        'input[placeholder="Enter discount percentage."]',
        'input[placeholder*="Enter discount"]',
        'input[placeholder*="discount percentage"]',
        'input[data-fieldtype="Data"][placeholder*="discount"]',
        'input.input-xs[placeholder*="discount"]',
        'input.form-control[placeholder*="discount"]'
    ];
    
    for (let selector of selectors) {
        let input = $(selector).filter(':visible').first();
        if (input.length > 0) {
            console.log("Found visible discount input with selector:", selector);
            return input;
        }
    }
    
    console.log("No visible discount input found");
    return null;
}

function applyDiscountValue(percentage) {
    console.log("Applying discount value:", percentage);
    
    let discountInput = findDiscountInput();
    
    if (discountInput && discountInput.length > 0) {
        console.log("Setting discount percentage:", percentage);
        
        // Clear the field first
        discountInput.val('');
        
        // Set the value with multiple triggers
        discountInput.val(percentage);
        
        // Trigger multiple events to ensure POS picks up the change
        discountInput.trigger('focus');
        discountInput.trigger('input');
        discountInput.trigger('change');
        discountInput.trigger('keyup');
        
        // Force focus and blur to trigger validation
        setTimeout(() => {
            discountInput.trigger('blur');
        }, 100);
        
        // Add visual feedback
        discountInput.css({
            'background-color': '#e8f5e8',
            'border-color': '#28a745',
            'box-shadow': '0 0 5px rgba(40, 167, 69, 0.3)'
        });
        
        // Remove visual feedback after 3 seconds
        setTimeout(() => {
            discountInput.css({
                'background-color': '',
                'border-color': '',
                'box-shadow': ''
            });
        }, 3000);
        
        console.log("Discount percentage applied successfully");
    } else {
        console.log("Discount input field still not found after clicking Add Discount");
        
        // Try one more time with a longer delay
        setTimeout(() => {
            let retryInput = findDiscountInput();
            if (retryInput && retryInput.length > 0) {
                console.log("Found discount input on retry");
                retryInput.val(percentage).trigger('input').trigger('change').trigger('blur');
            } else {
                console.log("Final attempt failed - discount input not accessible");
                
                // Debug: Log all visible input fields
                console.log("Available visible input fields:");
                $('input:visible').each(function(index, element) {
                    let $el = $(element);
                    console.log("Input", index, ":", {
                        placeholder: $el.attr('placeholder'),
                        class: $el.attr('class'),
                        type: $el.attr('type'),
                        'data-fieldtype': $el.attr('data-fieldtype'),
                        visible: $el.is(':visible')
                    });
                });
            }
        }, 1000);
    }
}

function calculatePercentageFromFlatAmount(flatAmount) {
    // Get net total from the net total container
    let netTotalContainer = $('.net-total-container');
    
    if (netTotalContainer.length > 0) {
        // Extract the amount from the net total display
        let netTotalText = netTotalContainer.find('div:last').text().trim();
        console.log("Net total text:", netTotalText);
        
        // Extract number from text (remove currency symbols and spaces)
        let netTotalAmount = parseFloat(netTotalText.replace(/[^\d.-]/g, ''));
        
        if (!isNaN(netTotalAmount) && netTotalAmount > 0) {
            // Calculate percentage: (flat_amount / net_total) * 100
            let discountPercentage = (flatAmount / netTotalAmount) * 100;
            
            // Round to 2 decimal places
            discountPercentage = Math.round(discountPercentage * 100) / 100;
            
            console.log("Calculated discount percentage:", discountPercentage, "from flat amount:", flatAmount, "net total:", netTotalAmount);
            
            setDiscountPercentage(discountPercentage);
        } else {
            console.log("Invalid net total amount:", netTotalAmount);
        }
    } else {
        console.log("Net total container not found");
        
        // Fallback: Monitor for net total changes
        monitorNetTotalForDiscount(flatAmount);
    }
}

function monitorNetTotalForDiscount(flatAmount) {
    console.log("Monitoring net total changes for flat amount discount:", flatAmount);
    
    let attempts = 0;
    let maxAttempts = 10;
    
    let monitorInterval = setInterval(() => {
        attempts++;
        let netTotalContainer = $('.net-total-container');
        
        if (netTotalContainer.length > 0) {
            let netTotalText = netTotalContainer.find('div:last').text().trim();
            let netTotalAmount = parseFloat(netTotalText.replace(/[^\d.-]/g, ''));
            
            if (!isNaN(netTotalAmount) && netTotalAmount > 0) {
                console.log("Net total found during monitoring:", netTotalAmount);
                clearInterval(monitorInterval);
                
                let discountPercentage = (flatAmount / netTotalAmount) * 100;
                discountPercentage = Math.round(discountPercentage * 100) / 100;
                
                setDiscountPercentage(discountPercentage);
            }
        }
        
        if (attempts >= maxAttempts) {
            console.log("Stopped monitoring net total - max attempts reached");
            clearInterval(monitorInterval);
        }
    }, 1000);
}

function clearDiscount() {
    console.log("Clearing discount");
    
    // First check if discount is currently applied/visible
    let discountInput = findDiscountInput();
    
    if (discountInput && discountInput.length > 0) {
        console.log("Found active discount input, clearing it");
        
        discountInput.val('').trigger('input').trigger('change').trigger('blur');
        
        // Visual feedback for clearing
        discountInput.css({
            'background-color': '#fff3cd',
            'border-color': '#ffc107'
        });
        
        setTimeout(() => {
            discountInput.css({
                'background-color': '',
                'border-color': ''
            });
        }, 1000);
        
        console.log("Discount cleared successfully");
    } else {
        console.log("No active discount found to clear");
    }
}
