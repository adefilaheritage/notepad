const mongoose = require('mongoose');
const slugify = require('slugify');

const noteSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: [true, 'A note must have a topic'],
        trim: true,
        maxlength: [50, 'A topic must have a maximum of 50 characters'],
        minlength: [2, 'A topic must have at least 2 characters ']
    },
    slug: String,
    author: {
        type: String,
        required: [true, 'A note must have a writer']
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A note must have a description']
    },
    body: {
        type: String,
        required: [true, 'A note must have a body']
    },
    privateNote: {
        type: Boolean,
        default: false
    },
    rated18: {
        type: Boolean,
        default: true,
        required: [true, 'Indicate if this note if this note is safe for children under 18 years']
    },
    dateCreated: {
        type: Date,
        default: Date.now(),
        select: false
    },
    ratings: {
        type: Number,
        default: 1
    },
    price: {
        type: Number,
        default: 0
    }
}, {
    toJSON: { virtuals: true },
    toObject: {virtuals: true }
});

//DOCUMENT MIDDLEWARE: this runs before .save() and .create()
noteSchema.pre('save', function(next) {
    //pre middleware runs between when the data is received and when it is persisted to the database
    this.slug = slugify(this.topic, {lower: true });
    next();
});

//QUERY MIDDLEWARE
noteSchema.pre(/^find/, function(next) {
    this.find({ privateNote: {$ne: true} });

    this.starttime = Date.now();
    next();
});

noteSchema.post(/^find/, function(docs, next) {
    console.log(`Your Query took ${Date.now() - this.starttime} milliseconds!`);
    next();
});

//AGGREGATION MIDDLEWARE
noteSchema.pre('aggregate', function(next) {
    this.pipeline().unshift({ $match: { privateNote: { $ne: true } } });
    
    console.log(this.pipeline());

    next();

});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
