import { parse as parseCSV } from 'csv-parse/sync';
import { formatToE164, extractCountryCode } from './phone.js';

export interface ParsedContact {
  phone: string;
  optIn: boolean;
  tags?: string;
  firstName?: string;
  lastName?: string;
}

export interface ParseResult {
  contacts: ParsedContact[];
  errors: Array<{ row: number; error: string; data?: any }>;
  format: 'simple-csv' | 'google-csv' | 'vcard' | 'unknown';
}

/**
 * Simple vCard parser - extracts name and phone numbers
 */
function parseVCard(content: string): ParseResult {
  const contacts: ParsedContact[] = [];
  const errors: Array<{ row: number; error: string; data?: any }> = [];

  try {
    // Split by BEGIN:VCARD to get individual cards
    const vcards = content.split('BEGIN:VCARD').filter(v => v.trim());

    vcards.forEach((vcard, index) => {
      try {
        const lines = vcard.split('\n').map(l => l.trim()).filter(l => l);

        // Extract name (FN field)
        const fnLine = lines.find(l => l.startsWith('FN:'));
        const fullName = fnLine ? fnLine.replace('FN:', '').trim() : '';

        // Try to split name into first/last
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Extract all phone numbers (TEL fields)
        const telLines = lines.filter(l => l.startsWith('TEL'));

        telLines.forEach((telLine) => {
          // Extract phone from TEL line (format: TEL;type=...:+972...)
          const phoneMatch = telLine.match(/:(.+)$/);
          if (!phoneMatch) return;

          let phoneValue = phoneMatch[1].trim().replace(/[\s\-\(\)]/g, '');

          // Try to format to E.164
          let formattedPhone = formatToE164(phoneValue);

          // If formatting failed but starts with 0, assume Israel (+972)
          if (!formattedPhone && phoneValue.startsWith('0')) {
            formattedPhone = formatToE164('+972' + phoneValue.substring(1));
          }

          if (formattedPhone) {
            contacts.push({
              phone: formattedPhone,
              optIn: true, // Default to opted-in for imported contacts
              firstName: firstName || undefined,
              lastName: lastName || undefined,
              tags: 'vcf-import',
            });
          } else {
            errors.push({
              row: index + 1,
              error: `Invalid phone number: ${phoneValue}`,
              data: { name: fullName, phone: phoneValue },
            });
          }
        });
      } catch (error) {
        errors.push({
          row: index + 1,
          error: `Failed to parse vCard: ${error}`,
          data: vcard.substring(0, 100),
        });
      }
    });

    return { contacts, errors, format: 'vcard' };
  } catch (error) {
    throw new Error(`Failed to parse vCard file: ${error}`);
  }
}

/**
 * Parse Google Contacts CSV format
 */
function parseGoogleCSV(content: string): ParseResult {
  const contacts: ParsedContact[] = [];
  const errors: Array<{ row: number; error: string; data?: any }> = [];

  try {
    const records = parseCSV(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    records.forEach((record: any, index: number) => {
      try {
        const firstName = record['First Name'] || '';
        const lastName = record['Last Name'] || '';

        // Google Contacts has multiple phone columns: "Phone 1 - Value", "Phone 2 - Value", etc.
        const phoneColumns = Object.keys(record).filter(key =>
          key.match(/^Phone \d+ - Value$/)
        );

        phoneColumns.forEach((phoneCol) => {
          const phoneValue = record[phoneCol]?.trim();
          if (!phoneValue) return;

          // Clean phone number
          const cleanPhone = phoneValue.replace(/[\s\-\(\):]/g, '');

          // Try to format to E.164
          let formattedPhone = formatToE164(cleanPhone);

          // If formatting failed but starts with 0, assume Israel (+972)
          if (!formattedPhone && cleanPhone.startsWith('0')) {
            formattedPhone = formatToE164('+972' + cleanPhone.substring(1));
          }

          if (formattedPhone) {
            contacts.push({
              phone: formattedPhone,
              optIn: true,
              firstName: firstName || undefined,
              lastName: lastName || undefined,
              tags: 'google-import',
            });
          } else {
            errors.push({
              row: index + 2, // +2 because of header row and 0-based index
              error: `Invalid phone number: ${phoneValue}`,
              data: { name: `${firstName} ${lastName}`.trim(), phone: phoneValue },
            });
          }
        });
      } catch (error) {
        errors.push({
          row: index + 2,
          error: `Failed to parse row: ${error}`,
          data: record,
        });
      }
    });

    return { contacts, errors, format: 'google-csv' };
  } catch (error) {
    throw new Error(`Failed to parse Google CSV: ${error}`);
  }
}

/**
 * Parse simple CSV format (phone, opt_in, tags)
 */
function parseSimpleCSV(content: string): ParseResult {
  const contacts: ParsedContact[] = [];
  const errors: Array<{ row: number; error: string; data?: any }> = [];

  try {
    const records = parseCSV(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    records.forEach((record: any, index: number) => {
      try {
        const phone = record.phone?.trim();
        if (!phone) {
          errors.push({
            row: index + 2,
            error: 'Missing phone number',
            data: record,
          });
          return;
        }

        const formattedPhone = formatToE164(phone);
        if (!formattedPhone) {
          errors.push({
            row: index + 2,
            error: `Invalid phone number: ${phone}`,
            data: record,
          });
          return;
        }

        const optIn = record.opt_in === 'true' || record.opt_in === '1' || record.opt_in === true;

        contacts.push({
          phone: formattedPhone,
          optIn,
          tags: record.tags || undefined,
          firstName: record.firstName || record.first_name || undefined,
          lastName: record.lastName || record.last_name || undefined,
        });
      } catch (error) {
        errors.push({
          row: index + 2,
          error: `Failed to parse row: ${error}`,
          data: record,
        });
      }
    });

    return { contacts, errors, format: 'simple-csv' };
  } catch (error) {
    throw new Error(`Failed to parse simple CSV: ${error}`);
  }
}

/**
 * Detect format and parse contact file
 */
export function parseContactFile(content: string, filename: string): ParseResult {
  // Detect format by file extension and content
  const extension = filename.toLowerCase().split('.').pop();

  // vCard format
  if (extension === 'vcf' || content.trim().startsWith('BEGIN:VCARD')) {
    return parseVCard(content);
  }

  // CSV formats
  if (extension === 'csv') {
    // Detect Google Contacts format by checking for specific columns
    if (content.includes('First Name,') && content.includes('Phone 1 - Value')) {
      return parseGoogleCSV(content);
    }

    // Try simple CSV format
    return parseSimpleCSV(content);
  }

  throw new Error(`Unsupported file format: ${extension}`);
}

/**
 * Deduplicate contacts by phone number (keep first occurrence)
 */
export function deduplicateContacts(contacts: ParsedContact[]): ParsedContact[] {
  const seen = new Set<string>();
  const deduplicated: ParsedContact[] = [];

  for (const contact of contacts) {
    if (!seen.has(contact.phone)) {
      seen.add(contact.phone);
      deduplicated.push(contact);
    }
  }

  return deduplicated;
}
