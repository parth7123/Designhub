import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const LOCAL_STORAGE_DIR = path.join(process.cwd(), '.drive_storage');

// Ensure local fallback directory exists for dev/test environments
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

function getGoogleDriveClient() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  // Support Personal Gmail accounts via OAuth 2.0 Refresh Token
  if (clientId && clientSecret && refreshToken && !clientId.includes('example')) {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  // Support Service Accounts
  const clientEmail = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;

  if (!clientEmail || !privateKey || clientEmail.includes('example') || !privateKey.includes('BEGIN PRIVATE KEY')) {
    return null; // Fallback to secure local simulated storage
  }

  // Handle multiline private key format
  privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ],
  });

  return google.drive({ version: 'v3', auth });
}

export interface UploadResult {
  fileId: string;
  fileSizeBytes: number;
  mimeType: string;
}

/**
 * Silently uploads file buffer to hidden Google Drive account (or local fallback storage)
 */
export async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  const drive = getGoogleDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (drive && folderId) {
    try {
      const stream = Readable.from(buffer);
      const fileMetadata = {
        name: `${Date.now()}_${fileName}`,
        parents: [folderId],
      };

      const media = {
        mimeType: mimeType,
        body: stream,
      };

      const uploadPromise = drive.files.create({
        requestBody: fileMetadata,
        media: media,
        supportsAllDrives: true,
        fields: 'id, size',
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Google Drive upload timed out after 8s')), 8000)
      );

      const response: any = await Promise.race([uploadPromise, timeoutPromise]);

      if (!response?.data?.id) {
        throw new Error('Google Drive upload failed to return file ID');
      }

      return {
        fileId: response.data.id,
        fileSizeBytes: Number(response.data.size || buffer.length),
        mimeType,
      };
    } catch (error: any) {
      console.warn('Google Drive API timeout/error, switching immediately to local storage fallback:', error.message || error);
    }
  }

  // Local fallback storage logic (simulating Drive internal file IDs)
  const simulatedFileId = `drive_file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const filePath = path.join(LOCAL_STORAGE_DIR, simulatedFileId);
  await fs.promises.writeFile(filePath, buffer);

  return {
    fileId: simulatedFileId,
    fileSizeBytes: buffer.length,
    mimeType,
  };
}

/**
 * Streams file from hidden Google Drive (or local storage fallback) back to server proxy
 */
export async function streamFileFromDrive(fileId: string): Promise<{ stream: Readable; mimeType: string; size: number }> {
  const drive = getGoogleDriveClient();

  if (drive && !fileId.startsWith('drive_file_')) {
    try {
      const meta = await drive.files.get({ fileId, fields: 'mimeType, size' });
      const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

      return {
        stream: res.data as Readable,
        mimeType: meta.data.mimeType || 'application/octet-stream',
        size: Number(meta.data.size || 0),
      };
    } catch (error) {
      console.warn(`Drive fetch failed for ${fileId}, checking fallback:`, error);
    }
  }

  // Local fallback stream
  const filePath = path.join(LOCAL_STORAGE_DIR, fileId);
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found in storage');
  }

  const stat = await fs.promises.stat(filePath);
  const stream = fs.createReadStream(filePath);

  return {
    stream,
    mimeType: fileId.endsWith('.jpg') || fileId.endsWith('.png') ? 'image/jpeg' : 'application/zip',
    size: stat.size,
  };
}

/**
 * Permanently deletes file from Google Drive and/or local fallback disk storage
 */
export async function deleteFileFromDrive(fileId: string): Promise<boolean> {
  if (!fileId) return false;

  const drive = getGoogleDriveClient();

  // If stored in Google Drive
  if (drive && !fileId.startsWith('drive_file_')) {
    try {
      await drive.files.delete({ fileId, supportsAllDrives: true });
    } catch (err) {
      console.warn(`Drive file delete failed for ${fileId}:`, err);
    }
  }

  // Also remove from local disk storage if exists
  try {
    const filePath = path.join(LOCAL_STORAGE_DIR, fileId);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.warn(`Local file delete error for ${fileId}:`, err);
  }

  return true;
}


/**
 * Fetches Drive storage usage & quota metrics for Admin Monitoring
 */
export async function getDriveStorageQuota() {
  const drive = getGoogleDriveClient();

  if (drive) {
    try {
      // Add a 2.5s timeout promise so the entire UI doesn't hang if Google API is unreachable
      const quotaPromise = drive.about.get({ fields: 'storageQuota' });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Google Drive quota request timed out')), 2500)
      );

      const about: any = await Promise.race([quotaPromise, timeoutPromise]);
      const quota = about?.data?.storageQuota;
      if (quota) {
        const limit = Number(quota.limit || 15 * 1024 * 1024 * 1024);
        const usage = Number(quota.usage || 0);
        return {
          usedBytes: usage,
          totalBytes: limit,
          usedPercent: Math.round((usage / limit) * 100),
          isGoogleDrive: true,
        };
      }
    } catch (err: any) {
      console.warn('Quota check fallback:', err.message || err);
    }
  }

  // Calculate local storage folder usage
  let totalSize = 0;
  try {
    const files = await fs.promises.readdir(LOCAL_STORAGE_DIR);
    for (const f of files) {
      const stat = await fs.promises.stat(path.join(LOCAL_STORAGE_DIR, f));
      totalSize += stat.size;
    }
  } catch (err) {}

  const mockTotal = 15 * 1024 * 1024 * 1024; // 15 GB
  return {
    usedBytes: totalSize,
    totalBytes: mockTotal,
    usedPercent: Math.min(100, Math.round((totalSize / mockTotal) * 100)),
    isGoogleDrive: false,
  };
}
