const mongoose = require("mongoose")
const ledgerModel = require("./ledger.model")

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [ true, "Account must be associated with a user" ],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: [ "ACTIVE", "FROZEN", "CLOSED" ],
            message: "Status can be either ACTIVE, FROZEN or CLOSED",
        },
        default: "ACTIVE"
    },
    currency: {
        type: String,
        required: [ true, "Currency is required for creating an account" ],
        default: "INR"
    }
}, {
    timestamps: true
})

accountSchema.index({ user: 1, status: 1 }) // Compound index on user and status to optimize queries that filter accounts by user and status, which is a common access pattern in account management systems. This index will speed up queries that look for accounts belonging to a specific user and having a particular status (e.g., ACTIVE), improving overall performance when retrieving account information based on these criteria.

accountSchema.methods.getBalance = async function () {
 //method to calculate the current balance of the account by aggregating the ledger entries associated with this account. 
 // It sums up all the debit and credit transactions to compute the net balance. This method is essential for providing real-time balance 
 // information when requested, ensuring that users see an accurate reflection of their account status based on all recorded transactions in the ledger.

    const balanceData = await ledgerModel.aggregate([
        { $match: { account: this._id } }, // Match ledger entries that are associated with the current account using its _id. This filters the ledger entries to only include those relevant to this specific account.
        {
            $group: { // Group the matched ledger entries to calculate the total debit and credit amounts for the account. The _id is set to null because we want to aggregate all entries into a single result, and we use conditional sums to separate debits and credits.
                _id: null,// Grouping key is null since we want a single aggregated result for the account

                totalDebit: {// Calculate the total debit amount by summing the amounts of ledger entries where the type is "DEBIT". 
                    $sum: {
                        $cond: [ //The $cond operator is used to check the type of each entry and include its amount in the sum only if it is a debit; otherwise, it contributes 0 to the total.
                            { $eq: [ "$type", "DEBIT" ] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: [ "$type", "CREDIT" ] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: { // After grouping, we project the final balance by subtracting totalDebit from totalCredit._id is excluded from the output since it's not needed in the final result. The balance is calculated as the difference between totalCredit and totalDebit, giving us the net balance of the account based on all its transactions.
                _id: 0, // Exclude the _id field from the output since it's not needed in the final result.
                balance: { $subtract: [ "$totalCredit", "$totalDebit" ] }
            }
        }
    ])

    if (balanceData.length === 0) {
        return 0
    }

    return balanceData[ 0 ].balance // Return the calculated balance from the aggregation result. 
    // Since the aggregation returns an array, we access the first element (balanceData[0]) to get the balance value, 
    // which represents the current balance of the account after considering all debits and credits.

}


const accountModel = mongoose.model("account", accountSchema)



module.exports = accountModel