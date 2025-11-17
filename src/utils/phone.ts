import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Extract country code from phone number
 * @param phone E.164 formatted phone number (e.g., +972501234567)
 * @returns Country calling code with + (e.g., +972) or null if invalid
 */
export function extractCountryCode(phone: string): string | null {
  try {
    // Remove any spaces or dashes
    const cleaned = phone.replace(/[\s-]/g, '');

    // Ensure it starts with +
    const formatted = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;

    const parsed = parsePhoneNumber(formatted);

    if (parsed && parsed.country) {
      // Get the country calling code
      return `+${parsed.countryCallingCode}`;
    }

    return null;
  } catch (error) {
    // If parsing fails, try to extract manually
    const match = phone.match(/^\+?(\d{1,4})/);
    return match ? `+${match[1]}` : null;
  }
}

/**
 * Validate E.164 phone number format
 * @param phone Phone number to validate
 * @returns true if valid E.164 format
 */
export function isValidE164(phone: string): boolean {
  try {
    const cleaned = phone.replace(/[\s-]/g, '');
    const formatted = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    const parsed = parsePhoneNumber(formatted);
    return parsed?.isValid() || false;
  } catch {
    return false;
  }
}

/**
 * Format phone number to E.164
 * @param phone Phone number in any format
 * @returns E.164 formatted phone or null if invalid
 */
export function formatToE164(phone: string): string | null {
  try {
    const cleaned = phone.replace(/[\s-]/g, '');
    const formatted = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    const parsed = parsePhoneNumber(formatted);

    if (parsed?.isValid()) {
      return parsed.format('E.164');
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get country name from country code
 * @param countryCode Country calling code (e.g., +1, +972)
 * @returns Country name or 'Unknown'
 */
export function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    '+1': 'USA/Canada',
    '+44': 'United Kingdom',
    '+91': 'India',
    '+972': 'Israel',
    '+55': 'Brazil',
    '+86': 'China',
    '+81': 'Japan',
    '+49': 'Germany',
    '+33': 'France',
    '+39': 'Italy',
    '+52': 'Mexico',
    '+61': 'Australia',
    '+7': 'Russia',
    '+34': 'Spain',
    '+62': 'Indonesia',
    '+92': 'Pakistan',
    '+63': 'Philippines',
    '+20': 'Egypt',
    '+27': 'South Africa',
    '+82': 'South Korea',
  };

  return countryNames[countryCode] || 'Unknown';
}
