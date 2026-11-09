import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { ROLE_VALUES, ROLES, EMAIL_REGEX } from '../../config/constants.js';
import { env } from '../../config/env.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [EMAIL_REGEX, 'Email is not valid'],
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: { values: ROLE_VALUES, message: 'Invalid role: {VALUE}' }, default: ROLES.TRAVELLER },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1, isActive: 1 });

userSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, env.BCRYPT_ROUNDS);
userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
