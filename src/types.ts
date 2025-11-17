export type Contact = {
  phone: string; // E.164
  opt_in: boolean;
  tags?: string;
};

export type SendRequest = {
  limit?: number;            // number of recipients to send to
  bodyText?: string;         // body parameter for template
  tag?: string;              // filter by tag
  dryRun?: boolean;          // preview without sending
  components?: any[];        // full template components override
};
