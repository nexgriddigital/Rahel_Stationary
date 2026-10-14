#!/usr/bin/env bash
set -e

echo "=== Building Genuine Android APK for Rahel Stationary ==="

PROJECT_DIR="/app/applet"
WORK_DIR="/tmp/rahel_apk_build"
ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
DX_TOOL="/usr/bin/dalvik-exchange"

if [ ! -f "$ANDROID_JAR" ]; then
  echo "Error: android.jar not found at $ANDROID_JAR"
  exit 1
fi

rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR/src/com/rahel/stationary"
mkdir -p "$WORK_DIR/res/values"
mkdir -p "$WORK_DIR/res/drawable"
mkdir -p "$WORK_DIR/res/mipmap-mdpi"
mkdir -p "$WORK_DIR/res/mipmap-hdpi"
mkdir -p "$WORK_DIR/res/mipmap-xhdpi"
mkdir -p "$WORK_DIR/res/mipmap-xxhdpi"
mkdir -p "$WORK_DIR/res/mipmap-xxxhdpi"
mkdir -p "$WORK_DIR/assets"
mkdir -p "$WORK_DIR/bin"
mkdir -p "$WORK_DIR/obj"

# 1. Launcher icons
if [ -f "$PROJECT_DIR/public/apple-touch-icon.png" ]; then
  cp "$PROJECT_DIR/public/apple-touch-icon.png" "$WORK_DIR/res/drawable/ic_launcher.png"
  cp "$PROJECT_DIR/public/apple-touch-icon.png" "$WORK_DIR/res/mipmap-mdpi/ic_launcher.png"
  cp "$PROJECT_DIR/public/apple-touch-icon.png" "$WORK_DIR/res/mipmap-hdpi/ic_launcher.png"
  cp "$PROJECT_DIR/public/apple-touch-icon.png" "$WORK_DIR/res/mipmap-xhdpi/ic_launcher.png"
  cp "$PROJECT_DIR/public/apple-touch-icon.png" "$WORK_DIR/res/mipmap-xxhdpi/ic_launcher.png"
  cp "$PROJECT_DIR/public/apple-touch-icon.png" "$WORK_DIR/res/mipmap-xxxhdpi/ic_launcher.png"
fi

# 2. String resources
cat << 'EOF' > "$WORK_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Rahel Stationary</string>
    <string name="app_description">Retail POS, Barcode Studio &amp; Store Management System</string>
</resources>
EOF

# 3. Android Manifest with broad compatibility (minSdk 21, targetSdk 33)
cat << 'EOF' > "$WORK_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.rahel.stationary"
    android:versionCode="101"
    android:versionName="1.1.0">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="33" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <uses-feature
        android:name="android.hardware.camera"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.camera.autofocus"
        android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">

        <activity
            android:name="com.rahel.stationary.MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|screenSize|smallestScreenSize|screenLayout"
            android:windowSoftInputMode="adjustResize"
            android:label="@string/app_name">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 4. Java Activity Source Code
cat << 'EOF' > "$WORK_DIR/src/com/rahel/stationary/MainActivity.java"
package com.rahel.stationary;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.net.Uri;
import android.content.Intent;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.graphics.Color;

