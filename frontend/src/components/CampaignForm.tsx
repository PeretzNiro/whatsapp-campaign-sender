import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Send, TestTube, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { campaignAPI, templatesAPI } from '@/lib/api';
import type { SendRequest, SendResponse } from '@/types';

export function CampaignForm() {
  const [limit, setLimit] = useState<number>(10);
  const [bodyText, setBodyText] = useState<string>('Hello! This is a campaign message.');
  const [tag, setTag] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<SendResponse | null>(null);

  // Fetch templates
  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesAPI.getAll(),
  });

  const sendMutation = useMutation({
    mutationFn: (request: SendRequest) => campaignAPI.send(request),
    onSuccess: (data) => {
      setLastResult(data);
    },
  });

  const handleSend = (dryRun: boolean) => {
    const request: SendRequest = {
      limit,
      bodyText,
      dryRun,
      templateId: selectedTemplate,
    };

    if (tag.trim()) {
      request.tag = tag.trim();
    }

    sendMutation.mutate(request);
  };

  const handleSyncTemplates = async () => {
    try {
      await templatesAPI.syncFromWhatsApp();
      refetchTemplates();
    } catch (error) {
      console.error('Failed to sync templates:', error);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Settings</CardTitle>
          <CardDescription>
            Configure your WhatsApp campaign message and recipients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="template">WhatsApp Template</Label>
              <button
                onClick={handleSyncTemplates}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Sync from WhatsApp
              </button>
            </div>
            <select
              id="template"
              value={selectedTemplate || ''}
              onChange={(e) => setSelectedTemplate(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">Select a template (optional)</option>
              {templatesLoading && <option>Loading templates...</option>}
              {templates?.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.language}) - {template.status}
                </option>
              ))}
            </select>
            {selectedTemplate && templates && (
              <p className="text-xs text-muted-foreground">
                {templates.find((t) => t.id === selectedTemplate)?.previewText || 'No preview available'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Number of Recipients</Label>
            <Input
              id="limit"
              type="number"
              min={1}
              max={100000}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of contacts to send to (with opt_in=true)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag">Filter by Tag (Optional)</Label>
            <Input
              id="tag"
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="vip, all, etc."
            />
            <p className="text-xs text-muted-foreground">
              Only send to contacts with this tag
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message Body</Label>
            <Textarea
              id="body"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Your message here..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              This will be inserted into your approved template
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={() => handleSend(true)}
              variant="outline"
              className="w-full"
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Dry Run (Test)
            </Button>
            <Button
              onClick={() => handleSend(false)}
              className="w-full"
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Campaign
            </Button>
          </div>

          {sendMutation.isError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              <p className="font-semibold">Error sending campaign:</p>
              <p>{(sendMutation.error as Error).message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Results</CardTitle>
          <CardDescription>
            View the status of your last campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sendMutation.isPending && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Sending campaign...</p>
              </div>
            </div>
          )}

          {!sendMutation.isPending && !lastResult && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No campaigns sent yet.</p>
              <p className="text-sm mt-2">Configure your campaign and click send to get started.</p>
            </div>
          )}

          {lastResult && !sendMutation.isPending && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{lastResult.total}</p>
                  <p className="text-xs text-blue-600">Total</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{lastResult.sent}</p>
                  <p className="text-xs text-green-600">Sent</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{lastResult.total - lastResult.sent}</p>
                  <p className="text-xs text-red-600">Failed</p>
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {lastResult.results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {result.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-mono text-sm">{result.to}</span>
                    </div>
                    <div className="flex gap-2">
                      {result.dryRun && <Badge variant="outline">Dry Run</Badge>}
                      {result.ok && <Badge variant="default">Success</Badge>}
                      {!result.ok && <Badge variant="destructive">Failed</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
