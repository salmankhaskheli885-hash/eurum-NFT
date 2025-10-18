

'use client';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
  deleteDoc,
  query,
  limit,
  orderBy,
  where,
  addDoc,
  updateDoc,
  onSnapshot, // Import onSnapshot
  type Unsubscribe,
  serverTimestamp,
  runTransaction,
  Timestamp,
  collectionGroup,
  increment
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { User as FirebaseUser } from 'firebase/auth';
import type { User, InvestmentPlan, Transaction, AppSettings, Announcement, ChatAgent, ChatRoom, ChatMessage, Task, UserTask, PartnerRequest } from './data';
import { UserProfile } from './schema';
import { updateProfile } from 'firebase/auth';
import { extractTid } from '@/ai/flows/extract-tid-flow';

// USER FUNCTIONS
export async function getOrCreateUser(
    firestore: ReturnType<typeof getFirestore>,
    firebaseUser: FirebaseUser,
): Promise<User> {
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        // The user document already exists, return it.
        return userSnap.data() as User;
    } else {
        // The user document does not exist, create a new one with basic info.
        const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: 'user', // Default role for all new users.
            shortUid: firebaseUser.uid.substring(0, 8),
            balance: 0,
            currency: 'PKR',
            vipLevel: 1,
            vipProgress: 0,
            kycStatus: 'unsubmitted',
            referralLink: `https://fynix.pro/ref/${firebaseUser.uid.substring(0, 8)}`,
            status: 'Active',
            totalDeposits: 0,
            failedDepositCount: 0,
        };
        await setDoc(userRef, newUser);
        return newUser;
    }
}


export function listenToUser(firestore: ReturnType<typeof getFirestore>, userId: string, callback: (user: User | null) => void): Unsubscribe {
    const userRef = doc(firestore, 'users', userId);
    return onSnapshot(userRef, (doc) => {
        callback(doc.exists() ? doc.data() as User : null);
    });
}

export function listenToAllUsers(firestore: ReturnType<typeof getFirestore>, callback: (users: User[]) => void): Unsubscribe {
    const usersCollection = collection(firestore, 'users');
    const q = query(usersCollection);
    return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({...doc.data(), uid: doc.id } as User));
        callback(users);
    });
}

export async function updateUser(firestore: ReturnType<typeof getFirestore>, userId: string, updates: Partial<User>) {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, updates);
}

export async function deleteUser(firestore: ReturnType<typeof getFirestore>, userId: string) {
    const userRef = doc(firestore, 'users', userId);
    await deleteDoc(userRef);
}

export async function submitKyc(firestore: ReturnType<typeof getFirestore>, userId: string, kycData: Transaction['kycDetails']) {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
        kycStatus: 'pending',
        cnicFrontUrl: kycData?.cnicFrontUrl,
        cnicBackUrl: kycData?.cnicBackUrl,
        selfieUrl: kycData?.selfieUrl,
        mobileNumber: kycData?.mobileNumber,
    });
}

export async function updateKycStatus(firestore: ReturnType<typeof getFirestore>, userId: string, status: 'approved' | 'rejected') {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, { kycStatus: status });
}

// Separate function to handle background receipt upload
const uploadReceiptAndUpdateTransaction = async (firestore: ReturnType<typeof getFirestore>, transactionId: string, userId: string, receiptFile: File) => {
    try {
        const storage = getStorage();
        const receiptPath = `receipts/${userId}/${transactionId}_${receiptFile.name}`;
        const storageRef = ref(storage, receiptPath);
        const snapshot = await uploadBytes(storageRef, receiptFile);
        const receiptUrl = await getDownloadURL(snapshot.ref);

        const transactionRef = doc(firestore, 'transactions', transactionId);
        await updateDoc(transactionRef, { receiptUrl: receiptUrl });

        return receiptUrl; // Return the URL for further use
    } catch (error) {
        console.error("Error in background receipt upload:", error);
        // Optionally, update the transaction to a 'failed' state if upload is critical
        return null;
    }
};

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


