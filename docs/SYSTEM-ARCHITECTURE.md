# AurumNFT - The Ultimate Master Script & System Blueprint

This document is the definitive "master script" for the AurumNFT application. It provides an exhaustive, panel-by-panel breakdown of every feature, option, and workflow. This blueprint details both the automated processes (backend logic) and the manual user interactions, serving as a complete guide to the application's functionality.

---

### **Application Structure (Panels)**

The application is divided into five core access levels or "panels":

1.  **Authentication** (Login / Register)
2.  **Admin Panel** (`/admin`)
3.  **User Panel** (`/dashboard`)
4.  **Partner Panel** (`/partner`)
5.  **Agent Panel** (`/agent`)

---

## 1. Authentication System (Login/Register)

This is the entry point for all users. The system is designed to intelligently route users based on their roles.

| Feature               | Type   | Logic / Description                                                                                                                              |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User/Partner Login**| Auto   | Users can select a "User" or "Partner" tab. Login is handled by **Firebase Authentication** (Google Sign-In).                                      |
| **Role-Based Routing**| Auto   | After login, the system checks the user's `role` in Firestore. It automatically redirects to `/admin`, `/partner`, `/agent`, or `/dashboard`.       |
| **Admin Panel Dialog**| Auto   | If a user with the `admin` role logs in, a special dialog appears, allowing them to choose which panel to enter (Admin, User, Partner, or Agent). |
| **New User Creation** | Auto   | On the very first login, a new user document is created in `firestore/users/{userId}` with default values (`role: 'user'`, `balance: 0`, etc.).    |
| **Referral Handling** | Auto   | If a new user signs up using a referral link, the referrer's `userId` is saved in the new user's `referredBy` field in Firestore.                |

---

## 2. Admin Panel (`/admin`)

The central control hub for the entire application. Accessible only to users with the `admin` role.

### **Dashboard (`/admin`)**
| Feature                  | Type   | Description                                                                                             |
| ------------------------ | ------ | ------------------------------------------------------------------------------------------------------- |
| **Stat Cards**           | Auto   | Displays real-time stats: Total Users, Total Deposits, Pending Withdrawals, Total Invested, Pending KYC.    |
| **Panel Control**        | Manual | Switches to enable or disable the User, Partner, and Agent panels globally. Changes are saved in Firestore. |
| **Manual Action Links**  | Manual | Quick links to approve deposits, withdrawals, and KYC requests.                                           |
| **Recent Activity Table**| Auto   | Shows the 5 most recent transactions from all users in the system.                                      |

### **User Management (`/admin/users`)**
| Feature                  | Type   | Description                                                                                        |
| ------------------------ | ------ | -------------------------------------------------------------------------------------------------- |
| **User List & Search**   | Auto   | Displays all users. Admin can search by name, email, or UID.                                       |
| **View User Details**    | Manual | Takes the admin to a detailed page (`/admin/users/{userId}`) for a specific user.                    |
| **Edit User Role**       | Manual | Admin can change a user's role to `user`, `partner`, or `admin` directly from the user list.         |
| **Suspend/Activate User**| Manual | Admin can change a user's status between `Active` and `Suspended`.                                   |
| **Delete User**          | Manual | Permanently deletes the user's document from Firestore.                                              |

### **Deposit Management (`/admin/deposits`)**
| Feature                | Type   | Description                                                                                                   |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| **Pending Requests Tab** | Auto   | Shows all deposit requests with a `Pending` status. Includes user name, amount, and a link to the receipt. |
| **Approve/Reject**     | Manual | Admin clicks "Approve" or "Reject". This triggers a Cloud Function to update the transaction status.        |
| **History Tab**        | Auto   | Shows all `Completed` and `Failed` deposits for historical record.                                            |

### **Withdrawal Management (`/admin/withdrawals`)**
| Feature                | Type   | Description                                                                                                  |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| **Pending Requests Tab** | Auto   | Shows all pending withdrawal requests with user name, bank details, and amount.                              |
| **Approve/Reject**     | Manual | Admin clicks "Approve" or "Reject". This triggers a Cloud Function to update the transaction status.         |
| **History Tab**        | Auto   | Shows all `Completed` and `Failed` withdrawals.                                                              |

### **KYC Management (`/admin/kyc`)**
| Feature                | Type   | Description                                                                                               |
| ---------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| **Pending Requests Tab** | Auto   | Shows all users with a `kycStatus` of `pending`.                                                          |
| **View Documents**     | Manual | A dialog opens to show the user's submitted CNIC and selfie images (placeholders for now).                |
| **Approve/Reject**     | Manual | Admin clicks "Approve" or "Reject". This updates the user's `kycStatus` in Firestore to `approved` or `rejected`. |
| **History Tab**        | Auto   | Shows all `approved` and `rejected` KYC submissions.                                                        |

