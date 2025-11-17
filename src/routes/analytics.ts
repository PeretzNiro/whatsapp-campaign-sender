import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, campaigns, deliveryEvents, contacts, templates } from '../db/index.js';
import { sql, desc, gte, count, eq } from 'drizzle-orm';

export const analyticsRouter = Router();

// GET /api/analytics/overview - Dashboard overview stats
analyticsRouter.get('/overview', async (req: Request, res: Response) => {
  try {
    // Total contacts
    const [totalContactsResult] = await db.select({ count: count() }).from(contacts);
    const totalContacts = totalContactsResult.count;

    // Opted-in contacts
    const [optedInResult] = await db.select({ count: count() })
      .from(contacts)
      .where(eq(contacts.optIn, true));
    const optedInContacts = optedInResult.count;

    // Total campaigns
    const [totalCampaignsResult] = await db.select({ count: count() }).from(campaigns);
    const totalCampaigns = totalCampaignsResult.count;

    // Messages sent (sum of all campaign.sent)
    const [messagesSentResult] = await db.select({
      total: sql<number>`COALESCE(SUM(${campaigns.sent}), 0)`.as('total')
    }).from(campaigns);
    const messagesSent = Number(messagesSentResult.total);

    // Success rate (delivered / sent)
    const [deliveredResult] = await db.select({ count: count() })
      .from(deliveryEvents)
      .where(eq(deliveryEvents.status, 'delivered'));
    const delivered = deliveredResult.count;

    const [sentResult] = await db.select({ count: count() })
      .from(deliveryEvents)
      .where(eq(deliveryEvents.status, 'sent'));
    const sent = sentResult.count + delivered; // sent includes delivered

    const successRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;

    // Active templates
    const [activeTemplatesResult] = await db.select({ count: count() })
      .from(templates)
      .where(eq(templates.status, 'approved'));
    const activeTemplates = activeTemplatesResult.count;

    // Today's campaigns
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayResult] = await db.select({ count: count() })
      .from(campaigns)
      .where(gte(campaigns.createdAt, today));
    const todayCampaigns = todayResult.count;

    res.json({
      totalContacts,
      optedInContacts,
      totalCampaigns,
      messagesSent,
      successRate,
      activeTemplates,
      todayCampaigns,
    });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to fetch overview analytics');
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/campaigns - Campaign history with pagination
analyticsRouter.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const campaignsList = await db.select({
      id: campaigns.id,
      templateId: campaigns.templateId,
      templateName: templates.name,
      bodyText: campaigns.bodyText,
      tag: campaigns.tag,
      total: campaigns.total,
      sent: campaigns.sent,
      failed: campaigns.failed,
      dryRun: campaigns.dryRun,
      createdAt: campaigns.createdAt,
    })
      .from(campaigns)
      .leftJoin(templates, eq(campaigns.templateId, templates.id))
      .orderBy(desc(campaigns.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db.select({ count: count() }).from(campaigns);
    const total = totalResult.count;

    res.json({
      campaigns: campaignsList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to fetch campaigns');
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/analytics/delivery-rates - Delivery status breakdown
analyticsRouter.get('/delivery-rates', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const statusCounts = await db.select({
      status: deliveryEvents.status,
      count: count(),
    })
      .from(deliveryEvents)
      .where(gte(deliveryEvents.timestamp, since))
      .groupBy(deliveryEvents.status);

    const total = statusCounts.reduce((sum, item) => sum + item.count, 0);

    const breakdown = statusCounts.map(item => ({
      status: item.status,
      count: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }));

    res.json({
      days,
      total,
      breakdown,
    });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to fetch delivery rates');
    res.status(500).json({ error: 'Failed to fetch delivery rates' });
  }
});

// GET /api/analytics/country-stats - Per-country statistics
analyticsRouter.get('/country-stats', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get contacts count per country
    const countryStats = await db.select({
      countryCode: contacts.countryCode,
      totalContacts: count(),
    })
      .from(contacts)
      .groupBy(contacts.countryCode);

    // Get messages sent per country (from delivery events joined with contacts)
    const messageStats = await db.select({
      countryCode: contacts.countryCode,
      messagesSent: count(),
    })
      .from(deliveryEvents)
      .innerJoin(contacts, eq(deliveryEvents.phone, contacts.phone))
      .where(gte(deliveryEvents.timestamp, since))
      .groupBy(contacts.countryCode);

    // Merge the data
    const merged = countryStats.map(cs => {
      const ms = messageStats.find(m => m.countryCode === cs.countryCode);
      return {
        countryCode: cs.countryCode || 'Unknown',
        totalContacts: cs.totalContacts,
        messagesSent: ms?.messagesSent || 0,
      };
    });

    // Sort by messages sent descending
    merged.sort((a, b) => b.messagesSent - a.messagesSent);

    res.json({
      days,
      countries: merged.slice(0, 10), // Top 10 countries
    });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to fetch country stats');
    res.status(500).json({ error: 'Failed to fetch country stats' });
  }
});

// GET /api/analytics/timeline - Messages over time
analyticsRouter.get('/timeline', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const timeline = await db.select({
      date: sql<string>`DATE(${deliveryEvents.timestamp})`.as('date'),
      count: count(),
    })
      .from(deliveryEvents)
      .where(gte(deliveryEvents.timestamp, since))
      .groupBy(sql`DATE(${deliveryEvents.timestamp})`)
      .orderBy(sql`DATE(${deliveryEvents.timestamp})`);

    res.json({
      days,
      timeline,
    });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to fetch timeline');
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});
