import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { 
  signInWithGoogle, 
  signOutUser, 
  getCachedAccessToken, 
  setCachedAccessToken, 
  initAuth 
} from "../lib/firebase";
import { 
  listDriveFiles, 
  createDriveTextFile, 
  deleteDriveFile, 
  listGmailMessages, 
  sendGmailMessage, 
  listGoogleContacts,
  DriveFileItem,
  GmailMessageItem,
  ContactItem
} from "../lib/workspace";
import { 
  HardDrive, 
  Mail, 
  Users, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Send, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Search
} from "lucide-react";

export default function GoogleWorkspaceDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getCachedAccessToken());
  const [activeTab, setActiveTab] = useState<"drive" | "gmail" | "contacts">("drive");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [newFileName, setNewFileName] = useState("Agent-Workflow-Notes.txt");
  const [newFileContent, setNewFileContent] = useState("AI Agent execution notes generated from the marketplace workspace.\nCreated on: " + new Date().toLocaleString());
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);

  // Gmail state
  const [messages, setMessages] = useState<GmailMessageItem[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Contacts state
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [contactSearch, setContactSearch] = useState("");

  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setCurrentUser(user);
        if (token) setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await signInWithGoogle();
      setCurrentUser(res.user);
      if (res.accessToken) {
        setAccessToken(res.accessToken);
        setCachedAccessToken(res.accessToken);
        setSuccessMsg(`Authenticated as ${res.user.email}`);
        // Fetch initial tab data
        loadTabData(activeTab, res.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setAccessToken(null);
    setDriveFiles([]);
    setMessages([]);
    setContacts([]);
  };

  const loadTabData = async (tab: "drive" | "gmail" | "contacts", tokenToUse?: string) => {
    const token = tokenToUse || accessToken;
    if (!token) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (tab === "drive") {
        const files = await listDriveFiles(token);
        setDriveFiles(files);
      } else if (tab === "gmail") {
        const msgs = await listGmailMessages(token);
        setMessages(msgs);
      } else if (tab === "contacts") {
        const cts = await listGoogleContacts(token);
        setContacts(cts);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load Google Workspace data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: "drive" | "gmail" | "contacts") => {
    setActiveTab(tab);
    if (accessToken) {
      loadTabData(tab, accessToken);
    }
  };

  // Safe file upload to Google Drive with user confirmation dialog
  const handleConfirmCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const created = await createDriveTextFile(accessToken, newFileName, newFileContent);
      setSuccessMsg(`File "${created.name}" created in Google Drive!`);
      setShowCreateFileModal(false);
      await loadTabData("drive", accessToken);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not save file to Drive.");
    } finally {
      setIsLoading(false);
    }
  };

  // Safe file deletion with mandatory confirmation dialog
  const handleConfirmDeleteFile = async () => {
    if (!accessToken || !fileToDelete) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await deleteDriveFile(accessToken, fileToDelete.id);
      setSuccessMsg(`Deleted "${fileToDelete.name}" from Google Drive.`);
      setFileToDelete(null);
      await loadTabData("drive", accessToken);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not delete file from Drive.");
    } finally {
      setIsLoading(false);
    }
  };

  // Send email via Gmail API with mandatory confirmation dialog
  const handleConfirmSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await sendGmailMessage(accessToken, emailTo, emailSubject, emailBody);
      setSuccessMsg(`Email successfully sent to ${emailTo}!`);
      setShowSendModal(false);
      setEmailTo("");
      setEmailSubject("");
      setEmailBody("");
      await loadTabData("gmail", accessToken);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not send email via Gmail.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.displayName.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Google Workspace Suite
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono text-xs">
                OAuth 2.0 Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Direct live access to your <strong>Google Drive</strong>, <strong>Gmail</strong>, and <strong>Google Contacts</strong> with end-to-end OAuth tokens and strict mutation confirmation guards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && accessToken ? (
              <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block">{currentUser.email}</span>
                  <span className="text-[9px] text-emerald-400 font-semibold uppercase">Token Active</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                Sign in with Google
              </button>
            )}
          </div>
        </div>

        {/* Status and Feedback Alerts */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-800/70 rounded-lg flex items-center gap-2 text-xs text-red-300 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-950/50 border border-emerald-800/70 rounded-lg flex items-center justify-between text-xs text-emerald-300 font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange("drive")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "drive"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
            }`}
          >
            <HardDrive className="h-3.5 w-3.5" />
            Google Drive
            {driveFiles.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-200 text-[10px]">
                {driveFiles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("gmail")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "gmail"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Gmail Inbox
            {messages.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-200 text-[10px]">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("contacts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "contacts"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Google Contacts
            {contacts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-200 text-[10px]">
                {contacts.length}
              </span>
            )}
          </button>
        </div>

        {accessToken && (
          <button
            onClick={() => loadTabData(activeTab, accessToken)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        )}
      </div>

      {/* Main Tab Views */}
      {!accessToken ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="p-4 bg-indigo-950/60 border border-indigo-900/60 rounded-2xl mb-4 text-indigo-400">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Google Authentication Required</h3>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            Connect your Google account with OAuth to interact with your real <strong>Google Drive files</strong>, browse your <strong>Gmail messages</strong>, or look up your <strong>Google Contacts</strong>.
          </p>
          <button
            onClick={handleSignIn}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg transition cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            Sign in with Google
          </button>
        </div>
      ) : (
        <div>
          {/* TAB 1: GOOGLE DRIVE */}
          {activeTab === "drive" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-mono">
                  Live Drive Documents & Files ({driveFiles.length} retrieved)
                </p>
                <button
                  onClick={() => setShowCreateFileModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Save Agent File to Drive
                </button>
              </div>

              {driveFiles.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No files found in Google Drive, or click "Sync" to refresh.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="h-5 w-5 text-indigo-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-semibold text-white block truncate" title={file.name}>
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block truncate">
                              {file.mimeType.split("/").pop()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setFileToDelete(file)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                          title="Delete File from Drive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : ""}</span>
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                          >
                            <span>Open</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GMAIL INBOX */}
          {activeTab === "gmail" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-mono">
                  Recent Gmail Threads & Messages ({messages.length})
                </p>
                <button
                  onClick={() => setShowSendModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  Compose & Send Email
                </button>
              </div>

              {messages.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No Gmail messages loaded yet. Click "Sync" to retrieve messages.
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">{msg.subject}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
                              {msg.from}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {msg.snippet}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {msg.date ? new Date(msg.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GOOGLE CONTACTS */}
          {activeTab === "contacts" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {filteredContacts.length} Contacts Synced
                </p>
              </div>

              {filteredContacts.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No contacts found matching your query.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredContacts.map((ct) => (
                    <div
                      key={ct.resourceName}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3"
                    >
                      {ct.photoUrl ? (
                        <img
                          src={ct.photoUrl}
                          alt={ct.displayName}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-indigo-950 border border-indigo-900 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                          {ct.displayName[0]?.toUpperCase() || "C"}
                        </div>
                      )}
                      <div className="truncate">
                        <span className="text-xs font-semibold text-white block truncate">{ct.displayName}</span>
                        {ct.email && (
                          <span className="text-[10px] text-slate-400 font-mono block truncate">{ct.email}</span>
                        )}
                        {ct.phoneNumber && (
                          <span className="text-[10px] text-slate-500 font-mono block">{ct.phoneNumber}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: CREATE FILE CONFIRMATION (MANDATORY GUARD) */}
      {/* ==================================================== */}
      {showCreateFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-indigo-400" />
                Upload New Document to Google Drive
              </h3>
              <button
                onClick={() => setShowCreateFileModal(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleConfirmCreateFile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Filename</label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold">File Content</label>
                <textarea
                  required
                  rows={5}
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg flex items-center gap-2 text-xxs text-amber-300 font-mono">
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" />
                <span>Explicit User Confirmation: Clicking "Confirm Upload" will save this file directly to your authenticated Google Drive.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFileModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow cursor-pointer disabled:opacity-50"
                >
                  Confirm Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: DELETE FILE CONFIRMATION (MANDATORY GUARD) */}
      {/* ==================================================== */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-red-900/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-950 text-red-400 border border-red-900">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirm File Deletion</h3>
                <p className="text-xxs text-slate-400 font-mono">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete <strong className="text-white">"{fileToDelete.name}"</strong> from your Google Drive account?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteFile}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow cursor-pointer disabled:opacity-50"
              >
                Yes, Delete File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: SEND EMAIL CONFIRMATION (MANDATORY GUARD) */}
      {/* ==================================================== */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-indigo-400" />
                Compose & Send Email via Gmail
              </h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleConfirmSendEmail} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Recipient Email</label>
                <input
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Subject title..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Email Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your email body..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg flex items-center gap-2 text-xxs text-amber-300 font-mono">
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" />
                <span>Explicit User Confirmation: Clicking "Send Email" will dispatch this message from your Gmail account ({currentUser?.email}).</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow cursor-pointer disabled:opacity-50"
                >
                  Confirm & Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
