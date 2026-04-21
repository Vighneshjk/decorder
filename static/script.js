'use strict';

// ── Tab Management ────────────────────────
function switchTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active', 'aria-selected'));
  document.getElementById(`tab-btn-${tabId}`).classList.add('active');
  document.getElementById(`tab-btn-${tabId}`).setAttribute('aria-selected', 'true');

  document.querySelectorAll('.tab-pane').forEach(p => p.hidden = true);
  document.getElementById(`tab-content-${tabId}`).hidden = false;
  
  // Clear outputs
  document.querySelectorAll('.output-box').forEach(clearOutputBox);
}

// ── Shared UI Helpers ──────────────────────
function clearOutputBox(box) {
  box.innerHTML = '<span class="output-placeholder">Result here…</span>';
  box.classList.remove('has-result');
  const err = box.nextElementSibling;
  if(err) err.textContent = '';
  const timeId = box.id.replace('out-', 'time-');
  const timeEl = document.getElementById(timeId);
  if(timeEl) timeEl.textContent = '';
}

function showResultRaw(boxId, htmlContent, timeMs) {
  const box = document.getElementById(boxId);
  box.innerHTML = htmlContent;
  box.classList.add('has-result');
  if (box.nextElementSibling) box.nextElementSibling.textContent = '';
  if (timeMs !== undefined) {
    document.getElementById(boxId.replace('out-', 'time-')).textContent = `(⏱ ${timeMs}ms)`;
  }
}

function showResult(boxId, text, timeMs) {
  const box = document.getElementById(boxId);
  box.innerHTML = `<span class="output-text">${escapeHtml(text)}</span>`;
  box.classList.add('has-result');
  if (box.nextElementSibling) box.nextElementSibling.textContent = '';
  if (timeMs !== undefined) {
    const charCount = text.length;
    const byteCount = new Blob([text]).size;
    document.getElementById(boxId.replace('out-', 'time-')).textContent = `(${charCount} chars | ${byteCount} bytes | ⏱ ${timeMs}ms)`;
  }
}

function showError(boxId, msg) {
  const box = document.getElementById(boxId);
  box.innerHTML = '<span class="output-placeholder">Result here…</span>';
  box.classList.remove('has-result');
  if (box.nextElementSibling) box.nextElementSibling.textContent = '⚠ ' + msg;
  const timeEl = document.getElementById(boxId.replace('out-', 'time-'));
  if (timeEl) timeEl.textContent = '';
}

function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function copyOutput(boxId, btn) {
  const box = document.getElementById(boxId);
  const textContent = box.innerText;
  if (!textContent || box.querySelector('.output-placeholder')) return;
  try {
    await navigator.clipboard.writeText(textContent.replace("Result here…", ""));
    showCopyFeedback(btn);
  } catch (err) { }
}

async function copyInput(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input.value) return;
  try {
    await navigator.clipboard.writeText(input.value);
    showCopyFeedback(btn);
  } catch (err) { }
}

function showCopyFeedback(btn) {
  const oldText = btn.textContent;
  btn.textContent = 'Copied!';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = oldText;
    btn.classList.remove('copied');
  }, 2000);
}

function updateInputStats(inputId, countId) {
  const el = document.getElementById(inputId);
  if (el) {
    document.getElementById(countId).textContent = `${el.value.length} chars`;
  }
}

// ── 1. A1Z26 Cipher Logic ────────────────────
let a1z26Mode = 'decode';
function setA1Z26Mode(mode) {
  a1z26Mode = mode;
  document.getElementById('btn-a1z26-encode').classList.toggle('active', mode === 'encode');
  document.getElementById('btn-a1z26-decode').classList.toggle('active', mode === 'decode');
  
  if (mode === 'encode') {
    document.getElementById('a1z26-mode-desc').textContent = 'Convert plain text into A1Z26 numbers.';
    document.getElementById('label-a1z26-input').textContent = 'Your Message';
    document.getElementById('input-a1z26').placeholder = 'Type your message here… (e.g. HELLO WORLD)';
    document.getElementById('label-a1z26-action').textContent = 'Encode Message';
  } else {
    document.getElementById('a1z26-mode-desc').textContent = 'Decode a number cipher back into readable text.';
    document.getElementById('label-a1z26-input').textContent = 'Cipher Numbers';
    document.getElementById('input-a1z26').placeholder = 'Enter cipher numbers… (e.g. 8-5-12-12-15)';
    document.getElementById('label-a1z26-action').textContent = 'Decode Cipher';
  }
  clearOutputBox(document.getElementById('out-a1z26'));
  updateInputStats('input-a1z26', 'count-a1z26');
}

