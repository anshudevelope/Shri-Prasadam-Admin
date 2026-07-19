import { ObjectId } from "mongodb";

export interface Subscriber {
  _id?: ObjectId;
  email: string;
  name?: string;
  phone?: string;
  status: "active" | "unsubscribed" | "bounced";
  source: string;
  groupIds: string[];
  tags: string[];
  customFields?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  unsubscribedAt?: Date | null;
}

export interface Group {
  _id?: ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  _id?: ObjectId;
  name: string;
  subject: string;
  contentType: "html" | "text";
  htmlContent?: string;
  textContent?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AudienceType = "all" | "groups" | "subscribers";

export interface CampaignStats {
  totalRecipients: number;
  sent: number;
  failed: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
}

export interface EmailCampaign {
  _id?: ObjectId;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  contentType: "template" | "html" | "text";
  templateId?: string | null;
  htmlContent?: string;
  textContent?: string;
  audienceType: AudienceType;
  groupIds: string[];
  subscriberIds: string[];
  status: "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";
  scheduledAt?: Date | null;
  sentAt?: Date | null;
  stats: CampaignStats;
  errorLog?: string[];
  createdAt: Date;
  updatedAt: Date;
}