export async function addTransaction(
    firestore: ReturnType<typeof getFirestore>,
    transactionData: Omit<Transaction, 'id' | 'date'> & { receiptFile?: File }
) {
    const { receiptFile, ...dataToSave } = transactionData;
    let isFakeReceipt = false;
    let extractedTid = '';

    if (receiptFile) {
        try {
            const receiptDataUri = await fileToDataUri(receiptFile);
            const aiResult = await extractTid({ receiptDataUri });
            if (!aiResult.transactionId) {
                isFakeReceipt = true; // AI failed to find a TID, mark as fake/unreadable
            } else {
                extractedTid = aiResult.transactionId;
            }
        } catch (error) {
            console.error("AI TID extraction failed:", error);
            isFakeReceipt = true; // Treat AI errors as a failure case
        }
    } else {
        isFakeReceipt = true; // No receipt file is also a failure case for deposits
    }

    if (isFakeReceipt) {
        // If the receipt is fake, immediately fail the transaction and update user stats.
        return runTransaction(firestore, async (transaction) => {
            const userRef = doc(firestore, 'users', dataToSave.userId);
            const userSnap = await transaction.get(userRef);

            if (!userSnap.exists()) {
                throw new Error("User not found to update failed deposit count.");
            }

            const user = userSnap.data() as User;
            const newFailedCount = (user.failedDepositCount || 0) + 1;

            const updates: Partial<User> = { failedDepositCount: newFailedCount };
            if (newFailedCount >= 5) {
                updates.status = 'Suspended';
            }
            transaction.update(userRef, updates);

            const failedTxRef = doc(collection(firestore, 'transactions'));
            const failedTxObject: Partial<Transaction> = {
                ...dataToSave,
                id: failedTxRef.id,
                date: new Date().toISOString(),
                status: 'Failed',
                details: 'Failed AI receipt check or no receipt provided.',
            };
            transaction.set(failedTxRef, failedTxObject);
        });
    }

    // --- Proceed with normal transaction if receipt is valid ---
    const newTransactionRef = doc(collection(firestore, 'transactions'));

    if (!dataToSave.userRole) {
        throw new Error("User role is required to create a transaction.");
    }

    // Agent Assignment Logic
    const settingsRef = doc(firestore, "app", "settings");
    const settingsSnap = await getDoc(settingsRef);
    const settings = settingsSnap.data() as AppSettings;
    const lastAssignedIndex = settings?.lastAssignedAgentIndex ?? -1;

    const agentsQuery = query(collection(firestore, "chat_agents"), where("isActive", "==", true));
    const agentsSnap = await getDocs(agentsQuery);
    const activeAgents = agentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ChatAgent));

    let assignedAgentId: string | undefined = undefined;
    if (activeAgents.length > 0) {
        const nextAgentIndex = (lastAssignedIndex + 1) % activeAgents.length;
        assignedAgentId = activeAgents[nextAgentIndex].uid;
        await updateDoc(settingsRef, { lastAssignedAgentIndex: nextAgentIndex });
    }

    const transactionObject: Partial<Transaction> = {
        ...dataToSave,
        id: newTransactionRef.id,
        date: new Date().toISOString(),
        status: dataToSave.status || 'Pending',
        userRole: dataToSave.userRole,
        assignedAgentId: assignedAgentId,
        details: extractedTid ? `TID: ${extractedTid}` : dataToSave.details,
    };

    await setDoc(newTransactionRef, transactionObject);

    if (receiptFile) {
        // Upload happens after the main transaction is committed
        await uploadReceiptAndUpdateTransaction(firestore, newTransactionRef.id, transactionData.userId, receiptFile);
    }
}


