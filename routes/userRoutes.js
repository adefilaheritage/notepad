const route = require('./noteRoutes');
const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.router();

router.post('/signup', authController.signup);

route.route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);