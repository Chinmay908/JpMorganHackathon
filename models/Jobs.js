const mongoose = require('mongoose')

mongoose.connect("mongodb://localhost:27017/userDB",{
    useNewUrlParser:true,
    useUnifiedTopology:true
})

const JobsSchema = mongoose.Schema({
    title:{
        type:String,
        required: true
    },
    description:{
        type:String,
        unique:true,
        required:true
    },
    type:{
        type:String,
        required:true
    },
    salary:{
        type:String,
        required : true
    },
    qualification:{
        type:String
    }
})

const jobModel = mongoose.model('job',JobsSchema)

module.exports = jobModel;