async function handleInvestmentPayout(firestore: ReturnType<typeof getFirestore>, finalTransaction: Transaction) {
    if (finalTransaction.type !== 'Investment' || !finalTransaction.investmentDetails) {
        return;
    }

    const { maturityDate, investedAmount, dailyReturn, durationDays, planName } = finalTransaction.investmentDetails;
    const payoutAmount = (dailyReturn * durationDays) + investedAmount;

    const maturityTimestamp = new Date(maturityDate).getTime();
    const nowTimestamp = new Date().getTime();
    const delay = Math.max(0, maturityTimestamp - nowTimestamp);

    setTimeout(async () => {
        try {
            await runTransaction(firestore, async (payoutTx) => {
                const userForPayoutRef = doc(firestore, 'users', finalTransaction.userId);
                const userForPayoutSnap = await payoutTx.get(userForPayoutRef);

                if (userForPayoutSnap.exists()) {
                    const payoutTransactionData: Omit<Transaction, 'id' | 'date'> = {
                        userId: finalTransaction.userId,
                        userName: finalTransaction.userName,
                        userRole: finalTransaction.userRole,
                        type: 'Payout',
                        amount: payoutAmount,
                        status: 'Completed',
                        details: `Matured investment from ${planName}`
                    };

                    const newBalance = userForPayoutSnap.data().balance + payoutAmount;
                    payoutTx.update(userForPayoutRef, { balance: newBalance });

                    const payoutDocRef = doc(collection(firestore, 'transactions'));
                    payoutTx.set(payoutDocRef, { ...payoutTransactionData, date: new Date().toISOString() });
                }
            });
        } catch (e) {
            console.error("Failed to process automatic payout:", e);
        }
    }, delay);
}

// Function to handle automatic task progress updates
async function updatePartnerTaskProgress(
    transaction: any, // The main transaction object from runTransaction
    firestore: ReturnType<typeof getFirestore>,
    depositingUser: User,
    depositAmount: number,
    referrerId: string
) {
    // 1. Get all active tasks for the referrer.
    const tasksQuery = query(
        collection(firestore, 'tasks'),
        where('isActive', '==', true),
        where('type', '==', 'referral_deposit')
    );
    const activeTasksSnap = await getDocs(tasksQuery);
    const activeTasks = activeTasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

    for (const task of activeTasks) {
        // 2. Check if this deposit qualifies for the task.
        if (depositAmount < task.minDeposit) {
            continue; // Skip if deposit amount is too low.
        }

        const userTaskRef = doc(firestore, 'users', referrerId, 'user_tasks', task.id);
        const userTaskSnap = await transaction.get(userTaskRef);

        let userTaskData: UserTask;

        if (userTaskSnap.exists()) {
            userTaskData = userTaskSnap.data() as UserTask;
            // 3. If task progress exists, check if user is already counted.
            if (userTaskData.isCompleted || userTaskData.qualifiedReferrals?.includes(depositingUser.uid)) {
                continue; // Skip if task is done or user already contributed.
            }
        } else {
            // 4. If no progress, create a new user_task document.
            userTaskData = {
                id: task.id,
                userId: referrerId,
                taskId: task.id,
                progress: 0,
                isCompleted: false,
                isClaimed: false,
                qualifiedReferrals: [],
            };
        }

        // 5. Update progress.
        const newProgress = (userTaskData.progress || 0) + 1;
        const newQualifiedReferrals = [...(userTaskData.qualifiedReferrals || []), depositingUser.uid];
        const isNowCompleted = newProgress >= task.targetCount;

        const updates: Partial<UserTask> = {
            progress: newProgress,
            qualifiedReferrals: newQualifiedReferrals,
            isCompleted: isNowCompleted,
        };

        if (userTaskSnap.exists()) {
            transaction.update(userTaskRef, updates);
        } else {
            transaction.set(userTaskRef, { ...userTaskData, ...updates });
        }
    }
}


export async function updateTransactionStatus(firestore: ReturnType<typeof getFirestore>, transactionId: string, newStatus: 'Completed' | 'Failed', txData: Transaction) {
    
    await runTransaction(firestore, async (transaction) => {
        const txRef = doc(firestore, 'transactions', transactionId);
        
        // --- READS FIRST ---
        const userRef = doc(firestore, 'users', txData.userId);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User for transaction not found");
        const user = userSnap.data() as User;

        const appSettingsDocSnap = await transaction.get(doc(firestore, 'app', 'settings'));
        const settings = appSettingsDocSnap.data() as AppSettings;

        let referrerSnap: any = null;
        if (user.referredBy) {
            const referrerRef = doc(firestore, 'users', user.referredBy);
            referrerSnap = await transaction.get(referrerRef);
        }

        // --- WRITES SECOND ---
        transaction.update(txRef, { status: newStatus });
        
        // Update Agent performance stats
        if (txData.assignedAgentId) {
            const agentQuery = query(collection(firestore, 'chat_agents'), where('uid', '==', txData.assignedAgentId), limit(1));
            // This needs to be outside the transaction's read phase
            const agentSnap = await getDocs(agentQuery);
            if (!agentSnap.empty) {
                const agentDocRef = agentSnap.docs[0].ref;
                if (txData.type === 'Deposit') {
                    if (newStatus === 'Completed') {
                        transaction.update(agentDocRef, { depositsApproved: increment(1) });
                    } else {
                        transaction.update(agentDocRef, { depositsRejected: increment(1) });
                    }
                } else if (txData.type === 'Withdrawal') {
                    if (newStatus === 'Completed') {
                        transaction.update(agentDocRef, { withdrawalsApproved: increment(1) });
                    } else {
                        transaction.update(agentDocRef, { withdrawalsRejected: increment(1) });
                    }
                }
            }
        }
        
        if (newStatus !== 'Completed') {
            if (txData.type === 'Deposit') {
                const newFailedCount = increment(1);
                const updates: Partial<User> = { failedDepositCount: newFailedCount as any };
                if ((user.failedDepositCount || 0) + 1 >= 5) {
                    updates.status = 'Suspended';
                }
                transaction.update(userRef, updates);
            }
            return;
        };
        
        switch (txData.type) {
            case 'Deposit': {
                const newTotalDeposits = (user.totalDeposits || 0) + txData.amount;
                const newBalance = user.balance + txData.amount;
                let newVipLevel = user.vipLevel;
                let vipProgress = user.vipProgress;

                if (user.vipLevel < 3 && newTotalDeposits >= 500) newVipLevel = 3;
                else if (user.vipLevel < 2 && newTotalDeposits >= 100) newVipLevel = 2;

                if (newVipLevel === 1) vipProgress = (newTotalDeposits / 100) * 100;
                else if (newVipLevel === 2) vipProgress = ((newTotalDeposits - 100) / (500 - 100)) * 100;
                else if (newVipLevel === 3) vipProgress = ((newTotalDeposits - 500) / (1000 - 500)) * 100;

                transaction.update(userRef, { 
                    balance: newBalance, 
                    totalDeposits: newTotalDeposits, 
                    vipLevel: newVipLevel,
                    vipProgress: Math.min(100, Math.max(0, Math.floor(vipProgress)))
                });

                // Check for referral and commission
                if (user.referredBy && referrerSnap && referrerSnap.exists()) {
                    const referrer = referrerSnap.data() as User;
                    const referrerRef = doc(firestore, 'users', user.referredBy); // get ref again for writing
                    const commissionRate = referrer.role === 'partner' ? 0.10 : 0.05;
                    const commissionAmount = txData.amount * commissionRate;
                    
                    const newReferrerBalance = referrer.balance + commissionAmount;
                    transaction.update(referrerRef, { balance: newReferrerBalance });

                    const commissionTxRef = doc(collection(firestore, 'transactions'));
                    transaction.set(commissionTxRef, {
                        userId: referrer.uid,
                        userName: referrer.displayName || 'N/A',
                        userRole: referrer.role,
                        type: 'Commission',
                        amount: commissionAmount,
                        status: 'Completed',
                        date: new Date().toISOString(),
                        details: `Commission from ${user.displayName}'s deposit`
                    });
                     // Call the task progress update function
                    await updatePartnerTaskProgress(transaction, firestore, user, txData.amount, referrer.uid);
                }
                break;
            }
            case 'Withdrawal': {
                const withdrawalAmount = Math.abs(txData.amount);
                const feePercentage = settings?.withdrawalFee || 0;
                const feeAmount = withdrawalAmount * (feePercentage / 100);
                const totalDeduction = withdrawalAmount + feeAmount;

                if (user.balance < totalDeduction) {
                    transaction.update(txRef, { status: 'Failed', details: `Insufficient balance. Required ${totalDeduction}, had ${user.balance}`});
                    // throw new Error() is not needed, just update and return
                    return;
                }
                
                transaction.update(userRef, { 
                    lastWithdrawalDate: new Date().toISOString(),
                    balance: user.balance - totalDeduction
                });
                 break;
            }
             case 'Investment': {
                const investmentAmount = Math.abs(txData.amount);
                 if (user.balance < investmentAmount) {
                     transaction.update(txRef, { status: 'Failed', details: `Insufficient balance. Required ${investmentAmount}, had ${user.balance}`});
                     return;
                 }
                const newBalance = user.balance - investmentAmount;
                transaction.update(userRef, { balance: newBalance });
                // We cannot call an async function with await inside the transaction.
                // We'll call it outside.
                 break;
            }
        }
    });

    // Call async operations like setTimeout outside the transaction
    if (newStatus === 'Completed' && txData.type === 'Investment') {
        handleInvestmentPayout(firestore, txData);
    }
}


