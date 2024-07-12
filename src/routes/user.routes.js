import { Router } from "express";
import { generateAccessTokenUsingRefreshToken, loginUser, logoutUser, registerUser } from "../conrollers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/login").post(loginUser)

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:"1"
        },{
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
);



// secured routes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/access-token").post(generateAccessTokenUsingRefreshToken)

export default router
