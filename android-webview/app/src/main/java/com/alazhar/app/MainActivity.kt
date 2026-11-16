package com.alazhar.app

import android.annotation.SuppressLint
import android.app.Activity
import android.app.DownloadManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.util.Base64
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.RenderProcessGoneDetail
import android.webkit.SslErrorHandler
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import java.io.File
import java.io.FileOutputStream
import java.net.URISyntaxException

class MainActivity : AppCompatActivity() {

    private val appUrl = "https://alazhar-app.vercel.app"
    private val appHost = "alazhar-app.vercel.app"

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var loadingView: LinearLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var offlineView: LinearLayout
    private lateinit var offlineTitle: TextView
    private lateinit var offlineSubtitle: TextView
    private lateinit var retryButton: Button

    private val mainHandler = Handler(Looper.getMainLooper())
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var hasMainFrameError = false
    private var hasEverFinishedLoad = false
    private var loadTimeoutRunnable: Runnable? = null
    private var mountCheckRunnable: Runnable? = null

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

        if (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        loadingView = findViewById(R.id.loadingView)
        progressBar = findViewById(R.id.progressBar)
        offlineView = findViewById(R.id.offlineView)
        offlineTitle = findViewById(R.id.offlineTitle)
        offlineSubtitle = findViewById(R.id.offlineSubtitle)
        retryButton = findViewById(R.id.retryButton)

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.setBackgroundColor(ContextCompat.getColor(this, R.color.surface_bg))
        webView.isFocusable = true
        webView.isFocusableInTouchMode = true

        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            loadsImagesAutomatically = true
            blockNetworkImage = false
            javaScriptCanOpenWindowsAutomatically = true
            setSupportMultipleWindows(true)
            loadWithOverviewMode = true
            useWideViewPort = true
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            if (userAgentString.contains("; wv")) {
                userAgentString = userAgentString.replace("; wv", "")
            }
        }

        webView.addJavascriptInterface(BlobDownloadBridge(this), "AndroidBlobBridge")

        swipeRefresh.setColorSchemeColors(ContextCompat.getColor(this, R.color.emerald_primary))
        swipeRefresh.setOnChildScrollUpCallback { _, _ -> webView.scrollY > 0 }
        swipeRefresh.setOnRefreshListener {
            if (!isNetworkAvailable()) {
                swipeRefresh.isRefreshing = false
                showErrorView(
                    getString(R.string.offline_title),
                    getString(R.string.offline_subtitle)
                )
                return@setOnRefreshListener
            }
            hasMainFrameError = false
            webView.clearCache(false)
            if (webView.url.isNullOrBlank()) {
                webView.loadUrl(appUrl)
            } else {
                webView.reload()
            }
        }

