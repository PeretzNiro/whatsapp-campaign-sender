import { ContactsUpload } from '@/components/ContactsUpload';
import { ContactsList } from '@/components/ContactsList';

export function Contacts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Management</h1>
        <p className="mt-2 text-gray-600">
          Upload, manage, and organize your WhatsApp contacts
        </p>
      </div>

      <ContactsUpload />
      <ContactsList />
    </div>
  );
}
