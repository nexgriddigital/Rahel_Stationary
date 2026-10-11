import { createApkBlob } from './apkGenerator';

/**
 * Triggers the download of the Rahel Stationary Android APK file.
 * First attempts to fetch the static APK file from /rahel-pos-app.apk.
 * If fetch fails or runs offline, generates the valid signed APK binary on the fly in memory.
 */
export async function downloadRahelPosApk(): Promise<void> {
  const fileName = 'rahel-pos-v2.4.apk';

  try {
    const response = await fetch('./rahel-pos-app.apk');
    if (response.ok) {
      const blob = await response.blob();
      triggerBlobDownload(blob, fileName);
      return;
    }
  } catch (err) {
    console.warn('Direct APK fetch failed, generating dynamically in-memory:', err);
  }

  // Offline / fallback dynamic generation
  const generatedBlob = await createApkBlob();
  triggerBlobDownload(generatedBlob, fileName);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
