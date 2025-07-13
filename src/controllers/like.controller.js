import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: toggle like on video
    if (!videoId) {
        throw new ApiError(400, "Video ID is missing");
    }

    const isVideoExist = await Video.exists({ _id: videoId });
    if (!isVideoExist) {
        throw new ApiError(404, "Video not found with this Video ID");
    }

    const like = await Like.findOne(
        {
            likedBy: req.user?._id,
            video: videoId
        }
    )

    let likedStatus;
    if (!like) {
        await Like.create(
            {
                likedBy: req.user?._id,
                video: videoId
            }
        )
        likedStatus = "Liked";
    } else {
        await like.deleteOne();
        likedStatus = "Unliked"
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { status: likedStatus },
            `Video has been ${likedStatus} successfully`
        ))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!commentId) {
        throw new ApiError(400, "Comment ID is missing");
    }

    const isCommentExist = await Comment.exists({ _id: commentId });
    if (!isCommentExist) {
        throw new ApiError(404, "Comment not found with this Comment ID");
    }

    const like = await Like.findOne(
        {
            likedBy: req.user?._id,
            comment: commentId
        }
    )

    let likedStatus;
    if (!like) {
        await Like.create(
            {
                likedBy: req.user?._id,
                comment: commentId
            }
        )
        likedStatus = "Liked";
    } else {
        await like.deleteOne();
        likedStatus = "Unliked"
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { status: likedStatus },
            `Comment has been ${likedStatus} successfully`
        ))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is missing");
    }

    const isTweetExist = await Tweet.exists({ _id: tweetId });
    if (!isTweetExist) {
        throw new ApiError(404, "Tweet not found with this Tweet ID");
    }

    const like = await Like.findOne(
        {
            likedBy: req.user?._id,
            tweet: tweetId
        }
    )

    let likedStatus;
    if (!like) {
        await Like.create(
            {
                likedBy: req.user?._id,
                tweet: tweetId
            }
        )
        likedStatus = "Liked";
    } else {
        await like.deleteOne();
        likedStatus = "Unliked"
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { status: likedStatus },
            `Tweet has been ${likedStatus} successfully`
        ))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),

                // Ensures the video field exists and is not null
                video: {
                    $exists: true,
                    $ne: null  // ne = not equal
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "video",
                as: "videoDetails"
            }
        },
        {
            $unwind: {
                path: "$videoDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "videoDetails.owner",
                as: "ownerInfo",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "$ownerInfo",
                preserveNullAndEmptyArrays: true
            }
        },

        // Injects the fetched user info into videoDetails.owner
        {
            $addFields: {
                "videoDetails.owner": "$ownerInfo"
            }
        },
        {
            $replaceRoot: {
                newRoot: "$videoDetails"
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { likedVideos },
            "Liked video details has been fetched successfully"
        ))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}