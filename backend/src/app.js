const path = require('path');
const express = require('express');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/env');
const routes = require('./routes');
const corsMiddleware = require('./middlewares/cors');
const errorHandler = require('./middlewares/errorHandler');

const swaggerDocument = require(path.join(__dirname, '..', '..', 'swagger', 'swagger.json'));

const app = express();

app.use(express.json());
app.use(corsMiddleware);
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/api-docs/swagger.json', (req, res) => res.json(swaggerDocument));
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { explorer: true, customSiteTitle: 'TodoListApp API Docs' }),
);

app.use('/api/v1', routes);

app.use(errorHandler);

module.exports = app;
