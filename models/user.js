const mongoose = require("mongoose")

mongoose.connect("mongodb://localhost:27017/medicare")

const userSchema = mongoose.Schema({
    name:String,
    username:String,
    email:String,
    password:String,
    appointments:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"hospital"
    }],
    accapp:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"hospital"
    }]
})

module.exports = mongoose.model("user",userSchema)