const express = require('express');
const morgan = require('morgan');

// IMPORTTING MY OWN DEFINED ROUTE
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const noteRouter = require('./routes/noteRoutes');

const app = express();

//1) MIDDLEWARES
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);

    next();
});

//2) ROUTES MOUNTING
app.use('/api/v1/notes', noteRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);

module.exports = app;

