import { MessageSquare } from 'lucide-react';
import { type ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg p-2">
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Campaign Sender</h1>
              <p className="text-sm text-muted-foreground">Manage and send campaign messages</p>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>WhatsApp Campaign Sender - Built with React, TypeScript & shadcn/ui</p>
        </div>
      </footer>
    </div>
  );
}
