const assert = require('node:assert/strict');
const fs = require('node:fs');
const c = require('./dist/crypto.js');
let tests = [];
async function test(name, fn) { await fn(); tests.push({name, result:'PASS'}); console.log('PASS',name); }
(async () => {
 await test('Caesar known answer', () => assert.equal(c.caesar('Attack at dawn!',3),'Dwwdfn dw gdzq!'));
 await test('Caesar decryption and wrap', () => assert.equal(c.caesar(c.caesar('Zebra 123! é',25),25,true),'Zebra 123! é'));
 await test('Reject empty and whitespace text', () => {assert.throws(()=>c.caesar('',3));assert.throws(()=>c.caesar('  ',3));});
 await test('Reject invalid shift', () => {for(const n of [0,26,2.5,'no'])assert.throws(()=>c.caesar('Hi',n));});
 await test('Vigenere known answer', () => assert.equal(c.vigenere('ATTACKATDAWN','LEMON'),'LXFOPVEFRNHR'));
 await test('Vigenere round trip and punctuation', () => assert.equal(c.vigenere(c.vigenere('Hello, World! 123','KEY'),'KEY',true),'Hello, World! 123'));
 await test('Reject missing and invalid keyword', () => {assert.throws(()=>c.vigenere('Hi',''));assert.throws(()=>c.vigenere('Hi','A1'));});
 await test('SHA256 known answer', async () => assert.equal(await c.sha256('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
 const password = 'Demo password 062!'; const text='Hello, SecureNet! اردو 😀';
 const encrypted=await c.aesEncrypt(text,password);
 await test('AES Unicode round trip', async () => assert.equal(await c.aesDecrypt(encrypted,password),text));
 await test('AES random salt and IV', async () => {const next=JSON.parse(await c.aesEncrypt(text,password));const first=JSON.parse(encrypted);assert.notEqual(next.salt,first.salt);assert.notEqual(next.iv,first.iv);assert.notEqual(next.ciphertext,first.ciphertext);});
 await test('AES rejects wrong password', async () => assert.rejects(()=>c.aesDecrypt(encrypted,'Wrong password 062!')));
 await test('AES rejects changed ciphertext', async () => {const changed=JSON.parse(encrypted);changed.ciphertext=(changed.ciphertext[0]==='A'?'B':'A')+changed.ciphertext.slice(1);await assert.rejects(()=>c.aesDecrypt(JSON.stringify(changed),password));});
 await test('AES rejects short password', async () => assert.rejects(()=>c.aesEncrypt('Hello','short')));
 await test('AES rejects invalid envelope', async () => {for(const s of ['not json','{}',JSON.stringify({...JSON.parse(encrypted),iterations:1})]) await assert.rejects(()=>c.aesDecrypt(s,password));});
 await test('Input length limit', () => assert.throws(()=>c.caesar('A'.repeat(100001),3)));
 fs.writeFileSync('test-results.json',JSON.stringify({runtime:process.version,total:tests.length,tests},null,2));
 console.log(`${tests.length} tests passed.`);
})().catch(e=>{console.error(e);process.exitCode=1});
