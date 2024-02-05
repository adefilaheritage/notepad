const express = require('express');
const noteController = require('./../controllers/noteController');
// const authController = require('./../controllers/authController');

const router = express.Router();

router.route('/top-5-rated')
    .get(noteController.getTop5RatedNotes, noteController.getAllNotes);

router.route('/getNoteStats')
    .get(noteController.getNoteStats, noteController.getNoteStats);

router.route('/')
    .get(noteController.getAllNotes)
    .post(noteController.createNote);

router.route('/:id')
    .get(noteController.getNote)
    .patch(noteController.updateNote)
    .delete(noteController.deleteNote);

module.exports = router;
