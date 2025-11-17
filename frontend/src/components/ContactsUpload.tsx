import { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { contactsAPI } from '@/lib/api';

export function ContactsUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const isValidFile = (file: File) => {
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
    const isVCard = file.type === 'text/vcard' || file.type === 'text/x-vcard' || file.name.endsWith('.vcf');
    return isCSV || isVCard;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        setFile(droppedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please upload a CSV or vCard (.vcf) file');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please upload a CSV or vCard (.vcf) file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await contactsAPI.upload(file, mode);
      setResult(response);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Contacts</h2>

      {/* Drag and drop area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop your contact file here, or
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          browse files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.vcf,text/csv,text/vcard,text/x-vcard"
          onChange={handleFileInput}
          className="hidden"
        />
        <p className="text-xs text-gray-500 mt-2">
          Supported: CSV, vCard (.vcf) from iOS/Android, Google Contacts CSV
        </p>
      </div>

      {/* Selected file */}
      {file && (
        <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Upload mode selection */}
      {file && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Mode
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="merge"
                checked={mode === 'merge'}
                onChange={(e) => setMode(e.target.value as 'merge' | 'replace')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Merge (update existing, add new)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="replace"
                checked={mode === 'replace'}
                onChange={(e) => setMode(e.target.value as 'merge' | 'replace')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Replace (delete all, then import)
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Upload button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {uploading ? 'Uploading...' : 'Upload Contacts'}
        </button>
      )}

      {/* Success result */}
      {result && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900 mb-2">
                Upload Successful
              </h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>Total: {result.total} contacts</p>
                <p>Imported: {result.imported} contacts</p>
                {result.skipped > 0 && (
                  <p>Skipped: {result.skipped} contacts</p>
                )}
                {result.totalErrors > 0 && (
                  <p className="text-red-600">Errors: {result.totalErrors}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-900">Upload Failed</h3>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Format help */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Supported File Formats
        </h3>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Simple CSV:</p>
            <pre className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-200 overflow-x-auto">
{`phone,opt_in,tags
+972501234567,true,vip-customer
+14155551234,true,new-lead`}
            </pre>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">iOS/Android vCard (.vcf):</p>
            <p className="text-xs text-gray-600">Export contacts from your phone, upload directly!</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Google Contacts CSV:</p>
            <p className="text-xs text-gray-600">Export from Google Contacts (all phone numbers extracted automatically)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