async function runA1Z26() {
  const raw = document.getElementById('input-a1z26').value.trim();
  if (!raw) return showError('out-a1z26', 'Please enter something first.');
  const endpoint = a1z26Mode === 'encode' ? '/api/encode' : '/api/decode';
  const body = a1z26Mode === 'encode' ? { text: raw } : { cipher: raw };
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) showError('out-a1z26', data.error);
    else showResult('out-a1z26', data.result, data.time_ms);
  } catch { showError('out-a1z26', 'Network error.'); }
}

function loadA1Z26Example(text, mode) {
  setA1Z26Mode(mode);
  document.getElementById('input-a1z26').value = text;
  updateInputStats('input-a1z26', 'count-a1z26');
  runA1Z26();
}

function buildCipherTable() {
  const table = document.getElementById('cipher-table');
  if(!table) return;
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    const num = i + 1;
    const cell = document.createElement('div');
    cell.className = 'cipher-cell';
    cell.innerHTML = `<span class="cell-letter">${letter}</span><span class="cell-sep">=</span><span class="cell-num">${num}</span>`;
    cell.addEventListener('click', () => {
      const inp = document.getElementById('input-a1z26');
      inp.value += a1z26Mode === 'encode' ? letter : (inp.value ? `-${num}` : `${num}`);
      updateInputStats('input-a1z26', 'count-a1z26');
    });
    table.appendChild(cell);
  }
}
function toggleRef() {
  const body = document.getElementById('ref-body');
  const btn = document.getElementById('ref-toggle');
  body.hidden = !body.hidden;
  btn.setAttribute('aria-expanded', !body.hidden);
}

// ── 2. CAESAR CIPHER ─────────────────────────
let caesarMode = 'encode';
function setCaesarMode(mode) {
  caesarMode = mode;
  document.getElementById('btn-caesar-encrypt').classList.toggle('active', mode === 'encode');
  document.getElementById('btn-caesar-decrypt').classList.toggle('active', mode === 'decode');
  
  if (mode === 'encode') {
    document.getElementById('caesar-mode-desc').textContent = 'Encrypt a message by shifting its letters.';
    document.getElementById('label-caesar-input').textContent = 'Your Message';
    document.getElementById('input-caesar-text').placeholder = 'Enter message to encrypt…';
    document.getElementById('label-caesar-action').textContent = 'Encrypt Message';
  } else {
    document.getElementById('caesar-mode-desc').textContent = 'Decrypt a message using its shift number.';
    document.getElementById('label-caesar-input').textContent = 'Encrypted Ciphertext';
    document.getElementById('input-caesar-text').placeholder = 'Enter encrypted text…';
    document.getElementById('label-caesar-action').textContent = 'Decrypt Cipher';
  }
  clearOutputBox(document.getElementById('out-caesar'));
}

async function runCaesar() {
  const raw = document.getElementById('input-caesar-text').value.trim();
  const shiftText = document.getElementById('input-caesar-shift').value;
  if (!raw) return showError('out-caesar', 'Please enter something first.');
  if (shiftText === '') return showError('out-caesar', 'Please provide a shift number.');
  const shift = parseInt(shiftText, 10);
  
  const endpoint = caesarMode === 'encode' ? '/caesar/encode' : '/caesar/decode';
  const body = caesarMode === 'encode' ? { text: raw, shift } : { cipher: raw, shift };
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) showError('out-caesar', data.error);
    else showResult('out-caesar', data.result, data.time_ms);
  } catch { showError('out-caesar', 'Network error.'); }
}

function loadCaesarExample(text, shift, mode) {
  setCaesarMode(mode);
  document.getElementById('input-caesar-text').value = text;
  document.getElementById('input-caesar-shift').value = shift;
  updateInputStats('input-caesar-text', 'count-caesar');
  runCaesar();
}

