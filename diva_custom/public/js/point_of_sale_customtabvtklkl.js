// Fixed POS customization with working discount and single sales person selector
console.log("Diva Custom POS script loaded - Fixed Version");

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
        if (window.location.href.includes('point-of-sale') && $('.diva-pos-user, .diva-sales-person').length > 0) {
            repositionCustomElements();
        }
    });
    
    // Periodic check as backup
    setInterval(function() {
        handleRouteChange();
    }, 3000);
});

function handleRouteChange() {
    if (window.location.href.includes('point-of-sale')) {
        // We're on POS page - add custom elements if not already there
        if ($('.diva-pos-user').length === 0) {
            addUserNameToPOS();
        }
        
        // Prevent multiple sales person selectors
        if ($('.diva-sales-person').length === 0) {
            addSalesPersonSelector();
        }
        
        // Initialize discount logic if not already initialized
        if (!window.divaDiscountInitialized) {
            setTimeout(() => {
                initializePOSDiscountLogic(); // Now monitors customer-details only
                window.divaDiscountInitialized = true;
            }, 2000);
        }
    } else {
        // We're NOT on POS page - remove custom elements and reset
        removeCustomElementsFromPOS();
        cleanupCustomerDetailsMonitoring(); // Updated cleanup function
        window.divaDiscountInitialized = false;
        window.selectedSalesPerson = null;
    }
}

// ===== USER NAME FUNCTIONS =====
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

// ===== SALES PERSON SELECTOR FUNCTIONS =====
function addSalesPersonSelector() {
    console.log("Adding sales person selector to POS page");
    
    // IMPORTANT: Check if already exists to prevent duplicates
    if ($('.diva-sales-person').length > 0) {
        console.log("Sales person selector already exists, skipping");
        return;
    }
    
    let attempts = 0;
    let maxAttempts = 15;
    
    let findElementsInterval = setInterval(function() {
        attempts++;
        console.log("Looking for POS elements for sales person, attempt:", attempts);
        
        // Look for customer section or appropriate container
        let customerSection = $('.customer-section, .pos-customer-details, .customer-details').first();
        let posContainer = $('.pos-profile-section, .pos-container').first();
        
        if (customerSection.length > 0 || posContainer.length > 0) {
            console.log("Found suitable container for sales person selector");
            clearInterval(findElementsInterval);
            createSalesPersonSelector(customerSection.length > 0 ? customerSection : posContainer);
        } else if (attempts >= maxAttempts) {
            console.log("Container not found, using fallback position");
            clearInterval(findElementsInterval);
            createSalesPersonSelectorFallback();
        }
    }, 500);
}

window.allSalesPersonsData = [];

function createSalesPersonSelector(container) {
    console.log("Creating sales person selector with search");
    
    // Double-check to prevent duplicates
    if ($('.diva-sales-person').length > 0) {
        console.log("Sales person selector already exists, removing old one");
        $('.diva-sales-person').remove();
    }
    
    // Create the sales person selector element with search
    let salesPersonSelector = $(`
        <div class="diva-sales-person" style="
            background: linear-gradient(135deg, #17a2b8 0%, #007bff 100%);
            border-radius: 8px;
            padding: 12px;
            margin: 10px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
        ">
            <div style="
                color: white;
                font-weight: 600;
                font-size: 13px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            ">
                <span>
                    <i class="fa fa-user-tie" style="margin-right: 8px; font-size: 14px;"></i>
                    Sales Person
                </span>
                <div style="display: flex; gap: 4px;">
                    <button class="btn btn-sm sales-person-refresh" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                    " title="Refresh Sales Persons">
                        <i class="fa fa-refresh"></i>
                    </button>
                    <button class="btn btn-sm sales-person-clear" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                    " title="Clear Selection">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="sales-person-input-wrapper" style="position: relative;">
                <input type="text" 
                       class="form-control sales-person-input" 
                       placeholder="Search and select sales person..." 
                       style="
                           background: rgba(255,255,255,0.95);
                           border: 1px solid rgba(255,255,255,0.3);
                           border-radius: 4px;
                           padding: 8px 12px;
                           font-size: 12px;
                           color: #333;
                       ">
                <div class="sales-person-dropdown" style="
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    max-height: 250px;
                    overflow-y: auto;
                    z-index: 1000;
                    display: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                "></div>
            </div>
        </div>
    `);
    
    // Insert after the container or at the beginning
    if (container.hasClass('customer-section') || container.hasClass('pos-customer-details')) {
        container.after(salesPersonSelector);
    } else {
        container.prepend(salesPersonSelector);
    }
    
    // Initialize the sales person functionality with search
    initializeSalesPersonSelectorWithSearch();
}

