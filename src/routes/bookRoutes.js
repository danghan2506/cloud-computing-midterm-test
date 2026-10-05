const express = require('express');
const { getReadBookModel, getWriteBookModel } = require('../models/Book');

const router = express.Router();

// READ path -> reader_23IT067 only
router.get('/', async (req, res, next) => {
  try {
    const BookRead = getReadBookModel();
    const books = await BookRead.find().sort({ createdAt: -1 }).lean();
    res.render('home', { books });
  } catch (err) {
    next(err);
  }
});

// WRITE path -> writer_23IT067 only
router.post('/', async (req, res, next) => {
  try {
    const { bookCode, title, author, price } = req.body;
    const BookWrite = getWriteBookModel();
    await BookWrite.create({ bookCode, title, author, price: Number(price) });
    // track writes in session (proves Bài 2 stateless later)
    req.session.writeCount = (req.session.writeCount || 0) + 1;
    res.redirect('/');
  } catch (err) {
    // Prefix / VAT validation errors land here with statusCode 400
    // Least-privilege violation lands here as MongoServerError 13 (not authorized)
    err.statusCode = err.statusCode || (err.code === 13 ? 403 : 500);
    next(err);
  }
});

module.exports = router;