public class MainActivity extends Activity {
    private WebView webView;
    private ProgressBar progressBar;
    private ValueCallback<Uri[]> filePathCallback;
    private final static int FILECHOOSER_RESULTCODE = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(Color.parseColor("#0a0a0c"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#0a0a0c"));
        rootLayout.addView(webView, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setProgress(0);
        progressBar.setVisibility(View.GONE);
        FrameLayout.LayoutParams pbParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 8
        );
        rootLayout.addView(progressBar, pbParams);

        setContentView(rootLayout);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            settings.setMediaPlaybackRequiresUserGesture(false);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception ignored) {}
                }
                view.loadUrl(url);
                return true;
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                String errorHtml = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                    + "<style>body{background:#0a0a0c;color:#f4efe8;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;padding:24px;text-align:center;}"
                    + "h1{color:#d4af37;font-size:22px;margin-bottom:8px;}"
                    + "p{color:#a89f91;font-size:14px;line-height:1.5;margin-bottom:24px;}"
                    + "button{background:linear-gradient(135deg,#f5d77f,#aa8010);color:#0a0a0c;border:none;padding:12px 28px;border-radius:12px;font-weight:bold;font-size:15px;cursor:pointer;}"
                    + "</style></head><body>"
                    + "<h1>Rahel Stationary Workstation</h1>"
                    + "<p>Connecting to store server...</p>"
                    + "<button onclick='window.location.reload()'>Retry Connection</button>"
                    + "</body></html>";
                view.loadDataWithBaseURL(null, errorHtml, "text/html", "utf-8", null);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                startActivityForResult(Intent.createChooser(intent, "Select File / Scan Image"), FILECHOOSER_RESULTCODE);
                return true;
            }
        });

        webView.loadUrl("http://127.0.0.1:3000/");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (filePathCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
EOF

# 5. Compile resources with aapt
echo "Compiling resources with aapt..."
aapt package -f -m \
  -J "$WORK_DIR/src" \
  -M "$WORK_DIR/AndroidManifest.xml" \
  -S "$WORK_DIR/res" \
  -I "$ANDROID_JAR" \
  -F "$WORK_DIR/bin/resources.ap_"

# 6. Compile Java source files to class files with javac targeting Java 8
echo "Compiling Java sources..."
javac -encoding UTF-8 \
  -source 1.8 -target 1.8 \
  -cp "$ANDROID_JAR" \
  -d "$WORK_DIR/obj" \
  "$WORK_DIR/src/com/rahel/stationary/MainActivity.java" \
  "$WORK_DIR/src/com/rahel/stationary/R.java"

# 7. Convert class files to Dalvik bytecode (classes.dex) with dalvik-exchange
echo "Converting to classes.dex with dalvik-exchange..."
"$DX_TOOL" --dex --output="$WORK_DIR/bin/classes.dex" "$WORK_DIR/obj"

# 8. Add classes.dex and assets into unaligned APK
echo "Packaging APK..."
cp "$WORK_DIR/bin/resources.ap_" "$WORK_DIR/bin/app-unaligned.apk"
cd "$WORK_DIR/bin"
aapt add "app-unaligned.apk" "classes.dex"

# 9. Align APK with zipalign (4-byte boundary for memory mapping on Android devices)
echo "Aligning APK with zipalign..."
zipalign -v -p 4 "$WORK_DIR/bin/app-unaligned.apk" "$WORK_DIR/bin/app-aligned.apk"

# 10. Generate release signing keystore if not exists
KEYSTORE="$WORK_DIR/rahel-release.keystore"
keytool -genkeypair -v \
  -keystore "$KEYSTORE" \
  -alias rahel_stationary_release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "RahelStationary2026!" \
  -keypass "RahelStationary2026!" \
  -dname "CN=Rahel Fira, OU=IT Department, O=Rahel Stationary Store, L=Addis Ababa, ST=Addis Ababa, C=ET"

# 11. Sign APK using apksigner (v1 + v2 + v3 scheme)
echo "Signing APK with apksigner..."
mkdir -p "$PROJECT_DIR/public/downloads"
TARGET_APK="$PROJECT_DIR/public/downloads/rahel-stationary.apk"
TARGET_APK_ROOT="$PROJECT_DIR/public/rahel-stationary.apk"
TARGET_APK_LEGACY="$PROJECT_DIR/public/rahel-pos-app.apk"

apksigner sign \
  --ks "$KEYSTORE" \
  --ks-key-alias rahel_stationary_release \
  --ks-pass "pass:RahelStationary2026!" \
  --key-pass "pass:RahelStationary2026!" \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --v3-signing-enabled true \
  --out "$TARGET_APK" \
  "$WORK_DIR/bin/app-aligned.apk"

# Also replicate to root and legacy filenames so every link works
cp "$TARGET_APK" "$TARGET_APK_ROOT"
cp "$TARGET_APK" "$TARGET_APK_LEGACY"

echo "=== Verifying Generated APK ==="
apksigner verify --verbose "$TARGET_APK"
echo "=== AAPT Badging Details ==="
aapt dump badging "$TARGET_APK" | head -n 15

echo "=== APK Built and Verified Successfully ==="
ls -lh "$TARGET_APK"
