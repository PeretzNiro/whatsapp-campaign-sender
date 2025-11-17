import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, templates } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import axios from 'axios';
import { env } from '../env.js';

export const templatesRouter = Router();

// Validation schema
const TemplateSchema = z.object({
  name: z.string().min(1),
  language: z.string().default('en_US'),
  category: z.enum(['marketing', 'utility', 'authentication']).default('marketing'),
  parameters: z.number().int().min(0).default(0),
  previewText: z.string().optional(),
  status: z.enum(['approved', 'pending', 'rejected']).default('approved'),
});

// GET /api/templates - List all templates
templatesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const allTemplates = await db.select().from(templates);
    res.json(allTemplates);
  } catch (error: any) {
    req.log.error({ error }, 'Failed to fetch templates');
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/templates/:id - Get single template
templatesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [template] = await db.select().from(templates).where(eq(templates.id, id));

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error: any) {
    req.log.error({ error }, 'Failed to fetch template');
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST /api/templates - Create new template
templatesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const validated = TemplateSchema.parse(req.body);

    const [newTemplate] = await db.insert(templates)
      .values(validated)
      .returning();

    res.status(201).json(newTemplate);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid template data', details: error.errors });
    }
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Template with this name already exists' });
    }
    req.log.error({ error }, 'Failed to create template');
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PUT /api/templates/:id - Update template
templatesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const validated = TemplateSchema.partial().parse(req.body);

    const [updatedTemplate] = await db.update(templates)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();

    if (!updatedTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(updatedTemplate);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid template data', details: error.errors });
    }
    req.log.error({ error }, 'Failed to update template');
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /api/templates/:id - Delete template
templatesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const [deletedTemplate] = await db.delete(templates)
      .where(eq(templates.id, id))
      .returning();

    if (!deletedTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully', template: deletedTemplate });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to delete template');
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// GET /api/templates/sync - Sync templates from WhatsApp API
templatesRouter.get('/sync/whatsapp', async (req: Request, res: Response) => {
  try {
    // Fetch templates from WhatsApp Graph API
    const response = await axios.get(
      `https://graph.facebook.com/v22.0/${env.PHONE_NUMBER_ID}/message_templates`,
      {
        headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}` },
        params: { fields: 'name,language,category,components,status' },
      }
    );

    const whatsappTemplates = response.data.data || [];
    const syncedTemplates = [];

    for (const waTemplate of whatsappTemplates) {
      // Only sync approved templates
      if (waTemplate.status !== 'APPROVED') continue;

      // Count parameters in body component
      let paramCount = 0;
      const bodyComponent = waTemplate.components?.find((c: any) => c.type === 'BODY');
      if (bodyComponent?.text) {
        const matches = bodyComponent.text.match(/\{\{(\d+)\}\}/g);
        paramCount = matches ? matches.length : 0;
      }

      const templateData = {
        name: waTemplate.name,
        language: waTemplate.language,
        category: waTemplate.category.toLowerCase(),
        parameters: paramCount,
        previewText: bodyComponent?.text || null,
        status: 'approved' as const,
      };

      // Insert or update
      const [synced] = await db.insert(templates)
        .values(templateData)
        .onConflictDoUpdate({
          target: templates.name,
          set: {
            ...templateData,
            updatedAt: new Date()
          },
        })
        .returning();

      syncedTemplates.push(synced);
    }

    res.json({
      message: `Synced ${syncedTemplates.length} templates from WhatsApp`,
      templates: syncedTemplates,
    });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to sync templates from WhatsApp');
    res.status(500).json({
      error: 'Failed to sync templates from WhatsApp',
      message: error.message
    });
  }
});
