import {asyncHandler} from "../utils/asyncHandler.js"


const registerUser = asyncHandler(async (req,res) => {

    // Algorithm for Registering user : 
    /*
    1.Take user data as input
    2.validate the input data
    3.check if user already exists
    4.check for images and avatar , upload files such as avatar and cover image into our local server
    5.then upload files from our local server to the cloudinary and get their url
    6.create user object - create entry in db
    7.remove password and refresh token from field response
    8.check for user creation
    9.return response    
    */


    res.status(200).json({
        message : "ok"
    })
})

export {registerUser}
