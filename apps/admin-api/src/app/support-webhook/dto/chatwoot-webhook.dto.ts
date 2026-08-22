export interface ChatwootWebhookSender {
  id: number;
  name: string;
  email?: string;
  type?: string;
}

export interface ChatwootWebhookContact {
  id: number;
  name: string;
  identifier?: string;
  custom_attributes?: {
    user_type?: 'passenger' | 'driver';
    user_id?: string;
    user_given_name?: string;
    user_family_name?: string;
    user_phone_number?: string;
    [key: string]: unknown;
  };
}

export interface ChatwootWebhookConversationAdditionalAttributes {
  browser?: {
    device_name?: string;
    browser_name?: string;
    platform_name?: string;
    browser_version?: string;
    platform_version?: string;
  };
  referer?: string;
  initiated_at?: {
    timestamp?: string;
  };
  browser_language?: string;
}

export interface ChatwootWebhookConversationMeta {
  sender?: ChatwootWebhookContact;
  assignee?: ChatwootWebhookSender;
  assignee_type?: string;
  team?: unknown;
  hmac_verified?: boolean;
}

export interface ChatwootWebhookConversation {
  id?: number;
  display_id?: string;
  additional_attributes?: ChatwootWebhookConversationAdditionalAttributes;
  custom_attributes?: Record<string, unknown>;
  meta?: ChatwootWebhookConversationMeta;
  status?: string;
  channel?: string;
}

export interface ChatwootWebhookAccount {
  id: number;
  name: string;
}

export interface ChatwootWebhookPayload {
  event: string;
  id: number;
  content: string;
  created_at: string;
  message_type: 'incoming' | 'outgoing' | 'template';
  content_type: 'text' | 'input_select' | 'cards' | 'form';
  content_attributes: Record<string, unknown>;
  source_id?: string;
  private?: boolean;
  sender?: ChatwootWebhookSender;
  contact?: ChatwootWebhookContact;
  conversation?: ChatwootWebhookConversation;
  account?: ChatwootWebhookAccount;
  inbox?: {
    id: number;
    name: string;
  };
}
