const { Schema } = require('mongoose');
const { getReadConnection, getWriteConnection } = require('../config/db');
const { validateBookCode, calculatePriceWithTax, getVatRate } = require('../utils/pricing');

const bookSchema = new Schema(
  {
    bookCode: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    priceWithTax: { type: Number },
    vatRate: { type: Number, default: () => getVatRate() },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'books' }
);

bookSchema.pre('validate', function () {
  validateBookCode(this.bookCode);
  this.vatRate = getVatRate();
  this.priceWithTax = calculatePriceWithTax(this.price);
});

// Read model is bound to the read-only connection. Only use find/lean here.
function getReadBookModel() {
  const conn = getReadConnection();
  return conn.models.BookRead || conn.model('BookRead', bookSchema);
}

// Write model is bound to the write-privileged connection. Only use create/save here.
function getWriteBookModel() {
  const conn = getWriteConnection();
  return conn.models.BookWrite || conn.model('BookWrite', bookSchema);
}

module.exports = { getReadBookModel, getWriteBookModel };
