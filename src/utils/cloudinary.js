import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localpath) => {
    if(!localpath) return null
    try {
        const response = await cloudinary.uploader
       .upload(
           localpath, {
               resource_type : "auto"
           }
       )
    
    console.log("file is uploaded on cloudinary " + response);
    fs.unlinkSync(localpath)
    return response

    } catch (error) {
        fs.unlink(localpath) // removes the file from local server in case of failed attempt to upload it.
        return null
    }

}

export {uploadOnCloudinary}


