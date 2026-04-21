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

// ── AES Logic ──────────────────────────────
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

// ── RSA Logic ──────────────────────────────
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
  btn.textContent = 'Generate New Keys';
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

// ── SHA256 Logic ───────────────────────────
let shaMode = 'hash';
function setSHAMode(mode) {
  shaMode = mode;
  document.getElementById('btn-sha-hash').classList.toggle('active', mode === 'hash');
  document.getElementById('btn-sha-verify').classList.toggle('active', mode === 'verify');
  if (mode === 'hash') {
    document.getElementById('sha-mode-desc').textContent = 'Generate a one-way SHA256 hash of your text.';
    document.getElementById('sha-verify-group').hidden = true;
    document.getElementById('label-sha-action').textContent = 'Generate Hash';
  } else {
    document.getElementById('sha-mode-desc').textContent = 'Verify if a text matches an expected SHA256 hash.';
    document.getElementById('sha-verify-group').hidden = false;
    document.getElementById('label-sha-action').textContent = 'Verify Hash';
  }
  clearOutputBox(document.getElementById('out-sha'));
}

async function runSHA() {
  const text = document.getElementById('input-sha').value;
  const hashStr = document.getElementById('input-sha-hash').value.trim();
  
  if (shaMode === 'hash') {
    if (!text) return showError('out-sha', 'Message required.');
    try {
      const res = await fetch('/sha256/hash', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({text}) });
      const data = await res.json();
      if (!res.ok) showError('out-sha', data.error);
      else showResult('out-sha', data.result, data.time_ms);
    } catch { showError('out-sha', 'Network error.'); }
  } else {
    if (!text || !hashStr) return showError('out-sha', 'Message and hash required.');
    try {
      const res = await fetch('/sha256/verify', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({text, hash: hashStr}) });
      const data = await res.json();
      if (!res.ok) showError('out-sha', data.error);
      else showResult('out-sha', data.match ? '✅ MATCH: The hashes are identical.' : '❌ NO MATCH: The hashes are different.', data.time_ms);
    } catch { showError('out-sha', 'Network error.'); }
  }
}

// Init
buildCipherTable();
setA1Z26Mode('decode');
