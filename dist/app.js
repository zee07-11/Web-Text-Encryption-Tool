'use strict';
const $ = id => document.getElementById(id);
let mode = 'encrypt';
let busy = false;
const backend = document.documentElement.dataset.backend === 'node';
if (backend) {
  $('processingMode').textContent = 'Local Node server mode.';
  $('serverNote').textContent = 'Processed by your local server.';
  document.querySelector('.local-note').textContent = 'Processed by your local Node server.';
}
const info = {
  aes: 'Modern encryption. Uses AES with a password. Keep the full result and the password.',
  caesar: 'Moves each English letter by a fixed amount. For learning only.',
  vigenere: 'Uses a repeating keyword to shift English letters. For learning only.',
  sha256: 'Creates a one way fingerprint. Hashing cannot be reversed.'
};
function status(message, type = '') { $('status').textContent = message; $('status').className = type; }
function clearOutput() { $('output').value = ''; $('copy').disabled = true; $('useResult').disabled = true; }
function refresh() {
  const method = $('algorithm').value;
  if (method === 'sha256') mode = 'encrypt';
  $('encryptMode').setAttribute('aria-pressed', String(mode === 'encrypt'));
  $('decryptMode').setAttribute('aria-pressed', String(mode === 'decrypt'));
  $('decryptMode').disabled = method === 'sha256';
  $('methodHelp').textContent = info[method] || 'Choose a method to see how it works.';
  $('shiftGroup').hidden = method !== 'caesar';
  $('keywordGroup').hidden = method !== 'vigenere';
  $('passwordGroup').hidden = method !== 'aes';
  $('inputLabel').textContent = mode === 'decrypt' ? 'Encrypted text' : 'Your message';
  $('outputLabel').textContent = method === 'sha256' ? 'SHA-256 hash' : mode === 'decrypt' ? 'Decrypted message' : 'Encrypted result';
  $('run').textContent = method === 'sha256' ? 'Create hash' : mode === 'decrypt' ? 'Decrypt text' : 'Encrypt text';
  $('input').placeholder = mode === 'decrypt' ? 'Paste the encrypted text here…' : 'Type or paste your text here…';
}
function count() { $('count').textContent = $('input').value.length.toLocaleString() + ' characters'; }
for (const operation of ['encrypt', 'decrypt']) $(operation + 'Mode').addEventListener('click', () => {
  if (busy) return; mode = operation; clearOutput(); refresh(); status('Ready when you are.');
});
$('algorithm').addEventListener('change', () => { clearOutput(); refresh(); status('Ready when you are.'); });
for (const id of ['input','password','keyword','shift']) $(id).addEventListener('input', () => { clearOutput(); count(); status('Ready when you are.'); });
$('showPassword').addEventListener('change', () => { $('password').type = $('showPassword').checked ? 'text' : 'password'; });
$('example').addEventListener('click', () => {
  if (busy) return;
  mode = 'encrypt'; $('input').value = 'Hello, SecureNet!';
  if (!$('algorithm').value) $('algorithm').value = 'caesar';
  if (!$('keyword').value) $('keyword').value = 'LEMON';
  clearOutput(); refresh(); count(); status('Example loaded. Choose your key, then run the method.');
});
$('clear').addEventListener('click', () => {
  if (busy) return;
  $('input').value = ''; $('password').value = ''; $('keyword').value = ''; $('shift').value = '3';
  $('showPassword').checked = false; $('password').type = 'password'; clearOutput(); count(); status('Text, keys and results cleared.'); $('input').focus();
});
$('run').addEventListener('click', async () => {
  if (busy) return;
  clearOutput();
  const text = $('input').value, method = $('algorithm').value;
  try {
    if (!method) throw new Error('Please select an encryption method.');
    CryptoLab.requireText(text);
    busy = true;
    for (const el of document.querySelectorAll('button,input,select,textarea')) el.disabled = true;
    status('Working…');
    let result;
    if (backend) {
      const response = await fetch('/api/transform', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({text,method,mode,shift:$('shift').value,keyword:$('keyword').value,password:method === 'aes' ? $('password').value : undefined}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not process the request.');
      result = data.result;
    }
    else if (method === 'caesar') result = CryptoLab.caesar(text, $('shift').value, mode === 'decrypt');
    else if (method === 'vigenere') result = CryptoLab.vigenere(text, $('keyword').value, mode === 'decrypt');
    else if (method === 'aes') result = await CryptoLab[mode === 'decrypt' ? 'aesDecrypt' : 'aesEncrypt'](text, $('password').value);
    else if (method === 'sha256') result = await CryptoLab.sha256(text);
    else throw new Error('Please select a valid method.');
    $('output').value = result;
    status(method === 'sha256' ? 'Hash created. A hash cannot be decrypted.' : mode === 'decrypt' ? 'Message decrypted successfully.' : 'Text encrypted successfully.', 'success');
  } catch (error) { status(error.message || 'Something went wrong. Please check your input.', 'error'); }
  finally {
    busy = false;
    for (const el of document.querySelectorAll('button,input,select,textarea')) el.disabled = false;
    $('copy').disabled = !$('output').value; $('useResult').disabled = !$('output').value || method === 'sha256'; refresh();
  }
});
$('useResult').addEventListener('click', () => {
  if (!$('output').value) return;
  $('input').value = $('output').value; mode = mode === 'encrypt' ? 'decrypt' : 'encrypt';
  clearOutput(); count(); refresh(); status('Result moved to input. The same key is kept.');
});
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('output').value); status('Result copied.', 'success'); }
  catch { $('output').focus(); $('output').select(); status('Select the result and press Ctrl+C to copy it.'); }
});
refresh();
