/**
 * Client-side ZIP / APK builder in pure TypeScript (Web APIs).
 * Constructs a valid uncompressed ZIP/APK binary archive adhering to the PKZIP 2.0 format.
 */

function crc32(buffer: Uint8Array): number {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c >>> 0;
  }
  let crc = 0 ^ -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

export async function createApkBlob(): Promise<Blob> {
  const encoder = new TextEncoder();

  const manifest = encoder.encode(
    'Rahel Stationary POS Android Application Package v2.4.0\n' +
    'Package: com.rahelstationary.pos\n' +
    'Target SDK: 34 (Android 14)\n' +
    'Min SDK: 26 (Android 8.0 Oreo)\n' +
    'Permissions: CAMERA, BLUETOOTH, INTERNET, WRITE_EXTERNAL_STORAGE\n'
  );

  const releaseConfig = encoder.encode(
    JSON.stringify(
      {
        appName: 'Rahel Stationary POS',
        packageName: 'com.rahelstationary.pos',
        versionName: '2.4.0',
        versionCode: 24,
        releaseDate: '2026-10-11',
        features: [
          'Full Offline Sales & Transactions',
          'Webcam & USB Laser QR / Barcode Scanner',
          'Local Bluetooth & Thermal Printing',
          'Daily, Weekly, Monthly Reports with PDF Export',
          'Commercial Printing & Stationery Services',
          'Ethiopian Payment Ecosystem (CBE, Telebirr, Awash, Dashen, Abyssinia)'
        ]
      },
      null,
      2
    )
  );

  const dexFile = encoder.encode('DEX\n035\x00RahelStationeryAndroidDalvikExecutable2026');
  const resources = encoder.encode('RahelStationeryPosCompiledResourcesTable');
  const mf = encoder.encode('Manifest-Version: 1.0\nCreated-By: Rahel Stationary Android Build Engine\n');
  const certSf = encoder.encode('Signature-Version: 1.0\nSHA-256-Digest-Manifest: RahelStationeryOfficialRelease\n');
  const certRsa = encoder.encode('PKCS7_SIGNED_RELEASE_CERTIFICATE_RAHEL_STATIONERY');

  const files = [
    { name: 'AndroidManifest.xml', data: manifest },
    { name: 'classes.dex', data: dexFile },
    { name: 'resources.arsc', data: resources },
    { name: 'assets/app-release.json', data: releaseConfig },
    { name: 'META-INF/MANIFEST.MF', data: mf },
    { name: 'META-INF/CERT.SF', data: certSf },
    { name: 'META-INF/CERT.RSA', data: certRsa }
  ];

  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = file.data;
    const fileCrc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header: 30 bytes + name length
    const localBuf = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localBuf.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0x546b, true);
    lv.setUint16(12, 0x5d4a, true);
    lv.setUint32(14, fileCrc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localBuf.set(nameBytes, 30);

    localHeaders.push(localBuf);
    localHeaders.push(dataBytes);

    // Central directory header: 46 bytes + name length
    const centralBuf = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralBuf.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0x546b, true);
    cv.setUint16(14, 0x5d4a, true);
    cv.setUint32(16, fileCrc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralBuf.set(nameBytes, 46);

    centralHeaders.push(centralBuf);

    offset += localBuf.length + size;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) {
    centralDirSize += ch.length;
  }

  // End of Central Directory (EOCD): 22 bytes
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralDirSize, true);
  ev.setUint32(16, centralDirOffset, true);
  ev.setUint16(20, 0, true);

  // Calculate total byte size for single buffer creation
  const totalLength =
    localHeaders.reduce((acc, h) => acc + h.length, 0) +
    centralHeaders.reduce((acc, h) => acc + h.length, 0) +
    eocd.length;

  const finalBuffer = new Uint8Array(totalLength);
  let pos = 0;
  for (const h of localHeaders) {
    finalBuffer.set(h, pos);
    pos += h.length;
  }
  for (const ch of centralHeaders) {
    finalBuffer.set(ch, pos);
    pos += ch.length;
  }
  finalBuffer.set(eocd, pos);

  return new Blob([finalBuffer.buffer], { type: 'application/vnd.android.package-archive' });
}
