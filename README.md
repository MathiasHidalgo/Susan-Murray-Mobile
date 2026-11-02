> Navigation update: customers now have Catalog, Orders, Notifications, and Account tabs. Staff/admins have Catalogs, Orders, and Account. Create order is a separate screen. See setup/NAVIGATION.md for the one-time server restart. Firebase rules are unchanged by this update.

> Current milestone: Firebase sign-in, online catalog approvals, online orders, staff receiving counts, corrections, workflow status updates, pickup confirmation, and the saved customer notification inbox are implemented. Publish the latest firestore.rules to enable them. See setup/NOTIFICATION_INBOX.md.

# Susan-Murray-Mobile

First milestone: a local demo built with Expo, React Native, and TypeScript.

## Run on your Mac

With Node.js installed, open a terminal in this folder:

```sh
npm install
npm start
```

Sign in to Expo CLI with `npx expo login` and use the same account in Expo Go on your iPhone. Connect both devices to the same Wi-Fi network, then scan the QR code with your iPhone camera. Expo Go must support the SDK version in package.json. The iPhone simulator requires Xcode.

## Try the demo

1. In Customer demo, choose Scotiabank, CIBC, or Table Tales.
2. Browse or search that customer's catalog, select an item, enter its quantity, and tap Add item to order.
3. Repeat for more items, review the summary, and submit one order. Customer views show only the selected customer's orders.
4. Switch to Staff demo and confirm the items.
5. Move the order to Washing, then Ready for pickup.
6. Switch back to Customer demo to see the updated status.

The role selector is for demonstration only; it does not authenticate users. All orders belong to the same sample session. Orders are stored in memory and reset when the app restarts. Firebase and notification delivery are not connected yet.

## Project structure

- src/app/: Expo Router screens and protected layouts.
- src/context/: shared signed-in session and customer-scoped catalog state.
- src/screens/DemoApp.tsx: the isolated temporary demo.
- App.tsx: legacy demo export; the app now starts through expo-router/entry.
- src/data/catalog.ts: sample customers and customer-specific item catalogs. All fabric names and sizes are illustrative; Samara is retained as a customer item name until its meaning is confirmed.
- src/types/order.ts: the initial order model and statuses.
- assets/: template images.

Navigation uses Expo Router in src/app/. Shared components and Firebase services live outside the route directory.

## MVP and next steps

One laundry business, two roles, order registration, and order tracking. Next: Firebase Authentication, Firestore with per-user permissions, staff confirmation of items, and a notification when an order is ready. Payments, inventory, and reports are reserved for later milestones.

Catalog requests and Ryan Cohen’s admin review are available in the demo. Orders support multiple catalog items, each with its own quantity. Customer switching is a demo tool, not access control.

## Catalog requests (demo)

Customers can request a new item with its name, type, fabric/design, color, and size. Requests are scoped to the selected sample customer. Pending and returned requests are excluded from the order selection catalog; approved requests become selectable immediately. Switching customers clears an unfinished form, while submitted requests remain in memory for the session. Restarting clears all requests.

A basic duplicate check compares customer, type, fabric/design, color, and size against both the existing catalog and pending requests. Case, surrounding whitespace, and repeated spaces are ignored. Item nicknames do not establish identity. Different sizes or colors remain valid separate variants. Synonyms and equivalent measurements are not detected yet.

Before production, implement canonical fabric/color/size selections and enforce a unique customer/item combination atomically in Firebase for both submission and approval. Client-side checks alone cannot prevent concurrent duplicates. Only Ryan Cohen's admin account may approve requests. The demo includes review actions; real approval authorization still requires Firebase.

## Ryan’s admin review (demo)

1. Submit a new item from Customer demo.
2. Switch to Ryan Cohen · Admin demo. The overview covers all customers, catalog totals, orders, and pending requests.
3. Approve the item or return it with a required note.
4. Switch back to the correct customer. Approved items appear in the searchable catalog and can be ordered. Returned requests show the note and offer Edit and resubmit.
5. Use All requests in the admin view to review completed decisions.

