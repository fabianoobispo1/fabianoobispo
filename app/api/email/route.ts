import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";


export async function POST(req: NextRequest) {

    const body = await req.json();

    const { email, text } = body;



    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API ?? '',
    });
    
    const sentFrom = new Sender("you@fabianoobispo.com.br", "Fabianoobispo");
    
    const recipients = [
      new Recipient(email, "Your Client")
    ];
    
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject("This is a Subject")
      .setHtml("<strong>Texto</strong>")
 
    
    await mailerSend.email.send(emailParams);


console.log('api')
console.log(process.env.MAILERSEND_API ?? '',)
      return NextResponse.json(
        { message: 'conta atualizado com sucesso.', return: email },
        { status: 201 }
      )
    
  
  
}
