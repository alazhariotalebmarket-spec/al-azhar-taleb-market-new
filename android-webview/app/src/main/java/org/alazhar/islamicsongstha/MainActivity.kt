package org.alazhar.islamicsongstha

import android.annotation.SuppressLint
import android.app.Activity
import android.app.DownloadManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.view.View
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import java.io.File
import java.io.FileOutputStream
import java.net.URISyntaxException

class MainActivity : AppCompatActivity() {

    private val appUrl = "https://alazhar-app.vercel.app"
    private val appHost = "alazhar-app.vercel.app"

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var offlineView: LinearLayout
    private lateinit var retryButton: Button

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var hasMainFrameError = false

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = fileUploadCallback
        fileUploadCallback = null
        if (callback == null) return@registerForActivityResult

        if (result.resultCode == Activity.RESULT_OK) {
            val data = result.data
            val uris = mutableListOf<Uri>()
            val clipData = data?.clipData
            if (clipData != null && clipData.itemCount > 0) {
                for (i in 0 until clipData.itemCount) {
                    clipData.getItemAt(i).uri?.let { uris.add(it) }
                }
            } else {
                data?.data?.let { uris.add(it) }
            }
            callback.onReceiveValue(uris.toTypedArray())
        } else {
            callback.onReceiveValue(null)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        progressBar = findViewById(R.id.progressBar)
        offlineView = findViewById(R.id.offlineView)
        retryButton = findViewById(R.id.retryButton)

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            javaScriptCanOpenWindowsAutomatically = true
            setSupportMultipleWindows(true)
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            // Remove default "; wv" token so Google OAuth / Drive popups work reliably
            userAgentString = userAgentString.replace("; wv", "")
        }

        // Clear stale HTTP asset cache on launch so AI Studio -> Vercel deploys load immediately
        webView.clearCache(false)

        webView.addJavascriptInterface(BlobDownloadBridge(this), "AndroidBlobBridge")

        swipeRefresh.setColorSchemeColors(getColor(R.color.emerald_primary))
        swipeRefresh.setOnChildScrollUpCallback { _, _ -> webView.scrollY > 0 }
        swipeRefresh.setOnRefreshListener {
            hasMainFrameError = false
            webView.clearCache(false)
            webView.reload()
        }

        retryButton.setOnClickListener {
            hasMainFrameError = false
            offlineView.visibility = View.GONE
            webView.visibility = View.VISIBLE
            if (webView.url.isNullOrBlank()) {
                webView.loadUrl(appUrl)
            } else {
                webView.reload()
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val uri = request?.url ?: return false
                val url = uri.toString()
                val scheme = uri.scheme?.lowercase() ?: ""

                if (scheme == "tel" || scheme == "mailto") {
                    openExternalIntent(Intent(Intent.ACTION_VIEW, uri))
                    return true
                }

                if (scheme == "intent") {
                    try {
                        val parsed = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        if (parsed.resolveActivity(packageManager) != null) {
                            startActivity(parsed)
                        } else {
                            val fallbackUrl = parsed.getStringExtra("browser_fallback_url")
                            if (!fallbackUrl.isNullOrBlank()) {
                                openExternalIntent(Intent(Intent.ACTION_VIEW, Uri.parse(fallbackUrl)))
                            }
                        }
                    } catch (_: URISyntaxException) {
                    }
                    return true
                }

                val host = uri.host?.lowercase() ?: ""
                if (host == appHost || host.endsWith(".google.com") || host.endsWith(".googleapis.com")) {
                    return false
                }

                if (scheme == "http" || scheme == "https") {
                    openExternalIntent(Intent(Intent.ACTION_VIEW, uri))
                    return true
                }

                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                hasMainFrameError = false
                progressBar.visibility = View.VISIBLE
                offlineView.visibility = View.GONE
                webView.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                swipeRefresh.isRefreshing = false
                progressBar.visibility = View.GONE
                if (!hasMainFrameError) {
                    offlineView.visibility = View.GONE
                    webView.visibility = View.VISIBLE
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                if (request?.isForMainFrame == true) {
                    hasMainFrameError = true
                    swipeRefresh.isRefreshing = false
                    progressBar.visibility = View.GONE
                    webView.visibility = View.GONE
                    offlineView.visibility = View.VISIBLE
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress >= 100) {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback
                return try {
                    val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                    }
                    fileChooserLauncher.launch(intent)
                    true
                } catch (_: Exception) {
                    fileUploadCallback = null
                    false
                }
            }

            override fun onCreateWindow(
                view: WebView?,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: android.os.Message?
            ): Boolean {
                val hitTestResult = view?.hitTestResult
                val extraUrl = hitTestResult?.extra
                if (!extraUrl.isNullOrBlank()) {
                    openExternalIntent(Intent(Intent.ACTION_VIEW, Uri.parse(extraUrl)))
                    return false
                }
                val popupWebView = WebView(this@MainActivity).apply {
                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(
                            popup: WebView?,
                            request: WebResourceRequest?
                        ): Boolean {
                            val popupUri = request?.url ?: return false
                            openExternalIntent(Intent(Intent.ACTION_VIEW, popupUri))
                            return true
                        }
                    }
                }
                val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
                transport.webView = popupWebView
                resultMsg.sendToTarget()
                return true
            }
        }

        webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
            if (url.startsWith("blob:") || url.startsWith("data:")) {
                val safeName = URLUtil.guessFileName(url, contentDisposition, mimeType)
                val safeMime = mimeType ?: "application/octet-stream"
                val js = """
                    (async function() {
                      try {
                        const res = await fetch("$url");
                        const blob = await res.blob();
                        const reader = new FileReader();
                        reader.onloadend = function() {
                          if (window.AndroidBlobBridge && reader.result) {
                            window.AndroidBlobBridge.saveBase64File(reader.result, "$safeName", "$safeMime");
                          }
                        };
                        reader.readAsDataURL(blob);
                      } catch (e) {}
                    })();
                """.trimIndent()
                webView.evaluateJavascript(js, null)
                return@setDownloadListener
            }

            try {
                val fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
                val request = DownloadManager.Request(Uri.parse(url)).apply {
                    setMimeType(mimeType)
                    addRequestHeader("User-Agent", userAgent)
                    val cookie = CookieManager.getInstance().getCookie(url)
                    if (!cookie.isNullOrBlank()) {
                        addRequestHeader("Cookie", cookie)
                    }
                    setTitle(fileName)
                    setDescription("ফাইল ডাউনলোড হচ্ছে...")
                    setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                }
                val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                dm.enqueue(request)
                Toast.makeText(this, "ডাউনলোড শুরু হয়েছে: $fileName", Toast.LENGTH_SHORT).show()
            } catch (_: Exception) {
                openExternalIntent(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        if (savedInstanceState == null) {
            webView.loadUrl(appUrl)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    private fun openExternalIntent(intent: Intent) {
        try {
            startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(this, "লিংকটি খোলার জন্য উপযুক্ত অ্যাপ পাওয়া যায়নি", Toast.LENGTH_SHORT).show()
        }
    }

    private class BlobDownloadBridge(private val context: Context) {
        @JavascriptInterface
        fun saveBase64File(dataUrl: String, fileName: String, mimeType: String) {
            try {
                val commaIdx = dataUrl.indexOf(',')
                val base64Part = if (commaIdx >= 0) dataUrl.substring(commaIdx + 1) else dataUrl
                val bytes = Base64.decode(base64Part, Base64.DEFAULT)
                val cleanName = fileName.replace(Regex("[^a-zA-Z0-9._-]"), "_")

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val values = ContentValues().apply {
                        put(MediaStore.Downloads.DISPLAY_NAME, cleanName)
                        put(MediaStore.Downloads.MIME_TYPE, mimeType)
                        put(MediaStore.Downloads.IS_PENDING, 1)
                    }
                    val resolver = context.contentResolver
                    val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values) ?: return
                    resolver.openOutputStream(uri)?.use { it.write(bytes) }
                    values.clear()
                    values.put(MediaStore.Downloads.IS_PENDING, 0)
                    resolver.update(uri, values, null, null)
                } else {
                    val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                    if (!downloadsDir.exists()) downloadsDir.mkdirs()
                    val outFile = File(downloadsDir, cleanName)
                    FileOutputStream(outFile).use { it.write(bytes) }
                }

                (context as? Activity)?.runOnUiThread {
                    Toast.makeText(context, "ডাউনলোড সম্পন্ন হয়েছে: $cleanName", Toast.LENGTH_SHORT).show()
                }
            } catch (_: Exception) {
            }
        }
    }
}
