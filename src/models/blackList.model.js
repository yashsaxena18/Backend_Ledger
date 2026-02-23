const mongoose = require("mongoose");


const tokenBlacklistSchema = new mongoose.Schema({
    // The token field is defined as a string that is required for creating a blacklist entry and must be unique to prevent duplicate entries of the same token.
    // This ensures that each blacklisted token is stored only once in the database, allowing for efficient lookups when checking if a token is blacklisted during authentication or authorization processes.
    token: {
        type: String,
        required: [ true, "Token is required to blacklist" ],
        unique: [ true, "Token is already blacklisted" ]
    }
}, {
    timestamps: true
})

tokenBlacklistSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 60 * 60 * 24 * 3 // 3 days
})

const tokenBlackListModel = mongoose.model("tokenBlackList", tokenBlacklistSchema);

module.exports = tokenBlackListModel;