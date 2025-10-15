
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
import type { User, InvestmentPlan, Transaction, AppSettings, Announcement, ChatAgent, ChatRoom, ChatMessage } from './data';

// USER FUNCTIONS
export async function getOrCreateUser(firestore: ReturnType<typeof getFirestore>, firebaseUser: FirebaseUser, intendedRole?: 'user' | 'partner'): Promise<User> {
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        
        // Also fetch agent data if it exists
        const agentRef = collection(firestore, 'chat_agents');
        const agentQuery = query(agentRef, where("email", "==", firebaseUser.email), limit(1));
        const agentSnap = await getDocs(agentQuery);
        
        if (!agentSnap.empty) {
            const agentData = agentSnap.docs[0].data();
            return { ...userData, ...agentData, id: agentSnap.docs[0].id, uid: userData.uid };
        }

        const updates: Partial<User> = {};
        if (userData.failedDepositCount === undefined) {
             updates.failedDepositCount = 0;
        }
         if (userData.totalDeposits === undefined) {
            updates.totalDeposits = 0;
        }
        if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
            return { ...userData, ...updates };
        }
        return userData;
    } else {
        const isAdmin = firebaseUser.email === 'salmankhaskheli885@gmail.com';
        
        const role = isAdmin ? 'admin' : intendedRole || 'user';

        let referredBy: string | undefined = undefined;
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const refId = urlParams.get('ref');
    
            if (refId) {
                 const referrerQuery = query(collection(firestore, "users"), where("shortUid", "==", refId), limit(1));
                 const referrerSnap = await getDocs(referrerQuery);
                 if (!referrerSnap.empty) {
                     referredBy = referrerSnap.docs[0].id;
                 }
            }
        } catch (e) {
            console.error("Could not parse URL for referral", e)
        }

        const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: role,
            shortUid: firebaseUser.uid.substring(0, 8),
            balance: 0,
            currency: 'USD',
            vipLevel: 1,
            vipProgress: 0,
            kycStatus: 'unsubmitted',
            referralLink: `https://fynix.pro/ref/${firebaseUser.uid.substring(0, 8)}`,
            status: 'Active',
            referredBy: referredBy,
            totalDeposits: 0,
            lastWithdrawalDate: undefined,
            failedDepositCount: 0,
        };
        await setDoc(userRef, newUser);
        
        // If the email is also in chat_agents, mark them as an agent
        const agentRef = collection(firestore, 'chat_agents');
        const agentQuery = query(agentRef, where("email", "==", firebaseUser.email), limit(1));
        const agentSnap = await getDocs(agentQuery);
        if (!agentSnap.empty) {
            await updateDoc(agentSnap.docs[0].ref, { uid: firebaseUser.uid, isActive: true });
        }


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
    } catch (error) {
        console.error("Error in background receipt upload:", error);
        // Optionally, update the transaction to a 'failed' state if upload is critical
    }
};

// New Round-Robin Assignment Logic
const assignAgent = async (firestore: ReturnType<typeof getFirestore>, permission: 'canApproveDeposits' | 'canApproveWithdrawals'): Promise<string | null> => {
    return await runTransaction(firestore, async (transaction) => {
        // 1. Get active agents with the required permission
        const agentsQuery = query(
            collection(firestore, 'chat_agents'),
            where(permission, '==', true),
            where('isActive', '==', true)
        );
        const agentsSnap = await getDocs(agentsQuery);
        const activeAgents = agentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ChatAgent)).filter(a => a.uid);

        if (activeAgents.length === 0) {
            return null; // No agents available
        }

        // 2. Get the current assignment index from app settings
        const settingsRef = doc(firestore, 'app', 'settings');
        const settingsSnap = await transaction.get(settingsRef);
        const settings = settingsSnap.data() as AppSettings;
        const lastIndex = settings.lastAssignedAgentIndex ?? -1;

        // 3. Determine the next agent (Round-Robin)
        const nextIndex = (lastIndex + 1) % activeAgents.length;
        const assignedAgent = activeAgents[nextIndex];

        // 4. Update the index in app settings for the next assignment
        transaction.update(settingsRef, { lastAssignedAgentIndex: nextIndex });

        return assignedAgent.uid!;
    });
};


export async function addTransaction(
  firestore: ReturnType<typeof getFirestore>,
  transactionData: Omit<Transaction, 'id' | 'date'> & { receiptFile?: File }
) {
    const { receiptFile, ...dataToSave } = transactionData;
    
    const transactionObject: Omit<Transaction, 'id'> = {
        ...dataToSave,
        date: new Date().toISOString(),
        status: dataToSave.status || 'Pending',
    };
    
    // Assign agent only for pending deposits and withdrawals
    if (transactionObject.status === 'Pending') {
        let permission: 'canApproveDeposits' | 'canApproveWithdrawals' | null = null;
        if (transactionObject.type === 'Deposit') {
            permission = 'canApproveDeposits';
        } else if (transactionObject.type === 'Withdrawal') {
            permission = 'canApproveWithdrawals';
        }

        if (permission) {
             transactionObject.assignedAgentId = await assignAgent(firestore, permission) || undefined;
        }
    }
    
    // Remove assignedAgentId if it's null or undefined to prevent Firestore errors
    if (transactionObject.assignedAgentId === null || transactionObject.assignedAgentId === undefined) {
        delete transactionObject.assignedAgentId;
    }
    
    const newTransactionRef = await addDoc(collection(firestore, 'transactions'), transactionObject);
    const fullTransaction = { ...transactionObject, id: newTransactionRef.id } as Transaction;

    if (transactionObject.status === 'Completed') {
         await updateTransactionStatus(firestore, newTransactionRef.id, 'Completed', fullTransaction);
    }

    if (dataToSave.type === 'Deposit' && receiptFile) {
        uploadReceiptAndUpdateTransaction(firestore, newTransactionRef.id, dataToSave.userId, receiptFile);
    }
}


