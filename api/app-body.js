const parts = [];
for (let i = 0; i < 20; i++) parts.push(require('./ab' + i + '.json').d);
module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  return res.status(200).send(parts.join(''));
};