        retryButton.setOnClickListener {
            reloadPage(clearCache = true)
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

                if (scheme == "about" || scheme == "data" || scheme == "blob") {
                    return false
                }

                if (!request.isForMainFrame) {
                    return false
                }

                val host = uri.host?.lowercase() ?: ""
                if (isAllowedInAppHost(host)) {
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
                cancelPendingLoadChecks()
                scheduleLoadTimeout()
                progressBar.visibility = View.VISIBLE
                offlineView.visibility = View.GONE
                webView.visibility = View.VISIBLE
                if (!hasEverFinishedLoad) {
                    loadingView.visibility = View.VISIBLE
                }
            }

            override fun onPageCommitVisible(view: WebView?, url: String?) {
                if (!hasMainFrameError) {
                    webView.visibility = View.VISIBLE
                    if (url != null && !url.contains(appHost)) {
                        loadingView.visibility = View.GONE
                    }
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                swipeRefresh.isRefreshing = false
                progressBar.visibility = View.GONE
                if (hasMainFrameError) return

                offlineView.visibility = View.GONE
                webView.visibility = View.VISIBLE

                if (url != null && url.contains(appHost)) {
                    verifySpaMountedAndReveal(0)
                } else {
                    cancelPendingLoadChecks()
                    hasEverFinishedLoad = true
                    loadingView.visibility = View.GONE
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                if (request?.isForMainFrame == true) {
                    val title = if (isNetworkAvailable()) {
                        getString(R.string.load_error_title)
                    } else {
                        getString(R.string.offline_title)
                    }
                    val subtitle = if (isNetworkAvailable()) {
                        getString(R.string.load_error_subtitle)
                    } else {
                        getString(R.string.offline_subtitle)
                    }
                    showErrorView(title, subtitle)
                }
            }

            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                errorResponse: WebResourceResponse?
            ) {
                if (request?.isForMainFrame == true && (errorResponse?.statusCode ?: 0) >= 400) {
                    showErrorView(
                        getString(R.string.load_error_title),
                        getString(R.string.load_error_subtitle)
                    )
                }
            }

            override fun onReceivedSslError(
                view: WebView?,
                handler: SslErrorHandler?,
                error: SslError?
            ) {
                handler?.cancel()
                showErrorView(
                    getString(R.string.load_error_title),
                    getString(R.string.ssl_error_subtitle)
                )
            }

            override fun onRenderProcessGone(
                view: WebView?,
                detail: RenderProcessGoneDetail?
            ): Boolean {
                cancelPendingLoadChecks()
                swipeRefresh.isRefreshing = false
                showErrorView(
                    getString(R.string.load_error_title),
                    getString(R.string.load_error_subtitle)
                )
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress >= 100) {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                return false
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
                val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
                val popupWebView = WebView(this@MainActivity).apply {
                    settings.javaScriptEnabled = true
                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(
                            popup: WebView?,
                            request: WebResourceRequest?
                        ): Boolean {
                            val popupUri = request?.url ?: return false
                            openExternalIntent(Intent(Intent.ACTION_VIEW, popupUri))
                            mainHandler.post { popup?.destroy() }
                            return true
                        }
                    }
                }
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

        val restored = savedInstanceState != null && webView.restoreState(savedInstanceState) != null
        if (!restored || webView.url.isNullOrBlank()) {
            loadInitialPage()
        } else {
            hasEverFinishedLoad = true
            loadingView.visibility = View.GONE
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        CookieManager.getInstance().flush()
        super.onPause()
    }

    override fun onDestroy() {
        cancelPendingLoadChecks()
        webView.destroy()
        super.onDestroy()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    private fun isAllowedInAppHost(host: String): Boolean {
        return host == appHost ||
            host.endsWith(".$appHost") ||
            host.endsWith(".vercel.app") ||
            host.endsWith(".firebaseapp.com") ||
            host.endsWith(".web.app") ||
            host.endsWith(".google.com") ||
            host.endsWith(".googleapis.com") ||
            host.endsWith(".gstatic.com") ||
            host.endsWith(".googleusercontent.com")
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val network = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun loadInitialPage() {
        if (!isNetworkAvailable()) {
            showErrorView(
                getString(R.string.offline_title),
                getString(R.string.offline_subtitle)
            )
            return
        }
        hasMainFrameError = false
        offlineView.visibility = View.GONE
        loadingView.visibility = View.VISIBLE
        webView.visibility = View.VISIBLE
        webView.loadUrl(appUrl)
    }

    private fun reloadPage(clearCache: Boolean) {
        if (!isNetworkAvailable()) {
            showErrorView(
                getString(R.string.offline_title),
                getString(R.string.offline_subtitle)
            )
            return
        }
        hasMainFrameError = false
        hasEverFinishedLoad = false
        offlineView.visibility = View.GONE
        loadingView.visibility = View.VISIBLE
        webView.visibility = View.VISIBLE
        if (clearCache) {
            webView.clearCache(false)
        }
        if (webView.url.isNullOrBlank()) {
            webView.loadUrl(appUrl)
        } else {
            webView.reload()
        }
    }

    private fun showErrorView(title: String, subtitle: String) {
        hasMainFrameError = true
        cancelPendingLoadChecks()
        swipeRefresh.isRefreshing = false
        progressBar.visibility = View.GONE
        loadingView.visibility = View.GONE
        webView.visibility = View.GONE
        offlineTitle.text = title
        offlineSubtitle.text = subtitle
        offlineView.visibility = View.VISIBLE
    }

    private fun scheduleLoadTimeout() {
        loadTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        val runnable = Runnable {
            if (!hasEverFinishedLoad && !hasMainFrameError && loadingView.visibility == View.VISIBLE) {
                showErrorView(
                    getString(R.string.load_error_title),
                    getString(R.string.load_error_subtitle)
                )
            }
        }
        loadTimeoutRunnable = runnable
        mainHandler.postDelayed(runnable, 30_000L)
    }

    private fun verifySpaMountedAndReveal(attempt: Int) {
        if (hasMainFrameError) return
        webView.evaluateJavascript(
            "(function(){var r=document.getElementById('root');var t=document.body?document.body.innerText.trim():'';return ((r&&r.children&&r.children.length>0)||t.length>0)?'1':'0';})();"
        ) { result ->
            if (hasMainFrameError) return@evaluateJavascript
            val mounted = result?.contains("1") == true
            if (mounted) {
                cancelPendingLoadChecks()
                hasEverFinishedLoad = true
                loadingView.visibility = View.GONE
                offlineView.visibility = View.GONE
                webView.visibility = View.VISIBLE
            } else if (attempt < 30) {
                val nextCheck = Runnable { verifySpaMountedAndReveal(attempt + 1) }
                mountCheckRunnable = nextCheck
                mainHandler.postDelayed(nextCheck, 500L)
            } else {
                showErrorView(
                    getString(R.string.load_error_title),
                    getString(R.string.load_error_subtitle)
                )
            }
        }
    }

    private fun cancelPendingLoadChecks() {
        loadTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        loadTimeoutRunnable = null
        mountCheckRunnable?.let { mainHandler.removeCallbacks(it) }
        mountCheckRunnable = null
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
