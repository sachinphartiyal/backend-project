import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    //TODO: create playlist
    const owner = req.user?._id
    if (!name || !owner) {
        throw new ApiError(400, "Name and logged in user is required to create a playlist")
    }

    if (name == "" || name.trim().length === 0) {
        throw new ApiError(400, "playlist name cannot be empty")
    }

    const userExists = await User.exists({ _id: owner })
    if (!userExists) {
        throw new ApiError(404, "invalid user credentials")
    }

    const playlistAlreadyExists = await Playlist.findOne({ owner: owner, name: name })
    if (playlistAlreadyExists) {
        throw new ApiError(409, "playlist with the same name already exists")
    }

    const createPlaylist = await Playlist.create({
        name,
        description,
        owner,
    })

    if (!createPlaylist) {
        throw new ApiError(500, "problem occured while creating the playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { createPlaylist },
            "playlist created successfully"
        ))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    const userExists = await User.exists({ _id: userId })
    if (!userExists) {
        throw new ApiError(400, "user does not exists")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userDetails",
                pipelines: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                }
            }
        }
    ])

    if (!playlists) {
        throw new ApiError(500, "problem occured while fetching playlists")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { playlists },
            "playlists fetched successfully"
        ))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    const playlistExists = await Playlist.exists({ _id: playlistId })
    if (!playlistExists) {
        throw new ApiError(400, "playlist is invalid")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(500, "problem occured while fetching a playlist by id")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { playlist },
            "playlist fetched successfully"
        ))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    const [playlistExists, videoExists] = await Promise.all([
        Playlist.exists({ _id: playlistId }),
        Video.exists({ _id: videoId })
    ])

    if (!playlistExists || !videoExists) {
        throw new ApiError(400, "both video id and playlist id are required to add a video to a playlist")
    }

    const videoAdded = await Playlist.findByIdAndUpdate(playlistId,
        {
            $addToSet: { videos: videoId }
        },
        {
            new: true,
            runValidators: true
        }
    )

    if (!videoAdded) {
        throw new ApiError(500, "problem occured while adding video in playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { videoAdded },
            "video added to the playlist successfully"
        ))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    const [playlistExists, videoExists] = await Promise.all(
        [
            Playlist.exists({ _id: playlistId }),
            Video.exists({ _id: videoId })
        ]
    )

    if (!playlistExists || !videoExists) {
        throw new ApiError(400, "both video id and playlist id are required to remove video from playlist")
    }

    const videoDeleted = await Playlist.findByIdAndUpdate(playlistId,
        {
            $pull: { videos: videoId }
        },
        {
            new: true
        }
    )

    if (!videoDeleted) {
        throw new ApiError(500, "problem occured while deleting the video from playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { videoDeleted },
            "video removed from the playlist successfully"
        ))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    const playlistExists = await Playlist.exists({ _id: playlistId })
    if (!playlistExists) {
        throw new ApiError(400, "playlist id is required to remove playlist")
    }

    const playlistDeleted = await Playlist.findByIdAndDelete(playlistId)

    if (!playlistDeleted) {
        throw new ApiError(500, "problem occured while deleting playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { playlistDeleted },
            "playlist deleted successfully"
        ))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    const playlistExists = await Playlist.exists({ _id: playlistId })
    if (!playlistExists) {
        throw new ApiError(400, "playlist id is required to update playlist")
    }

    const updateData = {};
    if (name !== undefined && name.trim().length > 0) {
        updateData.name = name;
    }
    if (description !== undefined && description.trim().length > 0) {
        updateData.description = description;
    }

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "atleast one the field either name or description data is needed for updating")
    }

    const playlistUpdated = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set: updateData
        },
        {
            new: true,
            runValidators: true
        }
    )

    if (!playlistUpdated) {
        throw new ApiError(500, "problem occured while updating the playlist")
    }

    return res
        .status(200),
        json(new ApiResponse(
            200,
            { playlistUpdated },
            "playlist updated successfully"
        ))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