The workflow records reviewer name, review time, and review note in memory. Approval rechecks duplicates. Repeated decisions cannot approve the same request twice. This is a prototype: anyone using the demo can select the admin role. Real admin identity, role enforcement, persistence, and full account management remain to be implemented. Ryan is the overall administrator, not only a catalog approver.

## Orders with multiple items

Customers can add several approved catalog items to an order. Adding the same item again combines quantities; different colors and sizes remain separate lines. Each line can be edited or removed before submission. Quantities must be whole numbers from 1 to 999 per item. Empty orders and catalog items belonging to another customer are rejected.

Drafts are kept separately per sample customer in memory. Orders snapshot item descriptions and submitted quantities. Staff and Ryan see every line and the total number of pieces, with one overall order status. All demo drafts and orders reset on restart. Staff count reconciliation is available in the demo.

## Staff receiving counts

For a new order, staff and Ryan enter the actual received quantity for every line (whole numbers from 0 to 999). Counts begin blank so quantities must be explicitly checked. Any mismatch requires a receiving note, including when shortages and extras cancel out in the overall total. Confirming moves the order to Checked, preserves all customer-submitted quantities, and records the demo reviewer and time. Customers can see submitted counts, confirmed received counts, per-line differences, and the note. Confirmed counts can be corrected by staff or the administrator with a required reason; every correction records its before/after counts, reviewer, and time. Later statuses preserve both counts and history.

Test with Scotiabank: submit 30 tablecloths and 100 napkins, switch to Staff demo, enter 29 and 100, add a shortage note, and confirm. Switch back to Customer demo to review the difference. Demo data still resets on restart.

## Business profiles

Administrator: Ryan Cohen. Initial staff: Mathias, Nguyen, and Pavlynna. Initial customers: Scotiabank, CIBC, and Table Tales. Staff demo includes a profile selector so receiving counts record the selected name. Business profile IDs are stable local identifiers, not authentication UIDs. Emails and real login accounts have not been created or assigned. Customer catalog items and sample orders are illustrative and do not represent these businesses’ actual inventory or transactions.

When authentication is added, link verified account UIDs to these profiles and assign permissions securely. Display names alone never establish identity or admin privileges.

## Correcting received counts

After an order is Checked, Washing, or Ready for pickup, staff and the administrator can select Correct received counts. Existing counts are prefilled. Saving requires a changed count and an explanation; Cancel correction discards the draft. The original customer quantities, initial receiving note and reviewer, and current order status are preserved. Both the customer and operational users can see the correction history. Changes remain in demo memory until Firebase persistence is implemented.

## Firebase connection preparation

The Firebase JS SDK is installed and src/services/firebase.ts provides lazy app/Firestore initialization. It does not perform reads or writes. Demo state is not connected to Firestore yet and still resets on restart. No Firebase project or real sign-in account has been created by this code.

Setup in small steps:

1. Create a Firebase project named Susan Murray Laundry in the Firebase Console. Google Analytics is optional and not needed for this milestone.
2. Register a Web app (the </> button), named Susan Murray Mobile. The Firebase JS SDK uses the web configuration even for this Expo iPhone app. Firebase Hosting is not needed.
3. Copy the web app configuration into .env.local using .env.example as the field guide. Restart Expo after environment changes. No service-account JSON, private keys, or passwords belong in this app.
4. Create Cloud Firestore in Production mode. The checked-in firestore.rules denies all access as a setup baseline. No rules have been deployed automatically.
5. Before wiring live data, add Firebase Authentication and tested customer/staff/admin authorization. Link verified account UIDs to the existing business profiles; do not grant access based on displayed names or the demo role selector.
6. Connect collections and migrate approved business data explicitly. The current customer catalogs and orders are samples and must not be silently uploaded as real business records.

Configuration and successful SDK initialization do not prove network access, permissions, or persistence. Verify an authenticated write/read only after access rules and real profiles are configured. Duplicate prevention must also run atomically on the backend.

## Empty catalog policy

