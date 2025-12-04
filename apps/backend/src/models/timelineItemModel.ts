import type { Prisma } from 'generated/prisma/client.js';
import prisma from '../db.js';

export class TimelineItemModel {
  async create(data: Prisma.TimelineItemCreateInput) {
    return prisma.timelineItem.create({ data });
  }
}

export const timelineItemModel = new TimelineItemModel();
