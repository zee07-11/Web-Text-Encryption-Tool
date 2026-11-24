# Web Based Text Encryption Tool

An Information Security assignment by Zohaib Abdullah. GitHub profile: https://github.com/zee07-11.

## Features
- Three encryption methods: Caesar, Vigenere and AES-256-GCM.
- Decryption with the same shift, keyword or password.
- SHA-256 hashing, clearly shown as a one way operation.
- Copy result, move result to input, example text and clear controls.
- Empty input, missing method, key and encrypted message validation.
- Responsive layout and keyboard accessible form labels.

The app supports a local Node.js backend and a browser-only static mode. It has no account system, database, analytics, saved messages or external libraries. The optional account saving feature is outside this version's scope.

## Run locally
Install Node.js 22 or newer if needed. Open a terminal in this project folder and run:

```text
node server.cjs
```

Visit http://localhost:8000 in a current Chrome, Edge or Firefox browser. Keep the terminal running while using the app. Stop it with Ctrl+C. The page shows Local Node server mode. This mode sends text and any required key to your own loopback server's POST /api/transform endpoint. The server validates the request and performs the selected method. It does not save or log messages or passwords. It listens only on 127.0.0.1 and rejects cross origin browser API requests. This is a local classroom server, not a production service.

For a browser-only alternative, run `python -m http.server 8000 --directory dist` with Python 3 and use http://localhost:8000. The private hosted preview also uses this static mode. In static mode, text and passwords stay in the page. Browser AES and SHA-256 use Web Crypto, which needs HTTPS or localhost. Use a local server rather than opening index.html directly.

## Run tests
Install Node.js 22 or newer, then run:

```text
node test.cjs
node test-backend.cjs
```

There are no npm packages to install. The 15 algorithm checks include known answers, Unicode AES round trips, random salt and IV checks, wrong-password and tamper rejection, and input validation. Eight backend checks cover the interface, algorithm API results, AES round trip, input errors, origin restrictions and unknown routes. Actual outputs are saved in test-results.json and backend-test-results.json. Browser checks also covered the controls, copy result, error messages and a phone layout without horizontal overflow.

## How to use
1. Select a method, then enter your text.
2. For Caesar choose a shift of 1 to 25. For Vigenere enter an English letter keyword. For AES use a password of at least 12 characters.
3. Click Encrypt text. Keep the complete result if you want to decrypt it.
4. Click Use as input to switch to decryption, or manually select Decrypt and paste the result. Keep the same key.
5. SHA-256 only creates a hash; it cannot decrypt. Copy result copies the output. Clear all clears message, keys and output from the page.

## Implementation
- dist/index.html: the single page interface.
- dist/styles.css: layout, colors and phone styles.
- dist/crypto.js: algorithm functions.
- dist/app.js: form controls, validation and result messages.
- test.cjs: automated checks using Node's standard test assertions.
- test-results.json: results from the completed test run.
- server.cjs: local Node HTTP server and encryption endpoint.
- test-backend.cjs and backend-test-results.json: backend checks and actual results.

JavaScript implements both the interface and the encryption logic. The shared crypto module is used by the browser and Node backend. The Node server marks the HTML with its backend mode; app.js then uses the same origin API. Static hosting leaves this flag absent, so app.js uses the browser functions instead. There is no automatic silent fallback from failed backend requests to browser processing. Python's alternative HTTP server only serves static files.

Caesar and Vigenere change English letters and keep punctuation and non-English characters unchanged. They are educational ciphers and are not suitable for protecting private data. AES uses Web Crypto AES-GCM with a 256 bit key, 128 bit authentication tag, fresh 16 byte random salt and 12 byte random IV. PBKDF2 with SHA-256 and 600,000 iterations derives the key from the password. The result is JSON containing the version, algorithm, KDF settings, salt, IV and Base64 ciphertext with its authentication tag. The password is not included. Base64 represents binary data as text; it is not another encryption method.

The minimum password length is an input rule, not a guarantee of password strength. The project is an educational demonstration, not an independently audited security product. It has no password recovery. Copying a result places it on the system clipboard.

## GitHub and submission
Create a PUBLIC repository called Web-Text-Encryption-Tool in your GitHub account and upload this folder's contents. Do not upload just the ZIP. Add the repository link to the report's marked space. The private hosted preview, if supplied, does not replace the GitHub source submission. The short report and captioned demo video are delivered separately.

## References
- MDN Web Docs, SubtleCrypto encrypt: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
- MDN Web Docs, deriveKey: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey
- MDN Web Docs, digest: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
- MDN Web Docs, AES GCM parameters: https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
