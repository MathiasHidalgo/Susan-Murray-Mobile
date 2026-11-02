# Enable the customer notification inbox

1. Publish the complete current firestore.rules in Firebase → Firestore Database → Rules.
2. Sign in as staff or admin and move an order from Washing to Ready for pickup.
3. Sign in as that order's customer. The Notifications section should show one unread pickup notice with the order reference and time.
4. Tap Mark as read. It leaves the unread list; Include read notices shows it again.
5. Restart the app to verify the notice and read state remain saved.

## Pickup completion notices

After publishing the current rules, staff/admin confirmation of Mark as picked up also saves one order_picked_up notice. In the Notifications tab, the customer sees Your order was picked up and Collected · Order complete. It has its own unread/read state. The pickup and notice are atomic, and the fixed {orderId}__pickedup ID prevents duplicates. Completed-order count locks and original quantities remain unchanged.

Existing completed orders are not backfilled. Test with a new pickup confirmation after publishing. To mark read, use the customer account; staff cannot mark notices read on the customer's behalf.

The inbox is in-app only. This does not send a phone notification, email, or SMS.

Notices are generated only for future Washing → Ready for pickup transitions using the new rules. Existing ready/completed orders are not backfilled. A notice records the ready event and remains in history even after pickup; check the order for its current status.

The order status and notice are saved in the same transaction. A fixed notice ID per order prevents duplicate notices. Rules deny a ready transition without its notice, standalone/forged notices, cross-customer access, and edits to notice content. Customers may save only their own read timestamp. Staff/admins cannot mark a notice as read on behalf of a customer. Read state is per account, so one contact at a customer business does not mark another contact's notices read.

No Firebase rules were published automatically. No live notices were seeded. Code checks, iOS export, and local emulator tests passed, including all previous catalog/order/count/pickup tests and the new privacy, atomicity, concurrency, and read-state tests.
