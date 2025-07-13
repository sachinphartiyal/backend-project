import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const sortOrder = sortType == "asc" ? 1 : -1;
    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const filteredPaginatedVideos = await Video.aggregatePaginate(Video.aggregate([
        {
            $match: {

                // $regex is a MongoDB operator that allows you to use a regular expression to match string patterns.
                $or: [
                    {
                        title: { $regex: query, $options: "i" }  // i means ignore case
                    },
                    {
                        description: { $regex: query, $options: "i" }
                    }
                ]
            }
        },
        {
            $sort: { [sortBy]: sortOrder }  // // Square brackets [] around sortBy allow you to use the value of the variable as the key.
        }
    ]), options);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { videos: filteredPaginatedVideos },
            "Sorted filtered videos with pagination has been fetched successfully"
        ))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!(title?.trim()) || !(description?.trim())) {
        throw new ApiError(400, "Video title and description both is required");
    }

    let thumbnailUrl;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length) {
        thumbnailUrl = await uploadOnCloudinary(req.files.thumbnail[0].path);
    }
    else {
        throw new ApiError(400, "Thumbnail file is missing");
    }

    let videoFileUrl;
    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length) {
        videoFileUrl = await uploadOnCloudinary(req.files.videoFile[0].path);
    }
    else {
        throw new ApiError(400, "Video file is missing");
    }

    if (!thumbnailUrl || !videoFileUrl) {
        throw new ApiError(500, "Error uploading video files or thumbnail on cloudinary")
    }

    const newVideo = await Video.create({
        title: title.trim(),
        description: description.trim(),
        thumbnail: thumbnailUrl.url,
        videoFile: videoFileUrl.url,
        owner: req.user?._id,
        duration: videoFileUrl.duration
    })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { video: newVideo },
            "New video has been added successfully"
        ))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId) {
        throw new ApiError(400, "Video ID is not provided");
    }

    const fullVideo = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
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
        {
            $project: {
                owner: 0
            }
        }
    ])

    if (!fullVideo.length) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { fullVideo: fullVideo[0] },
            "Video with owner details fetched successfully"
        ))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    if (!videoId) {
        throw new ApiError(400, "Video ID is not provided");
    }

    if (!title && !description && !req.file) {
        throw new ApiError(400, "Any of the title, description and thumbnail is required for update")
    }

    const existingVideo = await Video.findById(videoId);
    if (!existingVideo) {
        throw new ApiError(404, "Video not found");
    }

    const oldThumbnail = existingVideo.thumbnail;

    if (String(existingVideo.owner) !== req.user?._id) {
        throw new ApiError(402, "Unauthorized for this action");
    }

    const thumbnailPath = req.file?.path;
    const thumbnailUrl = await uploadOnCloudinary(thumbnailPath);

    existingVideo.title = title?.trim() || existingVideo.title;
    existingVideo.description = description?.trim() || existingVideo.description;
    existingVideo.thumbnail = thumbnailUrl || existingVideo.thumbnail;

    await existingVideo.save();

    if (thumbnailUrl) {
        await deleteFromCloudinary(oldThumbnail);
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { newVideo: existingVideo },
            "Video updated successfully"
        ))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId) {
        throw new ApiError(400, "Video Id is not provided");
    }

    const existingVideo = await Video.findById(videoId);
    if (!existingVideo) {
        throw new ApiError(404, "Video not found");
    }

    const oldThumbnail = existingVideo.thumbnail;
    const oldVideo = existingVideo.videoFile;

    if (String(existingVideo.owner) !== req.user?._id) {
        throw new ApiError(402, "Unauthorized to perform this action");
    }

    await Video.findByIdAndDelete(videoId);
    await deleteFromCloudinary(oldThumbnail);
    await deleteFromCloudinary(oldVideo);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Video deleted successfully"
        ))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "Video ID is not provided");
    }

    const existingVideo = await Video.findById(videoId);
    if (!existingVideo) {
        throw new ApiError(404, "Video not found");
    }

    if (String(existingVideo.owner) !== req.user?._id) {
        throw new ApiError(402, "User not authorized to perform this action");
    }

    existingVideo.isPublished = !existingVideo.isPublished;
    await existingVideo.save();
    const status = existingVideo.isPublished ? "Published" : "Unpublished";

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                video: existingVideo,
                status
            },
            `Video has been ${status} successfully`
        ))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
