import { Router } from 'express';
import { randomBytes } from 'crypto';
import { join } from 'path';

import { DOMAIN } from '../constants';
import { User } from '../models';
import { RegisterValidations } from '../validators';
import validationMiddleware from '../middlewares/validator-middleware';
import sendMail from '../functions/email-sender';

const router = Router();

/**
 * @description To create a new user Account
 * @access public
 * @api  /users/api/register
 * @type POST
 */

router.post(
  '/api/register',
  RegisterValidations,
  validationMiddleware,
  async (req, res) => {
    try {
      let { username, email } = req.body;

      // check if the username is taken or not
      let user = await User.findOne({ username });
      // if the user with that username already exists
      if (user) {
        return res.json({
          success: false,
          message: 'Username already exists',
        });
      }

      user = await User.findOne({ email });
      // Check if the user exists with that email
      if (user) {
        return res.status(400).json({
          success: false,
          message:
            'Email is already registered. Did you forget the password. Try resetting it',
        });
      }

      user = new User({
        ...req.body,
        verificationCode: randomBytes(20).toString('hex'),
      });

      /** saving the newly created user into the database */
      await user.save();

      /** send the email to the user with a verification link */
      let htmlEmailCode = `
        <div>
            <h1>Hello, ${user.username}</h1>
            <p>Please click the following link to verify your account.</p>
            <a href="${DOMAIN}users/verify-now/${user.verificationCode}">Verify Now<a>
        </div>`;

      await sendMail(
        user.email,
        'Verification Account',
        'Please verify Your Account.',
        htmlEmailCode
      );
      return res.status(201).json({
        success: true,
        message:
          'Hurray! Your account is created. Please verify your email address',
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        messag: 'An error occured while registering users',
      });
    }
  }
);

/**
 * @description
 * @api /users/verify-now/:verificationCode
 * @access PUBLIC <Only via email>
 * @type GET
 */
router.get('/verify-now/:verificationCode', async (req, res) => {
  try {
    let { verificationCode } = req.params;

    let user = await User.findOne({ verificationCode });
    if (!user) {
      return res.status(401).json({
        message: 'Unauthorized access. Invalid Verification Code',
      });
    }
    user.verified = true;
    user.verificationCode = undefined;
    await user.save();
    return res.sendFile(
      join(__dirname, '../templates/verification-success.html')
    );
  } catch (err) {
    return res.sendFile(
      join(__dirname, '../templates/verification-errors.html')
    );
  }
});

export default router;
