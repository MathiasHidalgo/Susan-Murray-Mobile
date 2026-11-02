# Complete an order at pickup

1. Publish the complete current firestore.rules in Firebase → Firestore Database → Rules. This adds staff/admin pickup confirmation while retaining existing permissions.
2. Sign in as Mathias or Admin test and find an order under Active.
3. Confirm its receiving counts and advance it through Washing to Ready for pickup, if needed.
4. When the customer has actually collected the linen, tap Mark as picked up, then Yes, confirm pickup. Cancel leaves it unchanged.
5. The order moves to Completed. Its record shows the confirming staff/admin name and the server-recorded pickup time.
6. Sign in as the customer to see the same completed status and history. Search either view by order reference, item, or customer name.

Only active staff/admin accounts may confirm pickup, and only from Ready for pickup. Confirmation cannot rewrite counts or customer-submitted items, be repeated, or rewind an order. Concurrent confirmations allow only the first valid transaction to save. Completed orders are locked: staff and administrators cannot change received counts after pickup. No orders are deleted or migrated; older orders keep their existing state. Notifications are not sent in this milestone.

Local Firebase emulator tests and code/iOS build checks passed. The rules have not been published automatically; user testing in the live project remains after publication.
