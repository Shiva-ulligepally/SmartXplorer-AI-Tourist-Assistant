/**
 * Emergency Contacts Service
 * Manages up to 4 emergency contact phone numbers stored in localStorage
 */

const STORAGE_KEY = 'sos_emergency_contacts';
const MAX_CONTACTS = 4;

export interface EmergencyContact {
  id: string;
  phoneNumber: string;
}

/**
 * Validate phone number format (E.164 or common formats)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // Check if it starts with + (E.164) or is just digits
  if (cleaned.startsWith('+')) {
    // E.164 format: +followed by 1-15 digits
    return /^\+\d{1,15}$/.test(cleaned);
  } else {
    // At least 10 digits (common minimum)
    return /^\d{10,15}$/.test(cleaned);
  }
};

/**
 * Normalize phone number to E.164 format
 */
export const normalizePhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // If no +, assume US number and add country code
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    return `+${cleaned}`;
  }

  return cleaned;
};

/**
 * Get all emergency contacts from localStorage
 */
export const getEmergencyContacts = (): EmergencyContact[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[Emergency Contacts] Error reading from storage:', error);
    return [];
  }
};

/**
 * Add an emergency contact (max 4)
 */
export const addEmergencyContact = (phoneNumber: string): EmergencyContact | null => {
  try {
    // Validate phone number
    if (!isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // Get existing contacts
    const contacts = getEmergencyContacts();

    // Check if already at max
    if (contacts.length >= MAX_CONTACTS) {
      throw new Error(`Maximum ${MAX_CONTACTS} emergency contacts allowed`);
    }

    // Check for duplicates
    const normalized = normalizePhoneNumber(phoneNumber);
    if (contacts.some((c) => c.phoneNumber === normalized)) {
      throw new Error('This phone number is already added');
    }

    // Create new contact
    const newContact: EmergencyContact = {
      id: `contact_${Date.now()}`,
      phoneNumber: normalized,
    };

    // Save to storage
    contacts.push(newContact);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));

    console.log('[Emergency Contacts] Contact added:', newContact.phoneNumber);
    return newContact;
  } catch (error) {
    console.error('[Emergency Contacts] Error adding contact:', error);
    return null;
  }
};

/**
 * Remove an emergency contact by ID
 */
export const removeEmergencyContact = (contactId: string): boolean => {
  try {
    const contacts = getEmergencyContacts();
    const filtered = contacts.filter((c) => c.id !== contactId);

    if (filtered.length === contacts.length) {
      console.warn('[Emergency Contacts] Contact not found:', contactId);
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log('[Emergency Contacts] Contact removed:', contactId);
    return true;
  } catch (error) {
    console.error('[Emergency Contacts] Error removing contact:', error);
    return false;
  }
};

/**
 * Update an emergency contact
 */
export const updateEmergencyContact = (contactId: string, phoneNumber: string): boolean => {
  try {
    // Validate phone number
    if (!isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    const contacts = getEmergencyContacts();
    const contact = contacts.find((c) => c.id === contactId);

    if (!contact) {
      throw new Error('Contact not found');
    }

    const normalized = normalizePhoneNumber(phoneNumber);

    // Check for duplicates (excluding current contact)
    if (contacts.some((c) => c.id !== contactId && c.phoneNumber === normalized)) {
      throw new Error('This phone number is already added');
    }

    contact.phoneNumber = normalized;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));

    console.log('[Emergency Contacts] Contact updated:', normalized);
    return true;
  } catch (error) {
    console.error('[Emergency Contacts] Error updating contact:', error);
    return false;
  }
};

/**
 * Clear all emergency contacts
 */
export const clearEmergencyContacts = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Emergency Contacts] All contacts cleared');
  } catch (error) {
    console.error('[Emergency Contacts] Error clearing contacts:', error);
  }
};

/**
 * Check if emergency contacts are configured
 */
export const hasEmergencyContacts = (): boolean => {
  return getEmergencyContacts().length > 0;
};

/**
 * Get count of emergency contacts
 */
export const getEmergencyContactCount = (): number => {
  return getEmergencyContacts().length;
};
