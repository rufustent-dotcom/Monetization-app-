// Client services for Google Drive, Gmail, and Google Contacts (People API)

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export interface ContactItem {
  resourceName: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  photoUrl?: string;
}

/**
 * Fetch Google Drive files using client OAuth Bearer token
 */
export async function listDriveFiles(accessToken: string, pageSize: number = 15): Promise<DriveFileItem[]> {
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink)&orderBy=modifiedTime%20desc`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Google Drive files (Status: ${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Upload a text or agent note file to Google Drive with user confirmation
 */
export async function createDriveTextFile(
  accessToken: string,
  filename: string,
  content: string
): Promise<DriveFileItem> {
  const metadata = {
    name: filename,
    mimeType: "text/plain"
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([content], { type: "text/plain" }));

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: form
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create file in Google Drive (Status: ${res.status})`);
  }

  return await res.json();
}

/**
 * Delete a Drive file with mandatory confirmation
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete file from Google Drive`);
  }
  return true;
}

/**
 * Fetch Gmail messages list using client OAuth Bearer token
 */
export async function listGmailMessages(accessToken: string, maxResults: number = 10): Promise<GmailMessageItem[]> {
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
  const res = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Gmail messages (Status: ${res.status})`);
  }

  const listData = await res.json();
  const messagesSummary = listData.messages || [];

  // Fetch header snippets for each message in parallel
  const details = await Promise.all(
    messagesSummary.slice(0, 8).map(async (item: { id: string; threadId: string }) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        if (!detailRes.ok) return null;
        const detailData = await detailRes.json();
        const headers = detailData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
        const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
        const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";

        return {
          id: item.id,
          threadId: item.threadId,
          snippet: detailData.snippet || "",
          subject,
          from,
          date
        };
      } catch {
        return null;
      }
    })
  );

  return details.filter((m): m is GmailMessageItem => m !== null);
}

/**
 * Send an email via Gmail API with user confirmation
 */
export async function sendGmailMessage(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<{ id: string }> {
  // Construct RFC 2822 email format and base64url encode
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    bodyText
  ];
  const emailContent = emailLines.join("\r\n");
  const encoded = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw: encoded })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email via Gmail (Status: ${res.status})`);
  }

  return await res.json();
}

/**
 * Fetch Google Contacts via Google People API
 */
export async function listGoogleContacts(accessToken: string, pageSize: number = 20): Promise<ContactItem[]> {
  const url = `https://people.googleapis.com/v1/people/me/connections?pageSize=${pageSize}&personFields=names,emailAddresses,phoneNumbers,photos`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Google Contacts (Status: ${res.status})`);
  }

  const data = await res.json();
  const connections = data.connections || [];

  return connections.map((p: any) => {
    const name = p.names?.[0]?.displayName || "Unnamed Contact";
    const email = p.emailAddresses?.[0]?.value;
    const phone = p.phoneNumbers?.[0]?.value;
    const photoUrl = p.photos?.[0]?.url;

    return {
      resourceName: p.resourceName,
      displayName: name,
      email,
      phoneNumber: phone,
      photoUrl
    };
  });
}
