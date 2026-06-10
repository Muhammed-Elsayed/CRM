import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from "joi";
import { WebError } from "../utilities/web-errors";

// Extend Request type to include multer file properties
interface MulterRequest extends Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

export const validateSchemas =
    (schema: ObjectSchema, type: 'body' | 'query' | 'params' | 'headers' = 'body') =>
        (req: Request, res: Response, next: NextFunction) => {
            const { error, value } = schema.validate(req[type], { abortEarly: false });

            if (!error) {
                req[type] = value;
                return next();
            }

            const { details } = error;
            const message = details.map((d: any) => d.message.replace(/['"]+/g, '')).join(',');
            throw WebError.BadRequest(`${message}, Please review.` || 'Invalid data, Please review.')
        };

export const validateFormData =
    (schema: ObjectSchema) =>
        (req: MulterRequest, res: Response, next: NextFunction) => {
            // For multer form_data requests, combine body fields with uploaded files
            let dataToValidate = { ...req.body };
            
            // Handle single file upload (req.file)
            if (req.file) {
                dataToValidate = {
                    ...dataToValidate,
                    [req.file.fieldname]: req.file
                };
            }
            
            // Handle multiple files upload (req.files)
            if (req.files) {
                if (Array.isArray(req.files)) {
                    // If files is an array, add each file by fieldname
                    req.files.forEach((file: Express.Multer.File) => {
                        dataToValidate[file.fieldname] = file;
                    });
                } else {
                    // If files is an object with fieldname keys
                    Object.keys(req.files).forEach(fieldname => {
                        const files = (req.files as { [fieldname: string]: Express.Multer.File[] })[fieldname];
                        if (Array.isArray(files)) {
                            dataToValidate[fieldname] = files;
                        } else {
                            dataToValidate[fieldname] = files;
                        }
                    });
                }
            }
            
            const { error, value } = schema.validate(dataToValidate, { abortEarly: false });

            if (!error) {
                req.body = value;
                return next();
            }

            const { details } = error;
            const message = details.map((d: any) => d.message.replace(/['"]+/g, '')).join(',');
            throw WebError.BadRequest(`${message}, Please review.` || 'Invalid data, Please review.')
        };