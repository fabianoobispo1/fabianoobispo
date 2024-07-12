import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";




export async function Enviaemail(email: string, text:string)   {
 
    const mailerSend = new MailerSend({
        apiKey: process.env.MAILERSEND_API ?? '',
      });
      
      const sentFrom = new Sender("you@Fabianoobispo.com.br", "Fabianoobispo");
      
      const recipients = [
        new Recipient(email, "Your Client")
      ];
      
      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setReplyTo(sentFrom)
        .setSubject("This is a Subject")
        .setHtml("<strong>This is the HTML content</strong>")
        .setText("This is the text content");
      
      await mailerSend.email.send(emailParams);

      return email +' '+ text

   
}