export function listenToAllTransactions(firestore: ReturnType<typeof getFirestore>, callback: (transactions: Transaction[]) => void): Unsubscribe {
    const transactionsCollection = collection(firestore, 'transactions');
    const q = query(transactionsCollection);
    return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
            } as Transaction
        });
        callback(transactions);
    });
}

export function listenToUserTransactions(firestore: ReturnType<typeof getFirestore>, userId: string, callback: (transactions: Transaction[]) => void, count?: number): Unsubscribe {
    const transactionsCollection = collection(firestore, 'transactions');
    let q;
    if (count) {
        q = query(transactionsCollection, where("userId", "==", userId), limit(count));
    } else {
        q = query(transactionsCollection, where("userId", "==", userId));
    }
    return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        callback(transactions);
    });
}


// INVESTMENT PLAN FUNCTIONS
export async function addInvestmentPlan(firestore: ReturnType<typeof getFirestore>, plan: Omit<InvestmentPlan, 'id'>): Promise<InvestmentPlan> {
    const plansCollection = collection(firestore, 'investment_plans');
    const newDocRef = await addDoc(plansCollection, plan);
    return { ...plan, id: newDocRef.id };
}

export async function updateInvestmentPlan(firestore: ReturnType<typeof getFirestore>, planToUpdate: InvestmentPlan) {
    const planRef = doc(firestore, 'investment_plans', planToUpdate.id);
    const { id, ...planData } = planToUpdate;
    await setDoc(planRef, planData, { merge: true });
}

export async function deleteInvestmentPlan(firestore: ReturnType<typeof getFirestore>, planId: string) {
    const planRef = doc(firestore, 'investment_plans', planId);
    await deleteDoc(planRef);
}

export function listenToAllInvestmentPlans(firestore: ReturnType<typeof getFirestore>, callback: (plans: InvestmentPlan[]) => void): Unsubscribe {
    const plansCollection = collection(firestore, 'investment_plans');
    return onSnapshot(plansCollection, (snapshot) => {
        const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestmentPlan));
        callback(plans);
    });
}

// APP SETTINGS FUNCTIONS
export async function getAppSettings(firestore: ReturnType<typeof getFirestore>): Promise<AppSettings> {
    const settingsRef = doc(firestore, 'app', 'settings');
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
    }
    return {
        adminWalletNumber: "",
        adminWalletName: "",
        adminAccountHolderName: "",
        withdrawalFee: 0,
        isUserPanelEnabled: true,
        isPartnerPanelEnabled: true,
        isAgentPanelEnabled: true,
    };
}


export function listenToAppSettings(firestore: ReturnType<typeof getFirestore>, callback: (settings: AppSettings) => void): Unsubscribe {
    const settingsRef = doc(firestore, 'app', 'settings');
    return onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as AppSettings);
        } else {
            callback({
                adminWalletNumber: "0300-1234567",
                adminWalletName: "JazzCash",
                adminAccountHolderName: "Fynix Pro Admin",
                withdrawalFee: 2,
                isUserPanelEnabled: true,
                isPartnerPanelEnabled: true,
                isAgentPanelEnabled: true,
            });
        }
    });
}

