import nodemailer from 'nodemailer'
import { EMAIL, EMAIL_PASS } from '../config';


const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: EMAIL,
        pass: EMAIL_PASS,
    }
})

export const sendMail = async (user_mail: string, subject: string, content: any) => {
    const email = {
        from: EMAIL,
        to: user_mail,
        subject,
        html: content
    }

    await transporter.sendMail(email)
    .then( () => {
        console.log('Email sent !!!');
    })
    .catch( e => {
        console.log(e);
    })

}