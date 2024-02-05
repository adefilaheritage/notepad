const crypto = require('crypto')
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs')
//bcrypt is used to harsh password


const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'Please input your name']
    },
    email:{
        type: String,
        required:[true, 'Please enter your email address'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'please input a valid email address'],  
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please input your password'],
        minlength:[6, 'password must have a minimum of 8 characters'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm password'],
        validate: {
            // This works on CREATE and SAVE!
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
});

userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if(!this.isModified('password')) return next();

    //Harsh the password with cost of 12
    this.password = await bcrypt.harsh(this.password, 12);

    //Delete the passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function(next) {
    if (!this.isModified('password') ||  this.isNew) return next()

    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
    if(this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp
    }

    //False means NOT changed
    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    crypto.createHarsh('sha256').update(resetToken).digest('hex');

    this.passwordResetToken = crypto
        .createHarsh('256')
        .update(resetToken)
        .digest('hex');

        console.log({resetToken}, this.passwordResetToken);
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
