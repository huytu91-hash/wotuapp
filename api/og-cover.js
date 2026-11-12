const p1 = require('./og-part1.json');
const p2 = require('./og-part2.json');
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  return res.status(200).send(Buffer.from(String(p1.d || '') + String(p2.d || ''), 'base64'));
};