// ── 3. MORSE CODE ────────────────────────────
let morseMode = 'encode';
function setMorseMode(mode) {
  morseMode = mode;
  document.getElementById('btn-morse-encode').classList.toggle('active', mode === 'encode');
  document.getElementById('btn-morse-decode').classList.toggle('active', mode === 'decode');
  
  if (mode === 'encode') {
    document.getElementById('morse-mode-desc').textContent = 'Convert plain text into Morse code dots and dashes.';
    document.getElementById('label-morse-input').textContent = 'Your Message';
    document.getElementById('input-morse-text').placeholder = 'Enter message… (e.g. HELLO)';
    document.getElementById('label-morse-action').textContent = 'Convert to Morse';
  } else {
    document.getElementById('morse-mode-desc').textContent = 'Decode Morse code back into readable text.';
    document.getElementById('label-morse-input').textContent = 'Morse Code';
    document.getElementById('input-morse-text').placeholder = 'Enter Morse code… (e.g. .... . .-.. .-.. ---)';
    document.getElementById('label-morse-action').textContent = 'Decode to Text';
  }
  clearOutputBox(document.getElementById('out-morse'));
}

async function runMorse() {
  const raw = document.getElementById('input-morse-text').value.trim();
  if (!raw) return showError('out-morse', 'Please enter something first.');
  const endpoint = morseMode === 'encode' ? '/morse/encode' : '/morse/decode';
  const body = morseMode === 'encode' ? { text: raw } : { cipher: raw };
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) showError('out-morse', data.error);
    else showResult('out-morse', data.result, data.time_ms);
  } catch { showError('out-morse', 'Network error.'); }
}

function loadMorseExample(text, mode) {
  setMorseMode(mode);
  document.getElementById('input-morse-text').value = text;
  updateInputStats('input-morse-text', 'count-morse');
  runMorse();
}

function toggleMorseRef() {
  const body = document.getElementById('morse-ref-body');
  body.hidden = !body.hidden;
}

function buildMorseTable() {
  const table = document.getElementById('morse-cipher-table');
  if(!table) return;
  const morseDict = {
    'A':'.-', 'B':'-...', 'C':'-.-.', 'D':'-..', 'E':'.', 'F':'..-.', 'G':'--.', 'H':'....',
    'I':'..', 'J':'.---', 'K':'-.-', 'L':'.-..', 'M':'--', 'N':'-.', 'O':'---', 'P':'.--.',
    'Q':'--.-', 'R':'.-.', 'S':'...', 'T':'-', 'U':'..-', 'V':'...-', 'W':'.--', 'X':'-..-',
    'Y':'-.--', 'Z':'--..', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....',
    '6':'-....', '7':'--...', '8':'---..', '9':'----.', '0':'-----'
  };
  for (const [letter, num] of Object.entries(morseDict)) {
    const cell = document.createElement('div');
    cell.className = 'cipher-cell';
    cell.innerHTML = `<span class="cell-letter">${letter}</span><span class="cell-sep" style="visibility:hidden;height:1px">=</span><span class="cell-num" style="font-size:1rem;font-weight:700">${num}</span>`;
    cell.addEventListener('click', () => {
      const inp = document.getElementById('input-morse-text');
      inp.value += morseMode === 'encode' ? letter : (inp.value ? ` ${num}` : `${num}`);
      updateInputStats('input-morse-text', 'count-morse');
    });
    table.appendChild(cell);
  }
}

// ── 4. ROT13 ─────────────────────────────────
async function runRot13() {
  const raw = document.getElementById('input-rot13-text').value.trim();
  if (!raw) return showError('out-rot13', 'Please enter something first.');
  try {
    const res = await fetch('/rot13/convert', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({text: raw}) });
    const data = await res.json();
    if (!res.ok) showError('out-rot13', data.error);
    else showResult('out-rot13', data.result, data.time_ms);
  } catch { showError('out-rot13', 'Network error.'); }
}

function loadRot13Example(text) {
  document.getElementById('input-rot13-text').value = text;
  updateInputStats('input-rot13-text', 'count-rot13');
  runRot13();
}

