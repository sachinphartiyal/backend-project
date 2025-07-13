import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video Id is required");
    }

    const isVideoExist = await Video.exists({ _id: videoId });
    if (!isVideoExist) {
        throw new ApiError(404, "Video not found with this video id");
    }

    // Pagination options
    const { page = 1, limit = 10 } = req.query;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    // aggregation pipeline to get comments
    const commentsAggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentUser",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },

        // flatten the array field i.e [{}] to {}
        {
            $unwind: {
                path: "$commentUser",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                username: "$commentUser.username",
                avatar: "$commentUser.avatar"
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                username: 1,
                avatar: 1
            }
        },

        // sorts the comments in descending order of createdAt field.
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    const paginatedVideoComments = await Comment.aggregatePaginate(commentsAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                comments: paginatedVideoComments
            },
            "Paginated video comments has been fetched successfully"
        ))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body;
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const isVideoExist = await Video.exists({ _id: videoId });
    if (!isVideoExist) {
        throw new ApiError(404, "Video not found with this video id");
    }

    if (!(content?.trim())) {
        throw new ApiError(400, "Comment content is missing and is required");
    }

    const newComment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user?._id
    })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                comment: newComment
            },
            "Comment has been added successfully"
        ))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    if (!commentId) {
        throw new ApiError(400, "Comment ID is missing");
    }

    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
        throw new ApiError(404, "Comment not found");
    }

    if (!existingComment.owner.equals(req.user?._id)) {
        throw new ApiError(403, "User not authorized to perform this action");
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment must not be blank");
    }

    existingComment.content = content.trim();
    existingComment.updatedAt = new Date();
    await existingComment.save();

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                comment: existingComment
            },
            "Comment updated successfully"
        ))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if (!commentId) {
        throw new ApiError(400, "Comment ID is missing");
    }

    // Mongoose automatically fetches the video document with _id: "v789" from the videos collection 
    // and replaces the video field with the actual video data:
    const comment = await Comment.findById(commentId).populate("video");

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // first cond: the user who posted the comment
    // second cond: the owner of the video is allowed to delete others comments
    if (!comment.owner.equals(req.user?._id) && !comment.video?.owner.equals(req.user?._id)) {
        throw new ApiError(402, "User not authorized to perform this action");
    }

    await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        ))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
