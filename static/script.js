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

function showResult(boxId, text, timeMs) {
  const box = document.getElementById(boxId);
  box.innerHTML = `<span class="output-text">${escapeHtml(text)}</span>`;
  box.classList.add('has-result');
  box.nextElementSibling.textContent = '';
  if (timeMs !== undefined) {
    const charCount = text.length;
    const byteCount = new Blob([text]).size;
    document.getElementById(boxId.replace('out-', 'time-')).textContent = `(${charCount} chars | ${byteCount} bytes | ${timeMs}ms)`;
  }
}

function showError(boxId, msg) {
  const box = document.getElementById(boxId);
  box.innerHTML = '<span class="output-placeholder">Result here…</span>';
  box.classList.remove('has-result');
  box.nextElementSibling.textContent = '⚠ ' + msg;
  document.getElementById(boxId.replace('out-', 'time-')).textContent = '';
}

function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function copyOutput(boxId, btn) {
  const box = document.getElementById(boxId);
  const textNode = box.querySelector('.output-text');
  if (!textNode) return;
  try {
    await navigator.clipboard.writeText(textNode.textContent);
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
  const val = document.getElementById(inputId).value;
  document.getElementById(countId).textContent = `${val.length} chars`;
}


// ── A1Z26 Cipher Logic ────────────────────
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

document.getElementById('input-a1z26').addEventListener('input', () => updateInputStats('input-a1z26', 'count-a1z26'));

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


// ── CAESAR CIPHER ─────────────────────────
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


// ── MORSE CODE ────────────────────────────
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
  const btn = document.getElementById('morse-ref-toggle');
  body.hidden = !body.hidden;
  btn.setAttribute('aria-expanded', !body.hidden);
}

function buildMorseTable() {
  const table = document.getElementById('morse-cipher-table');
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

// ── ROT13 ─────────────────────────────────
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


// ── BINARY ─────────────────────────────────
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

// ── BASE64 ─────────────────────────────────
let base64Mode = 'encode';
function setBase64Mode(mode) {
  base64Mode = mode;
  document.getElementById('btn-base64-encode').classList.toggle('active', mode === 'encode');
  document.getElementById('btn-base64-decode').classList.toggle('active', mode === 'decode');
  
  if (mode === 'encode') {
    document.getElementById('base64-mode-desc').textContent = 'Convert data into Base64 format (padding handled automatically).';
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

// ── HEXADECIMAL ────────────────────────────
let hexMode = 'encode';
function setHexMode(mode) {
  hexMode = mode;
  document.getElementById('btn-hex-encode').classList.toggle('active', mode === 'encode');
  document.getElementById('btn-hex-decode').classList.toggle('active', mode === 'decode');
  
  if (mode === 'encode') {
    document.getElementById('hex-mode-desc').textContent = 'Convert plain text bytes into Hexadecimal (base16).';
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
