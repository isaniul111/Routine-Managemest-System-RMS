import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocFromServer,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ActivityEntry, ExpenseEntry, MonthlyGoals, UserProfile, DayRoutine, NotificationSetting } from '../utils/helpers';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or unavailable.');
    }
  }
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<UserProfile | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      const u = result.user;
      const profile: UserProfile = {
        id: u.uid,
        uid: u.uid,
        name: u.displayName || 'Ride & Routine User',
        email: u.email || '',
        avatar: u.photoURL || undefined,
        photoURL: u.photoURL || undefined,
        provider: 'google',
        createdAt: new Date().toISOString(),
        dailyTarget: 8,
      };
      // Save user profile doc to firestore
      await setDoc(doc(db, 'users', u.uid), profile, { merge: true });
      return profile;
    }
  } catch (error) {
    console.error('Login error:', error);
  }
  return null;
}

export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Subscribe to Auth State
export function subscribeToAuth(onUserChanged: (u: UserProfile | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, async (u: User | null) => {
    if (u) {
      const userRef = doc(db, 'users', u.uid);
      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          onUserChanged(snap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            id: u.uid,
            uid: u.uid,
            name: u.displayName || 'Ride & Routine User',
            email: u.email || '',
            avatar: u.photoURL || undefined,
            photoURL: u.photoURL || undefined,
            provider: 'google',
            createdAt: new Date().toISOString(),
            dailyTarget: 8,
          };
          await setDoc(userRef, newProfile);
          onUserChanged(newProfile);
        }
      } catch (e) {
        onUserChanged({
          id: u.uid,
          uid: u.uid,
          name: u.displayName || 'User',
          email: u.email || '',
          avatar: u.photoURL || undefined,
          photoURL: u.photoURL || undefined,
          provider: 'google',
          createdAt: new Date().toISOString(),
          dailyTarget: 8,
        });
      }
    } else {
      onUserChanged(null);
    }
  });
}

// Real-time Firestore Listeners & Writers for Activities
export function listenToUserActivities(
  userId: string,
  onData: (entries: ActivityEntry[]) => void
): Unsubscribe {
  const colRef = collection(db, 'users', userId, 'activities');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ActivityEntry[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as ActivityEntry);
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/activities`);
    }
  );
}

export async function saveCloudActivity(userId: string, entry: ActivityEntry): Promise<void> {
  const path = `users/${userId}/activities/${entry.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'activities', entry.id), entry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudActivity(userId: string, entryId: string): Promise<void> {
  const path = `users/${userId}/activities/${entryId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'activities', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Real-time Firestore Listeners & Writers for Expenses
export function listenToUserExpenses(
  userId: string,
  onData: (expenses: ExpenseEntry[]) => void
): Unsubscribe {
  const colRef = collection(db, 'users', userId, 'expenses');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ExpenseEntry[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as ExpenseEntry);
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/expenses`);
    }
  );
}

export async function saveCloudExpense(userId: string, exp: ExpenseEntry): Promise<void> {
  const path = `users/${userId}/expenses/${exp.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'expenses', exp.id), exp);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudExpense(userId: string, expId: string): Promise<void> {
  const path = `users/${userId}/expenses/${expId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'expenses', expId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Real-time Firestore Listeners & Writers for Goals
export function listenToUserGoals(
  userId: string,
  onData: (goals: MonthlyGoals) => void
): Unsubscribe {
  const docRef = doc(db, 'users', userId, 'goals', 'monthly');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as MonthlyGoals);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/goals/monthly`);
    }
  );
}

export async function saveCloudGoals(userId: string, goals: MonthlyGoals): Promise<void> {
  const path = `users/${userId}/goals/monthly`;
  try {
    await setDoc(doc(db, 'users', userId, 'goals', 'monthly'), goals);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveCloudUserProfile(userId: string, profile: UserProfile): Promise<void> {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
