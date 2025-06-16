import frappe
from frappe import _


def validate_sales_persons_commission(doc, method=None):
    if doc.custom_commission_enabled == 1:
        if doc.custom_commission_type == "Percentage":
            doc.custom_commission_amount = None
        elif doc.custom_commission_type == "Flat Amount":
            doc.custom_commission_rate_c = None



@frappe.whitelist(allow_guest=True)
def get_sales_persons():
    sp = frappe.get_all("Sales Person", filters={"enabled":1}, fields={"name","sales_person_name","enabled"})
    return sp
