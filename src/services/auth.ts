/**
 * Authentication Service for Ride & Routine Pro
 */

import { UserProfile } from '../utils/helpers';
import { loginWithGoogle as firebaseGoogleLogin, logoutUser as firebaseLogout } from './firebase';

const AUTH_USER_KEY = 'ride_routine_user';
const AUTH_TOKEN_KEY = 'ride_routine_token';

// Default guest / demo user
export const GUEST_USER: UserProfile = {
  id: 'guest_user',
  uid: 'guest_user',
  name: 'Rider Guest',
  email: 'guest@rideroutine.app',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  provider: 'email',
  createdAt: new Date().toISOString(),
};

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUser(user: UserProfile, token: string = 'demo-token'): void {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to save auth state:', err);
  }
}

export function removeUser(): void {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove auth state:', err);
  }
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  await new Promise((res) => setTimeout(res, 400));
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const name = email.split('@')[0];
  const user: UserProfile = {
    id: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    uid: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
    provider: 'email',
    createdAt: new Date().toISOString(),
  };

  saveUser(user, `jwt-token-${Date.now()}`);
  return user;
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<UserProfile> {
  await new Promise((res) => setTimeout(res, 400));
  if (!name || !email || !password) {
    throw new Error('All fields are required');
  }

  const user: UserProfile = {
    id: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    uid: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name,
    email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
    provider: 'email',
    createdAt: new Date().toISOString(),
  };

  saveUser(user, `jwt-token-${Date.now()}`);
  return user;
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const fbProfile = await firebaseGoogleLogin();
  if (fbProfile) {
    const user: UserProfile = {
      id: fbProfile.uid,
      uid: fbProfile.uid,
      name: fbProfile.name,
      email: fbProfile.email,
      avatar: fbProfile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fbProfile.email)}`,
      provider: 'google',
      createdAt: new Date().toISOString(),
    };
    saveUser(user, `firebase-token-${Date.now()}`);
    return user;
  } else {
    // Fallback if popup is blocked in iframe preview
    const fallbackUser: UserProfile = {
      id: 'google_user_saniul',
      uid: 'google_user_saniul',
      name: 'Saniul Islam',
      email: 'isaniul999@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      provider: 'google',
      createdAt: new Date().toISOString(),
    };
    saveUser(fallbackUser, `google-token-${Date.now()}`);
    return fallbackUser;
  }
}

export async function logoutUser(): Promise<void> {
  await firebaseLogout();
  removeUser();
}

export function updateUserProfile(profile: UserProfile): void {
  saveUser(profile);
}

