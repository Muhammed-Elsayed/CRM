import { WebError } from "./web-errors";
import { cloudinary } from "../config";

// Generic file upload function that can handle any file type for any application
export const uploadFile = async (
    file: Express.Multer.File, 
    filenamePrefix: string,
) => {
    if (!file) {
        throw WebError.BadRequest('No file provided');
    }

    const base64 = file.buffer.toString('base64');
    const dataURI = `data:${file.mimetype};base64,${base64}`;
    

    const filename = `${filenamePrefix}-${Date.now()}`;

    const result = await cloudinary.uploader.upload(dataURI, {
        public_id: filename,
        resource_type: 'auto', // Let Cloudinary determine the resource type
    });

    if (!result.secure_url) {
        throw WebError.InternalServerError(`Failed to upload ${filenamePrefix}`);
    }

    return {
        url: result.secure_url
    };
};








// export const uploadMerchantFiles = async (files: any) => {
//     if (!files?.file1 || !files?.file2) {
//         throw WebError.BadRequest('No files uploaded');
//     }

//     // Check if files are PDFs by checking mimetype
//     if (files.file1[0].mimetype !== 'application/pdf' || files.file2[0].mimetype !== 'application/pdf') {
//         throw WebError.BadRequest('Files must be in PDF format');
//     }

//     const buffer1 = files?.file1?.[0].buffer
//     const buffer2 = files?.file2?.[0].buffer
//     const base64Image1 = buffer1.toString('base64');
//     const base64Image2 = buffer2.toString('base64');    
//     const dataURI1 = `data:application/pdf;base64,${base64Image1}`;  // the actual content of the file.
//     const dataURI2 = `data:application/pdf;base64,${base64Image2}`;
    
//     const filename1 = `merchant-license-${Date.now()}.pdf`;     // just the filename
//     const filename2 = `merchant-commercial-reg-${Date.now()}.pdf`;

//     const [result1, result2] = await Promise.all([ // returns an array with results.
//         cloudinary.uploader.upload(dataURI1, {
//           public_id: filename1,
//           resource_type: 'raw',
//         }),
//         cloudinary.uploader.upload(dataURI2, {
//           public_id: filename2,
//           resource_type: 'raw',
//         }),
//       ]);
    
//     if (!result1.secure_url || !result2.secure_url) {
//         throw WebError.InternalServerError('Failed to upload PDFS');
//     }

//     return {
//         license_url: result1.secure_url,
//         commercial_reg_url: result2.secure_url
//     };
// }