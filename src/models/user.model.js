import mongoose, {Schema} from "mongoose";

const userSchema = new Schema({
    userName : {
        type: String,
        require : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true,
    },
    email : {
        type: String,
        require : true,
        unique : true,
        lowercase : true,
        trim : true,
    },
    fullName : {
        type: String,
        require : true,        
        lowercase : true,
        trim : true,        
    },
    password : {
        type: String,
        require : [true, "password is required"],
    },
    avatar : {
        type : String, // cloudinary url
        required : true,
    },
    coverImage : {
        type : String,
        required : true,
    },
    refreshToken : {
        type : String,
    },
    watchHistory : [{
        type : Schema.Types.ObjectId,
        ref : "Video"
    }]

    
},{timestamps : true})


export const User = mongoose.model("User",userSchema)