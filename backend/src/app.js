const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use('/api/v1', routes);

app.use(errorHandler);

module.exports = app;
