function getVatRate() {
  const parsed = parseFloat(process.env.VAT_RATE);
  return Number.isFinite(parsed) ? parsed : 12;
}
function getBookPrefix() {
  return process.env.BOOK_PREFIX || '067';
}

function validateBookCode(bookCode) {
  const prefix = getBookPrefix();
  if (typeof bookCode !== 'string' || !bookCode.startsWith(prefix)) {
    const err = new Error(`Book code must start with ${prefix}`);
    err.statusCode = 400;
    throw err;
  }
}

function calculatePriceWithTax(price) {
  const vatRate = getVatRate();
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    const err = new Error('Price must be a non-negative number');
    err.statusCode = 400;
    throw err;
  }
  return Math.round(numericPrice * (1 + vatRate / 100));
}
module.exports = { getVatRate, getBookPrefix, validateBookCode, calculatePriceWithTax };