export async function updateAppSettings(firestore: ReturnType<typeof getFirestore>, newSettings: Partial<AppSettings>) {
    const settingsRef = doc(firestore, 'app', 'settings');
    await setDoc(settingsRef, newSettings, { merge: true });
}

// ANNOUNCEMENT FUNCTIONS
export async function addAnnouncement(firestore: ReturnType<typeof getFirestore>, message: string): Promise<Announcement> {
    const announcementsCollection = collection(firestore, 'announcements');
    const newAnnouncement = {
        message,
        date: new Date().toISOString(),
    };
    const newDocRef = await addDoc(announcementsCollection, newAnnouncement);
    return { ...newAnnouncement, id: newDocRef.id };
}

export function listenToLatestAnnouncement(firestore: ReturnType<typeof getFirestore>, callback: (announcement: Announcement | null) => void): Unsubscribe {
    const announcementsCollection = collection(firestore, 'announcements');
    const q = query(announcementsCollection, orderBy("date", "desc"), limit(1));
    return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            callback(null);
        } else {
            const doc = snapshot.docs[0];
            callback({ id: doc.id, ...doc.data() } as Announcement);
        }
    });
}

// CHAT AGENT FUNCTIONS
export async function isUserAChatAgent(firestore: ReturnType<typeof getFirestore>, email: string): Promise<boolean> {
    const agentsRef = collection(firestore, 'chat_agents');
    const q = query(agentsRef, where("email", "==", email), limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

export async function addChatAgent(firestore: ReturnType<typeof getFirestore>, agent: Omit<ChatAgent, 'id' | 'depositsApproved' | 'depositsRejected' | 'withdrawalsApproved' | 'withdrawalsRejected'>) {
    // Check if agent with this email already exists
    const q = query(collection(firestore, "chat_agents"), where("email", "==", agent.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error("An agent with this email already exists.");
    }
    
    // Find if a user with this email exists to get the UID
    const userQuery = query(collection(firestore, "users"), where("email", "==", agent.email), limit(1));
    const userSnapshot = await getDocs(userQuery);
    
    let agentUid: string | undefined;
    if (!userSnapshot.empty) {
        agentUid = userSnapshot.docs[0].id;
    }

    const agentData = {
        ...agent,
        uid: agentUid,
        isActive: !!agentUid,
        depositsApproved: 0,
        depositsRejected: 0,
        withdrawalsApproved: 0,
        withdrawalsRejected: 0,
    };

    const agentsCollection = collection(firestore, 'chat_agents');
    await addDoc(agentsCollection, agentData);
}

export async function updateChatAgent(firestore: ReturnType<typeof getFirestore>, agentId: string, updates: Partial<ChatAgent>) {
    const agentRef = doc(firestore, 'chat_agents', agentId);
    await updateDoc(agentRef, updates);
}


export async function deleteChatAgent(firestore: ReturnType<typeof getFirestore>, agentId: string) {
    const agentRef = doc(firestore, 'chat_agents', agentId);
    await deleteDoc(agentRef);
}

export function listenToAllChatAgents(firestore: ReturnType<typeof getFirestore>, callback: (agents: ChatAgent[]) => void): Unsubscribe {
    const agentsCollection = collection(firestore, 'chat_agents');
    return onSnapshot(agentsCollection, (snapshot) => {
        const agents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatAgent));
        callback(agents);
    });
}


// CHAT SYSTEM FUNCTIONS
export async function getOrCreateChatRoom(firestore: ReturnType<typeof getFirestore>, user: UserProfile): Promise<ChatRoom> {
  return runTransaction(firestore, async (transaction) => {
    const settingsRef = doc(firestore, "app", "settings");
    const settingsSnap = await transaction.get(settingsRef);
    const settings = settingsSnap.data() as AppSettings;
    const lastAssignedIndex = settings.lastAssignedAgentIndex ?? -1;

    // This query must be outside the transaction
    const agentsQuery = query(collection(firestore, "chat_agents"), where("isActive", "==", true));
    const agentsSnap = await getDocs(agentsQuery);
    const activeAgents = agentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ChatAgent));

    let agentId: string | undefined = undefined;
    let agentName: string | undefined = undefined;
    if (activeAgents.length > 0) {
      const nextAgentIndex = (lastAssignedIndex + 1) % activeAgents.length;
      const assignedAgent = activeAgents[nextAgentIndex];
      agentId = assignedAgent.uid;
      agentName = assignedAgent.email; // or a displayName if available
      transaction.update(settingsRef, { lastAssignedAgentIndex: nextAgentIndex });
    }

    const newRoomData: Omit<ChatRoom, 'id'> = {
      userId: user.uid,
      userName: user.displayName || "Unknown User",
      agentId: agentId,
      agentName: agentName,
      createdAt: new Date().toISOString(),
      lastMessage: "Chat started",
      lastMessageAt: new Date().toISOString(),
      isResolved: false // New chats are always unresolved
    };
    const newRoomRef = doc(collection(firestore, 'chat_rooms'));
    transaction.set(newRoomRef, newRoomData);
    return { id: newRoomRef.id, ...newRoomData };
  });
}

