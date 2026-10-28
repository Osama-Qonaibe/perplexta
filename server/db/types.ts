
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string | null;
  role: 'user' | 'admin' | 'moderator' | string;
  status: 'active' | 'suspended' | string;
  kyc_status: 'none' | 'pending' | 'verified' | 'rejected' | string;
  kyc_required: boolean;
  kyc_rejection_reason: string | null;
  kyc_submitted_at: Date | string | null;
  referred_by: number | null;
  referral_code: string | null;
  language: string;
  theme: 'light' | 'dark' | 'system' | string;
  memory: string | null;
  support_notes: string | null;
  custom_instructions: string | null;
  last_active_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
  provider: string;
  avatar: string | null;
  is_admin?: boolean;
}

export interface PasswordReset {
  id: number;
  email: string;
  token: string;
  expires_at: Date | string;
  created_at: Date | string;
}

export interface TokenBlacklist {
  id: number;
  token: string;
  expires_at: Date | string;
  created_at: Date | string;
}

export interface Chat {
  id: number;
  user_id: number | null;
  title: string;
  tool_id: string;
  context_summary: string | null;
  is_pinned: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  tool: string;
}

export interface Message {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_id: string | null;
  model: string | null;
  tokens_used: number;
  feedback: number;
  thinking_steps: Record<string, unknown>[] | string[] | null;
  citations: Record<string, unknown>[] | string[] | null;
  follow_ups: string[] | null;
  generation_time: number | string | null;
  created_at: Date | string;
  tool: string | null;
  is_pinned: boolean;
  updated_at: Date | string;
}

export interface ApiKeyVault {
  id: number;
  provider: string;
  encrypted_key: string;
  daily_budget: number | string;
  used_today: number | string;
  last_reset_date: Date | string;
  models: Array<{ id?: string; name?: string; [key: string]: unknown } | string> | null;
  model_list: Array<{ id?: string; name?: string; [key: string]: unknown } | string> | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  url_key: string | null;
  protocol_config: Record<string, unknown> | null;
}

