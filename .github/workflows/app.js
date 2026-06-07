// Arena Voice - Galaxy S20 optimized
const $ = s => document.querySelector(s);
const messagesEl = $('#messages');
const welcomeEl = $('#welcome');
const micBtn = $('#micBtn');
const textInput = $('#textInput');
const sendBtn = $('#sendBtn');
const statusEl = $('#status');

let recognition = null;
let isListening = false;
let conversation = JSON.parse(localStorage.getItem('arena_conversation') || '[]');
let settings = JSON.parse(localStorage.getItem('arena_settings') || '{}');

// Init settings
$('#apiKey').value = settings.apiKey || '';
$('#apiEndpoint').value = settings.apiEndpoint || 'https://api.starsarena.com';
$('#voiceLang').value = settings.voiceLang || 'ko-KR';
$('#autoSpeak').checked = settings.autoSpeak !== false;
$('#continuous').checked = settings.continuous || false;

function saveSettings() {
  settings = {
    apiKey: $('#apiKey').value,
    apiEndpoint: $('#apiEndpoint').value,
    voiceLang: $('#voiceLang').value,
    autoSpeak: $('#autoSpeak').checked,
    continuous: $('#continuous').checked
  };
  localStorage.setItem('arena_settings', JSON.stringify(settings));
}

// Load history
function renderHistory() {
  messagesEl.innerHTML = '';
  if (conversation.length > 0) welcomeEl.style.display = 'none';
  conversation.forEach(m => addMessage(m.role, m.content, false));
}
renderHistory();

// Speech Recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = settings.voiceLang || 'ko-KR';

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    statusEl.textContent = '듣고 있어요...';
  };
  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    statusEl.textContent = '준비됨';
    if (settings.continuous && !isListening) {
      setTimeout(() => startListening(), 500);
    }
  };
  recognition.onerror = (e) => {
    statusEl.textContent = '오류: ' + e.error;
  };
  recognition.onresult = (e) => {
    let transcript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    textInput.value = transcript;
    if (e.results[e.results.length-1].isFinal) {
      sendMessage(transcript);
    }
  };
} else {
  statusEl.textContent = '음성 인식을 지원하지 않는 브라우저입니다';
  micBtn.disabled = true;
}

function startListening() {
  if (!recognition) return;
  recognition.lang = $('#voiceLang').value;
  recognition.continuous = $('#continuous').checked;
  try { recognition.start(); } catch {}
}

micBtn.onclick = () => {
  if (isListening) {
    recognition.stop();
  } else {
    textInput.value = '';
    startListening();
  }
};

function addMessage(role, content, save=true) {
  welcomeEl.style.display = 'none';
  const div = document.createElement('div');
  div.className = 'message ' + (role === 'user' ? 'user' : 'assistant');
  div.innerHTML = `<div>${content.replace(/\n/g,'<br>')}</div><div class="time">${new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</div>`;
  messagesEl.appendChild(div);
  messagesEl.parentElement.scrollTop = messagesEl.parentElement.scrollHeight;
  
  if (save) {
    conversation.push({role, content, ts: Date.now()});
    localStorage.setItem('arena_conversation', JSON.stringify(conversation.slice(-100)));
  }
  
  if (role === 'assistant' && $('#autoSpeak').checked) {
    speak(content);
  }
}

// TTS
let voices = [];
function loadVoices() { voices = speechSynthesis.getVoices(); }
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speak(text) {
  speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  const lang = $('#voiceLang').value;
  utt.lang = lang;
  const voice = voices.find(v => v.lang === lang && v.name.includes('Google')) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
  if (voice) utt.voice = voice;
  utt.rate = 1.0;
  speechSynthesis.speak(utt);
}

async function sendMessage(text) {
  if (!text.trim()) return;
  textInput.value = '';
  addMessage('user', text);
  statusEl.textContent = '생각 중...';
  
  try {
    const reply = await callArenaAPI(text);
    addMessage('assistant', reply);
    statusEl.textContent = '준비됨';
  } catch (e) {
    addMessage('assistant', '오류가 발생했습니다: ' + e.message + '\n\n설정에서 API 키를 확인하거나, Arena 웹사이트를 직접 사용해보세요.');
    statusEl.textContent = '오류';
  }
}

async function callArenaAPI(userText) {
  const apiKey = $('#apiKey').value;
  const endpoint = $('#apiEndpoint').value;
  
  // If no API key, use local demo mode that guides to real Arena
  if (!apiKey) {
    // Simulate Arena Agent Mode response
    await new Promise(r => setTimeout(r, 800));
    return `음성 입력을 받았습니다: "${userText}"\n\n현재 데모 모드입니다. 실제 Arena Agent Mode를 사용하려면:\n1. 오른쪽 위 ⚙️ 설정 열기\n2. Arena API 키 입력 (ak_live_...)\n3. 또는 arena.ai를 브라우저에서 열고 이 앱으로 음성 입력 후 복사-붙여넣기\n\n갤럭시 S20에서는 Chrome에서 arena.ai를 열고, 이 앱의 마이크로 받아쓴 텍스트를 붙여넣으면 완벽하게 작동합니다.`;
  }

  // Try Arena-compatible chat
  // Note: Arena.social API doesn't have LLM chat, so we fallback to OpenAI-compatible
  try {
    const res = await fetch(endpoint.replace(/\/$/,'') + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        model: 'arena-agent',
        messages: [
          {role: 'system', content: 'You are Arena Agent Mode, helpful Korean AI assistant. Respond concisely and naturally for voice.'},
          ...conversation.slice(-10).map(m => ({role: m.role, content: m.content})),
          {role: 'user', content: userText}
        ],
        temperature: 0.7
      })
    });
    if (!res.ok) throw new Error('API ' + res.status);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || JSON.stringify(data);
  } catch (e) {
    // Fallback: try arena.social endpoint
    throw e;
  }
}

sendBtn.onclick = () => sendMessage(textInput.value);
textInput.onkeydown = e => { if (e.key === 'Enter') sendMessage(textInput.value); };

// Settings
$('#settingsBtn').onclick = () => $('#settings').classList.remove('hidden');
$('#closeSettings').onclick = () => { saveSettings(); $('#settings').classList.add('hidden'); };
$('#clearHistory').onclick = () => {
  if (confirm('모든 대화 기록을 삭제할까요?')) {
    conversation = [];
    localStorage.removeItem('arena_conversation');
    messagesEl.innerHTML = '';
    welcomeEl.style.display = 'block';
  }
};

// PWA install
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Keep screen awake on Galaxy S20
let wakeLock = null;
async function requestWakeLock() {
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch {}
}
document.addEventListener('visibilitychange', () => { if (wakeLock && document.visibilityState === 'visible') requestWakeLock(); });
micBtn.addEventListener('click', requestWakeLock);

// Auto-focus for DeX/desktop
if (window.innerWidth > 768) textInput.focus();