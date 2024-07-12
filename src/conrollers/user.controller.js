import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import mongoose from "mongoose";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken = async(userid) => {
    try {
        const user = await User.findById(userid)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()
        
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave : false })
        
        return {refreshToken,accessToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

const generateAccessTokenUsingRefreshToken = asyncHandler(async (req,res) => {

    const incomingRefreshToken = req.cookies?.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(400,"Unauthorized Access");
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedRefreshToken._id)
        if(!user){
            throw new ApiError(400,"Invalid refresh token or refresh token expired")
        }
        if(user?.refreshToken != incomingRefreshToken){
            throw new ApiError(400,"Invalid refresh token")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {newRefreshToken,accessToken} = await generateAccessAndRefreshToken(user._id);
        
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access token generated")
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})


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

    const avatarLocalFilePath = req.files?.avatar[0]?.path;
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



const loginUser = asyncHandler(async (req, res) =>{
    /* Algorithm for logIn a user
        - Take imput from user , req.body 
        - validate input
        - check if username or email exists
        - check if password match
        - generate refresh token and access token 
        - send cookie
    */


    const {email,password,userName} = req.body
    // console.log(email);

    if(!userName && !email){
        throw new ApiError(400,"All inputs fields are required")
    }

    const user = await User.findOne({
        $or: [{email},{userName}]
    })

    if(!user){
        throw new ApiError(400,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid Credentials")
    }

    // const accessToken = await user.generateAccessToken()
    // const refreshToken = await user.generateRefreshToken()
    
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);
    // console.log(refreshToken)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {user : loggedInUser,accessToken,refreshToken},
            "User logged in successfully"
        )
    )


})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(
            new ApiResponse(200,{},"User is logged out")
        )

})

export {registerUser,
    loginUser,
    logoutUser,
    generateAccessTokenUsingRefreshToken
}
