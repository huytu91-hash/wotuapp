const parts = [0,1,2,3,4,5].map((i) => require('./ogc' + i + '.json'));
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  const b64 = parts.map((p) => String(p.d || '')).join('');
  return res.status(200).send(Buffer.from(b64, 'base64'));
};
