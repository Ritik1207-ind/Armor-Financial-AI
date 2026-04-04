function sanitizeNum(val) {
  if (!val) return null;
  const num = String(val).replace(/[^0-9]/g, '');
  return num ? Number(num) : null;
}

module.exports = { sanitizeNum };
