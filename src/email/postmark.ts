import { Request, Response } from 'express';
import { makeDebug } from '../utils';
import config from '../config';
import Container from 'typedi';
import { PrismaClient } from '@prisma/client';

const DEBUG = makeDebug('email:postmark');

interface PostmarkInboundEmailFull {
  Email: string
  Name: string
  MailboxHash: string
}

interface PostmarkRequest {
  FromName: string
  MessageStream: string
  From: string
  FromFull: PostmarkInboundEmailFull,
  To: string
  ToFull: PostmarkInboundEmailFull[]
  Cc: string
  CcFull: PostmarkInboundEmailFull[]
  Bcc: string
  BccFull: PostmarkInboundEmailFull[]
  OriginalRecipient: string
  Subject: string
  MessageId: string
  ReplyTo: string
  MailboxHash: string
  Date: string
  TextBody: string
  HtmlBody: string
  StrippedTextReply: string
  Tag: String
  Headers: { Name: string, Value: string }[]
  Attachments: { Name: string, Content: string, ContentType: string, ContentLength: number }[]
}

export async function processPostmarkInboundEmail(req: Request, res: Response) {
  const prisma = Container.get(PrismaClient);
  const email = req.body as PostmarkRequest;
  DEBUG(`New project email from ${email.From}`);

  const myToEmails = [...email.ToFull, ...email.CcFull, ...email.BccFull]
    .map(e => e.Email)
    .filter(e => e.split('@')[1] === config.email.inboundDomain);

  if (myToEmails.length === 0) {
    DEBUG(`...not associated with a project.`);
    return res.send('ok');
  }

  DEBUG(`...project email addresses:`, myToEmails.join(','));
  const projectId = myToEmails[0].split('@')[0].split('+')[0];
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      mentors: { select: { id: true, email: true } },
      students: { select: { id: true, email: true } },
    },
  });

  if (!project) {
    DEBUG(`...project ${projectId} not found.`);
    return res.send('ok');
  }

  const fromMentor = project.mentors.filter(m => m.email === email.FromFull.Email)[0] || undefined;
  const fromStudent = project.students.filter(s => s.email === email.FromFull.Email)[0] || undefined;

  DEBUG(`... email ${email.FromFull.Email} matches: mentor - ${fromMentor?.id}, ${fromStudent?.id}`);

  await prisma.projectEmail.create({
    data: {
      project: { connect: { id: project.id } },
      ...(fromMentor ? { mentor: { connect: { id: fromMentor.id } } } : {}),
      ...(fromStudent ? { student: { connect: { id: fromStudent.id } } } : {}),
      subject: email.Subject,
      textBody: email.TextBody,
      htmlBody: email.HtmlBody,
      to: email.To,
      cc: email.Cc,
    },
  });
  DEBUG(`...project email tracked.`);

  res.send('ok');
}