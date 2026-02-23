const mongoose = require("mongoose") // For defining the user schema and model
const bcrypt = require("bcryptjs") // For hashing passwords securely


const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [ true, "Email is required for creating a user" ],
        trim: true,
        lowercase: true,
        match: [ /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid Email address" ],
        unique: [ true, "Email already exists." ]
    },
    name: {
        type: String,
        required: [ true, "Name is required for creating an account" ]
    },
    password: {
        type: String,
        required: [ true, "Password is required for creating an account" ],
        minlength: [ 6, "password should contain more than 6 character" ],
        select: false // IMP : Exclude password from query results by default for security reasons
    },
    // systemUser field to identify if the user is a system-generated user (e.g., for testing or internal use)
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true, // Once set, this field cannot be changed to prevent misuse
        select: false
    }
}, {
    timestamps: true
})

userSchema.pre("save", async function () {
    if (!this.isModified("password")) { // If the password field is not modified, skip hashing to avoid rehashing an already hashed password
        return
    }

    const hash = await bcrypt.hash(this.password, 10) // 10 rounds of salt for hashing the password securely why 10? because it provides a good balance between security and performance. It makes the hashing process slower, which helps protect against brute-force attacks, while still being efficient enough for most applications.
    this.password = hash // Replace the plain text password with the hashed version before saving to the database

    return // No need to return anything from a pre-save hook, but we can return to exit early if needed

})

userSchema.methods.comparePassword = async function (password) { // Method to compare a plain text password with the hashed password stored in the database. This is used during login to verify the user's credentials.

    console.log(password, this.password)

    return await bcrypt.compare(password, this.password)

}


const userModel = mongoose.model("user", userSchema) // Create a Mongoose model named "user" using the defined userSchema. This model will be used to interact with the "users" collection in the MongoDB database, allowing us to perform CRUD operations on user documents.

module.exports = userModel