All customers start with zero catalog items and zero seeded orders. Do not seed or automatically populate customer inventory. Customers submit their own item requests; Ryan Cohen must approve them before they appear in the customer catalog and can be ordered. This policy supersedes the earlier sample-catalog walkthroughs above. Firebase setup and migrations must preserve this empty starting state.

## Real sign-in milestone

The default app entry is now Firebase Email/Password sign-in, with persistent mobile sessions, sign-out, and password reset. The supplied contact email for Mathias is camathias2307@gmail.com. This contact is not an authorization rule and no account has been created by the source code.

Create the account in Firebase Authentication → Users → Add user, setting the password directly in Firebase. Sign in on the iPhone. The screen shows the resulting account UID so the profile can be linked in the next milestone. Never put the password in source code or chat.

Successful authentication currently leads to an account setup screen, not live business data. Firestore access remains locked; business profile mapping and tested role rules have not been deployed. Open demo preview remains a clearly labeled, separate temporary workflow with role selectors and empty starting catalogs. No demo data is uploaded. Real server-controlled roles will replace demo selectors when live data is enabled.

## Mathias account linking

Target Authentication UID: 4PQlDPQz5DdEPjhbrxzpkJkWVFa2. Profile document: users/4PQlDPQz5DdEPjhbrxzpkJkWVFa2. Fields: name (string) Mathias, role (string) staff, profileId (string) staff-001, active (boolean) true. A reviewable setup record is in setup/mathias-profile.json; it is not an automatic import or a deployed profile.

The app watches only the signed-in user's own profile document and rejects malformed or inactive profiles. The current firestore.rules allows authenticated users to get only their own users/{uid} document. Profile listing and all client writes are denied; other collections remain denied. Publish these rules in the Firebase Console and create the profile document there using a trusted project owner account. No rules or profiles have been deployed automatically.

After publishing rules and creating the profile, the signed-in screen should show Mathias · Staff. This milestone links identity to a persisted profile but does not yet enable online order access. Demo selectors remain isolated from real permissions. Role-based business collection rules and workflows still need implementation and emulator testing before live data is enabled.

## Temporary test accounts

- Admin test: alilucas2307@gmail.com, UID G5aM2AvMsdhzEaToVu232D1WjQJ3, profileId admin-test-001. This is a separate test administrator, not Ryan Cohen's identity.
- Faketales test customer: mejhc2307lbc@gmail.com, UID XynJNe7T4YdgsdVuQahLlqXb3k52, profileId customer-test-001, customerId test-faketales.

Create the corresponding users/{uid} documents in Firebase using setup/admin-test-profile.json and setup/faketales-test-profile.json as field guides. These setup records have not been uploaded automatically. Faketales is a separate test business, not Table Tales, and starts with an empty catalog. No example items or orders are seeded. Existing self-profile rules can read these documents after sign-in; live business data permissions remain a subsequent milestone. Real accounts should receive their own UIDs and profiles; deactivate temporary accounts after testing rather than treating these emails as the real admin/customer identities.

## Online catalog verification

Local Firestore emulator checks passed for: own-profile reads, blocked profile self-promotion, customer-scoped catalog queries, cross-customer read/write denial, inactive and unauthenticated access denial, staff read-only access, admin-only reviews, required return notes, immutable item details, normalized unique document keys, return/resubmit, concurrent approval attempts, and denied order writes. Lint/type checks and iOS export are run separately. Live project rules and end-to-end account tests still require publishing and user verification.

## Request card history

Customer request lists show pending and returned requests as active until resolved. Approved request cards move into a collapsed approval history, showing the past seven days by review time (submission time is the fallback). Include older approvals reveals the full history. Admin review defaults to pending requests; its history view follows the same recent approval window and keeps returned requests visible. This changes display only: no database documents or catalog items are deleted, and duplicate protection remains intact. No Firebase rule changes or republishing are required. Online order creation remains the next milestone.

## Online orders

Signed-in customers can add multiple approved items to a draft, combine repeated item quantities, edit/remove lines, and submit a saved order. The initial limit is eight different items per order, with 1–999 pieces per item. Drafts remain temporary. Saved orders include immutable descriptions, customer-submitted quantities, the submitting UID, and a server timestamp. Staff and administrators can read all orders; customers can query/read only their own business orders.

