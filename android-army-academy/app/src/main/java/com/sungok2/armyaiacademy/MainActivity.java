package com.sungok2.armyaiacademy;

import android.content.Intent;
import android.content.ContentResolver;
import android.content.ActivityNotFoundException;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.widget.FrameLayout;

import androidx.webkit.WebViewAssetLoader;
import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import org.json.JSONObject;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

public class MainActivity extends ComponentActivity {
    private static final int EXPORT_REQUEST = 1207;
    private static final int IMPORT_REQUEST = 1208;
    private static final String LOCAL_HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + LOCAL_HOST + "/assets/index.html";

    private WebView webView;
    private String pendingJson;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(android.graphics.Color.rgb(8, 19, 33));
        getWindow().setNavigationBarColor(android.graphics.Color.rgb(8, 19, 33));

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebView.setWebContentsDebuggingEnabled(false);
        webView = new WebView(this);
        webView.setBackgroundColor(android.graphics.Color.rgb(8, 19, 33));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);

        android.webkit.CookieManager.getInstance().setAcceptCookie(false);
        android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);
        settings.setGeolocationEnabled(false);
        webView.addJavascriptInterface(new ExportBridge(), "ArmyNative");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            private boolean trusted(Uri uri) {
                return uri != null && "https".equals(uri.getScheme())
                        && LOCAL_HOST.equals(uri.getHost())
                        && uri.getPath() != null
                        && uri.getPath().startsWith("/assets/");
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !trusted(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !trusted(Uri.parse(url));
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(
                    WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (trusted(uri)) {
                    return loader.shouldInterceptRequest(uri);
                }
                return new WebResourceResponse(
                        "text/plain", "UTF-8", 403, "Blocked",
                        Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
        });

        final FrameLayout container = new FrameLayout(this);
        container.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        if (Build.VERSION.SDK_INT >= 35) {
            container.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                FrameLayout.LayoutParams params =
                        (FrameLayout.LayoutParams) webView.getLayoutParams();
                params.setMargins(bars.left, bars.top, bars.right, bars.bottom);
                webView.setLayoutParams(params);
                return insets;
            });
        }
        setContentView(container);
        if (Build.VERSION.SDK_INT >= 35) container.requestApplyInsets();
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView == null) {
                    finish();
                    return;
                }
                webView.evaluateJavascript(
                    "window.handleAndroidBack ? window.handleAndroidBack() : false;",
                    handled -> {
                        if (!"true".equals(handled)) {
                            finish();
                        }
                    }
                );
            }
        });
        webView.loadUrl(START_URL);
    }

    private final class ExportBridge {
        @JavascriptInterface
        public void importJson() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES,
                        new String[] {"application/json", "text/plain", "application/octet-stream"});
                try {
                    startActivityForResult(intent, IMPORT_REQUEST);
                } catch (ActivityNotFoundException ex) {
                    Toast.makeText(MainActivity.this, "파일 선택기를 사용할 수 없습니다.", Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public void saveJson(String fileName, String json) {
            if (json == null || json.length() > 2_000_000) {
                runOnUiThread(() -> Toast.makeText(
                        MainActivity.this, "내보내기 데이터가 유효하지 않습니다.",
                        Toast.LENGTH_LONG).show());
                return;
            }
            final String safe = fileName == null ? "academy_export.json"
                    : fileName.replaceAll("[^A-Za-z0-9._-]", "_");
            runOnUiThread(() -> {
                pendingJson = json;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, safe.isEmpty() ? "academy_export.json" : safe);
                startActivityForResult(intent, EXPORT_REQUEST);
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == IMPORT_REQUEST) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null
                    && webView != null) {
                try (InputStream in = getContentResolver().openInputStream(data.getData());
                     ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                    if (in == null) throw new IOException("Cannot open document");
                    byte[] chunk = new byte[8192];
                    int n, total = 0;
                    while ((n = in.read(chunk)) != -1) {
                        total += n;
                        if (total > 2_000_000) throw new IOException("Backup file exceeds 2MB");
                        out.write(chunk, 0, n);
                    }
                    String contents = new String(out.toByteArray(), StandardCharsets.UTF_8);
                    webView.evaluateJavascript(
                            "window.importAcademyBackup(" + JSONObject.quote(contents) + ");",
                            null);
                } catch (Exception ex) {
                    Toast.makeText(this, "기록 복원 파일을 읽지 못했습니다.", Toast.LENGTH_LONG).show();
                }
            }
            return;
        }
        if (requestCode != EXPORT_REQUEST) return;
        if (resultCode == RESULT_OK && data != null && data.getData() != null
                && pendingJson != null) {
            try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                if (out == null) throw new IllegalStateException("No output stream");
                out.write(pendingJson.getBytes(StandardCharsets.UTF_8));
                Toast.makeText(this, "JSON 저장 완료", Toast.LENGTH_SHORT).show();
            } catch (Exception ex) {
                Toast.makeText(this, "파일 저장 실패", Toast.LENGTH_LONG).show();
            }
        }
        pendingJson = null;
    }



    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("ArmyNative");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
