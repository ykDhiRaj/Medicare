const mongoose = require("mongoose")

const hospitalSchema = mongoose.Schema({
    name:String,
    email:String,
    password:String,
    user:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }],
    admin:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"admin"
    }
})

module.exports = mongoose.model("hospital",hospitalSchema)