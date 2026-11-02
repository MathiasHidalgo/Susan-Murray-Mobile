# Enable online catalog requests

The app is implemented and the database rules passed local Firebase emulator tests. The updated rules have not been published to your Firebase project automatically.

## Publish the rules

1. Open Firebase Console → Susan Murray Laundry → Firestore Database → Rules.
2. Replace the complete rules text with the contents of `firestore.rules` in the app folder.
3. Click Publish.
4. In the signed-in app, tap Retry connection if it shows a database access error.

## Test the real workflow

1. Sign in as the Faketales customer (mejhc2307lbc@gmail.com).
2. Stay on the signed-in screen. Do not choose Open demo preview.
3. The catalog should be empty. Request an item with a name, type, fabric/design, color, and size.
4. Wait for successful submission. The request should show Pending approval.
5. Sign out and sign in as Admin test (alilucas2307@gmail.com).
6. Approve the request, or return it with a required note.
7. Sign back in as Faketales. Approval adds the item to its catalog; a return shows the review note and permits editing/resubmission.
8. Restart the app and sign back in to confirm the request and decision remain saved.

Staff can read catalogs and requests but cannot approve them. Customers cannot select another business in the signed-in workflow. The demo remains separate and temporary. Online order creation and order lists are now implemented; use the latest rules. Online receiving and corrections are implemented; see ONLINE_RECEIVING.md and publish the current rules.

## Duplicate prevention and limitations

One database document represents each customer/type/fabric/color/size combination. Rules verify the document ID against these fields. Case, spaces, and punctuation are ignored in the identity key; the item nickname does not create a different item. Transactions reject existing pending/approved entries and concurrent approval attempts. Synonyms and equivalent measurements still require human review. Each identity field must include at least one English letter or number in this first version.

Returning and resubmitting the same combination updates the returned record. Changing the actual combination creates a separate request and keeps the previous returned record. An approved item cannot be edited by the customer or silently approved again.

Permissions use active `users/{uid}` records stored in Firestore, never email strings or demo selectors. Client writes to user profiles and all order collections remain denied. No sample catalog records or orders are seeded or uploaded.

## Test online order creation

Publish the complete current firestore.rules again; this adds order access while preserving existing catalog permissions. Sign in as Faketales, find Create an order, select an approved item, enter a quantity, and tap Add item to order. Repeat for other approved items (up to eight different items), then review the summary and Submit order. The saved order appears under My orders. Restart to confirm persistence. Sign in as Mathias or Admin test to see it under Customer orders. For receiving updates, follow ONLINE_RECEIVING.md.