function createSalesPersonSelectorFallback() {
    console.log("Creating sales person selector in fallback position with search");
    
    // Double-check to prevent duplicates
    if ($('.diva-sales-person').length > 0) {
        console.log("Sales person selector already exists, removing old one");
        $('.diva-sales-person').remove();
    }
    
    let salesPersonSelector = $(`
        <div class="diva-sales-person" style="
            position: fixed;
            top: 80px;
            left: 20px;
            width: 280px;
            background: linear-gradient(135deg, #17a2b8 0%, #007bff 100%);
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1050;
            border: 1px solid rgba(255,255,255,0.2);
        ">
            <div style="
                color: white;
                font-weight: 600;
                font-size: 13px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            ">
                <span>
                    <i class="fa fa-user-tie" style="margin-right: 8px; font-size: 14px;"></i>
                    Sales Person
                </span>
                <div style="display: flex; gap: 4px;">
                    <button class="btn btn-sm sales-person-refresh" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                    " title="Refresh Sales Persons">
                        <i class="fa fa-refresh"></i>
                    </button>
                    <button class="btn btn-sm sales-person-clear" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                    " title="Clear Selection">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="sales-person-input-wrapper" style="position: relative;">
                <input type="text" 
                       class="form-control sales-person-input" 
                       placeholder="Search and select sales person..." 
                       style="
                           background: rgba(255,255,255,0.95);
                           border: 1px solid rgba(255,255,255,0.3);
                           border-radius: 4px;
                           padding: 8px 12px;
                           font-size: 12px;
                           color: #333;
                           width: 100%;
                       ">
                <div class="sales-person-dropdown" style="
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    max-height: 250px;
                    overflow-y: auto;
                    z-index: 1000;
                    display: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                "></div>
            </div>
        </div>
    `);
    
    $('body').append(salesPersonSelector);
    initializeSalesPersonSelectorWithSearch();
}


function initializeSalesPersonSelectorWithSearch() {
    console.log("Initializing sales person selector with search functionality");
    
    let salesPersonInput = $('.sales-person-input');
    let dropdown = $('.sales-person-dropdown');
    
    // Remove any existing event handlers to prevent duplicates
    salesPersonInput.off('click.salesPerson input.salesPerson keyup.salesPerson focus.salesPerson');
    $(document).off('click.salesPersonDropdown');
    $('.sales-person-refresh, .sales-person-clear').off('click');
    
    // Load sales persons on click or focus
    salesPersonInput.on('click.salesPerson focus.salesPerson', function() {
        console.log("Sales person input clicked/focused");
        if (window.allSalesPersonsData.length === 0) {
            loadSalesPersons();
        } else {
            showAllSalesPersons();
        }
    });
    
    // Search functionality - trigger on input and keyup
    salesPersonInput.on('input.salesPerson keyup.salesPerson', function() {
        let searchTerm = $(this).val().toLowerCase().trim();
        console.log("Searching for:", searchTerm);
        
        if (window.allSalesPersonsData.length > 0) {
            filterSalesPersons(searchTerm);
        } else {
            // Load data first, then filter
            loadSalesPersons(searchTerm);
        }
    });
    
    // Close dropdown when clicking outside
    $(document).on('click.salesPersonDropdown', function(e) {
        if (!$(e.target).closest('.sales-person-input-wrapper').length) {
            dropdown.hide();
        }
    });
    
    // Refresh button
    $('.sales-person-refresh').on('click', function() {
        console.log("Refreshing sales persons");
        window.allSalesPersonsData = []; // Clear cache
        salesPersonInput.val(''); // Clear search
        loadSalesPersons();
    });
    
    // Clear button
    $('.sales-person-clear').on('click', function() {
        console.log("Clearing sales person selection");
        salesPersonInput.val('');
        clearSalesPersonSelection();
        dropdown.hide();
    });
}