export interface GpuProvider {
  id: number;
  provider_id: string;
  name: string;
  provider_type: 'runpod_serverless' | 'openai_vision_compatible' | 'comfyui_worker' | 'custom_rest';
  endpoint_id: string | null;
  base_url: string;
  api_url?: string;
  encrypted_api_key: string;
  current_load_capacity?: number;
  status?: 'active' | 'inactive' | string;
  metadata?: Record<string, unknown> | null;
  health_status: 'online' | 'cold_boot' | 'busy' | 'offline';
  latency_ms: number;
  capabilities: string[];
  daily_budget: number | string;
  used_today: number | string;
  last_reset_date: Date | string;
  config: Record<string, unknown> | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface GpuProviderModel {
  id: number;
  provider_id: number;
  model_id: string;
  name: string;
  task_type: 'vision_analysis' | 'image_gen' | 'video_gen';
  context_window: number;
  max_output_tokens: number;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: Date | string;
}

export interface GpuExecutionJob {
  id: number;
  job_id: string;
  user_id: number | null;
  provider_id: number | null;
  model_id: string;
  task_type: 'vision_analysis' | 'image_gen' | 'video_gen';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  prompt: string | null;
  parameters: Record<string, unknown> | null;
  remote_job_id: string | null;
  result_url: string | null;
  result_data: Record<string, unknown> | null;
  latency_ms: number;
  error_message: string | null;
  attempts: number;
  failover_count: number;
  cost_charged: number | string;
  created_at: Date | string;
  completed_at: Date | string | null;
}

export interface ToolOrchestrator {
  id: number;
  tool_id: string;
  primary_provider: string | null;
  primary_model: string | null;
  fallback_1_provider: string | null;
  fallback_1_model: string | null;
  fallback_2_provider: string | null;
  fallback_2_model: string | null;
  fallback_3_provider: string | null;
  fallback_3_model: string | null;
  task_description: string | null;
  task_description_ar: string | null;
  system_prompt?: string | null;
  timeout_seconds?: number;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  is_active: boolean;
  max_history_depth: number;
  updated_at: Date | string;
  protocol_config: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface UserSession {
  id: number;
  user_id: number | null;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  status: 'active' | 'revoked' | 'expired';
  created_at: Date | string;
  expires_at: Date | string;
  last_active_at: Date | string;
}

export interface UserFile {
  id: number;
  user_id: number;
  chat_id: number | null;
  file_name: string;
  file_type: string | null;
  mime_type: string | null;
  file_size: number | null;
  file_url: string | null;
  file_content: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ChatMemory {
  id: number;
  user_id: number;
  chat_id: number | null;
  fact: string;
  source: 'ai' | 'user' | string;
  category: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Notification {
  id: number;
  user_id: number | null;
  title_en: string;
  title_ar: string;
  message_en: string;
  message_ar: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Plan {
  id: number;
  name_en: string;
  name_ar: string;
  desc_en: string | null;
  desc_ar: string | null;
  badge: string | null;
  discount: number;
  is_active: boolean;
  is_visible: boolean;
  is_popular: boolean;
  monthly_price: number | string;
  annual_price: number | string;
  color: string | null;
  features: string[] | Record<string, unknown>;
  limits: Record<string, number | string | boolean>;
  plan_type: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'expired' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing';
  billing_period: 'monthly' | 'annual';
  current_period_end: Date | string | null;
  last_period_start: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface SupportTicket {
  id: number;
  user_id: number | null;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed' | string;
  priority: 'low' | 'medium' | 'high' | string;
  category: string;
  assigned_to: number | null;
  last_reply_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface SupportTicketReply {
  id: number;
  ticket_id: number;
  user_id: number | null;
  message: string;
  is_admin_reply: boolean;
  created_at: Date | string;
}

export interface RouteSeoSetting {
  id: number;
  route: string;
  title_ar: string | null;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  keywords_ar: string | null;
  keywords_en: string | null;
  og_image_url: string | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface SystemSettings {
  id: number;
  site_name_en: string;
  site_name_ar: string;
  seo_site_name_en: string | null;
  seo_site_name_ar: string | null;
  logo_url: string | null;
  logo_light_url: string | null;
  favicon_url: string | null;
  site_description_en: string | null;
  site_description_ar: string | null;
  seo_description_en: string | null;
  seo_description_ar: string | null;
  keywords_en: string | null;
  keywords_ar: string | null;
  google_analytics_id: string | null;
  google_site_verification: string | null;
  seo_image_url: string | null;
  stripe_publishable_key: string | null;
  stripe_secret_key: string | null;
  stripe_webhook_secret: string | null;
  stripe_live_mode: boolean;
  stripe_status: string;
  stripe_last_verified_at: Date | string | null;
  paypal_client_id: string | null;
  paypal_client_secret: string | null;
  paypal_mode: 'sandbox' | 'live';
  paypal_status: string;
  paypal_last_verified_at: Date | string | null;
  image_prompt_pref_threshold: number;
  memory_limit_per_user: number;
  quota_warning_threshold_low?: number;
  quota_warning_threshold_high?: number;
  updated_at: Date | string;
}

export interface SystemBroadcast {
  id: number;
  admin_id: number | null;
  broadcast_type: string;
  type: string;
  target_group: string;
  target_role: string;
  title_en: string | null;
  title_ar: string | null;
  content_en: string | null;
  content_ar: string | null;
  status: string;
  sent_count: number;
  created_at: Date | string;
}

export interface SystemLog {
  id: number;
  user_id: number | null;
  action: string | null;
  type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface SecurityAlert {
  id: number;
  user_id: number | null;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string | null;
  metadata: Record<string, unknown> | null;
  is_resolved: boolean;
  ip_address: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface OAuthState {
  id: number;
  state: string;
  provider: string;
  redirect_url: string | null;
  expires_at: Date | string;
  created_at: Date | string;
}

export interface MessageReport {
  id: number;
  user_id: number | null;
  message_id: number | null;
  reason: string | null;
  status: 'pending' | 'reviewed' | 'dismissed' | string;
  created_at: Date | string;
}

export interface UserShortcut {
  id: number;
  user_id: number | null;
  title: string;
  query: string;
  category: string;
  created_at: Date | string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject_en: string | null;
  subject_ar: string | null;
  body_en: string | null;
  body_ar: string | null;
  type: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface EmailSettings {
  id: number;
  mailer_type: string;
  smtp_host: string | null;
  smtp_port: string | null;
  smtp_encryption: string;
  smtp_username: string | null;
  smtp_password: string | null;
  sender_name: string | null;
  sender_email: string | null;
  status: string;
  last_verified_at: Date | string | null;
  updated_at: Date | string;
}

export interface VideoResource {
  id: number;
  user_id: number | null;
  chat_id: number | null;
  message_id: number | null;
  file_url: string;
  prompt: string | null;
  provider: string | null;
  model: string | null;
  duration: number | null;
  aspect_ratio: string | null;
  resolution: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
}

export interface RegisteredAgent {
  id: number;
  client_id: string;
  client_secret: string;
  client_name: string | null;
  identity_type: string;
  credential_type: string;
  redirect_uris: string[] | null;
  jwks_uri: string | null;
  user_agent: string | null;
  signature_keys: Record<string, unknown> | null;
  user_id: number | null;
  created_at: Date | string;
}

export interface DbConnectionsRegistry {
  id: string;
  provider: string | null;
  type: string;
  host: string | null;
  port: string | null;
  db_name: string | null;
  username: string | null;
  password: string | null;
  connection_string: string | null;
  ssl_mode: string;
  pool_size: number;
  is_active: boolean;
  status: string;
  last_checked_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface MigrationHistory {
  id: number;
  migration_name: string;
  applied_at: Date | string;
}

export interface MigrationSecurityAudit {
  id: number;
  migration_name: string | null;
  status: 'failed' | 'conflict' | 'info';
  error_message: string | null;
  sql_state: string | null;
  details: Record<string, unknown> | null;
  created_at: Date | string;
}

export interface UserUsage {
  id: number;
  user_id: number;
  tool_id: string;
  usage_count: number;
  usage_date: Date | string;
  updated_at: Date | string;
}


export interface Wallet {
  id: number;
  user_id: number;
  balance: number | string;
  usd_balance: number | string;
  points: number;
  referral_activated: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface LedgerTransaction {
  id: number;
  wallet_id: number | null;
  user_id: number | null;
  amount: number | string;
  points: number;
  transaction_type: string;
  status: string;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  description: string | null;
  is_hidden: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Referral {
  id: number;
  referrer_id: number;
  referred_id: number;
  bonus_points: number;
  status: 'pending' | 'active' | 'completed' | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ReferralTree {
  id: number;
  referrer_id: number;
  referred_id: number;
  level: number;
  commission_earned: number | string;
  status: string;
  created_at: Date | string;
}

export interface KycRequest {
  id: number;
  user_id: number;
  full_name: string | null;
  selfie_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason: string | null;
  submitted_at: Date | string;
  updated_at: Date | string;
}

export interface WithdrawalRequest {
  id: number;
  user_id: number;
  amount_cents: number;
  method: string;
  details: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  processed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PayoutAccount {
  id: number;
  user_id: number;
  type: string | null;
  details: string | null;
  updated_at: Date | string;
}

export interface EconomySettings {
  id: number;
  welcome_bonus_points: number;
  referral_bonus_points: number;
  min_withdrawal_cents: number;
  points_per_dollar: number;
  conversion_rate: number | string;
  referral_bonus_percent: number;
  min_payout_usd: number | string;
  min_deposit_usd: number | string;
  referral_activation_min_deposit: number | string;
  crypto_address: string | null;
  bank_name: string | null;
  bank_recipient: string | null;
  bank_iban: string | null;
  bank_swift: string | null;
  paypal_email: string | null;
  updated_at: Date | string;
}

export interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed' | string;
  value: number | string;
  min_purchase: number | string;
  max_discount: number | string | null;
  expires_at: Date | string | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  created_at: Date | string;
}

export interface CouponUsage {
  id: number;
  coupon_id: number | null;
  user_id: number;
  transaction_id: number | null;
  applied_at: Date | string;
}

export interface DepositRequest {
  id: number;
  user_id: number;
  amount: number | string;
  currency: string;
  method: string;
  proof_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  admin_id: number | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface StripeEvent {
  id: number;
  stripe_event_id: string | null;
  type: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AdminAuditLog {
  id: number;
  admin_id: number | null;
  admin_email: string | null;
  action: string;
  target_resource: string | null;
  details: Record<string, unknown> | string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date | string;
}


export interface BulletinPage {
  id: number;
  user_id: number;
  owner_id?: number | null;
  name: string;
  slug?: string;
  category: string;
  city: string;
  address?: string | null;
  description: string;
  avatar_url: string;
  cover_url: string;
  whatsapp_number?: string | null;
  phone_number?: string | null;
  website_url?: string | null;
  is_verified: boolean;
  followers_count: number;
  ads_count: number;
  user_is_following?: boolean;
  owner_name?: string;
  owner_avatar?: string;
  owner_username?: string;
  owner_email?: string;
  managers?: string | Record<string, unknown>[] | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface BulletinInquiry {
  id: number;
  page_id?: number | null;
  ad_id?: number | null;
  sender_id: number;
  sender_name: string;
  sender_phone?: string | null;
  message: string;
  status: 'unread' | 'read';
  ad_title?: string;
  page_name?: string;
  created_at: Date | string;
}

export interface MediaGalleryItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
  thumbnailUrl?: string;
}

export interface BulletinAd {
  id: number;
  user_id: number;
  owner_id?: number | null;
  page_id?: number | null;
  page_name?: string | null;
  page_avatar?: string | null;
  page_cover?: string | null;
  page_is_verified?: boolean;
  location_city?: string | null;
  location_country?: string | null;
  location_scope?: 'entire_country' | 'specific_cities' | string | null;
  target_country?: string | null;
  author_name?: string;
  author_avatar?: string;
  title: string;
  description: string;
  image_url: string;
  media_gallery?: MediaGalleryItem[];
  metadata?: Record<string, unknown> | null;
  whatsapp_number: string | null;
  has_whatsapp_button?: boolean;
  phone_number?: string | null;
  video_url?: string | null;
  target_url: string | null;
  hashtags: string[];
  category: string;
  price_paid: number;
  duration_days: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'archived' | 'trash' | string;
  rejection_reason?: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  clicks_count: number;
  impressions_count: number;
  user_has_liked?: boolean;
  user_reaction?: string | null;
  user_has_saved?: boolean;
  is_ai_generated?: boolean;
  feeling?: string | null;
  tagged_users?: string[] | null;
  audience?: 'public' | 'friends' | 'only_me' | string;
  who_can_comment?: 'anyone' | 'followers' | 'mentioned' | 'nobody' | string;
  allow_translation?: boolean;
  is_muted_notifications?: boolean;
  partnership_code?: string | null;
  is_partnership?: boolean;
  partnership_brand?: string | null;
  partnership_label_enabled?: boolean;
  partnership_sponsor_name?: string | null;
  archived_at?: Date | string | null;
  deleted_at?: Date | string | null;
  ad_format?: 'post' | 'reel' | 'story' | string;
  quick_questions?: string[] | null;
  is_boosted?: boolean;
  boosted_until?: Date | string | null;
  boost_tier?: string | null;
  boost_price?: number;
  boost_goal?: string | null;
  boost_daily_budget?: number;
  boost_settings?: Record<string, unknown> | null;
  audio_url?: string | null;
  audio_title?: string | null;
  audio_artist?: string | null;
  audio_track_id?: string | null;
  starts_at?: Date | string | null;
  expires_at?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface BulletinAdComment {
  id: number;
  ad_id: number;
  user_id: number;
  author_name: string;
  author_avatar: string | null;
  content: string;
  parent_id?: number | null;
  like_count?: number;
  user_reaction?: string | null;
  reactions_summary?: string[];
  replies?: BulletinAdComment[];
  created_at: Date | string;
}


export interface Advertisement {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  image_url: string;
  target_url: string;
  sponsor_name: string | null;
  badge_text_ar: string | null;
  badge_text_en: string | null;
  position: string;
  display_order: number;
  is_active: boolean;
  click_count: number;
  impression_count: number;
  meta_title_ar: string | null;
  meta_title_en: string | null;
  meta_description_ar: string | null;
  meta_description_en: string | null;
  keywords_ar: string | null;
  keywords_en: string | null;
  start_date: Date | string | null;
  end_date: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ApiPerformanceLog {
  id: number;
  endpoint: string;
  method: string;
  status_code: number;
  duration_ms: number;
  ip_address: string | null;
  user_agent: string | null;
  user_id: number | null;
  query_params?: Record<string, unknown> | null;
  headers_snapshot?: Record<string, unknown> | null;
  is_slow: boolean;
  created_at: Date | string;
}

export interface StudioWorkspace {
  id: string;
  user_id: number;
  title: string;
  name?: string;
  description: string | null;
  framework_mode: string;
  files: Record<string, string>;
  chat_history: Record<string, unknown>[];
  is_public: boolean;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface StudioSnapshot {
  id: number | string;
  workspace_id: string;
  version_name: string;
  files: Record<string, string>;
  created_at: Date | string;
}

export interface RinexCreator {
  id: string;
  user_id: number | null;
  username: string;
  name: string;
  email: string | null;
  role_ar: string;
  role_en: string;
  avatar: string | null;
  bio_ar: string | null;
  bio_en: string | null;
  verified: boolean;
  total_views: number;
  total_uses: number;
  rating: number | string;
  earnings_balance: number | string;
  followers_count: number;
  likes_count: number;
  profile_visits_count: number;
  social_links: Record<string, string> | null;
  pending_bonus_usd: number | string;
  bonus_claimed: boolean;
  bonus_claimed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface RinexTemplate {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_username: string;
  creator_avatar: string | null;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  thumbnail: string;
  canvas_background: string | null;
  category: string;
  category_label_ar: string | null;
  dimensions: string;
  price_type: 'free' | 'pro' | string;
  price: number | string;
  views_count: number;
  uses_count: number;
  rating: number | string;
  elements: Record<string, unknown>[];
  created_at: Date | string;
  updated_at: Date | string;
}

export interface RinexTemplateUsage {
  id: number;
  template_id: string;
  creator_id: string;
  user_id: number | null;
  ip_address: string | null;
  royalty_paid: number | string;
  price_type: 'free' | 'pro' | string;
  created_at: Date | string;
}

export interface RinexFavoriteTemplate {
  id: number;
  user_id: number;
  template_id: string;
  created_at: Date | string;
}

export interface RinexPayoutRequest {
  id: string;
  creator_id: string;
  amount: number | string;
  method: string;
  details: string | null;
  status: 'pending' | 'approved' | 'rejected' | string;
  requested_at: Date | string;
  updated_at: Date | string;
}

export interface SeoMetadata {
  id: number;
  route_path: string;
  entity_type: string | null;
  entity_id: string | null;
  title_en: string | null;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  og_image_url: string | null;
  og_image_alt_en: string | null;
  og_image_alt_ar: string | null;
  keywords_en: string | null;
  keywords_ar: string | null;
  canonical_url: string | null;
  structured_data: Record<string, unknown> | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface MapProvider {
  id: number;
  provider_key: string;
  name: string;
  api_key_encrypted: string | null;
  is_enabled: boolean;
  is_primary: boolean;
  priority: number;
  capabilities: string[];
  config: Record<string, unknown>;
  status: string;
  last_tested_at: Date | string | null;
  last_error: string | null;
  latency_ms: number | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CachedLocation {
  id: number;
  place_id: string | null;
  title: string;
  city: string;
  state: string | null;
  country: string | null;
  country_code: string | null;
  lat: number | string | null;
  lon: number | string | null;
  full_address: string | null;
  category_label: string | null;
  raw_type: string | null;
  flag: string | null;
  source: string;
  hits: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Form {
  id: number;
  title: string;
  slug: string | null;
  description: string | null;
  fields: Record<string, unknown>[];
  settings: Record<string, unknown>;
  status: 'published' | 'draft' | 'archived' | string;
  submissions_count: number;
  created_by: number | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface FormSubmission {
  id: number;
  form_id: number;
  user_id: number | null;
  data: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date | string;
}

export interface PushToken {
  id: number;
  user_id: number;
  platform: 'android' | 'ios';
  token: string;
  device_name: string | null;
  app_version: string | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface MediaAsset {
  id: string;
  stored_path: string;
  original_filename: string;
  context: string;
  format: string;
  width: number;
  height: number;
  size_bytes: number | string;
  sha256_hash: string | null;
  is_public: boolean;
  user_id: number | null;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CanvasSession {
  id: string;
  user_id: number | null;
  session_name: string;
  dimensions: { width: number; height: number };
  state: Record<string, unknown>;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CanvasHistory {
  id: number;
  session_id: string;
  action_type: string;
  undo_state: Record<string, unknown>;
  redo_state: Record<string, unknown>;
  created_at: Date | string;
}

export interface UserAudioLibraryItem {
  id: string;
  user_id: number | null;
  user_name: string | null;
  user_avatar: string | null;
  title: string;
  artist: string | null;
  duration: number;
  audio_url: string;
  audio_type: string;
  category: string;
  source: string;
  source_ad_id: number | null;
  usage_count: number;
  likes_count: number;
  is_trending: boolean;
  is_public: boolean;
  license: string;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
}
