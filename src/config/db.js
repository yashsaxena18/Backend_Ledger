const mongoose = require("mongoose")

function connectToDB() {
    return mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log("✓ Server is connected to DB")
        })
        .catch(err => {
            console.error("✗ Error connecting to DB:", err.message)
            console.error("MongoDB URI:", process.env.MONGO_URI ? "Set" : "NOT SET")
            process.exit(1)
        })
}

module.exports = connectToDB