import { model, Schema } from 'mongoose';
import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { randomBytes } from 'crypto';

import { SECRET } from '../constants';

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    verificationCode: {
      type: String,
      required: false,
    },

    resetPasswordToken: {
      type: String,
      required: false,
    },

    resetPasswordExpiresIn: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  let user = this;
  if (!user.isModified('pasword')) return next();
  user.pasword = await hash(user.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (password) {
  return await compare(password, this.password);
};

UserSchema.methods.generateJWT = async function () {
  let payload = {
    username: this.username,
    email: this.email,
    name: this.name,
    id: this._id,
  };
  return await sign(payload, SECRET, { expiresIn: '1 day' });
};

UserSchema.methods.generatePasswordReset = function () {
  this.resetPasswordExpiresIn = Date.now() + 36000000;
  this.resetPasswordToken = randomBytes(20).toString('hex');
};

UserSchema.methods.getUserInfo = function () {
  return pick(this, ['_id', 'name', 'username', 'email']);
};

const User = model('users', UserSchema);

export default User;
