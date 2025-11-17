import { useState, useEffect } from 'react';
import { Search, RefreshCw, Download, Trash2, User } from 'lucide-react';
import { contactsAPI } from '@/lib/api';
import type { Contact } from '@/types';

export function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'opted-in' | 'opted-out'>('all');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20, search };
      if (filter === 'opted-in') params.optIn = true;
      if (filter === 'opted-out') params.optIn = false;

      const data = await contactsAPI.getAll(params);
      setContacts(data.contacts);
      setPagination(data.pagination);
      setSelectedContacts(new Set()); // Clear selection when reloading
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [page, filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadContacts();
  };

  const handleDelete = async (phone: string) => {
    if (!confirm(`Delete contact ${phone}?`)) return;

    try {
      await contactsAPI.delete(phone);
      loadContacts();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      alert('Failed to delete contact');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.size === 0) return;

    if (!confirm(`Delete ${selectedContacts.size} selected contact(s)?`)) return;

    setDeleting(true);
    try {
      await contactsAPI.bulkDelete(Array.from(selectedContacts));
      loadContacts();
    } catch (error) {
      console.error('Failed to bulk delete contacts:', error);
      alert('Failed to delete selected contacts');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('⚠️ DELETE ALL CONTACTS? This action cannot be undone!')) return;
    if (!confirm('Are you absolutely sure? This will delete ALL contacts from the database.')) return;

    setDeleting(true);
    try {
      await contactsAPI.bulkDelete([], true);
      loadContacts();
    } catch (error) {
      console.error('Failed to delete all contacts:', error);
      alert('Failed to delete all contacts');
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.phone)));
    }
  };

  const handleSelectContact = (phone: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(phone)) {
      newSelected.delete(phone);
    } else {
      newSelected.add(phone);
    }
    setSelectedContacts(newSelected);
  };

  const handleExport = async () => {
    try {
      const blob = await contactsAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export contacts:', error);
      alert('Failed to export contacts');
    }
  };

  const allSelected = contacts.length > 0 && selectedContacts.size === contacts.length;
  const someSelected = selectedContacts.size > 0 && selectedContacts.size < contacts.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold">Contacts</h2>

          {/* Action Buttons - Responsive */}
          <div className="flex flex-wrap gap-2">
            {selectedContacts.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden xs:inline">Delete </span>
                <span>({selectedContacts.size})</span>
              </button>
            )}
            <button
              onClick={handleDeleteAll}
              disabled={deleting || contacts.length === 0}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete All</span>
              <span className="sm:hidden">All</span>
            </button>
            <button
              onClick={loadContacts}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by phone, name, or tags..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Contacts</option>
            <option value="opted-in">Opted In</option>
            <option value="opted-out">Opted Out</option>
          </select>
        </div>
      </div>

      {/* Contacts Display - Desktop: Table, Mobile: Cards */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : contacts.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No contacts found. Upload a CSV or vCard file to get started.
        </div>
      ) : (
        <>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className={`hover:bg-gray-50 ${selectedContacts.has(contact.phone) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.phone)}
                        onChange={() => handleSelectContact(contact.phone)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {contact.firstName || contact.lastName
                        ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.countryCode || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          contact.optIn
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {contact.optIn ? 'Opted In' : 'Opted Out'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.tags || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.createdAt
                        ? new Date(contact.createdAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(contact.phone)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Hidden on desktop */}
          <div className="lg:hidden divide-y divide-gray-200">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 ${selectedContacts.has(contact.phone) ? 'bg-blue-50' : 'bg-white'}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedContacts.has(contact.phone)}
                    onChange={() => handleSelectContact(contact.phone)}
                    className="h-5 w-5 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {contact.firstName || contact.lastName
                              ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                              : 'No name'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 break-all">
                          {contact.phone}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(contact.phone)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1"
                        title="Delete contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          contact.optIn
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {contact.optIn ? 'Opted In' : 'Opted Out'}
                      </span>

                      {contact.countryCode && (
                        <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {contact.countryCode}
                        </span>
                      )}

                      {contact.tags && (
                        <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          {contact.tags}
                        </span>
                      )}
                    </div>

                    {contact.createdAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Added {new Date(contact.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-gray-700">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
