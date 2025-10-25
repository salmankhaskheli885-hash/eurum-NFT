# AurumNFT - System Architecture Blueprint

This document outlines the complete, step-by-step system architecture for the AurumNFT application. It details the automated and manual processes for every feature, providing a clear "script" for how the web application functions and how it can be compiled into a native app using Capacitor.

---

### **Summary (Automation Ratio)**

- ✅ **90% System Automatic** (Powered by Firebase, Cloud Functions & AI)
- 🧩 **10% Manual Control** (For Admin safety, verification, and critical decisions)

| System Module      | Auto % | Manual % |
| ------------------ | ------ | -------- |
| User Module        | 100%   | 0%       |
| Deposit System     | 90%    | 10%      |
| Withdrawal System  | 70%    | 30%      |
| Partner System     | 90%    | 10%      |
| Admin Controls     | 50%    | 50%      |
| AI Smart Actions   | 100%   | 0%       |

---

## 1. User System (100% Auto)

-   **Signup/Login:** Handled automatically by **Firebase Authentication** (Email/Google).
-   **Profile Creation:** A new user document is created automatically in **Firestore** (`/users/{userId}`) on the first login. A short, user-friendly UID is also generated and saved.
-   **VIP Level Progress:** A **Cloud Function** will run daily (or triggered on deposit completion) to calculate the user's total deposits and automatically update their `vipLevel` and `vipProgress` fields.
-   **Referral Bonus (5% for users, 10% for partners):** When a new user makes their first deposit, a **Cloud Function** is triggered. It automatically checks who the referrer is, calculates the commission (5% or 10%), and adds it to the referrer's balance. A 'Commission' transaction is logged.
-   **Password Reset:** Handled automatically via Firebase Auth's built-in email functionality.

## 2. Deposit System (90% Auto + AI Verification)

1.  **User Submits Deposit:** User fills the form and uploads a receipt. The data is saved to the `/transactions` collection in Firestore with a "Pending" status. The receipt image is uploaded to Firebase Storage.
2.  **AI Receipt Verification (Auto):** A **Cloud Function** is triggered when a new deposit transaction is created.
    -   It calls a Genkit AI Flow (`extractTid`).
    -   The AI extracts the Transaction ID (TID) and verifies that the recipient account number on the receipt matches the admin's wallet number.
3.  **Auto-Approval:** If the AI finds a valid TID and the account number matches, the Cloud Function automatically updates the transaction status to "Completed".
4.  **Balance Update (Auto):** The same Cloud Function securely updates the user's balance in their Firestore document.
5.  **Manual Review Flag:** If the AI cannot find a TID or the account number is incorrect, it updates the transaction status to "Pending (Review Required)" and flags it for the admin.

## 3. Withdrawal System (70% Auto + Manual Approval)

1.  **User Submits Withdrawal:** A new document is created in the `/transactions` collection with a "Pending" status.
2.  **Fee Calculation (Auto):** The system automatically calculates the withdrawal fee (e.g., 2%) based on the amount.
3.  **Admin Approval (Manual):** The request appears in the Admin Panel. The admin must manually verify the request and click "Approve" or "Reject".
4.  **Balance Deduction (Auto):** When the admin approves, a **Cloud Function** is triggered. It deducts the withdrawal amount AND the fee from the user's balance.
5.  **User Notification (Auto):** A notification (via Firebase Cloud Messaging) is sent to the user informing them that their withdrawal has been processed.

## 4. Investment Plans (100% Auto)

1.  **User Buys Plan:** User clicks "Invest". The system deducts the investment amount from their balance and creates an "Investment" transaction log in Firestore. The log includes `plan_id`, `investedAmount`, `startDate`, and `maturityDate`.
2.  **Daily Earning Payouts (Auto):** A **Cloud Function** runs every 24 hours. It queries all active investments, calculates the `dailyReturn` for each, and adds it to the respective user's balance, creating a "Payout" transaction log.
3.  **Maturity Payout (Auto):** The daily Cloud Function also checks for plans where `maturityDate` is today. For matured plans, it returns the principal investment amount to the user's balance and marks the investment as "Matured".

## 5. Partner System (90% Auto + Manual Request)

1.  **Request to Become Partner (Manual Trigger):** A user who meets the criteria (e.g., verified KYC) can click a button to request to become a partner. This creates a document in the `/partner_requests` collection.
2.  **Admin Approval (Manual):** The admin reviews the request in the Admin Panel and approves it.
3.  **Role Update (Auto):** When the admin approves, a Cloud Function triggers and updates the user's `role` from "user" to "partner".
4.  **Auto Commission (10%):** The referral commission logic (from Section 1) automatically checks the referrer's role. If the role is "partner", it calculates a 10% commission instead of 5%.
5.  **Team Tracking (Auto):** The system automatically tracks a partner's network via the `referredBy` field on each user document.

## How to Build the "Proper" App using this Script

This entire Next.js project is the "script" and "brain" of your app. Capacitor acts as the "body".

**Your Final Steps:**

1.  **Install Android Studio:** Make sure you have the official Android development tool installed on your computer.
2.  **Run the Build Command:** Open a terminal in your project folder and run this command:
    ```bash
    npm run android
    ```
3.  **Build the APK in Android Studio:**
    -   The command will automatically open your project in Android Studio.
    -   In Android Studio, go to the menu: `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`.
    -   Android Studio will create the `.apk` file for you, which you can then install on any Android phone.

This process uses your existing web code to create a real, installable Android app.