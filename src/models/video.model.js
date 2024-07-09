import mongoose, {Schema} from "mongoose";

const videoSchema = new Schema({

    title : {
        type: String,
        require : true,       
        lowercase : true,
        trim : true,
    },
    description : {
        type: String,
        require : true,
        lowercase : true,
        trim : true,
    },
    videoFile : {
        type : String, // cloudinary url
        required : true,
    },
    thumbnail : {
        type : String, // cloudinary url
        required : true,
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    duration : {
        type : Number,
        required : true,
    },
    views : {
        type : Number,
        default : 0,
    },
    isPublished : {
        type : Boolean,
        default : true,
    }

        
},{timestamps : true})

export const Video = mongoose.model("Video",videoSchema)