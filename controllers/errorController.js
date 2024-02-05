const AppError = require('./../utils/appError');

//HANDLE CASTERROR IN DB (data that conflicts with defined schema)
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.keyValue.name;
    const message = `Duplicate field value: "${value}. Please use another value!"`
    return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    //this are the errors that goes to the client. They are called operational errors
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });

    //Programming or other unknown errors you don't want to leak the details
    } else {
        // 1) Log error
        console.error('ERROR 💥', err);

        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong',
            err
        });

    }
}

module.exports = (err, req, res, next) => {
    console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.ENV === 'production') {
        console.log('this error is only shown in development environment', err);
        let error = { ...err };
        if(error.reason != null){
            let test = error.reason.toString();
            if (test.startsWith('Error: Argument passed in must be a single String of 12 bytes or a string of 24 hex characters')) error = handleCastErrorDB(error);
        };
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error._message === 'Validation failed') error = handleValidatorErrorDB(error);

        sendErrorProd(error, res);
    }
};
