import { pool } from '../db/index.js';
import { sendEmail } from './email.js';

export interface AdminAlertContext {
  actionUrl?: string;
  [key: string]: any;
}

export class AdminEmailService {
  /**
   * Generates a sleek, minimal, high-density Admin Terminal HTML wrapper.
   */
  private static renderAdminWrapper(content: string, title: string, lang: 'ar' | 'en' = 'ar'): string {
    const isAr = lang === 'ar';
    return `<!DOCTYPE html>
<html lang="${lang}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #030712;
            font-family: ${isAr ? "'Tajawal', 'Cairo', sans-serif" : "'Helvetica Neue', Helvetica, Arial, sans-serif"};
            color: #f3f4f6;
            direction: ${isAr ? 'rtl' : 'ltr'};
            text-align: ${isAr ? 'right' : 'left'};
            -webkit-font-smoothing: antialiased;
        }
        .admin-wrapper {
            width: 100%;
            background-color: #030712;
            padding: 24px 0;
        }
        .admin-table {
            background-color: #0b0f19;
            margin: 0 auto;
            width: 580px;
            max-width: 95%;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #1f2937;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }
        .admin-header {
            background-color: #111827;
            padding: 16px 20px;
            border-bottom: 1px solid #1f2937;
            display: table;
            width: 100%;
            box-sizing: border-box;
        }
        .admin-tag {
            display: inline-block;
            background-color: #0284c7;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .admin-title {
            color: #9ca3af;
            font-size: 12px;
            margin-top: 6px;
            font-weight: 600;
        }
        .admin-body {
            padding: 24px 20px;
        }
        .admin-card {
            background-color: #111827;
            border: 1px solid #1f2937;
            border-radius: 6px;
            padding: 14px 16px;
            margin: 16px 0;
        }
        .admin-label {
            color: #6b7280;
            font-size: 12px;
            font-weight: 600;
            width: 38%;
        }
        .admin-val {
            color: #f3f4f6;
            font-size: 13px;
            font-weight: 700;
        }
        .admin-btn {
            background-color: #0284c7;
            color: #ffffff !important;
            text-decoration: none;
            padding: 10px 24px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
            display: inline-block;
        }
        .admin-footer {
            background-color: #030712;
            padding: 16px;
            text-align: center;
            font-size: 11px;
            color: #4b5563;
            border-top: 1px solid #111827;
        }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <table border="0" cellpadding="0" cellspacing="0" class="admin-table" width="580">
            <tr>
                <td class="admin-header">
                    <span class="admin-tag">${isAr ? 'إشعار إداري حرج' : 'ADMIN OPERATIONAL ALERT'}</span>
                    <div class="admin-title">PERPLEXTA ERP & OPERATIONS TERMINAL</div>
                </td>
            </tr>
            <tr>
                <td class="admin-body">
                    ${content}
                </td>
            </tr>
            <tr>
                <td class="admin-footer">
                    Confidential System Alert • For Authorized Admins Only • © 2026 VIRALLINKUP LTD
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;
  }

  /**
   * Broadcasts an HTML email to all active admins in the system.
   */
  public static async broadcastToAdmins(
    subjectEn: string,
    subjectAr: string,
    contentGenerator: (lang: 'ar' | 'en') => string,
    title: string
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    try {
      const adminsRes = await pool.query(`
        SELECT id, email, language, name 
        FROM users 
        WHERE role IN ('admin', 'super_admin') AND status = 'active'
      `);

      if (adminsRes.rows.length === 0) {
        console.warn('[AdminEmailService] No active admin recipients found in database.');
        return { sent: 0, failed: 0 };
      }

      for (const admin of adminsRes.rows) {
        const lang: 'ar' | 'en' = String(admin.language || 'ar').toLowerCase().startsWith('en') ? 'en' : 'ar';
        const subject = lang === 'ar' ? subjectAr : subjectEn;
        const rawContent = contentGenerator(lang);
        const fullHtml = this.renderAdminWrapper(rawContent, title, lang);

        const result = await sendEmail(admin.email, subject, fullHtml, admin.id);
        if (result.success) sent++;
        else failed++;
      }
    } catch (err) {
      console.error('[AdminEmailService] Broadcast execution failed:', err);
    }

    return { sent, failed };
  }

  /**
   * 1. Alert Admins: New User Registration
   */
  public static async notifyNewUserRegistration(data: {
    userName: string;
    userEmail: string;
    registrationIp?: string;
    referrerName?: string;
    actionUrl?: string;
  }) {
    const adminUrl = data.actionUrl || `${process.env.PUBLIC_APP_URL || 'https://perplexta.com'}/admin`;

    return this.broadcastToAdmins(
      `[Admin Alert] New User Provisioned: ${data.userName}`,
      `[إشعار إداري] تسجيل مستخدم جديد: ${data.userName}`,
      (lang) => {
        const isAr = lang === 'ar';
        return `
          <h3 style="margin:0 0 12px 0; font-size:16px; color:#ffffff;">👤 ${isAr ? 'حساب مستخدم جديد' : 'New User Account Registered'}</h3>
          <p style="margin:0 0 14px 0; font-size:13px; color:#9ca3af; line-height:1.6;">
            ${isAr ? 'تم تسجيل عضو جديد بنجاح وتجهيز حسابه في القاعدة.' : 'A new user has completed registration on Perplexta Terminal.'}
          </p>
          <div class="admin-card">
            <table width="100%" cellpadding="4" cellspacing="0">
              <tr>
                <td class="admin-label">${isAr ? 'الاسم:' : 'Name:'}</td>
                <td class="admin-val">${data.userName}</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'البريد:' : 'Email:'}</td>
                <td class="admin-val">${data.userEmail}</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'عنوان IP:' : 'IP Address:'}</td>
                <td class="admin-val">${data.registrationIp || '127.0.0.1'}</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'المُحيل:' : 'Referred By:'}</td>
                <td class="admin-val">${data.referrerName || (isAr ? 'مباشر' : 'Direct')}</td>
              </tr>
            </table>
          </div>
          <div style="text-align:center; margin-top:18px;">
            <a href="${adminUrl}" class="admin-btn">${isAr ? 'فتح لوحة التحكم' : 'Open Admin Panel'}</a>
          </div>
        `;
      },
      'New User Registration Alert'
    );
  }

  /**
   * 2. Alert Admins: Subscription Purchase
   */
  public static async notifySubscriptionPurchase(data: {
    purchaserName: string;
    purchaserEmail: string;
    planName: string;
    paidAmount: string;
    billingCycle?: string;
    actionUrl?: string;
  }) {
    const adminUrl = data.actionUrl || `${process.env.PUBLIC_APP_URL || 'https://perplexta.com'}/admin`;

    return this.broadcastToAdmins(
      `[Admin Alert] Plan Subscription Purchased: ${data.planName}`,
      `[إشعار إداري] تم شراء اشتراك جديد: ${data.planName}`,
      (lang) => {
        const isAr = lang === 'ar';
        return `
          <h3 style="margin:0 0 12px 0; font-size:16px; color:#38bdf8;">💳 ${isAr ? 'عملية شراء اشتراك جديد' : 'New Subscription Plan Purchased'}</h3>
          <p style="margin:0 0 14px 0; font-size:13px; color:#9ca3af; line-height:1.6;">
            ${isAr ? 'تم تأكيد وإشهار عملية شراء خطة جديدة في السجل المالي.' : 'A subscription purchase has been confirmed in the ledger.'}
          </p>
          <div class="admin-card">
            <table width="100%" cellpadding="4" cellspacing="0">
              <tr>
                <td class="admin-label">${isAr ? 'المشتري:' : 'Purchaser:'}</td>
                <td class="admin-val">${data.purchaserName} (${data.purchaserEmail})</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'اسم الباقة:' : 'Plan:'}</td>
                <td class="admin-val">${data.planName}</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'المبلغ المدفوع:' : 'Amount Paid:'}</td>
                <td class="admin-val" style="color:#4ade80;">${data.paidAmount}</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'دورة الفوترة:' : 'Cycle:'}</td>
                <td class="admin-val">${data.billingCycle || (isAr ? 'شهري' : 'Monthly')}</td>
              </tr>
            </table>
          </div>
          <div style="text-align:center; margin-top:18px;">
            <a href="${adminUrl}" class="admin-btn">${isAr ? 'عرض السجل المالي' : 'View Financial Ledger'}</a>
          </div>
        `;
      },
      'Subscription Purchase Alert'
    );
  }

  /**
   * 3. Alert Admins: Account Deletion / Deactivation
   */
  public static async notifyAccountDeletion(data: {
    targetUserName: string;
    targetUserEmail: string;
    operatorName?: string;
    reasonNote?: string;
  }) {
    return this.broadcastToAdmins(
      `[Admin Security] Account Deleted / Deactivated: ${data.targetUserEmail}`,
      `[أمن الإدارة] حذف أو تعطيل حساب: ${data.targetUserEmail}`,
      (lang) => {
        const isAr = lang === 'ar';
        return `
          <h3 style="margin:0 0 12px 0; font-size:16px; color:#f87171;">⚠️ ${isAr ? 'حذف / تعطيل حساب مستخدم' : 'Account Deletion / Removal Executed'}</h3>
          <p style="margin:0 0 14px 0; font-size:13px; color:#9ca3af; line-height:1.6;">
            ${isAr ? 'تم تسجيل عملية حذف أو سحب صلاحيات حساب في النظام.' : 'A user deactivation or account deletion event was logged.'}
          </p>
          <div class="admin-card">
            <table width="100%" cellpadding="4" cellspacing="0">
              <tr>
                <td class="admin-label">${isAr ? 'الحساب:' : 'Target Account:'}</td>
                <td class="admin-val">${data.targetUserName} (${data.targetUserEmail})</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'المنفّذ:' : 'Executed By:'}</td>
                <td class="admin-val">${data.operatorName || (isAr ? 'المستخدم بنفسه' : 'Self-Action')}</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'السبب:' : 'Reason Note:'}</td>
                <td class="admin-val">${data.reasonNote || (isAr ? 'طلب إغلاق الحساب' : 'Account Closure Request')}</td>
              </tr>
            </table>
          </div>
        `;
      },
      'Account Deletion Alert'
    );
  }

  /**
   * 4. Alert Admins: High Value Deposit
   */
  public static async notifyHighValueDeposit(data: {
    accountName: string;
    accountEmail: string;
    depositAmount: string;
    paymentGateway: string;
  }) {
    return this.broadcastToAdmins(
      `[Admin Ledger] High Value Deposit Logged: ${data.depositAmount}`,
      `[السجل المالي] إيداع مالي كبير: ${data.depositAmount}`,
      (lang) => {
        const isAr = lang === 'ar';
        return `
          <h3 style="margin:0 0 12px 0; font-size:16px; color:#fbbf24;">💎 ${isAr ? 'إيداع مالي بقيمة مرتفعة' : 'High-Value Wallet Deposit Logged'}</h3>
          <p style="margin:0 0 14px 0; font-size:13px; color:#9ca3af; line-height:1.6;">
            ${isAr ? 'تم تسجيل إيداع مالي يتجاوز العتبة الموصى بها ويتطلب التدقيق.' : 'A large wallet top-up transaction was logged.'}
          </p>
          <div class="admin-card">
            <table width="100%" cellpadding="4" cellspacing="0">
              <tr>
                <td class="admin-label">${isAr ? 'اسم الحساب:' : 'Account:'}</td>
                <td class="admin-val">${data.accountName} (${data.accountEmail})</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'المبلغ:' : 'Amount:'}</td>
                <td class="admin-val" style="color:#4ade80;">${data.depositAmount}</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'بوابة السداد:' : 'Gateway:'}</td>
                <td class="admin-val">${data.paymentGateway}</td>
              </tr>
            </table>
          </div>
        `;
      },
      'High Value Deposit Alert'
    );
  }

  /**
   * 5. Alert Admins: GPU Infrastructure Outage
   */
  public static async notifyGpuOutage(data: {
    providerName: string;
    modelName: string;
    endpointUrl: string;
    errorMessage: string;
  }) {
    return this.broadcastToAdmins(
      `[Infrastructure Critical] GPU Node Offline: ${data.providerName}`,
      `[حرج - البنية التحتية] انقطاع خادم الـ GPU: ${data.providerName}`,
      (lang) => {
        const isAr = lang === 'ar';
        return `
          <h3 style="margin:0 0 12px 0; font-size:16px; color:#f87171;">🔴 ${isAr ? 'انقطاع عقدة معالجة الـ GPU' : 'GPU Compute Node Outage Detected'}</h3>
          <p style="margin:0 0 14px 0; font-size:13px; color:#9ca3af; line-height:1.6;">
            ${isAr ? 'رصد مراقب الصحة انقطاع خادم الـ GPU وتفعيل التوجيه التلقائي للمزود الاحتياطي.' : 'Health monitor recorded a GPU compute node outage. Failover activated.'}
          </p>
          <div class="admin-card">
            <table width="100%" cellpadding="4" cellspacing="0">
              <tr>
                <td class="admin-label">${isAr ? 'المزود:' : 'Provider:'}</td>
                <td class="admin-val">${data.providerName}</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'النموذج:' : 'Model:'}</td>
                <td class="admin-val">${data.modelName}</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'الرابط:' : 'Endpoint:'}</td>
                <td class="admin-val">${data.endpointUrl}</td>
              </tr>
              <tr>
                <td class="admin-label">${isAr ? 'حالة الخطأ:' : 'Error Message:'}</td>
                <td class="admin-val" style="color:#f87171;">${data.errorMessage}</td>
              </tr>
            </table>
          </div>
        `;
      },
      'GPU Node Outage Alert'
    );
  }
}

export default AdminEmailService;
