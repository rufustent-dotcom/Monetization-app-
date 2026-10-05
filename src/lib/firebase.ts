import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App instance safely (singleton)
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || undefined);

// Workspace OAuth Scopes requested by the user
export const WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/contacts",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile"
];

// Google Auth Provider with Workspace Scopes configured
export const googleProvider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});
googleProvider.setCustomParameters({
  prompt: "consent",
  access_type: "offline"
});

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Test connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "_system", "connection_check"));
    return true;
  } catch (err: any) {
    if (err?.message?.includes("the client is offline")) {
      console.warn("Firestore client is in offline mode.");
      return false;
    }
    // Any other response (like permission-denied or document-not-found) confirms connectivity
    return true;
  }
}

// Subscribe to Firebase Auth state
export function initAuth(
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
}

// Google Sign-In via popup with OAuth Workspace Token capture
export async function signInWithGoogle(): Promise<{ user: User; accessToken: string | null }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return {
      user: result.user,
      accessToken: cachedAccessToken
    };
  } catch (err) {
    console.error("Google Sign-In error:", err);
    throw err;
  } finally {
    isSigningIn = false;
  }
}

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

export async function signOutUser() {
  await signOut(auth);
  cachedAccessToken = null;
}
