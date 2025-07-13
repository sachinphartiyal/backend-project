import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    // object comparisons are reference based not value based so converted into String
    if (String(channelId) === String(req.user?._id)) {
        throw new ApiError(400, "User cannot subscribe/unsubscribe its own channel")
    }

    const isChannelExist = await User.exists({ _id: channelId });
    if (!isChannelExist) {
        throw new ApiError(404, "Channel with this ID does not exist");
    }

    const subscription = await Subscription.findOne({ channel: channelId, subscriber: req.user?._id })
    let isSubscribed;
    if (subscription) {
        await subscription.deleteOne();
        isSubscribed = false;
    }
    else {
        await Subscription.create({
            channel: channelId,
            subscriber: req.user?._id
        })
        isSubscribed = true;
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            `channel has been ${isSubscribed ? "subscribed" : "unsubscribed"} successfully`
        ))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    const isChannelExist = await User.exists({ _id: channelId });
    if (!isChannelExist) {
        throw new ApiError(404, "Channel not found with this channel ID");
    }

    const subscriberList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberInfo",
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
                path: "$subscriberInfo",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                username: "$subscriberInfo.username",
                fullName: "$subscriberInfo.fullName",
                avatar: "$subscriberInfo.avatar"
            }
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                avatar: 1
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { subscriber: subscriberList },
            "All subscriber are fetched successfully"
        ))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!subscriberId) {
        throw new ApiError(400, "Subscriber ID is required");
    }

    const isSubscriberExist = await User.findById(subscriberId)
    if (!isSubscriberExist) {
        throw new ApiError(404, "Subscriber not found with this subscriber ID");
    }

    const channelList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelInfo",
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
                path: "$channelInfo",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                username: "$channelInfo.username",
                fullName: "$channelInfo.fullName",
                avatar: "$channelInfo.avatar"
            }
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                avatar: 1
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { subscriber: channelList },
            "All channel details subscribed by the subscriber are fetched successfully"
        ))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}