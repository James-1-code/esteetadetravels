const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = './uploads/local';

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const dummyUpload = (buffer, filename, contentType) => {
  const key = `${uuidv4()}-${filename}`;
  const filepath = path.join(UPLOAD_DIR, key);
  fs.writeFileSync(filepath, buffer);
  return Promise.resolve({ key });
};

const dummyUrl = (key) => Promise.resolve(`http://localhost:5000/uploads/local/${key}`);
const dummyDelete = (key) => {
  const filepath = path.join(UPLOAD_DIR, path.basename(key));
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  return Promise.resolve();
};

module.exports = { dummyUpload, dummyUrl, dummyDelete };