function loadSalesPersons(searchTerm = '') {
    console.log("Loading sales persons from API");
    
    let dropdown = $('.sales-person-dropdown');
    
    // Show loading
    dropdown.html('<div style="padding: 10px; text-align: center; color: #666;"><i class="fa fa-spinner fa-spin"></i> Loading sales persons...</div>').show();
    
    // Use your existing API call
    frappe.call({
        method: 'diva_custom.overrides.sales_person.get_sales_persons',
        callback: function(response) {
            if (response.message && response.message.length > 0) {
                console.log("Sales persons loaded:", response.message.length);
                
                // Store all sales persons for search
                window.allSalesPersonsData = response.message;
                
                // Show filtered or all results
                if (searchTerm) {
                    filterSalesPersons(searchTerm);
                } else {
                    showAllSalesPersons();
                }
                
                // Show success message
                frappe.show_alert({
                    message: `Loaded ${response.message.length} sales persons`,
                    indicator: 'green'
                });
                
            } else {
                console.log("No sales persons found");
                dropdown.html('<div style="padding: 10px; text-align: center; color: #666;">No sales persons found</div>');
            }
        },
        error: function(error) {
            console.error("Error loading sales persons:", error);
            dropdown.html('<div style="padding: 10px; text-align: center; color: #dc3545;">Error loading sales persons</div>');
        }
    });
}

function showAllSalesPersons() {
    console.log("Showing all sales persons");
    populateSalesPersonDropdown(window.allSalesPersonsData);
}

function filterSalesPersons(searchTerm) {
    if (!searchTerm || searchTerm === '') {
        // Show all if no search term
        showAllSalesPersons();
        return;
    }
    
    console.log("Filtering sales persons for:", searchTerm);
    
    // Filter based on name or sales_person_name
    let filteredResults = window.allSalesPersonsData.filter(sp => {
        let name = (sp.sales_person_name || '').toLowerCase();
        let code = (sp.name || '').toLowerCase();
        return name.includes(searchTerm) || code.includes(searchTerm);
    });
    
    console.log("Found", filteredResults.length, "matching sales persons");
    
    // Show filtered results
    populateSalesPersonDropdown(filteredResults, searchTerm);
}


