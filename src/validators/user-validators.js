import { check } from 'express-validator';

const name = check('name', 'Name is required').not().isEmpty();
const username = check('username', 'Username is required').not().isEmpty();
const email = check('email', 'Please Provide a valid email').isEmail();
const password = check('password', 'Password is required').not().isLength({
  min: 6,
});

export const RegisterValidators = [password, name, username, email];
export const AuthenicateValidators = [username, password];
