# Screen navigation

Customer tabs: Catalog, Orders, Notifications, Account.
Staff/admin tabs: Catalogs, Orders, Account. Admin catalog approvals remain on Catalogs.

Orders opens the Active / Completed list. Customers can tap Create a new order to open a separate order form, then submit it to return to the order list. Drafts are temporary; leaving the form discards an unfinished draft. Saved orders remain in Firebase.

Account contains the signed-in name, role, company (for customers), email, sign-out, expandable account ID, and the isolated demo preview. Demo data never becomes online business data.

Firebase authentication and active business profiles control access to the signed-in route group. Customer-only notification and create-order routes are protected and also check the role before rendering. Signing out or losing the active profile removes the signed-in navigation history. Catalog state is scoped to the account/role/customer and shared across the signed-in screens. Firebase database rules remain the source of authorization and have not changed in this update.

## One-time restart for this update

Expo Router replaces the original single-screen entry point, so restart the development server once:

1. In the project terminal, press Control+C.
2. Run `npx expo start --clear`.
3. Open the QR code in Expo Go again.

No Firebase rule publication, account recreation, or data migration is needed. Test each tab, creating an order, switching between Active/Completed, marking a notice as read, and signing out. Customers should see the notification tab; staff/admin accounts should not.
