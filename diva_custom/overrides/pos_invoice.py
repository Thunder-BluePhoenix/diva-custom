import frappe
from frappe import _


def update_pos_commission(doc, method=None):
    # Get sales person from custom field (frontend selection) or fallback to current user's linked sales person
    doc.flags.ignore_permissions = True

    sales_person_name = doc.custom_sales_person
    
    if not sales_person_name:
        # Fallback: Find sales person linked to current user via Employee
        usr = frappe.session.user
        try:
            # Get employee linked to current user
            emp = frappe.get_doc("Employee", {"user_id": usr})
            # Get sales person linked to this employee
            sp = frappe.get_doc("Sales Person", {"employee": emp.name})
            sales_person_name = sp.name
            doc.custom_sales_person = sales_person_name
            doc.custom_sales_persons_name = sp.sales_person_name
        except:
            frappe.log_error(f"No Sales Person found for user {usr}")
            return
    else:
        # Validate that the selected sales person exists and get the details
        try:
            sp = frappe.get_doc("Sales Person", sales_person_name)
            # Update the display name if not already set
            if not doc.custom_sales_persons_name:
                doc.custom_sales_persons_name = sp.sales_person_name
        except:
            frappe.log_error(f"Sales Person {sales_person_name} not found")
            return
    
    # Calculate commission if enabled
    if sp.custom_commission_enabled == 1:
        if sp.custom_commission_type == "Percentage":
            commission_rate = sp.custom_commission_rate_c or 0
            commission_val = (float(doc.grand_total) * float(commission_rate)) / 100
            doc.custom_total_amount = doc.grand_total
            doc.custom_commission_rate = commission_rate
            doc.custom_total_commission = commission_val

        elif sp.custom_commission_type == "Flat Amount":
            doc.custom_total_amount = doc.grand_total
            doc.custom_commission_rate = None
            doc.custom_total_commission = float(sp.custom_commission_amount or 0)
        else:
            doc.custom_total_amount = doc.grand_total
            doc.custom_commission_rate = None
            doc.custom_total_commission = 0
    else:
        # Clear commission fields if not enabled
        doc.custom_total_amount = doc.grand_total
        doc.custom_commission_rate = None
        doc.custom_total_commission = 0


def fetch_user_details(doc, method=None):
    usr = frappe.session.user
    
    # Only set if not already set (to preserve frontend selection)
    if not doc.custom_sales_person:
        # Try to find sales person linked to current user via Employee
        try:
            emp = frappe.get_doc("Employee", {"user_id": usr})
            sp = frappe.get_doc("Sales Person", {"employee": emp.name})
            doc.custom_sales_person = sp.name
            doc.custom_sales_persons_name = sp.sales_person_name
        except:
            # If no sales person found, set user as fallback but this should be handled properly
            usr_doc = frappe.get_doc("User", usr)
            doc.custom_sales_person = usr  # This is not ideal but prevents errors
            doc.custom_sales_persons_name = usr_doc.full_name
    
    # Update name if sales person is set but name is empty
    if doc.custom_sales_person and not doc.custom_sales_persons_name:
        try:
            # Check if it's a Sales Person doctype record
            sp_doc = frappe.get_doc("Sales Person", doc.custom_sales_person)
            doc.custom_sales_persons_name = sp_doc.sales_person_name
        except:
            # If it's a User (fallback case)
            try:
                usr_doc = frappe.get_doc("User", doc.custom_sales_person)
                doc.custom_sales_persons_name = usr_doc.full_name
            except:
                doc.custom_sales_persons_name = doc.custom_sales_person


def bypass_pos_invoice_permissions(doc, method=None):
    """
    Set ignore permissions flag for all POS Invoice operations
    """
    
    doc.flags.ignore_permissions = True
    doc.flags.ignore_validate = False  # Keep validation but ignore permissions
        
        # Set session flag
       


# import frappe
# from frappe.contacts.doctype.address.address import get_company_address

# def get_address_for_company(company_name,method=None):
#     address = get_company_address(company_name)
#     return address if address else "No address found"

def validate(self,method=None):

    if self.company_address:
        address = frappe.get_doc("Address", self.company_address)
        full_address = []

        if address.address_line1:
            full_address.append(address.address_line1)
        if address.address_line2:
            full_address.append(address.address_line2)
        if address.city:
            full_address.append(address.city)
        if address.county:
            full_address.append(address.county)
        if address.country:
            full_address.append(address.country)

        # Join all parts with commas
        self.custom_company_address_details = ", ".join(full_address)
    else:
        self.custom_company_address_details = ""