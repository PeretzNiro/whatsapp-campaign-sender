import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { db, contacts, contactsArchive } from '../db/index.js';
import { eq, desc, count, sql, or, ilike, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { extractCountryCode, isValidE164, formatToE164 } from '../utils/phone.js';
import { parseContactFile, deduplicateContacts } from '../utils/contactParser.js';
import fs from 'fs';
import { Readable } from 'stream';

export const contactsRouter = Router();

// Configure multer for file uploads (CSV and vCard)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    const isCSV = file.mimetype === 'text/csv' || file.originalname.endsWith('.csv');
    const isVCard = file.mimetype === 'text/vcard' || file.mimetype === 'text/x-vcard' || file.originalname.endsWith('.vcf');

    if (isCSV || isVCard) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and vCard (.vcf) files are allowed'));
    }
  },
});

// Validation schemas
const ContactSchema = z.object({
  phone: z.string().min(10),
  optIn: z.boolean().default(false),
  tags: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// GET /api/contacts - List contacts with pagination and search
contactsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const optIn = req.query.optIn as string;
    const tag = req.query.tag as string;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(contacts.phone, `%${search}%`),
          ilike(contacts.firstName, `%${search}%`),
          ilike(contacts.lastName, `%${search}%`)
        )
      );
    }
    if (optIn === 'true') {
      conditions.push(eq(contacts.optIn, true));
    } else if (optIn === 'false') {
      conditions.push(eq(contacts.optIn, false));
    }
    if (tag) {
      conditions.push(ilike(contacts.tags, `%${tag}%`));
    }

    // Get contacts
    const contactsList = await db.select()
      .from(contacts)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
      .orderBy(desc(contacts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db.select({ count: count() })
      .from(contacts)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined);
    const total = totalResult.count;

    res.json({
      contacts: contactsList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to fetch contacts');
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// POST /api/contacts - Add single contact
contactsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const validated = ContactSchema.parse(req.body);

    // Format and validate phone
    const formattedPhone = formatToE164(validated.phone);
    if (!formattedPhone) {
      return res.status(400).json({ error: 'Invalid phone number format. Use E.164 (e.g., +1234567890)' });
    }

    // Extract country code
    const countryCode = extractCountryCode(formattedPhone);

    const [newContact] = await db.insert(contacts)
      .values({
        phone: formattedPhone,
        optIn: validated.optIn,
        tags: validated.tags,
        firstName: validated.firstName,
        lastName: validated.lastName,
        countryCode,
      })
      .returning();

    res.status(201).json(newContact);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid contact data', details: error.errors });
    }
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Contact with this phone number already exists' });
    }
    req.log.error({ error }, 'Failed to create contact');
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// PUT /api/contacts/:phone - Update contact
contactsRouter.put('/:phone', async (req: Request, res: Response) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const validated = ContactSchema.partial().parse(req.body);

    const [updatedContact] = await db.update(contacts)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(contacts.phone, phone))
      .returning();

    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(updatedContact);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid contact data', details: error.errors });
    }
    req.log.error({ error }, 'Failed to update contact');
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE /api/contacts/:phone - Delete contact
contactsRouter.delete('/:phone', async (req: Request, res: Response) => {
  try {
    const phone = decodeURIComponent(req.params.phone);

    const [deletedContact] = await db.delete(contacts)
      .where(eq(contacts.phone, phone))
      .returning();

    if (!deletedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully', contact: deletedContact });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to delete contact');
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// POST /api/contacts/bulk-delete - Delete multiple contacts
contactsRouter.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { phones, deleteAll } = req.body;

    if (deleteAll === true) {
      // Delete all contacts
      const deletedContacts = await db.delete(contacts).returning();

      req.log.info({ count: deletedContacts.length }, 'Deleted all contacts');

      return res.json({
        message: 'All contacts deleted successfully',
        count: deletedContacts.length
      });
    }

    // Validate phones array
    if (!Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({ error: 'phones array is required and must not be empty' });
    }

    // Delete specific contacts by phone numbers
    const deletedContacts = await db.delete(contacts)
      .where(inArray(contacts.phone, phones))
      .returning();

    req.log.info({
      requested: phones.length,
      deleted: deletedContacts.length
    }, 'Bulk deleted contacts');

    res.json({
      message: `${deletedContacts.length} contact(s) deleted successfully`,
      count: deletedContacts.length,
      deleted: deletedContacts
    });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to bulk delete contacts');
    res.status(500).json({ error: 'Failed to bulk delete contacts' });
  }
});