Firebase rules validate every order line against the approved catalog, including exact descriptions, valid quantities, and unique item IDs. Empty orders, pending/foreign items, forged descriptions/actors, and client updates/deletes are denied. An in-flight guard and a stable reference for identical retries prevent duplicate submits within the active draft session. Live receiving counts, status changes, and corrections are subsequent milestones; this release shows In progress / Awaiting receiving check.

Local emulator checks cover all eight lines at the limit, over-limit rejection, ownership, reader roles, inactive/unauthenticated users, and quantity/description tampering. No production orders have been created automatically. Publish the latest complete firestore.rules before using this feature.

## Online staff receiving and corrections

This milestone supersedes earlier notes that receiving is demo-only or online orders are read-only. Staff and admins confirm online counts, correct them with a reason, and move orders through Checked, Washing, and Ready for pickup. Customer-submitted lines remain unchanged. Latest received quantities are stored separately on the order; each count save appends an immutable countEvents/{revision} document in the same transaction. History records actor UID/name, server time, reason, and before/after counts. Original checks remain in history after corrections.

Database rules require complete 0–999 counts, notes for any initial mismatch, reasons for corrections, sequential revisions, atomic event creation, server timestamps, and actor identity matching the signed-in account. Customer writes, rewritten original lines, skipped statuses, detached/edited/deleted history entries, and inactive accounts are rejected. Transactions detect stale count versions. These checks passed locally alongside the prior catalog/order rules; live project publishing and end-to-end user testing still remain.

## Pickup and completed orders

The online lifecycle is In progress → Checked → Washing → Ready for pickup → Picked up. Staff/admin pickup confirmation requires an explicit confirmation prompt and is saved transactionally with the signed-in UID/name and server timestamp. Database rules restrict the transition to ready orders with confirmed counts, keep all original lines and received counts unchanged, prevent repeated/forged confirmations, and disallow rewinding or deleting orders. Local permission/concurrency tests passed alongside the catalog, order, and receiving regression checks.

Online order lists default to Active; Picked up orders move into Completed without deletion. Both views are searchable by order reference, customer name, and item description. Customers see only their own business’s orders. Receiving history remains available. Completed orders are locked against further count corrections, including by administrators. Notifications remain a subsequent milestone.

## Saved notification inbox

Customers receive one saved notice when an order is moved from Washing to Ready for pickup. The same transaction updates the order and creates notifications/{orderId}__ready. Rules enforce the pairing, recipient company, server timestamp, and staff/admin identity. Customers query only their own company notices and can mark them read with an immutable per-account timestamp. Inbox defaults to unread with Include read notices for history. Notice content cannot be rewritten or deleted by app users.

Existing ready orders are not backfilled, no live notices are seeded, and phone/push/email/SMS delivery remains unimplemented. Notices represent historical ready events; the order shows the current pickup status. Publishing the newest rules is required before further Ready for pickup transitions. Prior rules do not permit creating notifications.

## Navigation verification

Lint and TypeScript checks pass. Expo Router route discovery recognizes the sign-in route, isolated demo, four tab routes, and separate create-order route. The final iOS bundle is exported after the entry-point migration. Account switching and customer-only screens use active profile guards; Firestore rules and persisted business data are unchanged. Verify native tap, back, and sign-out behavior on the iPhone after the required server restart.

## Pickup completion notifications

The saved inbox now supports order_ready and order_picked_up events. Pickup confirmation creates one immutable customer notice in the same transaction as the order's completion. Rules require the correct recipient company, authenticated staff/admin identity, server timestamp, exact event ID/type, and Ready for pickup → Picked up transition. Completed counts remain locked. Existing completed orders are not backfilled. Read state is per customer account; phone alerts are not implemented.

After this update, publish the complete newest firestore.rules before confirming further pickups. Local catalog/order/receiving/pickup/notification tests passed with the new atomic requirement, including duplicate, cross-customer, and malformed completion notice attempts. The iOS bundle and code checks are verified separately.
