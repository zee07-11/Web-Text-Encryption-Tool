/* Cryptographic logic shared by the page and the automated tests. */
(function (root) {
  'use strict';
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const ITERATIONS = 600000;
  function requireText(text) {
    if (typeof text !== 'string' || !text.trim()) throw new Error('Please enter some text first.');
    if (text.length > 100000) throw new Error('Please use 100,000 characters or fewer.');
  }
  function caesar(text, shift, decrypt = false) {
    requireText(text);
    if (!/^-?\d+$/.test(String(shift)) || !Number.isSafeInteger(Number(shift)) || Number(shift) < 1 || Number(shift) > 25) throw new Error('Choose a whole number from 1 to 25 for the shift.');
    const n = decrypt ? -Number(shift) : Number(shift);
    return text.replace(/[a-z]/gi, c => {
      const base = c >= 'a' && c <= 'z' ? 97 : 65;
      return String.fromCharCode(((c.charCodeAt(0) - base + n) % 26 + 26) % 26 + base);
    });
  }
  function vigenere(text, key, decrypt = false) {
    requireText(text);
    if (!/^[a-z]+$/i.test(key)) throw new Error('Use letters A to Z only for the keyword.');
    let i = 0;
    return text.replace(/[a-z]/gi, c => {
      const base = c >= 'a' && c <= 'z' ? 97 : 65;
      const shift = key.toUpperCase().charCodeAt(i++ % key.length) - 65;
      return String.fromCharCode((c.charCodeAt(0) - base + (decrypt ? -shift : shift) + 26) % 26 + base);
    });
  }
  function getCrypto() {
    if (!root.crypto?.subtle) throw new Error('Your browser needs HTTPS or localhost for AES and hashing. Please use the start instructions.');
    return root.crypto;
  }
  function b64(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  function unb64(value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4) throw new Error('Invalid encrypted message.');
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
  }
  async function aesKey(password, salt) {
    if (typeof password !== 'string' || password.length < 12 || !password.trim()) throw new Error('Use a password with at least 12 characters.');
    const c = getCrypto();
    const material = await c.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    return c.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function aesEncrypt(text, password) {
    requireText(text);
    const c = getCrypto();
    const salt = c.getRandomValues(new Uint8Array(16));
    const iv = c.getRandomValues(new Uint8Array(12));
    const key = await aesKey(password, salt);
    const encrypted = await c.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, encoder.encode(text));
    return JSON.stringify({ version: 1, algorithm: 'AES-256-GCM', kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), ciphertext: b64(new Uint8Array(encrypted)) });
  }
  async function aesDecrypt(text, password) {
    requireText(text);
    let data, salt, iv, ciphertext;
    try {
      data = JSON.parse(text);
      if (data.version !== 1 || data.algorithm !== 'AES-256-GCM' || data.kdf !== 'PBKDF2-SHA256' || data.iterations !== ITERATIONS) throw new Error();
      salt = unb64(data.salt); iv = unb64(data.iv); ciphertext = unb64(data.ciphertext);
      if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) throw new Error();
    } catch { throw new Error('Paste the complete AES result from this app.'); }
    const key = await aesKey(password, salt);
    try {
      const plain = await getCrypto().subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, ciphertext);
      return decoder.decode(plain);
    } catch { throw new Error('Decryption failed. Check the password and the encrypted text.'); }
  }
  async function sha256(text) {
    requireText(text);
    const bytes = new Uint8Array(await getCrypto().subtle.digest('SHA-256', encoder.encode(text)));
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  const api = { caesar, vigenere, aesEncrypt, aesDecrypt, sha256, requireText };
  root.CryptoLab = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