// ── 5. BINARY ────────────────────────────────
let binaryMode = 'encode';
function setBinaryMode(mode) {
  binaryMode = mode;
  document.getElementById('btn-binary-encode').classList.toggle('active', mode === 'encode');
  document.getElementById('btn-binary-decode').classList.toggle('active', mode === 'decode');
  
  if (mode === 'encode') {
    document.getElementById('binary-mode-desc').textContent = 'Convert plain text into an 8-bit binary string.';
    document.getElementById('label-binary-input').textContent = 'Your Message';
    document.getElementById('input-binary-text').placeholder = 'Enter message…';
    document.getElementById('label-binary-action').textContent = 'Encode to Binary';
  } else {
    document.getElementById('binary-mode-desc').textContent = 'Decode a binary string back into readable text.';
    document.getElementById('label-binary-input').textContent = 'Binary Input';
    document.getElementById('input-binary-text').placeholder = 'Enter 0s and 1s…';
    document.getElementById('label-binary-action').textContent = 'Decode from Binary';
  }
  clearOutputBox(document.getElementById('out-binary'));
}

async function runBinary() {
  const raw = document.getElementById('input-binary-text').value.trim();
  if (!raw) return showError('out-binary', 'Please enter something first.');
  const endpoint = binaryMode === 'encode' ? '/binary/encode' : '/binary/decode';
  const body = binaryMode === 'encode' ? { text: raw } : { cipher: raw };
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) showError('out-binary', data.error);
    else showResult('out-binary', data.result, data.time_ms);
  } catch { showError('out-binary', 'Network error.'); }
}
function loadBinaryExample(text, mode) {
  setBinaryMode(mode);
  document.getElementById('input-binary-text').value = text;
  updateInputStats('input-binary-text', 'count-binary');
  runBinary();
}

// ── 6. BASE64 ────────────────────────────────
let base64Mode = 'encode';
function setBase64Mode(mode) {
  base64Mode = mode;
  document.getElementById('btn-base64-encode').classList.toggle('active', mode === 'encode');
  document.getElementById('btn-base64-decode').classList.toggle('active', mode === 'decode');
  
  if (mode === 'encode') {
    document.getElementById('base64-mode-desc').textContent = 'Convert data into Base64 format.';
    document.getElementById('label-base64-input').textContent = 'Your Message';
    document.getElementById('input-base64-text').placeholder = 'Enter message…';
    document.getElementById('label-base64-action').textContent = 'Encode to Base64';
  } else {
    document.getElementById('base64-mode-desc').textContent = 'Decode Base64 string back into readable text.';
    document.getElementById('label-base64-input').textContent = 'Base64 Input';
    document.getElementById('input-base64-text').placeholder = 'Enter Base64 text…';
    document.getElementById('label-base64-action').textContent = 'Decode from Base64';
  }
  clearOutputBox(document.getElementById('out-base64'));
}

async function runBase64() {
  const raw = document.getElementById('input-base64-text').value.trim();
  if (!raw) return showError('out-base64', 'Please enter something first.');
  const endpoint = base64Mode === 'encode' ? '/base64/encode' : '/base64/decode';
  const body = base64Mode === 'encode' ? { text: raw } : { cipher: raw };
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) showError('out-base64', data.error);
    else showResult('out-base64', data.result, data.time_ms);
  } catch { showError('out-base64', 'Network error.'); }
}
function loadBase64Example(text, mode) {
  setBase64Mode(mode);
  document.getElementById('input-base64-text').value = text;
  updateInputStats('input-base64-text', 'count-base64');
  runBase64();
}


