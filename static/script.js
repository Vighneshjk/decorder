/* ═══════════════════════════════════════
   CipherX — Frontend Logic (script.js)
   ═══════════════════════════════════════ */

'use strict';

// ── State ──────────────────────────────────
let currentMode = 'decode';

// ── DOM refs ───────────────────────────────
const inputEl      = document.getElementById('input-text');
const outputBox    = document.getElementById('output-box');
const errorMsg     = document.getElementById('error-msg');
const charCount    = document.getElementById('char-count');
const copyBtn      = document.getElementById('copy-btn');
const copyLabel    = document.getElementById('copy-label');
const copyIcon     = document.getElementById('copy-icon');
const convertBtn   = document.getElementById('convert-btn');
const btnLabel     = document.getElementById('btn-label');
const modeDesc     = document.getElementById('mode-desc');
const inputLabel   = document.getElementById('input-label');

// ── Cipher Table ───────────────────────────
function buildCipherTable() {
  const table = document.getElementById('cipher-table');
  table.setAttribute('role', 'table');
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    const num    = i + 1;

    const cell = document.createElement('div');
    cell.className = 'cipher-cell';
    cell.setAttribute('role', 'cell');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('title', `Press to use ${letter} or ${num}`);
    cell.setAttribute('aria-label', `${letter} equals ${num}. Click to use.`);
    cell.innerHTML = `
      <span class="cell-letter">${letter}</span>
      <span class="cell-sep">=</span>
      <span class="cell-num">${num}</span>
    `;

    // Clicking a cipher cell pre-fills input based on current mode
    cell.addEventListener('click', () => {
      if (currentMode === 'encode') {
        inputEl.value += letter;
      } else {
        const cur = inputEl.value.trim();
        inputEl.value = cur ? `${cur}-${num}` : `${num}`;
      }
      updateCharCount();
      inputEl.focus();
    });

    cell.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cell.click(); }
    });

    table.appendChild(cell);
  }
}

// ── Mode switching ─────────────────────────
function setMode(mode) {
  currentMode = mode;

  document.getElementById('btn-encode').classList.toggle('active', mode === 'encode');
  document.getElementById('btn-decode').classList.toggle('active', mode === 'decode');
  document.getElementById('btn-encode').setAttribute('aria-pressed', mode === 'encode');
  document.getElementById('btn-decode').setAttribute('aria-pressed', mode === 'decode');

  if (mode === 'encode') {
    modeDesc.textContent   = 'Convert plain text into secret number codes.';
    inputLabel.textContent = 'Your Message';
    inputEl.placeholder    = 'Type your message here… (e.g. HELLO WORLD)';
    btnLabel.textContent   = 'Encode Message';
  } else {
    modeDesc.textContent   = 'Decode a number cipher back into readable text.';
    inputLabel.textContent = 'Cipher Numbers';
    inputEl.placeholder    = 'Enter cipher numbers… (e.g. 8-5-12-12-15 / 23-15-18-12-4)';
    btnLabel.textContent   = 'Decode Cipher';
  }

  clearOutput();
  inputEl.value = '';
  updateCharCount();
}

// ── Char counter ───────────────────────────
function updateCharCount() {
  const len = inputEl.value.length;
  charCount.textContent = `${len} char${len !== 1 ? 's' : ''}`;
}
inputEl.addEventListener('input', updateCharCount);

// Allow pressing Enter (Ctrl+Enter or Cmd+Enter) to convert
inputEl.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') convert();
});

// ── Clear output helper ────────────────────
function clearOutput() {
  outputBox.innerHTML = '<span class="output-placeholder">Your result will appear here…</span>';
  outputBox.classList.remove('has-result');
  errorMsg.textContent = '';
  copyBtn.classList.remove('copied');
  copyLabel.textContent = 'Copy';
}

// ── Loading state ──────────────────────────
function setLoading(on) {
  if (on) {
    convertBtn.disabled = true;
    convertBtn.innerHTML = `<span class="spinner"></span> Processing…`;
  } else {
    convertBtn.disabled = false;
    convertBtn.innerHTML = `<span id="btn-label">${currentMode === 'encode' ? 'Encode Message' : 'Decode Cipher'}</span>
      <svg class="arrow-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>`;
  }
}

// ── Main convert function ──────────────────
async function convert() {
  const raw = inputEl.value.trim();
  if (!raw) {
    showError('Please enter something first.');
    return;
  }

  clearOutput();
  setLoading(true);

  try {
    const endpoint = currentMode === 'encode' ? '/api/encode' : '/api/decode';
    const body     = currentMode === 'encode'
      ? { text: raw }
      : { cipher: raw };

    const resp = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    const data = await resp.json();

    if (!resp.ok) {
      showError(data.error || 'Something went wrong.');
    } else {
      showResult(data.result);
    }
  } catch (err) {
    showError('Network error. Please make sure the Flask server is running.');
  } finally {
    setLoading(false);
  }
}

// ── Display helpers ────────────────────────
function showResult(text) {
  outputBox.innerHTML = `<span class="output-text">${escapeHtml(text)}</span>`;
  outputBox.classList.add('has-result');
  errorMsg.textContent = '';
}

function showError(msg) {
  outputBox.innerHTML = '<span class="output-placeholder">Your result will appear here…</span>';
  outputBox.classList.remove('has-result');
  errorMsg.textContent = '⚠ ' + msg;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Copy to clipboard ──────────────────────
async function copyOutput() {
  const textNode = outputBox.querySelector('.output-text');
  if (!textNode) return;

  const text = textNode.textContent;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add('copied');
    copyLabel.textContent = '✓ Copied!';
    copyIcon.innerHTML = `<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>`;
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyLabel.textContent = 'Copy';
      copyIcon.innerHTML = `<path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>`;
    }, 2000);
  } catch {
    copyLabel.textContent = 'Failed';
    setTimeout(() => { copyLabel.textContent = 'Copy'; }, 2000);
  }
}

// ── Quick Example loader ───────────────────
function loadExample(text, mode) {
  setMode(mode);
  inputEl.value = text;
  updateCharCount();
  inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  convert();
}

// ── Example card keyboard support ─────────
document.querySelectorAll('.example-card').forEach(card => {
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
  });
});

// ── Reference Table Toggle ─────────────────
function toggleRef() {
  const body    = document.getElementById('ref-body');
  const btn     = document.getElementById('ref-toggle');
  const isOpen  = !body.hidden;

  body.hidden = isOpen;
  btn.setAttribute('aria-expanded', String(!isOpen));
}

// ── Init ───────────────────────────────────
buildCipherTable();
setMode('decode');
updateCharCount();
