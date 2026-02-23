require("dotenv").config()

const app = require("./src/app")
const connectToDB = require("./src/config/db")

async function startServer() {
    try {
        await connectToDB()
        app.listen(3000, () => {
            console.log("Server is running on port 3000")
        })
    } catch (error) {
        console.error("Failed to start server:", error.message)
        process.exit(1)
    }
}

startServer()