export async function sendMessage(firestore: ReturnType<typeof getFirestore>, roomId: string, senderId: string, senderType: 'user' | 'agent' | 'system', text: string, imageFile?: File) {
    const roomRef = doc(firestore, 'chat_rooms', roomId);
    const messagesRef = collection(roomRef, 'messages');
    
    let imageUrl: string | undefined = undefined;
    if (imageFile) {
        const storage = getStorage();
        const imagePath = `chat_images/${roomId}/${Date.now()}_${imageFile.name}`;
        const storageRef = ref(storage, imagePath);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
    }

    if (!text && !imageUrl) {
        // Don't send an empty message
        return;
    }

    const messageData: Partial<ChatMessage> = {
        roomId: roomId,
        senderId: senderId,
        senderType: senderType,
        timestamp: new Date().toISOString(),
        ...(text && { text: text }),
        ...(imageUrl && { imageUrl: imageUrl }),
    };
    
    await addDoc(messagesRef, messageData);
    
    // If agent sends a message, resolve it. If user sends, unresolve it.
    const isResolved = senderType !== 'user';
    
    await updateDoc(roomRef, {
        lastMessage: text || "Image",
        lastMessageAt: new Date().toISOString(),
        isResolved: isResolved
    });
}


export function listenToChatRooms(firestore: ReturnType<typeof getFirestore>, callback: (rooms: ChatRoom[]) => void): Unsubscribe {
    const roomsCollection = collection(firestore, 'chat_rooms');
    const q = query(roomsCollection, orderBy("lastMessageAt", "desc"));
    
    return onSnapshot(q, (snapshot) => {
        const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom));
        callback(rooms);
    });
}

export function listenToMessages(firestore: ReturnType<typeof getFirestore>, roomId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe {
    const messagesCollection = collection(firestore, 'chat_rooms', roomId, 'messages');
    const q = query(messagesCollection, orderBy("timestamp", "asc"));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
        callback(messages);
    });
}


// TASK SYSTEM FUNCTIONS
export function listenToAllTasks(firestore: ReturnType<typeof getFirestore>, callback: (tasks: Task[]) => void): Unsubscribe {
  const tasksCollection = collection(firestore, 'tasks');
  return onSnapshot(tasksCollection, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    callback(tasks);
  });
}

export async function addTask(firestore: ReturnType<typeof getFirestore>, task: Omit<Task, 'id'>): Promise<Task> {
  const tasksCollection = collection(firestore, 'tasks');
  const newDocRef = await addDoc(tasksCollection, task);
  return { ...task, id: newDocRef.id };
}