// ── 7. HEXADECIMAL ───────────────────────────
let hexMode = 'encode';
function setHexMode(mode) {
  hexMode = mode;
  document.getElementById('btn-hex-encode').classList.toggle('active', mode === 'encode');
  document.getElementById('btn-hex-decode').classList.toggle('active', mode === 'decode');
  if (mode === 'encode') {
    document.getElementById('hex-mode-desc').textContent = 'Convert plain text bytes into Hexadecimal.';
    document.getElementById('label-hex-input').textContent = 'Your Message';
    document.getElementById('input-hex-text').placeholder = 'Enter message…';
    document.getElementById('hex-format-group').style.display = 'flex';
    document.getElementById('label-hex-action').textContent = 'Encode to Hex';
  } else {
    document.getElementById('hex-mode-desc').textContent = 'Decode hexadecimal bytes back into readable text.';
    document.getElementById('label-hex-input').textContent = 'Hexadecimal Input';
    document.getElementById('input-hex-text').placeholder = 'Enter hex (e.g. 48 65 6C...)';
    document.getElementById('hex-format-group').style.display = 'none';
    document.getElementById('label-hex-action').textContent = 'Decode from Hex';
  }
  clearOutputBox(document.getElementById('out-hex'));
}
async function runHex() {
  const raw = document.getElementById('input-hex-text').value.trim();
  if (!raw) return showError('out-hex', 'Please enter something first.');
  const endpoint = hexMode === 'encode' ? '/hex/encode' : '/hex/decode';
  const isUpper = document.querySelector('input[name="hex_case"]:checked').value === 'upper';
  const body = hexMode === 'encode' ? { text: raw, upper: isUpper } : { cipher: raw };
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) showError('out-hex', data.error);
    else showResult('out-hex', data.result, data.time_ms);
  } catch { showError('out-hex', 'Network error.'); }
}
function loadHexExample(text, mode) {
  setHexMode(mode);
  document.getElementById('input-hex-text').value = text;
  updateInputStats('input-hex-text', 'count-hex');
  runHex();
}

// ── 8. AES ───────────────────────────────────
let aesMode = 'encrypt';
function setAESMode(mode) {
  aesMode = mode;
  document.getElementById('btn-aes-encrypt').classList.toggle('active', mode === 'encrypt');
  document.getElementById('btn-aes-decrypt').classList.toggle('active', mode === 'decrypt');
  if (mode === 'encrypt') {
    document.getElementById('aes-mode-desc').textContent = 'Encrypt a message securely using AES-128 CBC.';
    document.getElementById('label-aes-input').textContent = 'Message';
    document.getElementById('input-aes').placeholder = 'Enter message to encrypt...';
    document.getElementById('label-aes-action').textContent = 'Encrypt Message';
  } else {
    document.getElementById('aes-mode-desc').textContent = 'Decrypt a message using your AES secret key.';
    document.getElementById('label-aes-input').textContent = 'Ciphertext (Hex)';
    document.getElementById('input-aes').placeholder = 'Enter hex ciphertext...';
    document.getElementById('label-aes-action').textContent = 'Decrypt Message';
  }
  clearOutputBox(document.getElementById('out-aes'));
}
async function runAES() {
  const text = document.getElementById('input-aes').value.trim();
  const key = document.getElementById('input-aes-key').value;
  if (!text || !key) return showError('out-aes', 'Message and Key are required.');
  const endpoint = aesMode === 'encrypt' ? '/aes/encrypt' : '/aes/decrypt';
  const body = aesMode === 'encrypt' ? { text, key } : { cipher: text, key };
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) showError('out-aes', data.error);
    else showResult('out-aes', data.result, data.time_ms);
  } catch { showError('out-aes', 'Network error.'); }
}

// ── 9. RSA ───────────────────────────────────
let rsaMode = 'encrypt';
function setRSAMode(mode) {
  rsaMode = mode;
  document.getElementById('btn-rsa-encrypt').classList.toggle('active', mode === 'encrypt');
  document.getElementById('btn-rsa-decrypt').classList.toggle('active', mode === 'decrypt');
  if (mode === 'encrypt') {
    document.getElementById('rsa-mode-desc').textContent = 'Encrypt using Public Key, Decrypt using Private Key.';
    document.getElementById('label-rsa-input').textContent = 'Message';
    document.getElementById('input-rsa').placeholder = 'Enter message to encrypt...';
    document.getElementById('label-rsa-action').textContent = 'Encrypt Message';
  } else {
    document.getElementById('rsa-mode-desc').textContent = 'Decrypt a message using your Private Key.';
    document.getElementById('label-rsa-input').textContent = 'Ciphertext (Hex)';
    document.getElementById('input-rsa').placeholder = 'Enter hex ciphertext...';
    document.getElementById('label-rsa-action').textContent = 'Decrypt Message';
  }
  clearOutputBox(document.getElementById('out-rsa'));
}
async function runRSAGenerate() {
  const btn = document.getElementById('btn-rsa-gen');
  btn.textContent = 'Generating...';
  try {
    const res = await fetch('/rsa/generate-keys', { method: 'POST' });
    const data = await res.json();
    document.getElementById('input-rsa-pub').value = data.public_key;
    document.getElementById('input-rsa-priv').value = data.private_key;
  } catch { alert('Network error generating keys.'); }
  btn.textContent = 'Generate 2048-bit RSA Keys';
}
async function runRSA() {
  const text = document.getElementById('input-rsa').value.trim();
  const pub = document.getElementById('input-rsa-pub').value;
  const priv = document.getElementById('input-rsa-priv').value;
  if (!text) return showError('out-rsa', 'Message/Ciphertext required.');
  let endpoint, body;
  if (rsaMode === 'encrypt') {
    if (!pub) return showError('out-rsa', 'Public key required to encrypt.');
    endpoint = '/rsa/encrypt';
    body = { text, public_key: pub };
  } else {
    if (!priv) return showError('out-rsa', 'Private key required to decrypt.');
    endpoint = '/rsa/decrypt';
    body = { cipher: text, private_key: priv };
  }
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) showError('out-rsa', data.error);
    else showResult('out-rsa', data.result, data.time_ms);
  } catch { showError('out-rsa', 'Network error.'); }
}

