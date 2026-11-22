package com.sungok2.armyaiacademy;

import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.Assert.*;

/**
 * True Android WebView end-to-end checks. No official education or security
 * accreditation is implied. Tests are executed on a running emulator.
 */
@RunWith(AndroidJUnit4.class)
public class LearningJourneyInstrumentedTest {
    private ActivityScenario<MainActivity> scenario;
    private WebView webView;

    @Before
    public void openApplication() throws Exception {
        scenario = ActivityScenario.launch(MainActivity.class);
        AtomicReference<WebView> ref = new AtomicReference<>();
        scenario.onActivity(a -> ref.set(findWebView(a.getWindow().getDecorView())));
        webView = ref.get();
        assertNotNull("MainActivity must own its offline WebView", webView);
        awaitPage();
    }

    @After
    public void closeApplication() {
        if (scenario != null) scenario.close();
    }

    private static WebView findWebView(View root) {
        if (root instanceof WebView) return (WebView) root;
        if (root instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) root;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView found = findWebView(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }

    private String js(String expression) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        androidx.test.platform.app.InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
            webView.evaluateJavascript(expression, s -> { result.set(s); latch.countDown(); })
        );
        assertTrue("WebView did not respond to JavaScript", latch.await(12, TimeUnit.SECONDS));
        // evaluateJavascript wraps strings in a JSON string literal.
        return new JSONArray("[" + result.get() + "]").getString(0);
    }

    private JSONObject state(String expression) throws Exception {
        String raw = js("(function() { return JSON.stringify(" + expression + "); })()");
        assertNotNull("WebView evaluation returned no result (possibly during navigation)", raw);
        assertFalse("WebView evaluation returned null (possibly mid-navigation)", "null".equals(raw));
        return new JSONObject(raw);
    }

    private void awaitPage() throws Exception {
        for (int i=0; i<60; i++) {
            String ready = js("String(Boolean(window.academyQA && document.querySelector('#home-next-lesson') && document.querySelector('.bottom-nav')))");
            if ("true".equals(ready)) return;
            Thread.sleep(250);
        }
        fail("Offline Academy application was not ready after opening the WebView");
    }

    @Test
    public void homeResumeAndAllSixNavigationScreensActuallyRender() throws Exception {
        JSONObject initial = state("({courseCount:window.academyQA.courseCount,nav:document.querySelectorAll('[data-view-target]').length,hasResume:Boolean(document.querySelector('#home-next-lesson [data-action=resume-lesson]')),bodyOverflow:document.documentElement.scrollWidth>window.innerWidth+2,tabLabels:[...document.querySelectorAll('[data-view-target]')].every(b=>b.innerText.trim().length>0),allTabsVisible:[...document.querySelectorAll('[data-view-target]')].every(b=>{const r=b.getBoundingClientRect();return r.width>=40 && r.left>=-1 && r.right<=window.innerWidth+1 && r.bottom<=window.innerHeight+1})})");
        assertEquals(42,initial.getInt("courseCount"));
        assertEquals(6,initial.getInt("nav"));
        assertTrue("Resume CTA should be populated on first launch",initial.getBoolean("hasResume"));
        assertFalse("Horizontal overflow on home view",initial.getBoolean("bodyOverflow"));
        assertTrue("Each navigation tab must have readable text",initial.getBoolean("tabLabels"));
        assertTrue("All six navigation taps must be inside visible screen",initial.getBoolean("allTabsVisible"));

        JSONObject pages = state("(()=>{let n=0;for(const t of ['home','schedule','courses','diagnostic','capstone','profile']){document.querySelector('[data-view-target='+t+']').click();const v=document.querySelector('#view-'+t);if(v && !v.hidden && document.querySelector('[data-view-target='+t+']').getAttribute('aria-current')==='page')n++;}return {visited:n,active:document.querySelectorAll('.bottom-nav [aria-current=page]').length}})()");
        assertEquals("All app routes should open with correct aria-current",6,pages.getInt("visited"));
        assertEquals(1,pages.getInt("active"));
        
        JSONObject lesson = state("(()=>{document.querySelector('[data-view-target=home]').click();document.querySelector('#home-next-lesson [data-action=resume-lesson]').click();return {dialog:document.querySelector('#course-dialog').open,header:document.querySelector('#course-detail h2')?.innerText||'',last:JSON.parse(localStorage.getItem('army_academy_rc3_local_v1')).lastLesson}})()");
        assertTrue("One-tap resume must open actual course dialog",lesson.getBoolean("dialog"));
        assertTrue("Actual lesson screen should contain a module heading",lesson.getString("header").length()>2);
        assertEquals("AT-001",lesson.getJSONObject("last").getString("course"));
        assertEquals(1,lesson.getJSONObject("last").getInt("module"));
    }

    @Test
    public void diagnosticAnswersArePersistedAcrossWebViewReload() throws Exception {
        JSONObject saved = state("(()=>{document.querySelector('[data-view-target=diagnostic]').click();const q=document.querySelector('.option[data-action=answer]');if(!q)return {valid:false};q.click();document.querySelector('[data-action=diag-next]').click();const o=JSON.parse(localStorage.getItem('army_academy_rc3_local_v1'));return {valid:true,answered:Object.keys(o.diagDrafts.AT.answers).length,index:o.diagDrafts.AT.index}})()");
        assertTrue(saved.getBoolean("valid"));
        assertEquals(1,saved.getInt("answered"));
        assertEquals(1,saved.getInt("index"));
        js("window.__academyE2EReloadMarker='OLD'; 'armed'");
        js("location.reload(); 'reloading'");
        // Wait until a DIFFERENT WebView document finishes loading. Older Android
        // WebView can report the previous document as ready before reload begins.
        boolean newDocumentReady = false;
        for (int i = 0; i < 80; i++) {
            try {
                String ready = js("String(Boolean(document.readyState==='complete' && window.academyQA && typeof window.__academyE2EReloadMarker==='undefined' && document.querySelector('#home-next-lesson')))");
                if ("true".equals(ready)) { newDocumentReady = true; break; }
            } catch (Exception ignored) {
                // Navigating WebView may temporarily return no JavaScript result.
            }
            Thread.sleep(250);
        }
        assertTrue("Android WebView did not finish loading a NEW page after reload", newDocumentReady);
        JSONObject resumed = state("(()=>{document.querySelector('[data-view-target=diagnostic]').click();const s=JSON.parse(localStorage.getItem('army_academy_rc3_local_v1'));return {index:s.diagDrafts.AT.index,answered:Object.keys(s.diagDrafts.AT.answers).length,second:document.querySelector('.diag-top')?.innerText.includes('02')||false}})()");
        assertEquals(1,resumed.getInt("index"));
        assertEquals(1,resumed.getInt("answered"));
        assertTrue("Second diagnostic question should render following WebView reload",resumed.getBoolean("second"));
    }

    @Test
    public void privacyExplanationAndLocalDataControlsAreAccessibleOffline() throws Exception {
        JSONObject result=state("(()=>{document.querySelector('#settings-open').click();const d=document.querySelector('#settings-dialog');const disclosure=d.querySelector('.privacy-inline');disclosure.open=true;return {dialog:d.open,summary:disclosure.querySelector('summary')?.innerText||'',containsDeletion:disclosure.innerText.includes('학습기록 삭제'),containsLocal:disclosure.innerText.includes('로컬 저장소'),deleteControl:Boolean(d.querySelector('[data-action=reset-progress]')),exportControl:Boolean(d.querySelector('[data-action=export-progress]'))}})()");
        assertTrue("Settings dialog should open",result.getBoolean("dialog"));
        assertTrue(result.getString("summary").contains("개인정보"));
        assertTrue(result.getBoolean("containsLocal"));
        assertTrue(result.getBoolean("containsDeletion"));
        assertTrue(result.getBoolean("deleteControl"));
        assertTrue(result.getBoolean("exportControl"));
    }

}
