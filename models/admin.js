const mongoose = require("mongoose")


const adminSchema = mongoose.Schema({
    name:String,
    email:String,
    password:String,
    register:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"hospital"
    }]
   
})

module.exports = mongoose.model("admin",adminSchema);