const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

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

        next();
    };
};


exports.forgotPassword = catchAsync(async(req, res, next) => {
    //STEP 1: GET USER BASED ON POSTED EMAIL
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with the email address you provided.', 404));
    }

    //STEP 2: GENERATE THE RANDOM RESET TOKEN
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //STEP 3: SEND IT TO USER'S EMAIL
    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password
     and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password,
     please ignore this email`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        });

        res.status(200).json({
            status: "success",
            message: "Token sent to your email address"
        });

    }catch(err){
        console.log(err);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Try again later!'),500);
    }

});

exports.resetPassword = catchAsync(async(req, res, next) => {
    //STEP 1: GET USER BASED ON THE TOKEN
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {$gt:Date.now()}
    });

    //STEP 2: IF THE TOKEN HAS NOT EXPIRED, AND THERE IS A USER, SET THE NEW PASSWORD
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //STEP 3: UPDATE PASSWORDAT PROPERTY FOR THE USER

    //STEP 4: LOG THE USER IN, SEND JWT
    const token = signToken(user._id);

    res.status(200).json({
        status: 'success',
        token
    });
});