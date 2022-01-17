const mongoose = require('mongoose')

mongoose.connect("mongodb://localhost:27017/userDB",{
    useNewUrlParser:true,
    useUnifiedTopology:true
})

const resourceSchema = mongoose.Schema({
    title:{
        type:String,
        unique:true,
        required: true
    },
    link:{
        type:String,
        unique:true,
        required:true
    }
})

const resourceModel = mongoose.model('resource',resourceSchema)

module.exports = resourceModel;