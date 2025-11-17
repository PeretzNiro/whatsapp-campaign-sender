import { useQuery } from '@tanstack/react-query';
import { Activity, Users, MessageSquare, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { healthAPI, analyticsAPI } from '@/lib/api';

export function Dashboard() {
  const { data: health, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: healthAPI.check,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: analyticsAPI.getOverview,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor your WhatsApp campaign sender status
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && <Badge variant="outline">Checking...</Badge>}
            {isError && <Badge variant="destructive">Offline</Badge>}
            {health?.ok && <Badge variant="default" className="bg-green-600">Online</Badge>}
            <p className="text-xs text-muted-foreground mt-2">
              Backend API connection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalContacts?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Contacts in database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opted In</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.optedInContacts?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to receive messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.messagesSent?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total campaigns sent
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>Get started with your WhatsApp campaigns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Configure WhatsApp API</h4>
                  <p className="text-sm text-muted-foreground">
                    Add your WhatsApp Business API credentials to the .env file
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Upload Contacts</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Contacts tab and upload CSV, vCard (.vcf), or Google Contacts export
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Sync Templates</h4>
                  <p className="text-sm text-muted-foreground">
                    In Send Campaign, sync your approved templates from WhatsApp Business
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold">Send Campaign</h4>
                  <p className="text-sm text-muted-foreground">
                    Select template, set recipients, run dry-run test, then send!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">Pro Tips</p>
              <ul className="text-blue-700 space-y-1 mt-1">
                <li>• Export contacts directly from your iPhone/Android and upload the .vcf / .csv file</li>
                <li>• Always use Dry Run mode first to test your campaign before sending</li>
                <li>• Per-country rate limiting is automatic - no configuration needed</li>
                <li>• Only opted-in contacts will receive messages</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