async function handleInvestmentPayout(firestore: ReturnType<typeof getFirestore>, finalTransaction: Transaction) {
    if (finalTransaction.type !== 'Investment' || !finalTransaction.investmentDetails) {
        return;
    }

    const { maturityDate, investedAmount, dailyReturn, durationDays, planName } = finalTransaction.investmentDetails;
    const profit = investedAmount * (dailyReturn / 100) * durationDays;
    const payoutAmount = investedAmount + profit;

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

        let agentRef: any = null;
        if (txData.assignedAgentId) {
            const agentQuery = query(collection(firestore, 'chat_agents'), where('uid', '==', txData.assignedAgentId), limit(1));
            // You can't use getDocs in a transaction. We must assume the UID is unique and get the doc directly if we know its ID,
            // or query outside. For simplicity, we'll perform this read outside the main transaction logic if needed,
            // but for increment, it's better to get the ref first. We'll query outside for the ref.
        }

        let referrerSnap: any = null;
        if (user.referredBy) {
            const referrerRef = doc(firestore, 'users', user.referredBy);
            referrerSnap = await transaction.get(referrerRef);
        }


        // --- WRITES SECOND ---
        transaction.update(txRef, { status: newStatus });

        // Agent Performance Tracking
        if (txData.assignedAgentId) {
             const agentQuery = query(collection(firestore, 'chat_agents'), where('uid', '==', txData.assignedAgentId), limit(1));
             const agentDocs = await getDocs(agentQuery); // This is outside transaction, which is fine for getting the ref
             if (!agentDocs.empty) {
                const agentDocRef = agentDocs.docs[0].ref;
                let fieldToIncrement: string | null = null;
                if (txData.type === 'Deposit') {
                    fieldToIncrement = newStatus === 'Completed' ? 'depositsApproved' : 'depositsRejected';
                } else if (txData.type === 'Withdrawal') {
                    fieldToIncrement = newStatus === 'Completed' ? 'withdrawalsApproved' : 'withdrawalsRejected';
                }
                if (fieldToIncrement) {
                    transaction.update(agentDocRef, { [fieldToIncrement]: increment(1) });
                }
            }
        }
        
        if (newStatus !== 'Completed') {
            if (txData.type === 'Deposit') {
                const newFailedCount = (user.failedDepositCount || 0) + 1;
                const updates: Partial<User> = { failedDepositCount: newFailedCount };
                if (newFailedCount >= 5) updates.status = 'Suspended';
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

                if (user.referredBy && referrerSnap && referrerSnap.exists()) {
                    const referrer = referrerSnap.data() as User;
                    const referrerRef = doc(firestore, 'users', user.referredBy); // get ref again for writing
                    const commissionRate = referrer.role === 'partner' ? 0.10 : 0.05;
                    const commissionAmount = txData.amount * commissionRate;
                    transaction.update(referrerRef, { balance: referrer.balance + commissionAmount });

                    const commissionTxRef = doc(collection(firestore, 'transactions'));
                    transaction.set(commissionTxRef, {
                        userId: referrer.uid,
                        userName: referrer.displayName || 'N/A',
                        type: 'Commission',
                        amount: commissionAmount,
                        status: 'Completed',
                        date: new Date().toISOString(),
                        details: `From ${user.displayName}'s deposit`
                    });
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
                withdrawalFee: 2
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

export async function addChatAgent(firestore: ReturnType<typeof getFirestore>, agent: Omit<ChatAgent, 'id'>) {
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
export async function getOrCreateChatRoom(firestore: ReturnType<typeof getFirestore>, user: User): Promise<ChatRoom> {
    const roomsRef = collection(firestore, 'chat_rooms');
    const q = query(roomsRef, where("userId", "==", user.uid), limit(1));
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as ChatRoom;
    } else {
        const newRoomData: Omit<ChatRoom, 'id'> = {
            userId: user.uid,
            userName: user.displayName || "Unknown User",
            createdAt: new Date().toISOString(),
            lastMessage: "Chat started",
            lastMessageAt: new Date().toISOString(),
            isResolved: false
        };
        const newRoomRef = await addDoc(roomsRef, newRoomData);
        return { id: newRoomRef.id, ...newRoomData };
    }
}

export async function sendMessage(firestore: ReturnType<typeof getFirestore>, roomId: string, senderId: string, senderType: 'user' | 'agent' | 'system', text: string) {
    const roomRef = doc(firestore, 'chat_rooms', roomId);
    const messagesRef = collection(roomRef, 'messages');

    const messageData: Omit<ChatMessage, 'id'> = {
        roomId: roomId,
        senderId: senderId,
        senderType: senderType,
        text: text,
        timestamp: new Date().toISOString()
    };
    
    await addDoc(messagesRef, messageData);
    
    // If agent sends a message, resolve it. If user sends, unresolve it.
    const isResolved = senderType !== 'user';
    
    await updateDoc(roomRef, {
        lastMessage: text,
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


    
