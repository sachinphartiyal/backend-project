import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// JWT authentication middleware
// if user ke paas valid token hai then i will be adding req.user field in it.
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // Step 1: Get JWT Token from Request
        // In an Express.js app, if you're using cookie-parser middleware, it adds a cookies object to the req (request) object.
        // Second one gets the value of the Authorization header from the incoming request.
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        // Step 2: If Token Not Found
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        // Step 3: Verify JWT
        // If the token is valid: You get back the payload (the data you encoded earlier during token generation)
        // jwt.verify(token, secretOrPublicKey, options)
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Step 4: Find User in DB
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        // Step 5: If User Not Found
        // Even if the token is valid, the user might be deleted or blocked — so this check ensures the user still exists.
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        // Step 6: Attach User to Request
        // this user object will be accessible in any route handler that runs after this middleware.
        req.user = user;
        next(); // aab next middleware ya function mai jaayo
    }
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }

})