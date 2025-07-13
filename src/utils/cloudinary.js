import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // upload the file on cloudinary 
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // file has been uploaded successfully
        // console.log("File is uploaded on cloudinary", response.url );

        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        console.log("File did not uploaded on cloudinary", error);
        // removes the locally saved temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const deleteFromCloudinary = async (url) => {
    if (!url) {
        return null;
    }

    /*
    const public_id_array=String(url).split("/");
    const last=public_id_array[public_id_array.length-1];
    const public_id=String(last).split(".")[0];
    */

    // or

    const public_id = url.split("/upload/")[1].split(".")[0];

    try {
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: "auto"
        })

        console.log("File deleted successfully from cloudinary ", result)
        return true;
    } catch (error) {
        console.log("Error in deleting file", error.message);
        return null;
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }