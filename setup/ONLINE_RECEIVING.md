# Enable online staff counting

The app and database rules are implemented and passed local emulator checks. The latest rules must be published in your Firebase project before these actions are enabled.

1. Open firestore.rules in the app folder and copy the complete contents.
2. In Firebase Console → Firestore Database → Rules, replace the existing text and click Publish.
3. Sign in as Mathias (camathias2307@gmail.com), or the admin test account.
4. Open a submitted order under Customer orders. Enter the received quantity for every item. Counts start blank; zero is valid when none were received.
5. If any count differs from the customer's quantity, enter a receiving note. Confirm received counts moves the order to Checked.
6. Sign back in as Faketales to see the original quantities, confirmed counts, differences, receiving note, and history.

## Corrections and workflow

Staff or admins can select Correct received counts after confirmation. Counts are prefilled. Any correction requires a changed count and a reason. Saving records the before/after counts, authenticated account, and server time, while preserving the original submitted quantities and current order status. Cancel correction discards the draft.

Staff can advance Checked → Washing → Ready for pickup. They cannot skip stages or rewind the status. Counts can be corrected while Checked, Washing, or Ready for pickup without moving the order backward. Once Picked up, the completed order is locked against corrections. Changing status does not send a notification yet.

## Privacy and reliability

Only active staff/admin accounts can write counts or change status. Customers can read only their own company's orders and receiving history. The original item descriptions and submitted quantities remain immutable. Count events are append-only: clients cannot edit or delete them.

Counts and their audit entry are saved together in a transaction. A count version check prevents stale staff drafts from overwriting a newer check. On conflict, cancel the correction, review the latest counts, and try again. No migration or deletion of existing orders is needed; orders without a count version are treated as uncounted.
