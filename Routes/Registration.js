const express = require('express');
const route = express.Router();

const { RegistrationUserInFormation, NewRegistrationUser, DeleteUser, UpdateInformathin } = require('../Controlear/RegistrationControlear');

route.get('/:page', RegistrationUserInFormation);
route.post('/', NewRegistrationUser);
route.delete('/', DeleteUser);
route.put('/', UpdateInformathin);

module.exports = route;
