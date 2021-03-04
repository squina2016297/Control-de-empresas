'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = Schema({
    name: String,
    username: String,
    password: String,
    phone: Number,
    address: String,
    role: String,
    cant: Number,
    empleados: [{type: Schema.ObjectId, ref: 'empleado'}]
});

module.exports = mongoose.model('user', userSchema);
