import frappe
from frappe import _


def update_pos_commission(doc, method=None):
    usr = doc.custom_sales_person
    emp = frappe.get_doc("Employee", {"user_id":usr})
    sp = frappe.get_doc("Sales Person", {"employee": emp.name})
    if sp.custom_commission_enabled ==1 :
        if sp.custom_commission_type == "Percentage":
            commission_rate = sp.custom_commission_rate_c
            commission_val = (float(doc.grand_total)*float(commission_rate))/100
            doc.custom_total_amount = doc.grand_total
            doc.custom_commission_rate = commission_rate
            doc.custom_total_commission = commission_val

        elif sp.custom_commission_type == "Flat Amount":
            doc.custom_total_amount = doc.grand_total
            doc.custom_commission_rate = None
            doc.custom_total_commission = float(sp.custom_commission_amount)
        else:
            pass

    else:
        pass
    # print("on_update")


def fetch_user_details(doc,method=None):
    usr = frappe.session.user
    usr_doc = frappe.get_doc("User", usr)
    doc.custom_sales_person = usr
    doc.custom_sales_persons_name = usr_doc.full_name