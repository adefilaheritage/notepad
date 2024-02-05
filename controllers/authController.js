const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./utils/email');

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            user: newUser
        }
    });
});


exports.login = catchAsync(async(req, res,next) =>{
    const { email, password } = req.body;

    //STEP 1: Checks if email and password is inputed
    if(!email || !password) {
        return next(new AppError ('Please input the username and email', 400));
    }

    //STEP 2: Check if the user exists && if password is correct
    const user = User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    //STEP 3: Sends token (JWT) to client if everything is okay
    const token = signToken(user._id);

    res.status(200).json({
        status: 'success',
        token
    });
});

exports.protect = catchAsynce(async (req, res, next) => {
    //STEP 1: Get token from req.headers and set to token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if(!token) {
        return next(new AppError('You are not logged in! Please log in to get access', 401));
    }

    //STEP 2: Verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);


    //STEP 3: Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if(!freshUser) {
        return next(new AppError('The user assigned to this token no longer exist.', 401));
    };


    //STEP 4: Check if user changed password after the token was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    //GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }

    }
}