### **Partner Management (`/admin/partner-requests`, `/admin/tasks`)**
| Feature               | Type   | Description                                                                                                               |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Partner Requests**  | Auto   | `/partner-requests` page shows all users who have requested to become a partner. Admin can approve or reject.           |
| **Task Management**   | Manual | `/tasks` page allows admin to create, edit, and delete tasks (e.g., "Refer 10 users for a bonus").                  |
| **Approve Request**   | Manual | Approving a partner request updates the user's `role` to `partner` in Firestore.                                        |

### **Investment Plans (`/admin/investments`)**
| Feature             | Type   | Description                                                                                                                             |
| ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Plan List**       | Auto   | Shows all investment plans with their details (daily return, duration, etc.).                                                         |
| **Add/Edit Plan**   | Manual | A dialog allows the admin to create a new plan or edit an existing one. A placeholder image is automatically generated. |
| **Set Visibility**  | Manual | Admin can set which roles (`user`, `partner`, `agent`) can see and invest in a plan.                                    |
| **Activate/Lock**   | Manual | Admin can make a plan `isActive` (available for investment) or inactive (locked).                                           |
| **Delete Plan**     | Manual | Permanently deletes the plan from Firestore.                                                                                      |

### **Global Settings (`/admin/settings`)**
| Feature                | Type   | Description                                                                                                                             |
| ---------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Payment Settings**   | Manual | Admin can set the master wallet details (account name, number), withdrawal fees, and min/max deposit/withdrawal amounts. |
| **Post Announcement**  | Manual | Admin can write and broadcast a message that appears as a notification for all users on their dashboard.                  |

---

## 3. User Panel (`/dashboard`)

This is the main interface for regular users.

| Page / Feature        | Description                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Dashboard**         | Shows a welcome message, current balance, and VIP level progress. Contains a prominent "Install App" button.                           |
| **Investments**       | Displays all investment plans visible to the `user` role. Users can click "Invest Now" to buy a plan.                                |
| **Deposit**           | User can see admin's wallet details, fill a form with their transaction info, and upload a payment receipt to request a deposit.       |
| **Withdraw**          | User can fill a form with their bank details and requested amount to request a withdrawal.                                             |
| **Transactions**      | A complete history of all the user's transactions (deposits, withdrawals, investments, payouts, etc.), with filtering options.       |
| **Referrals**         | Shows the user's unique referral link, total referred users, and commission earnings (5% rate for regular users).                        |
| **Profile**           | Displays the user's name, email, and unique User ID.                                                                                 |
| **Settings**          | Allows the user to change their password and view FAQs, Terms of Service, etc. Also contains another "Install App" button.            |
| **Live Chat**         | A floating chat button on all pages that opens a chat window to talk directly with a support agent.                                    |

---

## 4. Partner Panel (`/partner`)

An enhanced dashboard for users with the `partner` role. It includes all User Panel features plus the following:

| Page / Feature        | Description                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dashboard**         | Shows enhanced stats: total users in their network, total network investment, and total commission earned.                                   |
| **Investments**       | Displays investment plans visible to the `partner` role (can be different from user plans).                                                  |
| **Referrals**         | Commission rate is shown as **10%**.                                                                                                       |
| **Tasks**             | `/partner/tasks` page. Shows a list of challenges (e.g., "Refer 5 users who deposit 1000 PKR") and tracks the partner's progress.        |
| **KYC Submission**    | `/partner/kyc` page. Partners must submit their KYC documents to be verified. This is a requirement for being a trusted partner.             |
| **Settings**          | Includes an additional "Contact Us" form for partners to send messages directly to the admin.                                              |

---

## 5. Agent Panel (`/agent`)

A dedicated, simplified interface for support agents. Accessible only to users with the `agent` role.

| Page / Feature        | Description                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Active Chats**      | The main page. Shows a list of active user chats. Clicking a chat opens the conversation window.                                       |
| **Chat Window**       | Agent can send text and images to the user.                                                                                          |
| **Chat History**      | A full log of all past conversations.                                                                                                |
| **Manage Deposits**   | If the agent has permission, this page shows deposit requests assigned to them. They can approve or reject them.                      |
| **Manage Withdrawals**| If the agent has permission, this page shows withdrawal requests assigned to them. They can approve or reject them.                   |
| **Profile**           | Shows the agent's name, email, and their assigned permissions (e.g., "Can Handle Deposits").                                           |

---

## 6. How to Build the App from this Script

This web project is the "script" and "brain". Capacitor is the "body" that turns it into a native app.

1.  **Install Android Studio:** Get the official Android development tool.
2.  **Run Build Command:** In your project terminal, run `npm run android`. This command automatically opens your project in Android Studio.
3.  **Build the APK:** In Android Studio, go to the menu: `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`. This will create the `.apk` file you can install on any Android phone.
