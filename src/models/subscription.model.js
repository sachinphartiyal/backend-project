import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
        ref: "User"
    },

}, { timestamps: true })

export const Subscription = mongoose.model("Subscription", subscriptionSchema);


/*
dono subscriber and channel hai toh user hii.

how to know no. of subscribers of a channel named "chai aur code"?
we will count the no. of documents where channel = "chai aur code"

how to know no. of channels a subscriber named "A" has subscribed to?
we will count the no. of documents where subscriber = "A" 
*/