function populateSalesPersonDropdown(salesPersons, searchTerm = '') {
    console.log("Populating dropdown with", salesPersons.length, "sales persons");
    
    let dropdown = $('.sales-person-dropdown');
    let dropdownHtml = '';
    
    // Add search info header
    if (searchTerm) {
        dropdownHtml += `
            <div style="padding: 6px 12px; background: #e3f2fd; border-bottom: 1px solid #dee2e6; font-size: 11px; color: #1976d2;">
                <i class="fa fa-search" style="margin-right: 4px;"></i>
                Search: "${searchTerm}" (${salesPersons.length} found)
            </div>
        `;
    } else {
        dropdownHtml += `
            <div style="padding: 4px 12px; background: #e9ecef; font-size: 10px; color: #6c757d; border-bottom: 1px solid #dee2e6;">
                ${salesPersons.length} sales person(s) available - Type to search
            </div>
        `;
    }
    
    // Add "Clear Selection" option
    dropdownHtml += `
        <div class="sales-person-option" data-name="" data-display="" style="
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
            color: #dc3545;
            font-style: italic;
            background: #f8f9fa;
        ">
            <i class="fa fa-times" style="margin-right: 6px;"></i>
            Clear Selection
        </div>
    `;
    
    // Show message if no results
    if (salesPersons.length === 0) {
        dropdownHtml += `
            <div style="padding: 15px; text-align: center; color: #6c757d; font-style: italic;">
                ${searchTerm ? `No sales persons found matching "${searchTerm}"` : 'No sales persons available'}
                <br><small>Try different search terms</small>
            </div>
        `;
    } else {
        // Add sales persons
        salesPersons.forEach(function(salesPerson) {
            let displayName = salesPerson.sales_person_name || salesPerson.name;
            
            // Highlight search term if present
            let highlightedName = displayName;
            if (searchTerm && searchTerm.trim() !== '') {
                let regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                highlightedName = displayName.replace(regex, '<mark style="background: #ffeb3b; padding: 1px; border-radius: 2px;">$1</mark>');
            }
            
            dropdownHtml += `
                <div class="sales-person-option" data-name="${salesPerson.name}" data-display="${displayName}" style="
                    padding: 8px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #eee;
                    transition: background-color 0.2s;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <i class="fa fa-user" style="margin-right: 6px; color: #007bff;"></i>
                            <strong>${highlightedName}</strong>
                        </div>
                        <div style="font-size: 10px; color: #6c757d;">
                            ${salesPerson.name}
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    dropdown.html(dropdownHtml).show();
    
    // Remove existing event handlers to prevent duplicates
    $('.sales-person-option').off('hover click');
    
    // Add hover effects and click handlers
    $('.sales-person-option').hover(
        function() {
            $(this).css('background-color', '#f8f9fa');
        },
        function() {
            $(this).css('background-color', 'white');
        }
    ).on('click', function() {
        let selectedName = $(this).data('name');
        let selectedDisplayName = $(this).data('display');
        
        console.log("Sales person selected:", selectedName, selectedDisplayName);
        
        // Update input field
        let salesPersonInput = $('.sales-person-input');
        if (selectedName) {
            salesPersonInput.val(selectedDisplayName);
            
            // Use the integration function to set sales person
            if (typeof window.setSalesPersonForPOS === 'function') {
                window.setSalesPersonForPOS(selectedName, selectedDisplayName);
            } else {
                // Fallback to old method
                window.selectedSalesPerson = selectedName;
            }
            
            // Visual feedback for selection
            salesPersonInput.css({
                'background-color': '#e8f5e8',
                'border-color': '#28a745'
            });
            
            setTimeout(() => {
                salesPersonInput.css({
                    'background-color': 'rgba(255,255,255,0.95)',
                    'border-color': 'rgba(255,255,255,0.3)'
                });
            }, 2000);
            
            // Show success message
            frappe.show_alert({
                message: `Selected: ${selectedDisplayName}`,
                indicator: 'green'
            });
            
        } else {
            // Clear selection
            clearSalesPersonSelection();
        }
        
        // Hide dropdown
        dropdown.hide();
    });
    
    console.log("Sales person dropdown populated successfully");
}

function clearSalesPersonSelection() {
    console.log("Clearing sales person selection");
    
    let salesPersonInput = $('.sales-person-input');
    salesPersonInput.val('');
    
    // Use the integration function to clear sales person
    if (typeof window.clearSalesPersonForPOS === 'function') {
        window.clearSalesPersonForPOS();
    } else {
        // Fallback to old method
        window.selectedSalesPerson = null;
    }
    
    // Visual feedback for clearing
    salesPersonInput.css({
        'background-color': '#fff3cd',
        'border-color': '#ffc107'
    });
    
    setTimeout(() => {
        salesPersonInput.css({
            'background-color': 'rgba(255,255,255,0.95)',
            'border-color': 'rgba(255,255,255,0.3)'
        });
    }, 2000);
    
    frappe.show_alert({
        message: 'Sales person selection cleared',
        indicator: 'blue'
    });
}


function repositionCustomElements() {
    console.log("Repositioning custom elements due to window resize");
    
    // Remove existing elements
    $('.diva-pos-user, .diva-sales-person').remove();
    
    // Add them again with correct positioning
    setTimeout(function() {
        if (window.location.href.includes('point-of-sale')) {
            addUserNameToPOS();
            addSalesPersonSelector();
        }
    }, 100);
}

function removeCustomElementsFromPOS() {
    if ($('.diva-pos-user, .diva-sales-person').length > 0) {
        console.log("Removing custom elements - not on POS page");
        $('.diva-pos-user, .diva-sales-person').fadeOut(300, function() {
            $(this).remove();
        });
    }
}

// ===== DISCOUNT FUNCTIONS (RESTORED ORIGINAL FUNCTIONALITY) =====
// function initializePOSDiscountLogic() {
//     console.log("Initializing POS discount logic");
    
//     // Monitor customer input field for changes
//     let customerInputSelector = 'input[data-target="Customer"], input[placeholder*="customer"], input[placeholder*="Customer"]';
    
//     // Remove any existing event handlers to prevent duplicates
//     $(document).off('input.discount change.discount blur.discount', customerInputSelector);
//     $(document).off('awesomplete-selectcomplete.discount', customerInputSelector);
    
//     // Use event delegation to handle dynamically loaded elements
//     $(document).on('input.discount change.discount blur.discount', customerInputSelector, function() {
//         let customerInput = $(this);
//         let customerValue = customerInput.val();
        
//         console.log("Customer input changed:", customerValue);
        
//         if (customerValue && customerValue.trim() !== '') {
//             // Delay to ensure customer is properly selected
//             setTimeout(() => {
//                 handleCustomerSelection(customerValue);
//             }, 1000);
//         } else {
//             // Clear discount if no customer selected
//             clearDiscount();
//             // Clear stored discount info
//             window.currentDiscountInfo = null;
//         }
//     });
    
//     // Also monitor for awesomplete selection (dropdown selection)
//     $(document).on('awesomplete-selectcomplete.discount', customerInputSelector, function() {
//         let customerValue = $(this).val();
//         console.log("Customer selected via dropdown:", customerValue);
        
//         if (customerValue && customerValue.trim() !== '') {
//             setTimeout(() => {
//                 handleCustomerSelection(customerValue);
//             }, 500);
//         }
//     });
    
//     // Start monitoring net total changes
//     startNetTotalMonitoring();
    
//     console.log("POS discount logic initialized");
// }
function initializePOSDiscountLogic() {
    console.log("Initializing POS discount logic - monitoring customer-details section only");
    
    // Monitor for changes in the customer-details section only
    startCustomerDetailsMonitoring();
    
    // Start monitoring net total changes
    startNetTotalMonitoring();
    
    console.log("POS discount logic initialized - focused on customer-details");
}

function startCustomerDetailsMonitoring() {
    console.log("Starting customer-details section monitoring");
    
    // Use MutationObserver to monitor changes in customer-details section
    if (typeof MutationObserver !== 'undefined') {
        
        // Disconnect any existing observer
        if (window.customerDetailsObserver) {
            window.customerDetailsObserver.disconnect();
        }
        
        let observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // Check for added nodes (customer selected)
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if ($(node).hasClass('customer-display') || $(node).find('.customer-display').length > 0) {
                            console.log("Customer display added - customer selected");
                            handleCustomerSelectionFromDetails();
                        }
                    });
                }
                
                // Check for changes in existing customer-details
                if (mutation.type === 'childList' && $(mutation.target).hasClass('customer-details')) {
                    let customerDisplay = $(mutation.target).find('.customer-display');
                    if (customerDisplay.length > 0) {
                        console.log("Customer details changed");
                        handleCustomerSelectionFromDetails();
                    }
                }
            });
        });
        
        // Start observing the entire POS container for customer-details changes
        let posContainer = document.querySelector('.pos-wrapper, .pos-container, body');
        if (posContainer) {
            observer.observe(posContainer, {
                childList: true,
                subtree: true
            });
            
            window.customerDetailsObserver = observer;
            console.log("Customer details observer started");
        }
    }
    
    // Also use periodic checking as backup
    startPeriodicCustomerCheck();
    
    // Check for existing customer on load
    setTimeout(() => {
        checkExistingCustomer();
    }, 2000);
}

function startPeriodicCustomerCheck() {
    console.log("Starting periodic customer check");
    
    // Clear any existing interval
    if (window.customerCheckInterval) {
        clearInterval(window.customerCheckInterval);
    }
    
    let lastCustomerName = null;
    
    window.customerCheckInterval = setInterval(() => {
        if (window.location.href.includes('point-of-sale')) {
            let customerDetails = $('.customer-details');
            
            if (customerDetails.length > 0 && customerDetails.is(':visible')) {
                let customerNameElement = customerDetails.find('.customer-name');
                let currentCustomerName = customerNameElement.text().trim();
                
                // Check if customer name has changed
                if (currentCustomerName && currentCustomerName !== lastCustomerName) {
                    console.log("Customer changed via periodic check:", currentCustomerName);
                    lastCustomerName = currentCustomerName;
                    
                    // Apply discount logic
                    setTimeout(() => {
                        handleCustomerSelection(currentCustomerName);
                    }, 500);
                }
                
                // If customer details is hidden/empty, clear last customer
                if (!currentCustomerName) {
                    if (lastCustomerName) {
                        console.log("Customer cleared");
                        lastCustomerName = null;
                        clearDiscount();
                        window.currentDiscountInfo = null;
                    }
                }
            }
        }
    }, 1500); // Check every 1.5 seconds
}

function checkExistingCustomer() {
    console.log("Checking for existing customer on load");
    
    let customerDetails = $('.customer-details');
    
    if (customerDetails.length > 0 && customerDetails.is(':visible')) {
        let customerNameElement = customerDetails.find('.customer-name');
        let customerName = customerNameElement.text().trim();
        
        if (customerName) {
            console.log("Found existing customer on load:", customerName);
            handleCustomerSelection(customerName);
        }
    }
}

function handleCustomerSelectionFromDetails() {
    console.log("Handling customer selection from customer-details section");
    
    // Short delay to ensure DOM is updated
    setTimeout(() => {
        let customerDetails = $('.customer-details');
        
        if (customerDetails.length > 0 && customerDetails.is(':visible')) {
            let customerNameElement = customerDetails.find('.customer-name');
            let customerName = customerNameElement.text().trim();
            
            if (customerName) {
                console.log("Customer selected from details:", customerName);
                handleCustomerSelection(customerName);
            }
        }
    }, 300);
}

// Monitor for customer removal (reset button click)
$(document).on('click', '.reset-customer-btn', function() {
    console.log("Customer reset button clicked");
    
    // Clear discount after customer is removed
    setTimeout(() => {
        console.log("Clearing discount after customer reset");
        clearDiscount();
        window.currentDiscountInfo = null;
    }, 500);
});

// Cleanup function
function cleanupCustomerDetailsMonitoring() {
    console.log("Cleaning up customer details monitoring");
    
    if (window.customerDetailsObserver) {
        window.customerDetailsObserver.disconnect();
        window.customerDetailsObserver = null;
    }
    
    if (window.customerCheckInterval) {
        clearInterval(window.customerCheckInterval);
        window.customerCheckInterval = null;
    }
    
    window.currentDiscountInfo = null;
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
    } else if (discountType === 'Flat Amount/Each Item') {
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

