package com.arena.voice

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.PowerManager
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.view.Gravity
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.util.*

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {
    private lateinit var webView: WebView
    private lateinit var speechRecognizer: SpeechRecognizer
    private lateinit var tts: TextToSpeech
    private lateinit var micButton: ImageButton
    private var isListening = false
    private var wakeLock: PowerManager.WakeLock? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), 100)
        }
        
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.SCREEN_DIM_WAKE_LOCK, "ArenaVoice::WakeLock")
        
        val layout = FrameLayout(this)
        webView = WebView(this)
        
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
        }
        
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }
        
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()
        webView.addJavascriptInterface(VoiceBridge(), "ArenaVoice")
        
        layout.addView(webView)
        
        micButton = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_btn_speak_now)
            alpha = 0.9f
            setOnClickListener { toggleVoice() }
        }
        
        val btnSize = (72 * resources.displayMetrics.density).toInt()
        val params = FrameLayout.LayoutParams(btnSize, btnSize, Gravity.BOTTOM or Gravity.END).apply {
            bottomMargin = (100 * resources.displayMetrics.density).toInt()
            rightMargin = (24 * resources.displayMetrics.density).toInt()
        }
        layout.addView(micButton, params)
        setContentView(layout)
        
        webView.loadUrl("https://arena.ai")
        tts = TextToSpeech(this, this)
        setupSpeechRecognizer()
    }

    private fun setupSpeechRecognizer() {
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
        speechRecognizer.setRecognitionListener(object : RecognitionListener {
            override fun onResults(results: Bundle?) {
                results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()?.let {
                    injectText(it)
                }
                finishListening()
            }
            override fun onReadyForSpeech(p: Bundle?) { 
                isListening = true
                micButton.setColorFilter(0xFFFF4444.toInt())
                wakeLock?.acquire(600000)
            }
            override fun onEndOfSpeech() { finishListening() }
            override fun onError(e: Int) { finishListening() }
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(b: ByteArray?) {}
            override fun onPartialResults(p: Bundle?) {}
            override fun onEvent(e: Int, p: Bundle?) {}
        })
    }
    
    private fun finishListening() {
        isListening = false
        micButton.clearColorFilter()
        if (wakeLock?.isHeld == true) wakeLock?.release()
    }

    private fun toggleVoice() {
        if (isListening) speechRecognizer.stopListening()
        else {
            val intent = android.content.Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR")
            }
            speechRecognizer.startListening(intent)
        }
    }

    private fun injectText(text: String) {
        val safeText = text.replace("\\", "\\\\").replace("'", "\\'")
        val js = """
            (function(){
                const el = document.querySelector('textarea, [contenteditable=true]');
                if(el){
                    el.focus();
                    if(el.tagName==='TEXTAREA') el.value='$safeText';
                    else el.textContent='$safeText';
                    el.dispatchEvent(new Event('input',{bubbles:true}));
                    setTimeout(()=>{document.querySelector('button[type=submit]')?.click()},300);
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js, null)
        Toast.makeText(this, "전송: $text", Toast.LENGTH_SHORT).show()
    }

    inner class VoiceBridge {
        @JavascriptInterface
        fun onResponse(text: String) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) tts.language = Locale.KOREAN
    }
}