// ── 10. SHA256 ───────────────────────────────
let shaMode = 'hash';
function setSHAMode(mode) {
  shaMode = mode;
  document.getElementById('btn-sha-hash').classList.toggle('active', mode === 'hash');
  document.getElementById('btn-sha-verify').classList.toggle('active', mode === 'verify');
  if (mode === 'hash') {
    document.getElementById('sha-mode-desc').textContent = 'Live SHA256, MD5, and SHA1 hashing.';
    document.getElementById('sha-verify-group').hidden = true;
    document.getElementById('out-sha').innerHTML = '<span class="output-placeholder">Start typing to generate hashes...</span>';
  } else {
    document.getElementById('sha-mode-desc').textContent = 'Verify if a text matches an expected SHA256 hash.';
    document.getElementById('sha-verify-group').hidden = false;
    document.getElementById('out-sha').innerHTML = '<span class="output-placeholder">Result here...</span>';
  }
}
async function runSHA() {
  if (shaMode !== 'hash') return; 
  const text = document.getElementById('input-sha').value;
  if (!text) {
    clearOutputBox(document.getElementById('out-sha'));
    document.getElementById('out-sha').innerHTML = '<span class="output-placeholder">Start typing to generate hashes...</span>';
    return;
  }
  try {
    const res = await fetch('/sha256/hash', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({text}) });
    const data = await res.json();
    if (!res.ok) showError('out-sha', data.error);
    else {
      const html = `
        <div class="multi-hash-box">
          <div><div class="hash-label">SHA-256</div><div class="output-text sha-text">${data.result.sha256}</div></div>
          <div><div class="hash-label">MD5</div><div class="output-text md5-text" style="color:var(--text-3); font-size:0.85rem">${data.result.md5}</div></div>
          <div><div class="hash-label">SHA-1</div><div class="output-text sha1-text" style="color:var(--text-3); font-size:0.85rem">${data.result.sha1}</div></div>
        </div>
      `;
      showResultRaw('out-sha', html, data.time_ms);
    }
  } catch { showError('out-sha', 'Network error.'); }
}
async function runSHAVerify() {
  const text = document.getElementById('input-sha').value;
  const hashStr = document.getElementById('input-sha-hash').value.trim();
  if (!text || !hashStr) return showError('out-sha', 'Message and expected hash required.');
  try {
    const res = await fetch('/sha256/verify', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({text, hash: hashStr}) });
    const data = await res.json();
    if (!res.ok) showError('out-sha', data.error);
    else {
      const matchText = data.match ? '✅ MATCH: The hashes are identical.' : '❌ NO MATCH: The hashes are different.';
      showResult('out-sha', matchText + '\nCalculated:\n' + data.hash, data.time_ms);
    }
  } catch { showError('out-sha', 'Network error.'); }
}

document.getElementById('input-a1z26').addEventListener('input', () => updateInputStats('input-a1z26', 'count-a1z26'));

// Init Everything
buildCipherTable();
buildMorseTable();

// Initialize modes
setA1Z26Mode('decode');
setCaesarMode('encode');
setMorseMode('encode');
setBinaryMode('encode');
setBase64Mode('encode');
setHexMode('encode');
setAESMode('encrypt');
setRSAMode('encrypt');
setSHAMode('hash');
