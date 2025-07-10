// This is where you define what a user document looks like in your MongoDB database.

import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true  // jab kisi field ko searchable banana ho.
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // cloudinary url
        required: true,
    },
    coverImage: {
        type: String, // cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video",
        }
    ],
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true })

// pre-middleware functions are executed before certain operations are performed on a Mongoose document or query.
// cannot use arrow functions here becoz it needs context (this).
// This is a hook that runs before calling .save() on a user document.

/* problem kya ki jab bhi user "save" krega kuch bhi toh password hash change hota rahega
so for that hum chahate hai ki jab password change ho tabhi password hashing change ho warna na ho. */

userSchema.pre("save", async function (next) {
    // if password field change ni huwa hai toh // true -> if changed
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

// .methods is used to add custom instance methods to our mongoose model.

// These methods are available on individual user objects.
// password: input password — usually the plain-text password entered by the user during login.
// this.password: hashed password that is stored in the user document in the database.
// this function checks whether the password entered by user during login is correct or not.

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// Generates a short-lived token (for login sessions).
// Includes basic user info (username, email, etc.).
// Syntax: jwt.sign(payload, secretOrPrivateKey, [options, callback])

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// Longer-lived token used to get a new access token without logging in again.
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);

