import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


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


    const {fullName,email,password,userName} = req.body
    if(
        [fullName,email,password,userName].some((field) => 
        field?.trim() === "")
    ){
        return new ApiError(400,"All fields are required")
    }

    const exitstedUser = await User.findOne({
        $or: [{email},{userName}]
    })

    if(exitstedUser) { throw new ApiError(409,"User already existed") }

    const avatarLocalFilePath = req.files?.avatar[0]?.path
    // const coverImageLocalFilePath = req.files?.coverImage[0]?.path

    let coverImageLocalFilePath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalFilePath = req.files.coverImage[0].path;
    }

    if(!avatarLocalFilePath){
        throw new ApiError(400,"Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalFilePath)
    const cover = await uploadOnCloudinary(coverImageLocalFilePath)

    if(!avatar){
        throw new ApiError(500,"failed upload avatar on cloudinary")
    }

    const user = await User.create(
        {fullName : fullName,
        userName : userName.toLowerCase(),
        email : email,
        password : password,
        avatar : avatar.url,
        coverImage: cover?.url || ""}
    )

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(501,"Failed to create user")
    }

    return res.status(201).json(
        new ApiResponse(201,createdUser,"user created successfully")
    )
    
})

export {registerUser}
