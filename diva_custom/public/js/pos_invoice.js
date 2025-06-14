// Client Script for POS Invoice DocType
// Add this in Frappe: Setup > Customization > Client Script

frappe.ui.form.on('POS Invoice', {
    refresh: function(frm) {
        console.log("POS Invoice form refreshed");
        
        // Check if we're in POS mode
        if (frm.doc.is_pos === 1) {
            setupSalesPersonClientLogic(frm);
        }
    },
    
    onload: function(frm) {
        console.log("POS Invoice form loaded");
        
        if (frm.doc.is_pos === 1) {
            setupSalesPersonClientLogic(frm);
        }
    },
    
    before_save: function(frm) {
        console.log("POS Invoice before save - checking sales person selection");
        
        // Get selected sales person from global variables
        if (typeof window !== 'undefined') {
            let selectedSalesPerson = null;
            let selectedSalesPersonName = null;
            
            // Check new integration method first
            if (window.diva_pos_integration && window.diva_pos_integration.selectedSalesPersonName) {
                selectedSalesPerson = window.diva_pos_integration.selectedSalesPersonName;
                selectedSalesPersonName = window.diva_pos_integration.selectedSalesPersonDisplayName;
            }
            // Fallback to old method
            else if (window.selectedSalesPerson) {
                selectedSalesPerson = window.selectedSalesPerson;
            }
            
            if (selectedSalesPerson) {
                console.log("Setting sales person from frontend selection:", selectedSalesPerson);
                frm.set_value('custom_sales_person', selectedSalesPerson);
                
                if (selectedSalesPersonName) {
                    frm.set_value('custom_sales_persons_name', selectedSalesPersonName);
                }
            }
        }
    },
    
    before_submit: function(frm) {
        console.log("POS Invoice before submit - ensuring sales person is set");
        
        // Double-check sales person is set before submission
        if (typeof window !== 'undefined') {
            let selectedSalesPerson = null;
            let selectedSalesPersonName = null;
            
            // Check new integration method first
            if (window.diva_pos_integration && window.diva_pos_integration.selectedSalesPersonName) {
                selectedSalesPerson = window.diva_pos_integration.selectedSalesPersonName;
                selectedSalesPersonName = window.diva_pos_integration.selectedSalesPersonDisplayName;
            }
            // Fallback to old method
            else if (window.selectedSalesPerson) {
                selectedSalesPerson = window.selectedSalesPerson;
            }
            
            if (selectedSalesPerson) {
                console.log("Final check - setting sales person:", selectedSalesPerson);
                frm.set_value('custom_sales_person', selectedSalesPerson);
                
                if (selectedSalesPersonName) {
                    frm.set_value('custom_sales_persons_name', selectedSalesPersonName);
                }
            }
        }
    },
    
    custom_sales_person: function(frm) {
        // When sales person changes, update the name field
        if (frm.doc.custom_sales_person) {
            console.log("Sales person field changed:", frm.doc.custom_sales_person);
            
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Sales Person',
                    name: frm.doc.custom_sales_person
                },
                callback: function(response) {
                    if (response.message) {
                        console.log("Fetched sales person details:", response.message);
                        frm.set_value('custom_sales_persons_name', response.message.sales_person_name);
                    }
                },
                error: function(error) {
                    console.log("Error fetching sales person details:", error);
                    // Might be a User instead of Sales Person, handle gracefully
                    frappe.call({
                        method: 'frappe.client.get',
                        args: {
                            doctype: 'User',
                            name: frm.doc.custom_sales_person
                        },
                        callback: function(user_response) {
                            if (user_response.message) {
                                frm.set_value('custom_sales_persons_name', user_response.message.full_name);
                            }
                        }
                    });
                }
            });
        } else {
            frm.set_value('custom_sales_persons_name', '');
        }
    },
    
    on_submit: function(frm) {
        console.log("POS Invoice submitted");
        
        // Update commission calculations after submit
        if (frm.doc.custom_sales_person) {
            frm.reload_doc();
        }
    }
});

function setupSalesPersonClientLogic(frm) {
    console.log("Setting up sales person client logic for POS");
    
    // Add custom button to manually refresh sales person from POS selection
    if (frm.doc.docstatus === 0) { // Only for draft documents
        frm.add_custom_button(__('Sync Sales Person from POS'), function() {
            if (typeof window !== 'undefined') {
                let selectedSalesPerson = null;
                let selectedSalesPersonName = null;
                
                // Check new integration method first
                if (window.diva_pos_integration && window.diva_pos_integration.selectedSalesPersonName) {
                    selectedSalesPerson = window.diva_pos_integration.selectedSalesPersonName;
                    selectedSalesPersonName = window.diva_pos_integration.selectedSalesPersonDisplayName;
                }
                // Fallback to old method
                else if (window.selectedSalesPerson) {
                    selectedSalesPerson = window.selectedSalesPerson;
                }
                
                if (selectedSalesPerson) {
                    frm.set_value('custom_sales_person', selectedSalesPerson);
                    
                    if (selectedSalesPersonName) {
                        frm.set_value('custom_sales_persons_name', selectedSalesPersonName);
                    }
                    
                    frappe.show_alert({
                        message: 'Sales person synced from POS selection',
                        indicator: 'green'
                    });
                } else {
                    frappe.show_alert({
                        message: 'No sales person selected in POS interface',
                        indicator: 'orange'
                    });
                }
            }
        }, __("Actions"));
    }
    
    // Make custom_sales_person field more prominent in POS
    if (frm.fields_dict.custom_sales_person) {
        frm.fields_dict.custom_sales_person.df.reqd = 0; // Not required to avoid validation issues
        frm.fields_dict.custom_sales_person.df.bold = 1;
        frm.refresh_field('custom_sales_person');
    }
    
    // Add some styling to highlight the sales person fields
    setTimeout(() => {
        $('[data-fieldname="custom_sales_person"], [data-fieldname="custom_sales_persons_name"]').closest('.form-group').css({
            'background': 'linear-gradient(135deg, rgba(23, 162, 184, 0.1), rgba(0, 123, 255, 0.1))',
            'border-radius': '4px',
            'padding': '8px',
            'margin': '4px 0'
        });
    }, 500);
}

// Global function to manually set sales person from POS interface
window.setPOSSalesPersonInForm = function(salesPersonName, salesPersonDisplayName) {
    console.log("Setting POS sales person in form:", salesPersonName, salesPersonDisplayName);
    
    if (typeof cur_frm !== 'undefined' && cur_frm && cur_frm.doc && cur_frm.doc.doctype === 'POS Invoice') {
        cur_frm.set_value('custom_sales_person', salesPersonName);
        
        if (salesPersonDisplayName) {
            cur_frm.set_value('custom_sales_persons_name', salesPersonDisplayName);
        }
        
        return true;
    }
    
    return false;
};

