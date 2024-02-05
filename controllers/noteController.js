const Note = require('./../models/noteModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getTop5RatedNotes = (req, res, next) => {
    req.query.sort = '-price';
    req.query.limit = '5';
    req.query.fields = 'topic,author,summary,price,ratings,rated18';
    next();

};

exports.getAllNotes = catchAsync(async (req, res, next) => {

    //EXECUTE QUERY
    const features = new APIFeatures(Note.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const notes = await features.query;
    
    //SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: notes.length,
        data: {notes}
    });
});

exports.getNote = catchAsync(async (req, res, next) => {
    const note = await Note.findById(req.params.id);
    if (!note) {
        return next(new AppError ('No note is found with that ID', 404))        
    }

    res.status(200).json({
        status: 'success',
        data: {note}
    });
});

exports.createNote = catchAsync(async(req, res, next) => {
    const newNote = await Note.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            note: newNote
        }
    });
});

exports.updateNote = catchAsync(async(req, res, next) => {
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!note) {
        return next(new AppError('No note found with that ID', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            note
        }
    });
});

exports.deleteNote = catchAsync(async(req, res, next) => {
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
        return next(new AppError('No note is found with that ID', 404));
    };

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.getNoteStats = catchAsync(async (req, res, next) => {
    const stats = await Note.aggregate([
        {
            $match: { ratings: {$gte: 3} }
        },
        {
            $group: {
                _id: { $toUpper: 'topic' },
                numNotes: { $sum: 1 },
                numRatings: { $sum: '$ratings' },
                avgRating: { $avg: '$ratings' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price'},
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});
