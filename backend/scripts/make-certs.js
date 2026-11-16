// Δημιουργεί self-signed πιστοποιητικό για το localhost (certs/key.pem και certs/cert.pem).
// Το ίδιο πιστοποιητικό χρησιμοποιείται από το NestJS και από το ng serve.
// Εκτέλεση: npm run certs
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

async function main() {
  const certsDir = path.join(__dirname, '..', 'certs');
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = await selfsigned.generate(attrs, {
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' },
        ],
      },
    ],
  });

  fs.mkdirSync(certsDir, { recursive: true });
  fs.writeFileSync(path.join(certsDir, 'key.pem'), pems.private);
  fs.writeFileSync(path.join(certsDir, 'cert.pem'), pems.cert);
  console.log('Τα πιστοποιητικά δημιουργήθηκαν στον φάκελο certs/');
}

main();
