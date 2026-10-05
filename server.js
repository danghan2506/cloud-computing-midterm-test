require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const { engine } = require('express-handlebars');
const { connectDatabases, getReadConnection, getWriteConnection } = require('./src/config/db');
const bookRoutes = require('./src/routes/bookRoutes');
const { getVatRate } = require('./src/utils/pricing');
const app = express();
const PORT = process.env.PORT || 3000;
app.engine(
  'hbs',
  engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: 'views/layouts',
    partialsDir: 'views/partials',
  })
);
app.set('view engine', 'hbs');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Footer locals (required): fullName, studentId, VAT
app.use((req, res, next) => {
  res.locals.fullName = process.env.FULLNAME || 'Dang Cong Gia Han';
  res.locals.studentId = process.env.MSSV || '23IT067';
  res.locals.vatRate = getVatRate();
  next();
});
async function bootstrap() {
  await connectDatabases();
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_SESSION_URI || process.env.MONGO_WRITE_URI,
        dbName: process.env.DB_NAME || 'DB_23IT067',
        collectionName: 'sessions',
        ttl: 24 * 60 * 60,
      }),
      cookie: { maxAge: 24 * 60 * 60 * 1000 },
    })
  );
  app.use('/', bookRoutes);

  // Bai 1 proof: both least-privilege connections are alive
  app.get('/health', async (req, res) => {
    const readPing = await getReadConnection().db.admin().ping();
    const writePing = await getWriteConnection().db.admin().ping();
    res.json({
      ok: true,
      db: process.env.DB_NAME,
      read: readPing,
      write: writePing,
      sessionViews: req.session.views || 0,
    });
  });

  // demo that session survives (for Bai 2 autoscaling proof)
  app.get('/session-ping', (req, res) => {
    req.session.views = (req.session.views || 0) + 1;
    res.json({ views: req.session.views, sessionID: req.sessionID });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode || 500).send(err.message || 'Internal error');
  });

  app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
}

bootstrap().catch((err) => {
  console.error('Boot failed:', err.message);
  process.exit(1);
});