export async function updateTask(firestore: ReturnType<typeof getFirestore>, taskToUpdate: Task) {
  const taskRef = doc(firestore, 'tasks', taskToUpdate.id);
  const { id, ...taskData } = taskToUpdate;
  await setDoc(taskRef, taskData, { merge: true });
}

export async function deleteTask(firestore: ReturnType<typeof getFirestore>, taskId: string) {
  const taskRef = doc(firestore, 'tasks', taskId);
  await deleteDoc(taskRef);
}

// USER TASK PROGRESS FUNCTIONS
export function listenToUserTasks(firestore: ReturnType<typeof getFirestore>, userId: string, callback: (tasks: UserTask[]) => void): Unsubscribe {
  const userTasksCollection = collection(firestore, 'users', userId, 'user_tasks');
  return onSnapshot(userTasksCollection, (snapshot) => {
    const userTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserTask));
    callback(userTasks);
  });
}

export async function claimTaskReward(firestore: ReturnType<typeof getFirestore>, userId: string, userTaskId: string, rewardAmount: number) {
    return runTransaction(firestore, async (transaction) => {
        const userTaskRef = doc(firestore, 'users', userId, 'user_tasks', userTaskId);
        const userRef = doc(firestore, 'users', userId);

        const userTaskSnap = await transaction.get(userTaskRef);
        const userSnap = await transaction.get(userRef);

        if (!userTaskSnap.exists() || !userSnap.exists()) {
            throw new Error("User or Task not found!");
        }

        const userTask = userTaskSnap.data() as UserTask;
        if (!userTask.isCompleted || userTask.isClaimed) {
            throw new Error("Task not completed or reward already claimed.");
        }

        // Mark as claimed
        transaction.update(userTaskRef, { isClaimed: true });

        // Add reward to user balance
        const newBalance = userSnap.data().balance + rewardAmount;
        transaction.update(userRef, { balance: newBalance });

        // Create a transaction log for the reward
        const rewardTransaction: Omit<Transaction, 'id' | 'date'> = {
            userId: userId,
            userName: userSnap.data().displayName || 'Unknown',
            type: 'Commission', // Or a new 'Task Reward' type
            amount: rewardAmount,
            status: 'Completed',
            userRole: userSnap.data().role,
            details: `Reward for completing task: ${userTaskId}`
        };
         const newTransactionRef = doc(collection(firestore, 'transactions'));
        transaction.set(newTransactionRef, {...rewardTransaction, date: new Date().toISOString() });
    });
}


// PARTNER REQUEST FUNCTIONS
export function listenToPartnerRequests(firestore: ReturnType<typeof getFirestore>, callback: (requests: PartnerRequest[]) => void): Unsubscribe {
  const requestsCollection = collection(firestore, 'partner_requests');
  const q = query(requestsCollection, orderBy("requestDate", "desc"));
  
  return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartnerRequest));
      callback(requests);
  });
}

export async function updatePartnerRequestStatus(firestore: ReturnType<typeof getFirestore>, requestId: string, status: 'approved' | 'rejected') {
    return runTransaction(firestore, async (transaction) => {
        const requestRef = doc(firestore, 'partner_requests', requestId);
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists()) {
            throw new Error("Request not found!");
        }

        const requestData = requestSnap.data() as PartnerRequest;
        const userRef = doc(firestore, 'users', requestData.userId);
        
        transaction.update(requestRef, { status: status });

        if (status === 'approved') {
            transaction.update(userRef, { role: 'partner' });
        }
    });
}


export async function sendPartnerRequest(firestore: ReturnType<typeof getFirestore>, user: User) {
    // Check if a pending request already exists for this user
    const q = query(collection(firestore, "partner_requests"), where("userId", "==", user.uid), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error("You already have a pending partner request.");
    }
    
    const request: Omit<PartnerRequest, 'id' | 'requestDate'> = {
        userId: user.uid,
        userName: user.displayName || 'Unknown',
        userEmail: user.email || 'Unknown',
        status: 'pending'
    };
    await addDoc(collection(firestore, 'partner_requests'), {
        ...request,
        requestDate: new Date().toISOString()
    });
}

export { type ChatMessage };

    