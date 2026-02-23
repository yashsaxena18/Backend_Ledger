const mongoose = require("mongoose")


const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [ true, "Transaction must be associated with a from account" ],
        index: true  // Adding an index on fromAccount to optimize queries that filter transactions by the originating account, which is a common access pattern when retrieving transaction history for a specific account. This index will speed up queries that look for transactions where the fromAccount matches a particular account ID, improving overall performance when fetching transaction data based on the source account.
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [ true, "Transaction must be associated with a to account" ],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: [ "PENDING", "COMPLETED", "FAILED", "REVERSED" ],
            message: "Status can be either PENDING, COMPLETED, FAILED or REVERSED",
        },
        default: "PENDING"
    },
    amount: {
        type: Number,
        required: [ true, "Amount is required for creating a transaction" ],
        min: [ 0, "Transaction amount cannot be negative" ]
    },
    idempotencyKey: {  
    // The idempotencyKey field is used to ensure that the same transaction is not processed multiple times in case of retries or duplicate requests. 
    // By enforcing uniqueness on this field, we can prevent the creation of duplicate transactions with the same idempotency key,
    // which is crucial for maintaining data integrity and consistency in financial applications where duplicate transactions can lead to incorrect balances and other issues.
        type: String,
        required: [ true, "Idempotency Key is required for creating a transaction" ],
        index: true,
        unique: true
    }
}, {
    timestamps: true
})

const transactionModel = mongoose.model("transaction", transactionSchema)


module.exports = transactionModel   