import { PrismaClient } from "@prisma/client";
import Container from "typedi";
import {
  SlackEventWithProjects,
  SlackMentorInfo,
  SlackStudentInfo,
  linkExistingSlackChannels,
  linkExistingSlackMembers,
  slackEventInfoSelect,
  updateSlackUserGroups
} from "../../slack";
import { makeDebug } from "../../utils";

const DEBUG = makeDebug('automation:tasks:syncSlack');

export const JOBSPEC = '0 * * * *';

export default async function slackSync(): Promise<void> {
  const prisma = Container.get(PrismaClient);
  const activeEvents = await prisma.event.findMany({
      where: {
        isActive: true,
        slackWorkspaceAccessToken: { not: null },
        slackWorkspaceId: { not: null },
      },
      select: slackEventInfoSelect,
    }) as SlackEventWithProjects<SlackMentorInfo & SlackStudentInfo>[];

  for (const event of activeEvents) {
    DEBUG(`Syncing Slack for ${event.id}.`);
    try {
      await linkExistingSlackMembers(event);
      await linkExistingSlackChannels(event);
      await updateSlackUserGroups(event);
    } catch (ex) {
      DEBUG(ex);
    }
  }
}