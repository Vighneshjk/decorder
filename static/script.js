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
    document.getElementById(boxId.replace('out-', 'time-')).textContent = `(${timeMs}ms)`;
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
  updateA1Z26Count();
}

function updateA1Z26Count() {
  const len = document.getElementById('input-a1z26').value.length;
  document.getElementById('count-a1z26').textContent = `${len} chars`;
}
document.getElementById('input-a1z26').addEventListener('input', updateA1Z26Count);

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
  updateA1Z26Count();
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
      updateA1Z26Count();
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
  runRot13();
}


// Init
buildCipherTable();
setA1Z26Mode('decode');
setCaesarMode('encode');
setMorseMode('encode');
buildMorseTable();