// POST /api/contacts/upload - Upload contact file (CSV or vCard)
contactsRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const mode = req.body.mode || 'merge'; // 'merge' or 'replace'

    // Parse the file using the unified parser
    const fileContent = req.file.buffer.toString('utf-8');
    const parseResult = parseContactFile(fileContent, req.file.originalname);

    // Deduplicate contacts
    const uniqueContacts = deduplicateContacts(parseResult.contacts);

    req.log.info({
      filename: req.file.originalname,
      format: parseResult.format,
      total: uniqueContacts.length,
      errors: parseResult.errors.length,
    }, 'Parsed contact file');

    // Replace mode: delete all existing contacts first
    if (mode === 'replace') {
      await db.delete(contacts);
    }

    // Insert contacts with country code extraction
    let imported = 0;
    let skipped = 0;

    for (const contact of uniqueContacts) {
      try {
        const countryCode = extractCountryCode(contact.phone);

        await db.insert(contacts)
          .values({
            phone: contact.phone,
            optIn: contact.optIn,
            tags: contact.tags || null,
            firstName: contact.firstName || null,
            lastName: contact.lastName || null,
            countryCode,
          })
          .onConflictDoUpdate({
            target: contacts.phone,
            set: {
              optIn: contact.optIn,
              tags: contact.tags || null,
              firstName: contact.firstName || null,
              lastName: contact.lastName || null,
              updatedAt: new Date(),
            },
          });
        imported++;
      } catch (error: any) {
        req.log.error({ error, contact }, 'Failed to insert contact');
        skipped++;
      }
    }

    // Save to archive
    await db.insert(contactsArchive).values({
      filename: req.file.originalname,
      totalContacts: uniqueContacts.length,
      optedIn: uniqueContacts.filter(c => c.optIn).length,
      uploadedBy: 'admin',
    });

    res.json({
      message: `${parseResult.format.toUpperCase()} file uploaded successfully`,
      mode,
      format: parseResult.format,
      total: uniqueContacts.length,
      imported,
      skipped,
      errors: parseResult.errors.slice(0, 20), // Return first 20 errors
      totalErrors: parseResult.errors.length,
    });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to upload file');
    res.status(500).json({ error: 'Failed to upload file', message: error.message });
  }
});

// GET /api/contacts/uploads - Get upload history
contactsRouter.get('/uploads', async (req: Request, res: Response) => {
  try {
    const uploads = await db.select()
      .from(contactsArchive)
      .orderBy(desc(contactsArchive.uploadedAt))
      .limit(20);

    res.json({ uploads });
  } catch (error: any) {
    req.log.error({ error }, 'Failed to fetch upload history');
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

// GET /api/contacts/export - Export contacts to CSV
contactsRouter.get('/export', async (req: Request, res: Response) => {
  try {
    const allContacts = await db.select().from(contacts);

    const stringifier = stringify({
      header: true,
      columns: ['phone', 'opt_in', 'tags', 'first_name', 'last_name', 'country_code', 'created_at'],
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="contacts_${Date.now()}.csv"`);

    stringifier.pipe(res);

    for (const contact of allContacts) {
      stringifier.write({
        phone: contact.phone,
        opt_in: contact.optIn,
        tags: contact.tags || '',
        first_name: contact.firstName || '',
        last_name: contact.lastName || '',
        country_code: contact.countryCode || '',
        created_at: contact.createdAt?.toISOString() || '',
      });
    }

    stringifier.end();
  } catch (error: any) {
    req.log.error({ error }, 'Failed to export contacts');
    res.status(500).json({ error: 'Failed to export contacts' });
  }
});
