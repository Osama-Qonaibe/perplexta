import express from 'express';
import { pool } from '../db/index.js';
import { authenticateTokenOptional } from '../middleware/auth.js';

const router = express.Router();

/**
 * Loads the user's active subscription plan limits for Studio.
 */
async function getUserStudioLimits(userId: string | number) {
  if (!pool) return { maxProjects: 100, maxStorageMb: 500, maxSnapshots: 20, planName: 'Free' };
  try {
    // Check if user is admin or developer for unconstrained access
    const userRoleRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]).catch(() => ({ rows: [] }));
    const userRole = userRoleRes.rows[0]?.role?.toLowerCase();
    if (userRole === 'admin' || userRole === 'developer' || userRole === 'owner') {
      return { maxProjects: 'unlimited', maxStorageMb: 'unlimited', maxSnapshots: 'unlimited', planName: 'Admin / Unlimited' };
    }

    const res = await pool.query(`
      SELECT p.name_en, p.name_ar, p.limits 
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = $1 
        AND s.status = 'active' 
        AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
      ORDER BY s.current_period_end DESC NULLS LAST
      LIMIT 1
    `, [userId]);

    let limits: any = {};
    let planName = 'Free';
    if (res.rows.length > 0 && res.rows[0]) {
      planName = res.rows[0].name_en || 'Pro';
      const rawLimits = res.rows[0].limits;
      limits = typeof rawLimits === 'string' ? JSON.parse(rawLimits) : (rawLimits || {});
    } else {
      const freePlanRes = await pool.query(`
        SELECT name_en, name_ar, limits 
        FROM plans 
        WHERE plan_type = 'free' OR monthly_price = 0 
        ORDER BY id ASC 
        LIMIT 1
      `).catch(() => ({ rows: [] }));
      
      if (freePlanRes.rows.length > 0 && freePlanRes.rows[0]) {
        planName = freePlanRes.rows[0].name_en || 'Free';
        const rawLimits = freePlanRes.rows[0].limits;
        limits = typeof rawLimits === 'string' ? JSON.parse(rawLimits) : (rawLimits || {});
      }
    }

    const appStudioLimits = limits.app_studio || limits.studio || {};
    
    // Parse max_projects (generous default of 50 projects for seamless creation)
    let maxProjects: number | 'unlimited' = 50;
    if (appStudioLimits.max_projects === 'unlimited' || appStudioLimits.max_projects === -1 || appStudioLimits.maxProjects === 'unlimited' || appStudioLimits.maxProjects === -1) {
      maxProjects = 'unlimited';
    } else {
      const raw = appStudioLimits.max_projects !== undefined ? appStudioLimits.max_projects : appStudioLimits.maxProjects;
      if (raw !== undefined && !isNaN(Number(raw))) {
        maxProjects = Math.max(50, Number(raw));
      }
    }

    // Parse max_storage_mb
    let maxStorageMb: number | 'unlimited' = 500;
    if (appStudioLimits.max_storage_mb === 'unlimited' || appStudioLimits.max_storage_mb === -1 || appStudioLimits.maxStorageMb === 'unlimited' || appStudioLimits.maxStorageMb === -1) {
      maxStorageMb = 'unlimited';
    } else {
      const raw = appStudioLimits.max_storage_mb !== undefined ? appStudioLimits.max_storage_mb : appStudioLimits.maxStorageMb;
      if (raw !== undefined && !isNaN(Number(raw))) {
        maxStorageMb = Math.max(200, Number(raw));
      }
    }

    // Parse max_snapshots
    let maxSnapshots: number | 'unlimited' = 20;
    if (appStudioLimits.max_snapshots === 'unlimited' || appStudioLimits.max_snapshots === -1 || appStudioLimits.maxSnapshots === 'unlimited' || appStudioLimits.maxSnapshots === -1) {
      maxSnapshots = 'unlimited';
    } else {
      const raw = appStudioLimits.max_snapshots !== undefined ? appStudioLimits.max_snapshots : appStudioLimits.maxSnapshots;
      if (raw !== undefined && !isNaN(Number(raw))) {
        maxSnapshots = Math.max(10, Number(raw));
      }
    }

    return { maxProjects, maxStorageMb, maxSnapshots, planName };
  } catch (err) {
    console.error('[getUserStudioLimits Error]:', err);
    return { maxProjects: 50, maxStorageMb: 500, maxSnapshots: 20, planName: 'Free' };
  }
}

/**
 * Calculates current studio usage for a user (number of projects, storage used in bytes and MB, total snapshots).
 */
async function getUserStudioUsage(userId: string | number) {
  if (!pool) return { projectCount: 0, storageBytes: 0, storageMb: 0, snapshotCount: 0 };
  try {
    const wsRes = await pool.query(
      `SELECT 
         COUNT(id) AS project_count,
         COALESCE(SUM(octet_length(COALESCE(files::text, '')) + octet_length(COALESCE(chat_history::text, ''))), 0) AS ws_bytes
       FROM studio_workspaces 
       WHERE user_id = $1`,
      [userId]
    );

    const snapRes = await pool.query(
      `SELECT 
         COUNT(s.id) AS snap_count,
         COALESCE(SUM(octet_length(COALESCE(s.files::text, ''))), 0) AS snap_bytes
       FROM studio_snapshots s
       JOIN studio_workspaces w ON s.workspace_id = w.id
       WHERE w.user_id = $1`,
      [userId]
    );

    const projectCount = parseInt(wsRes.rows[0]?.project_count || '0', 10);
    const wsBytes = parseInt(wsRes.rows[0]?.ws_bytes || '0', 10);
    const snapCount = parseInt(snapRes.rows[0]?.snap_count || '0', 10);
    const snapBytes = parseInt(snapRes.rows[0]?.snap_bytes || '0', 10);

    const totalBytes = wsBytes + snapBytes;
    const storageMb = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;

    return {
      projectCount,
      storageBytes: totalBytes,
      storageMb,
      snapshotCount: snapCount
    };
  } catch (err) {
    console.error('[getUserStudioUsage Error]:', err);
    return { projectCount: 0, storageBytes: 0, storageMb: 0, snapshotCount: 0 };
  }
}

// Studio Quota & Usage Radar Endpoint
router.get('/usage', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.json({
        isGuest: true,
        projectCount: 0,
        maxProjects: 3,
        storageUsedBytes: 0,
        storageUsedMb: 0,
        maxStorageMb: 25,
        snapshotCount: 0,
        maxSnapshots: 3,
        planName: 'Guest'
      });
    }

    const [limits, usage] = await Promise.all([
      getUserStudioLimits(userId),
      getUserStudioUsage(userId)
    ]);

    res.json({
      isGuest: false,
      projectCount: usage.projectCount,
      maxProjects: limits.maxProjects,
      storageUsedBytes: usage.storageBytes,
      storageUsedMb: usage.storageMb,
      maxStorageMb: limits.maxStorageMb,
      snapshotCount: usage.snapshotCount,
      maxSnapshots: limits.maxSnapshots,
      planName: limits.planName
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch studio usage metrics' });
  }
});

router.get('/workspaces', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.json([]);
    }
    const result = await pool.query(
      'SELECT id, user_id, title, description, framework_mode, files, chat_history, is_public, metadata, created_at, updated_at FROM studio_workspaces WHERE user_id = $1 ORDER BY updated_at DESC', 
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// In-memory workspace cache ensuring live previews and share links work 100% of the time (including guest/local sessions)
const inMemoryWorkspaces = new Map<string, any>();

router.post('/workspaces', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id, title, description, frameworkMode, files, chatHistory, isPublic, metadata } = req.body;
    if (!id || !title) {
      return res.status(400).json({ error: 'Workspace id and title are required' });
    }

    // Check Plan Limits & Storage Quota for authenticated users
    if (userId && pool) {
      const existingWs = await pool.query('SELECT id, user_id FROM studio_workspaces WHERE id = $1', [id]);
      const isNewWorkspace = existingWs.rows.length === 0;

      const [limits, usage] = await Promise.all([
        getUserStudioLimits(userId),
        getUserStudioUsage(userId)
      ]);

      // Projects Count Limit Enforcement (Only for creating brand new workspaces beyond quota)
      if (isNewWorkspace && typeof limits.maxProjects === 'number' && usage.projectCount >= limits.maxProjects) {
        // Still save in memory so preview works, but alert user on cloud persistence
        inMemoryWorkspaces.set(id, {
          id,
          user_id: userId || null,
          title,
          description: description || '',
          framework_mode: frameworkMode || 'html',
          files: files || {},
          chat_history: chatHistory || [],
          is_public: isPublic !== undefined ? !!isPublic : false,
          metadata: metadata || {},
          updated_at: new Date()
        });
        return res.json({ 
          success: true, 
          localOnly: true,
          limitReached: true,
          message: `لقد بلغت الحد الأقصى للمشاريع السحابية (${limits.maxProjects} مشاريع). تم حفظ المشروع محلياً في جلستك.`
        });
      }
    }

    // Always cache in memory so previews and live links never fail with "Workspace not found"
    inMemoryWorkspaces.set(id, {
      id,
      user_id: userId || null,
      title,
      description: description || '',
      framework_mode: frameworkMode || 'html',
      files: files || {},
      chat_history: chatHistory || [],
      is_public: isPublic !== undefined ? !!isPublic : false,
      metadata: metadata || {},
      updated_at: new Date()
    });

    try {
      await pool.query(
        `INSERT INTO studio_workspaces (id, user_id, title, description, framework_mode, files, chat_history, is_public, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET 
           user_id = COALESCE(EXCLUDED.user_id, studio_workspaces.user_id),
           title = EXCLUDED.title,
           description = COALESCE(EXCLUDED.description, studio_workspaces.description),
           framework_mode = EXCLUDED.framework_mode,
           files = EXCLUDED.files,
           chat_history = COALESCE(EXCLUDED.chat_history, studio_workspaces.chat_history),
           is_public = COALESCE(EXCLUDED.is_public, studio_workspaces.is_public),
           metadata = COALESCE(EXCLUDED.metadata, studio_workspaces.metadata),
           updated_at = CURRENT_TIMESTAMP
         WHERE studio_workspaces.user_id = EXCLUDED.user_id OR studio_workspaces.user_id IS NULL`,
        [
          id, 
          userId || null, 
          title, 
          description || '', 
          frameworkMode || 'html', 
          JSON.stringify(files || {}), 
          JSON.stringify(chatHistory || []), 
          isPublic !== undefined ? !!isPublic : false,
          JSON.stringify(metadata || {})
        ]
      );
    } catch (dbErr: any) {
      console.error('[Studio Workspaces DB Upsert Error]:', dbErr);
      if (userId) {
        return res.status(500).json({ error: 'Failed to persist workspace in cloud database: ' + (dbErr?.message || 'Database error') });
      }
    }
    
    res.json({ success: true, localOnly: !userId });
  } catch (error: any) {
    console.error('[Studio Workspaces Save Error]:', error);
    res.status(500).json({ error: error?.message || 'Failed to save workspace' });
  }
});

router.get('/workspaces/:id', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    
    if (pool) {
      const result = await pool.query('SELECT * FROM studio_workspaces WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        const ws = result.rows[0];
        // If workspace is private and belongs to another user, deny access
        if (ws.user_id && userId && ws.user_id !== userId && !ws.is_public) {
          return res.status(403).json({ error: 'Access denied to workspace' });
        }
        return res.json(ws);
      }
    }

    const cached = inMemoryWorkspaces.get(id);
    if (cached) {
      if (cached.user_id && userId && cached.user_id !== userId && !cached.is_public) {
        return res.status(403).json({ error: 'Access denied to workspace' });
      }
      return res.json(cached);
    }
    
    return res.status(404).json({ error: 'Workspace not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load workspace' });
  }
});

router.delete('/workspaces/:id', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    
    if (!userId) {
      // Unauthenticated / Local session cleanup
      inMemoryWorkspaces.delete(id);
      return res.json({ success: true, localOnly: true });
    }

    if (pool) {
      // 1. Delete all snapshots (derivatives) associated with this workspace
      await pool.query(
        `DELETE FROM studio_snapshots 
         WHERE workspace_id IN (
           SELECT id FROM studio_workspaces WHERE id = $1 AND user_id = $2
         )`,
        [id, userId]
      ).catch((err: any) => {
        console.warn('[Delete Snapshots Notice]:', err);
      });

      // 2. Delete the workspace record itself from studio_workspaces
      const deleteRes = await pool.query('DELETE FROM studio_workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
      
      // 3. Purge from in-memory cache
      inMemoryWorkspaces.delete(id);

      if (deleteRes.rowCount === 0) {
        return res.status(404).json({ error: 'المشروع غير موجود أو تم حذفه مسبقاً' });
      }
    } else {
      inMemoryWorkspaces.delete(id);
    }

    res.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('[Delete Workspace Server Error]:', error);
    res.status(500).json({ error: 'فشل حذف المشروع ومشتقاته من قاعدة البيانات' });
  }
});

router.patch('/workspaces/:id', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    const { title, description, isPublic } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const updateRes = await pool.query(
      `UPDATE studio_workspaces 
       SET title = $1, 
           description = COALESCE($2, description), 
           is_public = COALESCE($3, is_public),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title.trim(), description, isPublic, id, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found or unauthorized' });
    }

    res.json({ success: true, workspace: updateRes.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// Workspace Version Snapshots Endpoints
router.get('/workspaces/:id/snapshots', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    // Verify workspace ownership
    const wsCheck = await pool.query('SELECT id FROM studio_workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
    if (wsCheck.rows.length === 0) return res.status(404).json({ error: 'Workspace not found' });

    const result = await pool.query(
      'SELECT id, workspace_id, version_name, created_at FROM studio_snapshots WHERE workspace_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch snapshots' });
  }
});

router.post('/workspaces/:id/snapshots', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    const { versionName, files } = req.body;
    if (!userId) {
      return res.json({ success: true, localOnly: true });
    }
    if (!versionName) return res.status(400).json({ error: 'Version name is required' });

    const wsCheck = await pool.query('SELECT id, files FROM studio_workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
    if (wsCheck.rows.length === 0) return res.status(404).json({ error: 'Workspace not found' });

    // Snapshot count enforcement per plan
    if (pool) {
      const limits = await getUserStudioLimits(userId);
      if (typeof limits.maxSnapshots === 'number') {
        const snapCountRes = await pool.query('SELECT count(*) as count FROM studio_snapshots WHERE workspace_id = $1', [id]);
        const currentSnaps = parseInt(snapCountRes.rows[0]?.count || '0', 10);
        const maxSnaps = limits.maxSnapshots;
        
        if (currentSnaps >= maxSnaps) {
          const deleteCount = (currentSnaps - maxSnaps) + 1;
          await pool.query(`
            DELETE FROM studio_snapshots 
            WHERE id IN (
              SELECT id FROM studio_snapshots 
              WHERE workspace_id = $1 
              ORDER BY created_at ASC 
              LIMIT $2
            )
          `, [id, deleteCount]);
        }
      }
    }

    const filesToSave = files || (typeof wsCheck.rows[0].files === 'string' ? JSON.parse(wsCheck.rows[0].files) : wsCheck.rows[0].files);

    const result = await pool.query(
      'INSERT INTO studio_snapshots (workspace_id, version_name, files) VALUES ($1, $2, $3) RETURNING id, version_name, created_at',
      [id, versionName, JSON.stringify(filesToSave)]
    );
    res.json({ success: true, snapshot: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

router.post('/workspaces/:id/snapshots/:snapshotId/restore', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id, snapshotId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const snapResult = await pool.query(
      `SELECT s.files, s.version_name 
       FROM studio_snapshots s
       JOIN studio_workspaces w ON s.workspace_id = w.id
       WHERE s.id = $1 AND w.id = $2 AND w.user_id = $3`,
      [snapshotId, id, userId]
    );

    if (snapResult.rows.length === 0) {
      return res.status(404).json({ error: 'Snapshot not found or unauthorized' });
    }

    const restoredFiles = snapResult.rows[0].files;

    await pool.query(
      'UPDATE studio_workspaces SET files = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
      [typeof restoredFiles === 'string' ? restoredFiles : JSON.stringify(restoredFiles), id, userId]
    );

    res.json({ 
      success: true, 
      versionName: snapResult.rows[0].version_name,
      files: typeof restoredFiles === 'string' ? JSON.parse(restoredFiles) : restoredFiles
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore snapshot' });
  }
});

// In-memory cache for proxied scripts to ensure 0ms latency on subsequent loads and bypass CSP
const scriptCache: Record<string, { content: string; contentType: string }> = {};

router.get('/proxy/:library', async (req, res) => {
  const { library } = req.params;
  const libraryUrls: Record<string, string> = {
    tailwind: 'https://cdn.tailwindcss.com',
    react: 'https://unpkg.com/react@18/umd/react.production.min.js',
    'react-dom': 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    babel: 'https://unpkg.com/@babel/standalone/babel.min.js',
    lucide: 'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
    chartjs: 'https://cdn.jsdelivr.net/npm/chart.js',
    scrollreveal: 'https://unpkg.com/scrollreveal'
  };

  const url = libraryUrls[library.toLowerCase()];
  if (!url) {
    return res.status(404).send('Library not found');
  }

  if (scriptCache[url]) {
    res.setHeader('Content-Type', scriptCache[url].contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(scriptCache[url].content);
  }

  try {
    const fetchResponse = await fetch(url);
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch from upstream: ${fetchResponse.statusText}`);
    }
    const content = await fetchResponse.text();
    const contentType = fetchResponse.headers.get('content-type') || 'application/javascript';

    scriptCache[url] = { content, contentType };

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(content);
  } catch (error: any) {
    console.error(`[Studio Proxy Error] Failed to proxy ${library}:`, error?.message || error);
    res.status(500).send(`Failed to load ${library} library`);
  }
});

router.get('/workspaces/:id/preview', authenticateTokenOptional, async (req: any, res) => {
  try {
    const { id } = req.params;
    const lang = (req.query.lang || 'ar') as string;
    const dir = (req.query.dir || 'rtl') as string;

    let workspace: any = null;

    try {
      const result = await pool.query('SELECT * FROM studio_workspaces WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        workspace = result.rows[0];
      }
    } catch (dbErr) {
      console.warn('[Studio Preview DB Query Error]:', dbErr);
    }

    if (!workspace) {
      workspace = inMemoryWorkspaces.get(id);
    }

    if (!workspace) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="${lang}" dir="${dir}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${lang === 'ar' ? 'المشروع قيد المزامنة' : 'Workspace Syncing'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 text-white min-h-screen flex items-center justify-center p-6 text-center font-sans">
          <div class="max-w-md space-y-4">
            <div class="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center text-xl font-bold">⚡</div>
            <h1 class="text-xl font-bold">${lang === 'ar' ? 'المشروع قيد المزامنة أو قيد الإنشاء' : 'Workspace Syncing or Initializing'}</h1>
            <p class="text-xs text-slate-400 leading-relaxed">${lang === 'ar' ? 'يرجى الرجوع للاستوديو والنقر على "فتح بالمتصفح" أو إجراء حفظ للمشروع.' : 'Please return to studio and open live preview again.'}</p>
            <a href="/app" class="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition">
              ${lang === 'ar' ? 'الرجوع للاستوديو' : 'Back to Studio'}
            </a>
          </div>
        </body>
        </html>
      `);
    }

    const files = typeof workspace.files === 'string' ? JSON.parse(workspace.files) : (workspace.files || {});

    let rawHtml = files['index.html']?.content || '<div class="p-8 text-center text-slate-400">جاري تحميل المشروع...</div>';
    if (rawHtml.includes('\\n') && (rawHtml.match(/\\n/g)?.length || 0) > 3) {
      rawHtml = rawHtml
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"');
    }

    let htmlContent = rawHtml
      .replace(/<script\b[^>]*\bsrc=["'](?!https?:\/\/|\/\/|\/api\/)[^"']+\.(?:jsx?|tsx?|mjs|cjs|ts)["'][^>]*>\s*<\/script>/gi, '')
      .replace(/<link\b[^>]*\bhref=["'](?!https?:\/\/|\/\/|\/api\/)[^"']+\.css["'][^>]*\/?>/gi, '')
      .replace(/https:\/\/unpkg\.com\/scrollreveal(?:\/dist\/scrollreveal\.min\.js)?/gi, '/api/studio/proxy/scrollreveal')
      .replace(/https:\/\/unpkg\.com\/lucide@latest\/dist\/umd\/lucide\.js/gi, '/api/studio/proxy/lucide')
      .replace(/https:\/\/unpkg\.com\/lucide@latest/gi, '/api/studio/proxy/lucide')
      .replace(/https:\/\/cdn\.tailwindcss\.com/gi, '/api/studio/proxy/tailwind');

    const allCss = Object.keys(files)
      .filter(p => p.endsWith('.css'))
      .map(p => {
        let c = files[p].content || '';
        if (c.includes('\\n')) c = c.replace(/\\n/g, '\n');
        return c;
      })
      .join('\n');

    const isConfigFile = (p: string) => {
      const base = p.split('/').pop()?.toLowerCase() || '';
      return base.startsWith('vite.config.') || base.startsWith('tailwind.config.') || base.startsWith('postcss.config.') || base.startsWith('eslint.config.');
    };

    const allCodeFiles = Object.keys(files)
      .filter(p => !isConfigFile(p))
      .filter(p => p.endsWith('.js') || p.endsWith('.jsx') || p.endsWith('.ts') || p.endsWith('.tsx'));

    const getFilePriority = (path: string) => {
      const lower = path.toLowerCase();
      if (lower.includes('types') || lower.includes('constants') || lower.includes('config')) return 1;
      if (lower.includes('data') || lower.includes('mock') || lower.includes('seed')) return 2;
      if (lower.includes('utils') || lower.includes('helpers') || lower.includes('services')) return 3;
      if (lower.includes('context') || lower.includes('hooks') || lower.includes('store')) return 4;
      if (lower.includes('components') || lower.includes('ui') || lower.includes('views')) return 5;
      if (lower.includes('pages')) return 6;
      if (lower.endsWith('app.jsx') || lower.endsWith('app.tsx')) return 7;
      if (lower.endsWith('main.jsx') || lower.endsWith('main.tsx') || lower.endsWith('index.jsx') || lower.endsWith('index.tsx') || lower === 'src/app.js' || lower === 'app.js' || lower === 'script.js' || lower === 'main.js') return 8;
      return 5;
    };

    const sortedFiles = [...allCodeFiles].sort((a, b) => getFilePriority(a) - getFilePriority(b));

    const babelFiles = sortedFiles.filter(p => p.endsWith('.jsx') || p.endsWith('.tsx'));
    const plainJsFiles = sortedFiles.filter(p => p.endsWith('.js') || p.endsWith('.ts'));

    const plainJsScripts = plainJsFiles.map(p => `
      <script data-file="${p}">
        /* --- File: ${p} --- */
        ${cleanEsmForBrowser(files[p]?.content || '')}
      </script>
    `).join('\n');

    const combinedBabelCode = babelFiles.map(p => `
      /* --- File: ${p} --- */
      ${cleanEsmForBrowser(files[p]?.content || '')}
    `).join('\n\n');

    if (!htmlContent.includes('id="root"') && !htmlContent.includes('id="app"')) {
      const defaultContainers = '<div id="root"></div><div id="app"></div>';
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', defaultContainers + '</body>');
      } else {
        htmlContent += defaultContainers;
      }
    }

    const injectionHead = `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
      <script src="/api/studio/proxy/tailwind"></script>
      <script src="/api/studio/proxy/react"></script>
      <script src="/api/studio/proxy/react-dom"></script>
      <script src="/api/studio/proxy/babel"></script>
      <script src="/api/studio/proxy/lucide"></script>
      <script src="/api/studio/proxy/chartjs"></script>
      <script>
        // Global Image Fallback Polyfill (prevents broken image placeholder icons)
        window.addEventListener('error', function(e) {
          if (e.target && e.target.tagName === 'IMG') {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80';
          }
        }, true);

        // Event listener race-condition polyfill for DOMContentLoaded and load events in iframes/tabs
        (function() {
          const originalAddEventListener = EventTarget.prototype.addEventListener;
          EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (type === 'DOMContentLoaded' && (document.readyState === 'interactive' || document.readyState === 'complete')) {
              try { listener.call(this, { type: 'DOMContentLoaded', target: document, currentTarget: document }); } catch(e) { console.error('DOMContentLoaded race polyfill bypass:', e); }
              return;
            }
            if (type === 'load' && document.readyState === 'complete') {
              try { listener.call(this, { type: 'load', target: window, currentTarget: window }); } catch(e) { console.error('load race polyfill bypass:', e); }
              return;
            }
            return originalAddEventListener.apply(this, arguments);
          };
        })();

        // Expose React hooks globally for seamless multi-file JSX execution
        if (window.React) {
          window.useState = window.React.useState;
          window.useEffect = window.React.useEffect;
          window.useRef = window.React.useRef;
          window.useMemo = window.React.useMemo;
          window.useCallback = window.React.useCallback;
          window.useContext = window.React.useContext;
          window.createContext = window.React.createContext;
          window.useReducer = window.React.useReducer;
          window.Fragment = window.React.Fragment;
        }

        window.initLucideIcons = function() {
          try {
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
              window.lucide.createIcons();
            } else if (window.Lucide && typeof window.Lucide.createIcons === 'function') {
              window.Lucide.createIcons();
            }
          } catch(_) {}
        };
        window.LucideIconProxy = new Proxy({}, {
          get: function(target, prop) {
            if (typeof prop === 'string' && prop !== 'then' && prop !== 'prototype') {
              return function LucideIconComponent(props) {
                var cls = (props && props.className) ? props.className + ' lucide' : 'w-5 h-5 inline-block lucide';
                var iconName = prop.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
                return React.createElement('i', Object.assign({ 'data-lucide': iconName, className: cls }, props));
              };
            }
            return undefined;
          }
        });
        if (window.ReactDOM && !window.ReactDOM.createRoot) {
          window.ReactDOM.createRoot = function(container) {
            return {
              render: function(element) {
                window.ReactDOM.render(element, container);
              }
            };
          };
        }
        if (window.ReactDOM) {
          window.createRoot = window.ReactDOM.createRoot;
        }
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              fontFamily: {
                sans: ['Tajawal', 'Cairo', 'Inter', 'system-ui', 'sans-serif'],
                tajawal: ['Tajawal', 'sans-serif'],
                cairo: ['Cairo', 'sans-serif'],
              }
            }
          }
        }
      </script>
      <style>
        ${allCss}
        body {
          font-family: 'Tajawal', 'Cairo', 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      </style>
      <script>
        (function() {
          window.process = window.process || { env: {} };
          window.process.env = Object.assign(window.process.env, ${JSON.stringify((workspace?.metadata && typeof workspace.metadata === 'object' && workspace.metadata.envVars) ? workspace.metadata.envVars : {})});
          window.__VITE_ENV__ = Object.assign(window.__VITE_ENV__ || {}, window.process.env);
        })();
      </script>
    `;

    const injectionScripts = `
      ${plainJsScripts}
      ${babelFiles.length > 0 ? `
      <script type="text/babel" data-presets="typescript,react,env">
        const { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext, useReducer, Fragment } = window.React || {};
        const { createRoot } = window.ReactDOM || {};
        ${combinedBabelCode}
        setTimeout(function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        }, 50);
      </script>
      ` : ''}
      <script>
        window.addEventListener('DOMContentLoaded', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        window.addEventListener('load', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
      </script>
    `;

    if (/<head[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<head[^>]*>)/i, `$1${injectionHead}`);
    } else if (/<html[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<html[^>]*>)/i, `$1<head>${injectionHead}</head>`);
    } else {
      htmlContent = `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head>${injectionHead}</head><body>${htmlContent}</body></html>`;
    }

    if (/<\/body>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<\/body>)/i, `${injectionScripts}$1`);
    } else if (/<\/html>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<\/html>)/i, `${injectionScripts}$1`);
    } else {
      htmlContent = htmlContent + injectionScripts;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  } catch (error: any) {
    console.error('[Studio Preview Error] Failed to render workspace preview:', error?.message || error);
    res.status(500).send('Failed to generate workspace preview');
  }
});

function normalizeFileContent(raw: string): string {
  if (typeof raw !== 'string') return '';
  let content = raw.trim();
  // Strip accidental outer markdown fences inside <perplexta_file> tags
  if (/^```[a-zA-Z0-9_-]*\s*\n/.test(content) && /\n```\s*$/.test(content)) {
    content = content.replace(/^```[a-zA-Z0-9_-]*\s*\n/, '').replace(/\n```\s*$/, '').trim();
  }
  if (content.includes('\\n') && !content.includes('\n')) {
    content = content
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  return content;
}

function cleanEsmForBrowser(code: string): string {
  if (!code) return '';
  const exportBlockRegex = /export\s*\{([\s\S]*?)\};?/g;
  let match;
  let cleanCode = code;
  let binds = '';
  while ((match = exportBlockRegex.exec(code)) !== null) {
    const exports = match[1].split(',').map(x => x.trim());
    exports.forEach(exp => {
      if (exp) {
        const parts = exp.split(/\s+as\s+/i);
        const orig = parts[0].trim();
        const alias = parts[parts.length - 1].trim();
        if (alias && alias !== 'default') {
          binds += `\ntry { window.${alias} = ${orig}; } catch(_) {}`;
        }
      }
    });
  }
  cleanCode = cleanCode.replace(exportBlockRegex, '') + binds;

  return cleanCode
    .replace(/import\.meta\.env/g, '(window.__VITE_ENV__ || window.process?.env || {})')
    .replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"];?/g, 'const {$1} = window.LucideIconProxy || {};')
    .replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?/g, '')
    .replace(/import\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'window.$1 = $1; function $1')
    .replace(/export\s+default\s+function\s*/g, 'function ')
    .replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)/g, 'window.$1 = $1; class $1')
    .replace(/export\s+default\s+class\s*/g, 'class ')
    .replace(/export\s+default\s+([A-Za-z0-9_]+);?/g, 'window.$1 = $1;')
    .replace(/export\s+const\s+([A-Za-z0-9_]+)\s*=/g, 'const $1 = window.$1 =')
    .replace(/export\s+let\s+([A-Za-z0-9_]+)\s*=/g, 'let $1 = window.$1 =')
    .replace(/export\s+var\s+([A-Za-z0-9_]+)\s*=/g, 'var $1 = window.$1 =')
    .replace(/export\s+function\s+([A-Za-z0-9_]+)/g, 'window.$1 = $1; function $1')
    .replace(/export\s+(let|var|class|type|interface)\s+/g, '$1 ');
}

function tryParseBlueprintJson(rawBp: string): any {
  if (!rawBp) return null;
  let cleaned = rawBp.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object') {
      const order = parsed.file_tree_order || parsed.files_order || parsed.files || [];
      if (Array.isArray(order)) {
        parsed.file_tree_order = order;
        parsed.files_order = order;
      }
      return parsed;
    }
  } catch {
    try {
      const relaxed = cleaned.replace(/,\s*([}\]])/g, '$1');
      const parsed = JSON.parse(relaxed);
      if (parsed && typeof parsed === 'object') {
        const order = parsed.file_tree_order || parsed.files_order || parsed.files || [];
        if (Array.isArray(order)) {
          parsed.file_tree_order = order;
          parsed.files_order = order;
        }
        return parsed;
      }
    } catch (_) {}
  }
  return null;
}

const UNICODE_NORM_MAP: Record<string, string> = {
  '\u2018': "'", '\u2019': "'", '\u201A': "'", '\u201B': "'", '\u2032': "'",
  '\u201C': '"', '\u201D': '"', '\u201E': '"', '\u201F': '"', '\u2033': '"',
  '\u00A0': ' ', '\u2002': ' ', '\u2003': ' ', '\u2009': ' ', '\u202F': ' ',
  '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2013': '-', '\u2014': '-'
};
const UNICODE_NORM_RE = new RegExp(Object.keys(UNICODE_NORM_MAP).join('|'), 'g');

function normalizeUnicodeLookalikes(str: string): string {
  return str.replace(UNICODE_NORM_RE, ch => UNICODE_NORM_MAP[ch] || ch);
}

/**
 * 4-Tier File Edit Matcher (ported from Osama-Qonaibe/builder src/js/helpers.js)
 */
function applyFileEditServer(content: string, oldContent: string, newContent: string): string {
  if (typeof content !== 'string') throw new Error('File content must be a string.');
  if (typeof oldContent !== 'string' || oldContent.length === 0) {
    throw new Error('old_content must be a non-empty string.');
  }
  if (typeof newContent !== 'string') {
    throw new Error('new_content must be a string.');
  }

  const usesCRLF = content.includes('\r\n');
  const normContent = content.replace(/\r\n/g, '\n');
  const normOld = oldContent.replace(/\r\n/g, '\n');
  const normNew = newContent.replace(/\r\n/g, '\n');
  const finalize = (result: string) => (usesCRLF ? result.replace(/\n/g, '\r\n') : result);

  // Tier 0: Exact match
  const exactIdx = normContent.indexOf(normOld);
  if (exactIdx !== -1) {
    return finalize(
      normContent.slice(0, exactIdx) + normNew + normContent.slice(exactIdx + normOld.length)
    );
  }

  const contentLines = normContent.split('\n');
  const oldLines = normOld.split('\n');
  if (oldLines.length > 1 && oldLines[oldLines.length - 1] === '') {
    oldLines.pop();
  }
  const n = oldLines.length;

  const lineStartOffsets: number[] = [0];
  for (let i = 0; i < contentLines.length; i++) {
    lineStartOffsets.push(lineStartOffsets[i] + contentLines[i].length + 1);
  }

  const spliceLines = (startLine: number, endLine: number, replacement: string) => {
    const startOffset = lineStartOffsets[startLine];
    const endOffset = lineStartOffsets[endLine] - 1;
    return finalize(
      normContent.slice(0, startOffset) +
      replacement +
      normContent.slice(Math.min(endOffset, normContent.length))
    );
  };

  if (n > 0 && n <= contentLines.length) {
    // Tier 1: Trailing-whitespace-flexible match
    const rtrim = (s: string) => s.replace(/[ \t]+$/, '');
    const oldRTrimmed = oldLines.map(rtrim);
    for (let i = 0; i <= contentLines.length - n; i++) {
      let ok = true;
      for (let j = 0; j < n; j++) {
        if (rtrim(contentLines[i + j]) !== oldRTrimmed[j]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        return spliceLines(i, i + n, normNew);
      }
    }

    // Tier 2: Leading + trailing whitespace flexible with uniform indent delta
    const strip = (s: string) => s.trim();
    const leadingSpaces = (s: string) => {
      const m = s.match(/^[ \t]*/);
      return m ? m[0].replace(/\t/g, '  ').length : 0;
    };
    const oldStripped = oldLines.map(strip);
    if (oldStripped.some(l => l.length > 0)) {
      for (let i = 0; i <= contentLines.length - n; i++) {
        let ok = true;
        let delta: number | null = null;
        for (let j = 0; j < n; j++) {
          if (strip(contentLines[i + j]) !== oldStripped[j]) {
            ok = false;
            break;
          }
          if (oldStripped[j].length > 0) {
            const d = leadingSpaces(contentLines[i + j]) - leadingSpaces(oldLines[j]);
            if (delta === null) delta = d;
            else if (d !== delta) {
              ok = false;
              break;
            }
          }
        }
        if (ok) {
          const dVal = delta || 0;
          const adjustedNew = normNew
            .split('\n')
            .map(line => {
              if (line.trim().length === 0) return line;
              if (dVal > 0) return ' '.repeat(dVal) + line;
              if (dVal < 0) {
                const remove = Math.min(-dVal, leadingSpaces(line));
                return line.slice(remove);
              }
              return line;
            })
            .join('\n');
          return spliceLines(i, i + n, adjustedNew);
        }
      }
    }
  }

  // Tier 3: Unicode look-alike normalization
  const uContent = normalizeUnicodeLookalikes(normContent);
  const uOld = normalizeUnicodeLookalikes(normOld);
  const uIdx = uContent.indexOf(uOld);
  if (uIdx !== -1) {
    return finalize(
      normContent.slice(0, uIdx) + normNew + normContent.slice(uIdx + normOld.length)
    );
  }

  throw new Error('old_content not found in file.');
}

function applyPatchBlocksToContent(baseContent: string, editBlockBody: string): { updated: string; appliedCount: number } {
  let working = baseContent;
  let appliedCount = 0;
  const blockRegex = /<<<<+\s*SEARCH\s*\r?\n([\s\S]*?)\r?\n====+\s*\r?\n([\s\S]*?)\r?\n>>>>+/gi;
  let m;
  while ((m = blockRegex.exec(editBlockBody)) !== null) {
    try {
      working = applyFileEditServer(working, m[1], m[2]);
      appliedCount++;
    } catch (_) {}
  }
  return { updated: working, appliedCount };
}

function buildServerTemplateNote(
  templateOrigin: { slug?: string; name?: string; instructions?: string } | null | undefined,
  fileKeys: string[]
): string {
  if (!templateOrigin || !templateOrigin.name) return '';
  const fileList = fileKeys.join(', ');
  const instructions = typeof templateOrigin.instructions === 'string' ? templateOrigin.instructions.trim() : '';
  const lines = [
    `TEMPLATE CONTEXT (buildTemplateNote):`,
    `This project started from the "${templateOrigin.name}" template. Its files (${fileList}) are already in the workspace.`,
    `The live preview is already open and serves the workspace directly — it updates automatically whenever files change.`,
    `Before changing anything, inspect the files involved and build on the existing code. Keep what already works unless the user asks to replace it, and keep following every rule above.`
  ];
  if (instructions) {
    lines.push(
      `Rules for this "${templateOrigin.name}" project. Keep following them through every change, even when the user rewrites the app, unless the user explicitly asks to drop one: ${instructions}`
    );
  }
  return lines.join('\n\n');
}

function tryParseJsonArrayOrObject(raw: string): any {
  if (!raw) return null;
  let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      const relaxed = cleaned.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(relaxed);
    } catch (_) {}
  }
  return null;
}

router.post('/generate', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || null;
    const {
      prompt,
      files,
      errorLogs,
      activeFilePath,
      history,
      templateOrigin,
      allowClarify,
      clarificationContext,
      language: reqLanguage
    } = req.body;
    const isAr = (reqLanguage || 'ar') !== 'en';
    
    if (!prompt && (!errorLogs || errorLogs.length === 0)) {
      return res.status(400).json({ error: 'Prompt or error logs required' });
    }

    const { pool } = await import('../db/index.js');
    const { callAIProvider, getProviderKey, getProviderUrlKey } = await import('../services/ai.js');
    const { checkAndIncrementQuota } = await import('../services/quota.js');
    const { getCachedOrchestratorConfig, getCachedApiKeysVault } = await import('../db/queries.js');

    if (userId) {
      const quotaCheck = await checkAndIncrementQuota(userId, 'code');
      if (!quotaCheck.allowed) {
        return res.status(429).json({
          error: 'QUOTA_EXCEEDED',
          message: 'لقد تجاوزت الحد المسموح به لأداة الكود. يرجى ترقية باقتك.',
          message_en: 'Code generation quota exceeded. Please upgrade your plan.'
        });
      }
    }

    // Dynamic Database Orchestrator Routing (Zero hardcoded model names)
    let route = await getCachedOrchestratorConfig('code').catch(() => null);
    if (!route) {
      const routeRes = await pool.query("SELECT * FROM tool_orchestrator WHERE tool_id = 'code' AND is_active = true LIMIT 1");
      if (routeRes.rows.length > 0) {
        route = routeRes.rows[0];
      }
    }

    // 1 Primary + 3 Fallbacks strictly from Database Tool Orchestrator Registry (Decree #3: Orchestrator Absolutism)
    const targets: Array<{ provider: string; model: string }> = [];

    if (route && route.is_active && route.primary_provider && route.primary_model) {
      targets.push({ provider: route.primary_provider.trim(), model: route.primary_model.trim() });

      if (route.fallback_1_provider && route.fallback_1_model) {
        targets.push({ provider: route.fallback_1_provider.trim(), model: route.fallback_1_model.trim() });
      }

      if (route.fallback_2_provider && route.fallback_2_model) {
        targets.push({ provider: route.fallback_2_provider.trim(), model: route.fallback_2_model.trim() });
      }

      if (route.fallback_3_provider && route.fallback_3_model) {
        targets.push({ provider: route.fallback_3_provider.trim(), model: route.fallback_3_model.trim() });
      }
    }

    if (targets.length === 0) {
      throw new Error(
        'لم يتم ضبط مسار أداة هندسة البرمجيات (code) في الأوركسترا بلوحة التحكم. يرجى الدخول إلى لوحة التحكم > الأوركسترا، وتعيين النموذج الأساسي والبدائل الاحتياطية (1، 2، 3) وتفعيل الأداة.'
      );
    }

    // Detect if workspace only contains the initial blank launchpad index.html
    const fileKeys = Object.keys(files || {});
    const indexHtmlContent = files?.['index.html']?.content || '';
    const isDefaultLaunchpad = fileKeys.length === 1 && fileKeys[0] === 'index.html' && (
      indexHtmlContent.includes('جاهز للتطوير') ||
      indexHtmlContent.includes('Ready to Build') ||
      indexHtmlContent.includes('أدخل وصف التطبيق أو الميزة المطلوبة') ||
      indexHtmlContent.includes('Enter your application description in the chat panel')
    );

    const isNewProjectRequest = req.body.isNewProject === true || fileKeys.length === 0 || isDefaultLaunchpad;
    const clientSystemPrompt = typeof req.body.systemPrompt === 'string' ? req.body.systemPrompt.trim() : '';

    // Determine whether this request can ask clarifying questions (matches Builder's <clarify> rules)
    const cleanPromptWords = String(prompt || '').trim().split(/\s+/).filter(Boolean);
    const canAskClarify =
      allowClarify !== false &&
      !clarificationContext &&
      (!errorLogs || errorLogs.length === 0) &&
      cleanPromptWords.length >= 1 &&
      cleanPromptWords.length <= 35;

    // Friendly non-technical status messages (matches Builder's tool status labels)
    const lowerPrompt = (prompt || '').toLowerCase();
    let dynamicAnalyzingMsg = isAr ? 'جاري التخطيط والتحضير...' : 'Planning and preparing...';
    let dynamicGeneratingMsg = isAr ? 'جاري بناء وتحديث المشروع...' : 'Building and updating your project...';

    if (isNewProjectRequest) {
      dynamicAnalyzingMsg = isAr ? 'جاري تصميم هيكل التطبيق...' : 'Designing your app structure...';
      dynamicGeneratingMsg = isAr ? 'جاري بناء صفحات وواجهات التطبيق...' : 'Building your app pages and interface...';
    } else if (/css|ستايل|مظهر|ألوان|تصميم|تنسيق|خلفية|خط|theme|color|style|dark mode|font/i.test(lowerPrompt)) {
      dynamicAnalyzingMsg = isAr ? 'جاري مراجعة التصميم والألوان...' : 'Reviewing design and styling...';
      dynamicGeneratingMsg = isAr ? 'جاري تحديث المظهر البصري والتنسيقات...' : 'Updating visual styling and layout...';
    } else if (/خطأ|error|fix|إصلاح|terminal|طرفية|تصحيح|debug/i.test(lowerPrompt) || (errorLogs && errorLogs.length > 0)) {
      dynamicAnalyzingMsg = isAr ? 'جاري فحص المشكلة وتشخيص السبب...' : 'Checking the issue...';
      dynamicGeneratingMsg = isAr ? 'جاري إصلاح المشكلة وتحديث المعاينة...' : 'Applying the fix and refreshing preview...';
    }

    const currentFilesSummary = (!isNewProjectRequest && fileKeys.length > 0)
      ? fileKeys.map(p => {
          const f = files[p];
          return `FILE: ${p} (${f.type || 'text'})\nCONTENT:\n${f.content || ''}\n---`;
        }).join('\n\n')
      : '(Blank Workspace — Ready for complete multi-file project scaffolding according to user requirements)';

    const serverTemplateNote = buildServerTemplateNote(templateOrigin, fileKeys);

    const clarifyInstructionBlock = canAskClarify
      ? `0. CLARIFYING QUESTIONS PROTOCOL (AskClarifyingQuestions / <perplexta_clarify>):
- On a new build or a feature request with real ambiguity (where 1 to 3 product, audience, or visual style choices would genuinely shape the result), prefer asking 1–3 brief multiple-choice questions BEFORE writing any files!
- When asking clarifying questions:
  1. Write ONE short friendly sentence inside <perplexta_opening>...</perplexta_opening> acknowledging what the user wants to build.
  2. Immediately output <perplexta_clarify> containing a JSON array of 1 to 3 short, plain-language questions (each with 2–4 concrete options):
  <perplexta_opening>${isAr ? 'فكرة رائعة! قبل أن أبدأ ببناء التطبيق، لدي بضعة أسئلة سريعة لتخصيصه تماماً كما تريد:' : 'Great idea! Before I build this for you, I have a quick question to tailor it:'}</perplexta_opening>
  <perplexta_clarify>
  [
    {
      "id": "q1",
      "question": "...",
      "options": [
        { "id": "o1", "label": "...", "recommended": true },
        { "id": "o2", "label": "..." },
        { "id": "o3", "label": "..." }
      ]
    }
  ]
  </perplexta_clarify>
  3. If you output <perplexta_clarify>, STOP IMMEDIATELY after </perplexta_clarify> and do NOT output <perplexta_blueprint> or <perplexta_file> in this turn.
- Only skip <perplexta_clarify> if the user's prompt is already very detailed and specific, or is a direct small edit/bugfix.`
      : `0. BUILD IMMEDIATELY (NO CLARIFYING QUESTIONS):
- Do NOT output <perplexta_clarify>. Proceed directly to building and updating the project files. If any detail is unspecified, choose smart, high-quality defaults and flesh it out into a complete application.`;

    const systemPrompt = `You are a friendly, expert web builder assistant in Perplexta App Studio (powered by the Osama-Qonaibe/builder Assistant Engine).
The user may be completely non-technical: always speak in plain, warm, everyday ${isAr ? 'Arabic' : 'English'} without coding jargon or file paths in your user-facing text.
The live preview sits right next to the chat and refreshes automatically as soon as your files are applied.

${clientSystemPrompt ? `\n${clientSystemPrompt}\n` : ''}
${serverTemplateNote ? `\n${serverTemplateNote}\n` : ''}
${clarifyInstructionBlock}

1. ASSISTANT WORKFLOW & TASK TRACKING RULES (Ported from Osama-Qonaibe/builder prompt.js):
- OPENING SENTENCE (<perplexta_opening>): Start your response with ONE short, friendly sentence inside <perplexta_opening>...</perplexta_opening> in ${isAr ? 'Arabic' : 'English'} telling the user what you are about to build or update.
- PLAIN-LANGUAGE TODOS ("todos" in <perplexta_blueprint> or <perplexta_todo>): Create a short 3 to 5 item checklist written in plain language for a non-technical user (e.g., "${isAr ? 'إنشاء الصفحة الرئيسية' : 'Creating the main page'}", "${isAr ? 'إضافة التصميم والألوان' : 'Adding the styling'}", "${isAr ? 'تفعيل الأزرار والتفاعل الحي' : 'Making it interactive'}"). Never put file paths or function names in todo labels.
- SILENT TOOL EXECUTION: Do NOT narrate between file blocks.
- CLOSING SUMMARY: After the last file/edit block, write 2–3 friendly, non-technical sentences in ${isAr ? 'Arabic' : 'English'} summarizing what is now ready in the live preview. Never mention internal tags (<perplexta_blueprint>, <perplexta_file>, <perplexta_edit>) or raw file paths to the user.

2. MULTI-FILE PROJECT ARCHITECTURE & SURGICAL EDITING:
- For a NEW PROJECT (NEW_PROJECT_BUILD):
  Generate a complete, cohesive multi-file project inside <perplexta_blueprint> and write every file in full inside <perplexta_file path="...">:
  1. "index.html": Complete semantic HTML5 application shell using Tailwind CSS and Google Fonts (Tajawal/Cairo/Inter). Never retain the "Ready to Build" / "جاهز للتطوير" empty splash card.
  2. "styles/main.css": Custom CSS rules, animations, scrollbars, and theme variables.
  3. "src/data/mockData.js" (or domain-specific data file): Rich, realistic structured dataset attached to \`window\`.
  4. "src/components/uiRenderer.js": Modular UI rendering functions attached to \`window\`.
  5. "src/app.js": Complete interactive controller (localStorage state persistence, live search/filter, modals/drawers, form validation, toast notifications, and DOM event listeners).
- For an EXISTING PROJECT OR TEMPLATE (TARGETED_UPDATE):
  - Strictly obey THE "NEVER DESTROY, ONLY EVOLVE" RULE: Read EXISTING PROJECT FILES carefully and keep everything that already works unless the user explicitly asks to replace it.
  - For targeted changes to an existing file, you can either:
    (a) Use surgical search-and-replace blocks inside \`<perplexta_edit path="..."><<<< SEARCH\\nexact existing lines\\n====\\nupdated lines\\n>>>></perplexta_edit>\`, OR
    (b) Output the complete updated file inside \`<perplexta_file path="...">...</perplexta_file>\` preserving all existing working code.
- ZERO OMISSION POLICY: Inside <perplexta_file path="...">, write the complete file without placeholders ("// ... rest of code") and without outer markdown fences (\`\`\`html).

3. OUTPUT FORMAT WHEN BUILDING/EDITING:

<perplexta_opening>
${isAr ? 'سأقوم الآن ببناء التطبيق وتجهيز المعاينة التفاعلية لك.' : 'I will now build the application and set up the live preview for you.'}
</perplexta_opening>

<perplexta_blueprint>
{
  "phase": "blueprint",
  "project_name": "project-slug-name",
  "framework": "html-tailwind",
  "file_tree_order": [
    "index.html",
    "styles/main.css",
    "src/data/mockData.js",
    "src/components/uiRenderer.js",
    "src/app.js"
  ],
  "todos": [
    "${isAr ? 'إنشاء الصفحة الرئيسية وهيكلة الواجهة' : 'Creating the main page'}",
    "${isAr ? 'إضافة التصميم والألوان المتجاوبة' : 'Adding the visual styling'}",
    "${isAr ? 'تجهيز المحتوى والبيانات التفاعلية' : 'Setting up the interactive content'}",
    "${isAr ? 'تفعيل الأزرار والربط مع المعاينة الحية' : 'Making controls interactive'}"
  ],
  "suggestions": [
    {
      "label": "${isAr ? 'إضافة بحث وتصفية فورية' : 'Add live search & filter'}",
      "prompt": "${isAr ? 'أضف شريط بحث فوري وأزرار تصفية حسب الفئة لتسهيل الوصول للعناصر في الصفحة.' : 'Add an instant search bar and category filter pills that update items in real time.'}"
    },
    {
      "label": "${isAr ? 'تصدير البيانات كملف CSV' : 'Export data to CSV'}",
      "prompt": "${isAr ? 'أضف زر تصدير يتيح تحميل البيانات المعروضة كملف CSV أو طباعة تقرير منسق.' : 'Add an export button that downloads current records as a CSV file.'}"
    },
    {
      "label": "${isAr ? 'إضافة لوحة إحصائيات وملخص' : 'Add analytics summary cards'}",
      "prompt": "${isAr ? 'أضف بطاقات ملخص إحصائي تفاعلية في أعلى الصفحة تعرض أهم المؤشرات.' : 'Add interactive summary metric cards at the top of the page.'}"
    }
  ]
}
</perplexta_blueprint>

Followed by <perplexta_file path="...">...</perplexta_file> or <perplexta_edit path="...">...</perplexta_edit> blocks, and finally 2-3 friendly non-technical summary sentences.`;

    const userPrompt = `USER REQUEST: ${prompt || 'Build and elevate the project'}
${clarificationContext ? `\nCLARIFICATION ANSWERS FROM USER:\n${clarificationContext}\n` : ''}
REQUEST TYPE: ${isNewProjectRequest ? 'NEW_PROJECT_BUILD (Scaffold a complete multi-file project in the file tree tailored to this request)' : 'TARGETED_UPDATE (Evolve existing project/template files additively while preserving working features)'}
ACTIVE FILE IN EDITOR: ${activeFilePath || 'index.html'}
${templateOrigin?.name ? `STARTER TEMPLATE: ${templateOrigin.name} (${templateOrigin.slug || ''})` : ''}

ERROR LOGS (IF ANY):
${JSON.stringify(errorLogs || [])}

EXISTING PROJECT FILES:
${currentFilesSummary}`;

    const isStreamingRequested = req.headers['accept']?.includes('text/event-stream') || req.body.stream === true;
    
    if (isStreamingRequested) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      if (typeof (res as any).flushHeaders === 'function') {
        (res as any).flushHeaders();
      }

      res.write(`data: ${JSON.stringify({ type: 'step', step: 'analyzing', phase: 1, message: dynamicAnalyzingMsg })}\n\n`);
    }

    let rawResponse = '';
    let usedProvider = '';
    let usedModel = '';

    const formattedHistory: Array<{ role: string; content: string }> = Array.isArray(history)
      ? history.map((h: any) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: String(h.content || '') }))
      : [];

    const failedTargets = new Set<string>();
    let stepGeneratingSent = false;

    // Real-time stream state trackers for live File Tree population, Opening, Clarify, and Todos
    let streamOpeningEmitted = false;
    let streamClarifyEmitted = false;
    let streamBlueprintEmitted = false;
    let streamTodoEmitted = false;
    let liveStreamTodos: Array<{ id: string; title: string; status: 'completed' | 'in_progress' | 'pending' }> = [];
    const streamStartedFiles = new Set<string>();
    const streamCompletedFiles = new Set<string>();
    const streamCompletedEdits = new Set<string>();

    const advanceLiveTodoOnFileComplete = () => {
      if (!liveStreamTodos || liveStreamTodos.length === 0) return;
      const inProgIdx = liveStreamTodos.findIndex(t => t.status === 'in_progress');
      if (inProgIdx !== -1) {
        liveStreamTodos[inProgIdx].status = 'completed';
        const nextPendingIdx = liveStreamTodos.findIndex((t, idx) => idx > inProgIdx && t.status === 'pending');
        if (nextPendingIdx !== -1) {
          liveStreamTodos[nextPendingIdx].status = 'in_progress';
        }
      } else {
        const firstPending = liveStreamTodos.findIndex(t => t.status === 'pending');
        if (firstPending !== -1) {
          liveStreamTodos[firstPending].status = 'completed';
          if (firstPending + 1 < liveStreamTodos.length && liveStreamTodos[firstPending + 1].status === 'pending') {
            liveStreamTodos[firstPending + 1].status = 'in_progress';
          }
        }
      }
      if (isStreamingRequested && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'todo', todos: liveStreamTodos })}\n\n`);
      }
    };

    const friendlyActionForPath = (fPath: string): string => {
      const lower = fPath.toLowerCase();
      if (lower.endsWith('index.html') || lower.endsWith('.html')) {
        return isAr ? 'جاري بناء الصفحة الرئيسية...' : 'Building the main page...';
      }
      if (lower.endsWith('.css')) {
        return isAr ? 'جاري تنسيق الألوان والمظهر...' : 'Updating visual styling...';
      }
      if (lower.includes('data') || lower.endsWith('.json') || lower.endsWith('.sql')) {
        return isAr ? 'جاري تجهيز البيانات والمحتوى...' : 'Preparing sample data and content...';
      }
      return isAr ? 'جاري تفعيل التفاعل والخصائص...' : 'Adding interactive behavior...';
    };

    const processRealtimeStream = (accumulatedText: string, chunkText: string) => {
      if (!isStreamingRequested || res.writableEnded) return;

      // 1. Emit raw chunk for live code preview
      res.write(`data: ${JSON.stringify({ type: 'chunk', chunk: chunkText })}\n\n`);

      // 1.5 Check if <perplexta_opening>...</perplexta_opening> has completed
      if (!streamOpeningEmitted) {
        const openMatch = /<perplexta_opening>([\s\S]*?)<\/perplexta_opening>/i.exec(accumulatedText);
        if (openMatch && openMatch[1].trim()) {
          streamOpeningEmitted = true;
          res.write(`data: ${JSON.stringify({ type: 'opening', text: openMatch[1].trim() })}\n\n`);
        }
      }

      // 1.6 Check if <perplexta_clarify>...</perplexta_clarify> has completed
      if (!streamClarifyEmitted) {
        const clarifyMatch = /<perplexta_clarify>([\s\S]*?)<\/perplexta_clarify>/i.exec(accumulatedText);
        if (clarifyMatch) {
          const parsedQuestions = tryParseJsonArrayOrObject(clarifyMatch[1]);
          const qArray = Array.isArray(parsedQuestions)
            ? parsedQuestions
            : Array.isArray(parsedQuestions?.questions)
            ? parsedQuestions.questions
            : null;
          if (qArray && qArray.length > 0) {
            streamClarifyEmitted = true;
            const openMatch = /<perplexta_opening>([\s\S]*?)<\/perplexta_opening>/i.exec(accumulatedText);
            const leadIn = openMatch ? openMatch[1].trim() : '';
            res.write(`data: ${JSON.stringify({ type: 'clarify', leadIn, questions: qArray })}\n\n`);
          }
        }
      }

      // 1.7 Check if standalone <perplexta_todo>...</perplexta_todo> has completed
      if (!streamTodoEmitted) {
        const todoMatch = /<perplexta_todo>([\s\S]*?)<\/perplexta_todo>/i.exec(accumulatedText);
        if (todoMatch) {
          const parsedTodos = tryParseJsonArrayOrObject(todoMatch[1]);
          const tArray = Array.isArray(parsedTodos) ? parsedTodos : parsedTodos?.todos || parsedTodos?.items;
          if (Array.isArray(tArray) && tArray.length > 0) {
            streamTodoEmitted = true;
            liveStreamTodos = tArray.map((t: any, idx: number) => ({
              id: typeof t === 'object' && t.id ? String(t.id) : `todo_${idx}`,
              title: typeof t === 'string' ? t : String(t.title || t.content || `Step ${idx + 1}`),
              status: idx === 0 ? 'in_progress' : 'pending'
            }));
            res.write(`data: ${JSON.stringify({ type: 'todo', todos: liveStreamTodos })}\n\n`);
          }
        }
      }

      // 2. Check if <perplexta_blueprint>...</perplexta_blueprint> has completed
      if (!streamBlueprintEmitted) {
        const bpMatch = /<perplexta_blueprint>([\s\S]*?)<\/perplexta_blueprint>/i.exec(accumulatedText);
        if (bpMatch) {
          streamBlueprintEmitted = true;
          const parsedBp = tryParseBlueprintJson(bpMatch[1]);
          if (parsedBp) {
            res.write(`data: ${JSON.stringify({ type: 'blueprint', blueprint: parsedBp })}\n\n`);
            if (Array.isArray(parsedBp.todos) && parsedBp.todos.length > 0 && !streamTodoEmitted) {
              streamTodoEmitted = true;
              liveStreamTodos = parsedBp.todos.map((t: any, idx: number) => ({
                id: typeof t === 'object' && t.id ? String(t.id) : `todo_${idx}`,
                title: typeof t === 'string' ? t : String(t.title || t.content || `Step ${idx + 1}`),
                status: idx === 0 ? 'in_progress' : 'pending'
              }));
              res.write(`data: ${JSON.stringify({ type: 'todo', todos: liveStreamTodos })}\n\n`);
            }
          }
        }
      }

      // 3. Check for newly completed <perplexta_file ...>...</perplexta_file> blocks
      const closedFileRegex = /<perplexta_file\s+(?:path|file|name)=["']([^"']+)["'][^>]*>([\s\S]*?)<\/perplexta_file>/gi;
      let cMatch;
      while ((cMatch = closedFileRegex.exec(accumulatedText)) !== null) {
        const fPath = cMatch[1].trim();
        if (fPath && !streamCompletedFiles.has(fPath)) {
          streamCompletedFiles.add(fPath);
          streamStartedFiles.add(fPath);
          const normContent = normalizeFileContent(cMatch[2]);
          const ext = fPath.split('.').pop() || 'txt';
          const fName = fPath.split('/').pop() || fPath;
          if (normContent) {
            res.write(`data: ${JSON.stringify({
              type: 'file_complete',
              path: fPath,
              file: {
                name: fName,
                path: fPath,
                type: ext,
                content: normContent,
                isEntry: fPath === 'index.html'
              }
            })}\n\n`);
            advanceLiveTodoOnFileComplete();
          }
        }
      }

      // 3.5 Check for newly completed <perplexta_edit path="...">...</perplexta_edit> blocks
      const closedEditRegex = /<perplexta_edit\s+(?:path|file|name)=["']([^"']+)["'][^>]*>([\s\S]*?)<\/perplexta_edit>/gi;
      let eMatch;
      while ((eMatch = closedEditRegex.exec(accumulatedText)) !== null) {
        const eKey = `${eMatch.index}:${eMatch[1].trim()}`;
        const fPath = eMatch[1].trim();
        if (fPath && !streamCompletedEdits.has(eKey)) {
          streamCompletedEdits.add(eKey);
          const existingFile = files?.[fPath];
          if (existingFile && typeof existingFile.content === 'string') {
            const { updated, appliedCount } = applyPatchBlocksToContent(existingFile.content, eMatch[2]);
            if (appliedCount > 0) {
              const ext = fPath.split('.').pop() || 'txt';
              const fName = fPath.split('/').pop() || fPath;
              res.write(`data: ${JSON.stringify({
                type: 'file_complete',
                path: fPath,
                file: {
                  name: fName,
                  path: fPath,
                  type: ext,
                  content: updated,
                  isEntry: fPath === 'index.html'
                }
              })}\n\n`);
              advanceLiveTodoOnFileComplete();
            }
          }
        }
      }

      // 4. Check for any <perplexta_file ...> or <perplexta_edit ...> opening tag currently being written
      const openFileRegex = /<perplexta_(?:file|edit)\s+(?:path|file|name)=["']([^"']+)["'][^>]*>/gi;
      let oMatch;
      while ((oMatch = openFileRegex.exec(accumulatedText)) !== null) {
        const fPath = oMatch[1].trim();
        if (fPath && !streamStartedFiles.has(fPath)) {
          streamStartedFiles.add(fPath);
          res.write(`data: ${JSON.stringify({
            type: 'file_writing',
            path: fPath,
            message: friendlyActionForPath(fPath)
          })}\n\n`);
        }
      }
    };

    // Silent Failover Execution across Primary + Fallbacks
    for (const target of targets) {
      const targetKey = `${target.provider.toLowerCase().trim()}:${target.model.toLowerCase().trim()}`;
      if (failedTargets.has(targetKey)) {
        continue;
      }
      try {
        const key = await getProviderKey(target.provider);
        if (!key && !target.provider.toLowerCase().includes('ollama')) continue;
        const urlKey = await getProviderUrlKey(target.provider).catch(() => undefined);

        if (isStreamingRequested && !stepGeneratingSent && !res.writableEnded) {
          stepGeneratingSent = true;
          res.write(`data: ${JSON.stringify({ type: 'step', step: 'generating', phase: 1, message: dynamicGeneratingMsg })}\n\n`);
        }

        let accumulated = '';
        streamOpeningEmitted = false;
        streamClarifyEmitted = false;
        streamBlueprintEmitted = false;
        streamTodoEmitted = false;
        streamStartedFiles.clear();
        streamCompletedFiles.clear();
        streamCompletedEdits.clear();

        const returnedText = await callAIProvider(
          target.provider,
          target.model,
          key || '',
          userPrompt,
          systemPrompt,
          (chunk) => {
            accumulated += chunk;
            processRealtimeStream(accumulated, chunk);
          },
          formattedHistory,
          { stream: isStreamingRequested, toolId: 'code', headerTimeoutMs: 15000 },
          urlKey || undefined
        );

        const finalOutput = (accumulated && accumulated.trim().length > 0) ? accumulated : (returnedText || '');
        if (finalOutput && finalOutput.trim().length > 0) {
          rawResponse = finalOutput;
          usedProvider = target.provider;
          usedModel = target.model;
          break;
        }
      } catch (callErr: any) {
        failedTargets.add(targetKey);
        console.warn(`[Studio Orchestrator Failover] Target ${target.provider}/${target.model} failed:`, callErr?.message);
      }
    }

    // Secondary Dynamic Vault Recovery if all configured slots experienced upstream spikes
    if (!rawResponse || rawResponse.trim().length === 0) {
      try {
        const vaultRows = await getCachedApiKeysVault();
        for (const row of vaultRows) {
          if (!row || !row.provider || row.is_active === false) continue;
          const rawModels = Array.isArray(row.models) ? row.models : [];
          const candidateModels = rawModels
            .map((m: any) => typeof m === 'string' ? m : (m?.id || m?.name || ''))
            .filter((id: string) => {
              const lower = id.toLowerCase();
              return lower.length > 0 &&
                !lower.includes('tts') &&
                !lower.includes('image') &&
                !lower.includes('embedding') &&
                !lower.includes('transcribe') &&
                !lower.includes('robotics') &&
                !lower.includes('computer-use') &&
                !lower.includes('antigravity') &&
                !lower.includes('deep-research') &&
                !lower.includes('lyria') &&
                !lower.includes('aqa') &&
                !lower.includes('3.8-flash') &&
                !lower.includes('3.1-flash-lite') &&
                !lower.includes('pro-preview') &&
                !lower.includes('latest');
            })
            .slice(0, 3);

          for (const candidateModel of candidateModels) {
            const targetKey = `${row.provider.toLowerCase().trim()}:${candidateModel.toLowerCase().trim()}`;
            if (failedTargets.has(targetKey)) continue;
            try {
              const key = await getProviderKey(row.provider);
              if (!key) continue;
              const urlKey = await getProviderUrlKey(row.provider).catch(() => undefined);
              let accumulated = '';
              streamOpeningEmitted = false;
              streamClarifyEmitted = false;
              streamBlueprintEmitted = false;
              streamTodoEmitted = false;
              streamStartedFiles.clear();
              streamCompletedFiles.clear();
              streamCompletedEdits.clear();

              const returnedText = await callAIProvider(
                row.provider,
                candidateModel,
                key,
                userPrompt,
                systemPrompt,
                (chunk) => {
                  accumulated += chunk;
                  processRealtimeStream(accumulated, chunk);
                },
                formattedHistory,
                { stream: isStreamingRequested, toolId: 'code', headerTimeoutMs: 15000 },
                urlKey || undefined
              );
              const finalOutput = (accumulated && accumulated.trim().length > 0) ? accumulated : (returnedText || '');
              if (finalOutput && finalOutput.trim().length > 0) {
                rawResponse = finalOutput;
                usedProvider = row.provider;
                usedModel = candidateModel;
                break;
              }
            } catch (vaultFallbackErr: any) {
              failedTargets.add(targetKey);
            }
          }
          if (rawResponse && rawResponse.trim().length > 0) break;
        }
      } catch (_) {}
    }

    if (!rawResponse || rawResponse.trim().length === 0) {
      throw new Error('فشلت جميع محاولات الاتصال بمزودي الذكاء الاصطناعي (بما في ذلك خادم Ollama المحلي والاتصال السحابي). يرجى التحقق من مفاتيح واجهة البرمجة (API Keys) في لوحة التحكم أو تشغيل خادم Ollama.');
    }

    // Check if the model returned a <perplexta_clarify> turn (AskClarifyingQuestions)
    const clarifyBlockMatch = /<perplexta_clarify>([\s\S]*?)<\/perplexta_clarify>/i.exec(rawResponse);
    if (clarifyBlockMatch && !/<perplexta_file\s/i.test(rawResponse) && !/<perplexta_edit\s/i.test(rawResponse)) {
      const parsedClarify = tryParseJsonArrayOrObject(clarifyBlockMatch[1]);
      const qList = Array.isArray(parsedClarify)
        ? parsedClarify
        : Array.isArray(parsedClarify?.questions)
        ? parsedClarify.questions
        : [];
      if (qList.length > 0) {
        const openMatch = /<perplexta_opening>([\s\S]*?)<\/perplexta_opening>/i.exec(rawResponse);
        const leadInText = openMatch
          ? openMatch[1].trim()
          : rawResponse.replace(/<perplexta_clarify>[\s\S]*?<\/perplexta_clarify>/gi, '').trim() ||
            (isAr ? 'قبل البدء بالبناء، يرجى تحديد تفضيلاتك:' : 'Before building, please select your preferences:');

        const clarifyPayload = {
          success: true,
          clarifyOnly: true,
          leadIn: leadInText,
          clarifyQuestions: qList,
          files: files || {},
          updatedFiles: [],
          reply: leadInText,
          summary: isAr ? 'بانتظار إجابات الأسئلة التوضيحية' : 'Awaiting clarifying answers'
        };

        if (isStreamingRequested) {
          if (!res.writableEnded) {
            if (!streamClarifyEmitted) {
              res.write(`data: ${JSON.stringify({ type: 'clarify', leadIn: leadInText, questions: qList })}\n\n`);
            }
            res.write(`data: ${JSON.stringify({ type: 'complete', ...clarifyPayload })}\n\n`);
            res.end();
          }
          return;
        }
        return res.json(clarifyPayload);
      }
    }
    
    // Universal Multi-Protocol Output Parser
    const newlyGeneratedFiles: Record<string, any> = {};
    let parsedBlueprint: any = null;
    let parsedReply = '';
    let parsedOpening = '';
    let parsedSummary = '';
    const parsedLogs: string[] = [];
    const parsedSuggestions: Array<string | { label: string; prompt: string }> = [];

    const openTagMatch = /<perplexta_opening>([\s\S]*?)<\/perplexta_opening>/i.exec(rawResponse);
    if (openTagMatch && openTagMatch[1].trim()) {
      parsedOpening = openTagMatch[1].trim();
    }

    // 0. Parse <perplexta_blueprint> JSON schema
    const bpMatch = /<perplexta_blueprint>([\s\S]*?)<\/perplexta_blueprint>/i.exec(rawResponse);
    if (bpMatch) {
      parsedBlueprint = tryParseBlueprintJson(bpMatch[1]);
      if (parsedBlueprint && Array.isArray(parsedBlueprint.suggestions)) {
        for (const s of parsedBlueprint.suggestions) {
          if (typeof s === 'string' && s.trim().length > 0) {
            parsedSuggestions.push(s.trim());
          } else if (s && typeof s === 'object' && (s.label || s.prompt)) {
            parsedSuggestions.push({
              label: String(s.label || s.prompt).trim(),
              prompt: String(s.prompt || s.label).trim()
            });
          }
        }
      }
    }

    // 1. Parse closed <perplexta_file path="..."> tags
    const fileTagRegex = /<perplexta_file\s+(?:path|file|name)=["']([^"']+)["'][^>]*>([\s\S]*?)<\/perplexta_file>/gi;
    let tagMatch;
    let lastClosedTagEndIndex = 0;
    while ((tagMatch = fileTagRegex.exec(rawResponse)) !== null) {
      lastClosedTagEndIndex = tagMatch.index + tagMatch[0].length;
      const filePath = tagMatch[1].trim();
      const content = normalizeFileContent(tagMatch[2]);
      const ext = filePath.split('.').pop() || 'txt';
      const fileName = filePath.split('/').pop() || filePath;
      if (content) {
        newlyGeneratedFiles[filePath] = {
          name: fileName,
          path: filePath,
          type: ext,
          content,
          isEntry: filePath === 'index.html'
        };
      }
    }

    // 1.05 Truncation Recovery: Check if there is an unclosed <perplexta_file path="..."> at the end of rawResponse
    const remainingTail = rawResponse.slice(lastClosedTagEndIndex);
    const unclosedMatch = /<perplexta_file\s+(?:path|file|name)=["']([^"']+)["'][^>]*>([\s\S]+)$/i.exec(remainingTail);
    if (unclosedMatch) {
      const filePath = unclosedMatch[1].trim();
      let tailContent = unclosedMatch[2]
        .replace(/<\/perplexta_file[^>]*$/i, '')
        .trim();
      const content = normalizeFileContent(tailContent);
      if (filePath && content && content.length > 20 && !newlyGeneratedFiles[filePath]) {
        const ext = filePath.split('.').pop() || 'txt';
        const fileName = filePath.split('/').pop() || filePath;
        newlyGeneratedFiles[filePath] = {
          name: fileName,
          path: filePath,
          type: ext,
          content,
          isEntry: filePath === 'index.html'
        };
      }
    }

    // 1.08 Parse <perplexta_edit path="..."> surgical edit blocks using 4-tier applyFileEditServer
    const editTagRegex = /<perplexta_edit\s+(?:path|file|name)=["']([^"']+)["'][^>]*>([\s\S]*?)<\/perplexta_edit>/gi;
    let editMatch;
    while ((editMatch = editTagRegex.exec(rawResponse)) !== null) {
      const targetPath = editMatch[1].trim();
      const baseFile = newlyGeneratedFiles[targetPath] || files?.[targetPath];
      if (baseFile && typeof baseFile.content === 'string') {
        const { updated, appliedCount } = applyPatchBlocksToContent(baseFile.content, editMatch[2]);
        if (appliedCount > 0) {
          const ext = targetPath.split('.').pop() || 'txt';
          const fileName = targetPath.split('/').pop() || targetPath;
          newlyGeneratedFiles[targetPath] = {
            ...baseFile,
            name: fileName,
            path: targetPath,
            type: ext,
            content: updated,
            isEntry: targetPath === 'index.html'
          };
        }
      }
    }

    // 1.1 Parse standalone <<<< SEARCH ... ==== ... >>>> surgical patches (using 4-tier applyFileEditServer)
    const withoutEditTags = rawResponse.replace(/<perplexta_edit[\s\S]*?<\/perplexta_edit>/gi, '');
    const patchRegex = /<<<<+\s*SEARCH\s*\r?\n([\s\S]*?)\r?\n====+\s*\r?\n([\s\S]*?)\r?\n>>>>+/gi;
    let patchMatch;
    while ((patchMatch = patchRegex.exec(withoutEditTags)) !== null) {
      const searchTarget = patchMatch[1];
      const replacementText = patchMatch[2];
      // Try activeFilePath first, then scan all workspace files for a 4-tier match
      const candidatePaths = Array.from(new Set([activeFilePath || 'index.html', ...Object.keys(files || {})]));
      for (const candidatePath of candidatePaths) {
        const existingFile = newlyGeneratedFiles[candidatePath] || files?.[candidatePath];
        if (!existingFile || !existingFile.content) continue;
        try {
          const patchedContent = applyFileEditServer(existingFile.content, searchTarget, replacementText);
          newlyGeneratedFiles[candidatePath] = {
            ...existingFile,
            content: patchedContent
          };
          break;
        } catch (_) {}
      }
    }

    // 2. Parse Markdown code blocks with path or language hints (excluding <perplexta_blueprint>)
    if (Object.keys(newlyGeneratedFiles).length === 0) {
      const withoutBlueprint = rawResponse.replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '');
      const mdBlockRegex = /```(?:([a-zA-Z0-9_.-]+)(?:\s+(?:path=["']|file=["']|title=["'])?([^"'\s\n`]+)["']?)?)?\s*\n([\s\S]*?)(?:```|$)/gi;
      let mdMatch;
      while ((mdMatch = mdBlockRegex.exec(withoutBlueprint)) !== null) {
        const lang = (mdMatch[1] || '').toLowerCase();
        let pathHint = mdMatch[2] || '';
        const content = normalizeFileContent(mdMatch[3].trim());
        if (!content || content.length < 15) continue;

        if (!pathHint && (lang.includes('/') || lang.endsWith('.html') || lang.endsWith('.css') || lang.endsWith('.js') || lang.endsWith('.jsx') || lang.endsWith('.sql'))) {
          pathHint = mdMatch[1];
        }

        if (!pathHint) {
          if (lang === 'html' || content.includes('<!DOCTYPE html>') || content.includes('<html')) {
            pathHint = 'index.html';
          } else if (lang === 'css' || (content.includes('{') && content.includes('}') && (content.includes('body') || content.includes(':root') || content.includes('@keyframes')))) {
            pathHint = 'styles/main.css';
          } else if (lang === 'sql' || content.toUpperCase().includes('CREATE TABLE')) {
            pathHint = 'db/schema.sql';
          } else if (lang === 'jsx' || lang === 'tsx') {
            pathHint = newlyGeneratedFiles['src/App.jsx'] ? 'src/main.jsx' : 'src/App.jsx';
          } else if (lang === 'js' || lang === 'javascript' || lang === 'ts' || lang === 'typescript') {
            pathHint = newlyGeneratedFiles['src/app.js'] ? 'src/data/mockData.js' : 'src/app.js';
          }
        }

        if (pathHint && content && pathHint !== 'json' && lang !== 'json') {
          const ext = pathHint.split('.').pop() || lang || 'txt';
          const fileName = pathHint.split('/').pop() || pathHint;
          newlyGeneratedFiles[pathHint] = {
            name: fileName,
            path: pathHint,
            type: ext,
            content,
            isEntry: pathHint === 'index.html'
          };
        }
      }
    }

    // 3. Fallback: Parse JSON schema or Raw HTML
    if (Object.keys(newlyGeneratedFiles).length === 0) {
      let parsedJson: any = null;
      const withoutBp = rawResponse.replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '').trim();
      try {
        let cleaned = withoutBp.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        parsedJson = JSON.parse(cleaned);
      } catch {
        try {
          const relaxed = withoutBp
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => c === '\n' || c === '\r' || c === '\t' ? c : '');
          const firstBrace = relaxed.indexOf('{');
          const lastBrace = relaxed.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            parsedJson = JSON.parse(relaxed.substring(firstBrace, lastBrace + 1));
          }
        } catch (_) {}
      }

      if (parsedJson && typeof parsedJson === 'object' && !parsedJson.file_tree_order) {
        parsedReply = parsedJson.reply || '';
        parsedSummary = parsedJson.summary || '';
        if (Array.isArray(parsedJson.logs)) parsedLogs.push(...parsedJson.logs);
        if (Array.isArray(parsedJson.suggestions)) parsedSuggestions.push(...parsedJson.suggestions);

        const filesContainer = (parsedJson.files && typeof parsedJson.files === 'object') ? parsedJson.files : parsedJson;
        for (const [key, val] of Object.entries(filesContainer)) {
          if (['summary', 'reply', 'logs', 'suggestions', 'deletedFiles', 'success', 'error', 'phase', 'project_name', 'framework', 'dependencies'].includes(key)) continue;
          let filePath = key;
          let fileContent = '';
          let fileType = '';
          if (typeof val === 'string') fileContent = val;
          else if (val && typeof val === 'object') {
            fileContent = (val as any).content || (val as any).code || (val as any).text || '';
            filePath = (val as any).path || (val as any).name || key;
            fileType = (val as any).type || '';
          }
          if (fileContent && typeof fileContent === 'string' && fileContent.trim().length > 0) {
            const cleanedContent = normalizeFileContent(fileContent);
            if (!fileType) {
              const ext = filePath.split('.').pop() || 'txt';
              fileType = ext;
            }
            newlyGeneratedFiles[filePath] = {
              name: filePath.split('/').pop() || filePath,
              path: filePath,
              type: fileType,
              content: cleanedContent,
              isEntry: filePath === 'index.html'
            };
          }
        }
      } else if (withoutBp.includes('<!DOCTYPE html>') || withoutBp.includes('<html')) {
        const htmlStart = withoutBp.indexOf('<!DOCTYPE html>') !== -1 ? withoutBp.indexOf('<!DOCTYPE html>') : withoutBp.indexOf('<html');
        const htmlEnd = withoutBp.lastIndexOf('</html>');
        const rawHtmlBlock = htmlEnd !== -1 ? withoutBp.slice(htmlStart, htmlEnd + 7) : withoutBp.slice(htmlStart);
        newlyGeneratedFiles['index.html'] = {
          name: 'index.html',
          path: 'index.html',
          type: 'html',
          content: normalizeFileContent(rawHtmlBlock),
          isEntry: true
        };
      }
    }

    const hasUpdatedFiles = Object.keys(newlyGeneratedFiles).length > 0;

    // Extract deleted files via <perplexta_delete path="..."> tags
    const deletedFilesList: string[] = [];
    const deleteTagRegex = /<perplexta_delete\s+path=["']([^"']+)["'][^>]*\/?>/gi;
    let delMatch;
    while ((delMatch = deleteTagRegex.exec(rawResponse)) !== null) {
      const delPath = delMatch[1].trim();
      if (delPath) {
        deletedFilesList.push(delPath);
      }
    }

    // Determine final files map safely
    let finalFilesMap: Record<string, any> = {};
    if (hasUpdatedFiles) {
      if (isNewProjectRequest) {
        // Fresh project tree replacing blank launchpad template
        finalFilesMap = { ...newlyGeneratedFiles };
      } else {
        // Merge with existing files to preserve project tree
        finalFilesMap = { ...(files || {}), ...newlyGeneratedFiles };
      }
    } else {
      finalFilesMap = { ...(files || {}) };
    }

    // Apply file deletions
    deletedFilesList.forEach(delPath => {
      delete finalFilesMap[delPath];
    });

    // Extract clean conversational reply text without raw code, search-replace patches, or blueprint dumps
    const cleanReply = rawResponse
      .replace(/<perplexta_opening>[\s\S]*?<\/perplexta_opening>/gi, '')
      .replace(/<perplexta_clarify>[\s\S]*?<\/perplexta_clarify>/gi, '')
      .replace(/<perplexta_todo>[\s\S]*?<\/perplexta_todo>/gi, '')
      .replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '')
      .replace(/<perplexta_blueprint>[\s\S]*/gi, '')
      .replace(/<perplexta_file[\s\S]*?<\/perplexta_file>/gi, '')
      .replace(/<perplexta_file[\s\S]*/gi, '')
      .replace(/<perplexta_edit[\s\S]*?<\/perplexta_edit>/gi, '')
      .replace(/<perplexta_edit[\s\S]*/gi, '')
      .replace(/<<<<+\s*SEARCH[\s\S]*?>>>>+/gi, '')
      .replace(/<<<<+\s*SEARCH[\s\S]*/gi, '')
      .replace(/<perplexta_delete[\s\S]*?\/?>/gi, '')
      .replace(/```[\s\S]*?```/gi, '')
      .replace(/```[\s\S]*/gi, '')
      .trim();

    const updatedFilesKeys = Object.keys(newlyGeneratedFiles);

    if (cleanReply && !cleanReply.includes('{') && cleanReply.length > 10) {
      parsedReply = cleanReply;
    } else if (hasUpdatedFiles) {
      parsedReply = isNewProjectRequest
        ? (isAr
            ? 'أصبح مشروعك جاهزاً الآن في شاشة المعاينة الحية! يمكنك تجربته مباشرة أو إخباري بأي تعديل أو ميزة إضافية ترغب بها.'
            : 'Your project is now ready in the live preview! Try it out and let me know what you would like to customize or add next.')
        : (isAr
            ? 'تم تطبيق التحديثات المطلوبة وتحديث المعاينة الحية بنجاح. أخبرني إذا كنت ترغب في أي تعديل إضافي.'
            : 'The updates have been applied and your live preview is refreshed. Let me know if you want any further adjustments.');
    } else if (deletedFilesList.length > 0) {
      parsedReply = isAr
        ? 'تم تحديث المشروع وحذف العناصر المطلوبة بنجاح.'
        : 'Updated the project and removed the requested items.';
    } else {
      parsedReply = isAr
        ? 'لم يتم استخراج تغييرات جديدة من الاستجابة. يرجى إعادة المحاولة أو توضيح المطلوب.'
        : 'No file changes were extracted from the response. Please try again or clarify what you need.';
    }

    // Promote all todos to completed when files were built/updated (mirrors promoteFinishedTodos in Builder's app.js)
    let finalizedTodos = liveStreamTodos.length > 0
      ? liveStreamTodos.map(t => ({ ...t, status: hasUpdatedFiles ? ('completed' as const) : t.status }))
      : Array.isArray(parsedBlueprint?.todos)
      ? parsedBlueprint.todos.map((t: any, idx: number) => ({
          id: typeof t === 'object' && t.id ? String(t.id) : `todo_${idx}`,
          title: typeof t === 'string' ? t : String(t.title || t.content || `Step ${idx + 1}`),
          status: 'completed' as const
        }))
      : [];

    if (finalizedTodos.length > 0 && isStreamingRequested && !res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'todo', todos: finalizedTodos })}\n\n`);
    }

    // Generate concise, professional engineering logs without emojis
    const enhancedLogs: string[] = [];
    if (isNewProjectRequest && hasUpdatedFiles) {
      enhancedLogs.push('تحليل متطلبات المشروع وتخطيط الهيكل البرمجي');
      enhancedLogs.push(`إنشاء شجرة الملفات (${Object.keys(finalFilesMap).length} ملفات) وتنظيم المجلدات`);
      updatedFilesKeys.forEach(f => {
        enhancedLogs.push(`كتابة ملف ${f} والتحقق من التوافق البرمجي`);
      });
      enhancedLogs.push('ربط ملفات البيانات والواجهات وتشغيل المعاينة المباشرة');
    } else if (hasUpdatedFiles) {
      enhancedLogs.push('فحص شجرة المشروع وتحديد الملفات المستهدفة للتحديث');
      updatedFilesKeys.forEach(f => {
        enhancedLogs.push(`تحديث ملف ${f} وحقن الوظائف التفاعلية`);
      });
      enhancedLogs.push('مزامنة شاشة المعاينة المباشرة وتطبيق التغييرات');
    } else {
      enhancedLogs.push('فحص الطلب ومراجعة حالة ملفات المشروع الحالية');
    }

    const payloadResult = {
      success: true,
      files: finalFilesMap,
      updatedFiles: updatedFilesKeys,
      blueprint: parsedBlueprint,
      opening: parsedOpening,
      todos: finalizedTodos,
      deletedFiles: deletedFilesList,
      reply: parsedReply,
      summary: parsedSummary || (deletedFilesList.length > 0 ? `تم حذف ${deletedFilesList.join(', ')}` : (isNewProjectRequest && hasUpdatedFiles ? `تم إنشاء المشروع (${updatedFilesKeys.length} ملفات)` : hasUpdatedFiles ? `تم تحديث ${updatedFilesKeys.length} ملفات بنجاح` : 'تمت مراجعة المشروع')),
      logs: parsedLogs.length > 0 ? parsedLogs : enhancedLogs,
      suggestions: parsedSuggestions.length > 0 ? parsedSuggestions.slice(0, 4) : (
        Object.keys(finalFilesMap).some(f => f.toLowerCase().includes('product') || f.toLowerCase().includes('cart') || f.toLowerCase().includes('store'))
          ? [
              {
                label: isAr ? 'تطوير بطاقة تسجيل دخول وحسابات العملاء' : 'Add customer login & accounts',
                prompt: isAr ? 'طور نافذة تسجيل دخول وحسابات للعملاء مع حفظ الجلسة وسجل الطلبات.' : 'Build a customer login modal and account profile view with order history.'
              },
              {
                label: isAr ? 'إضافة نظام كوبونات خصم وتخفيضات' : 'Add discount coupons system',
                prompt: isAr ? 'أضف حقل لتطبيق كوبونات الخصم في سلة المشتريات مع حساب نسبة الخصم والضريبة تلقائياً.' : 'Add a promo code input in the cart that calculates discounts and tax automatically.'
              },
              {
                label: isAr ? 'لوحة إحصائيات المبيعات وتصدير الفواتير' : 'Sales analytics & invoice export',
                prompt: isAr ? 'أنشئ لوحة إحصائيات للمبيعات مع إمكانية طباعة وتصدير الفاتورة.' : 'Create a sales analytics view with printable customer invoices.'
              }
            ]
          : [
              {
                label: isAr ? 'إضافة بحث وتصفية فورية' : 'Add live search & filter',
                prompt: isAr ? 'أضف شريط بحث فوري وأزرار تصفية حسب الفئة لتسهيل الوصول للعناصر في الصفحة.' : 'Add an instant search bar and category filter pills that filter items in real time.'
              },
              {
                label: isAr ? 'تصدير البيانات كملف CSV / JSON' : 'Export data to CSV / JSON',
                prompt: isAr ? 'أضف ميزة تصدير البيانات الحالية إلى ملف CSV أو JSON مع إمكانية الطباعة.' : 'Add an Export button to download current data as CSV or JSON.'
              },
              {
                label: isAr ? 'إضافة لوحة إحصائيات وملخص بصري' : 'Add interactive summary metrics',
                prompt: isAr ? 'أضف قسم ملخص إحصائي تفاعلي في أعلى التطبيق يعرض المؤشرات الرئيسية.' : 'Add an interactive analytics summary bar at the top of the app.'
              }
            ]
      )
    };

    if (isStreamingRequested) {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'complete', ...payloadResult })}\n\n`);
        res.end();
      }
      return;
    }

    if (!res.headersSent) {
      return res.json(payloadResult);
    }
  } catch (error: any) {
    console.error('[Studio Generate Error]:', error);
    const errMsg = error?.message || 'Failed to generate code';
    if (res.headersSent) {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: errMsg, message: errMsg })}\n\n`);
        res.end();
      }
      return;
    }
    return res.status(500).json({ error: errMsg, message: errMsg });
  }
});

/**
 * POST /api/studio/suggestions
 * Ported from generateContinueSuggestions & SUGGESTION_SYSTEM_PROMPT in Osama-Qonaibe/builder (src/js/app.js).
 * Dynamically generates 4-5 tailored follow-up suggestions { label, prompt } by inspecting the current HTML,
 * recent conversation transcript, and avoiding any previously suggested labels (_recentSuggestionLabels).
 * Strictly uses the Database Tool Orchestrator Registry ('code') with zero hardcoded model names.
 */
router.post('/suggestions', authenticateTokenOptional, async (req: any, res) => {
  try {
    const { htmlSnapshot, transcript, recentLabels, language: reqLang } = req.body || {};
    const isAr = (reqLang || 'ar') !== 'en';

    const { pool } = await import('../db/index.js');
    const { callAIProvider, getProviderKey, getProviderUrlKey } = await import('../services/ai.js');
    const { getCachedOrchestratorConfig } = await import('../db/queries.js');

    let route = await getCachedOrchestratorConfig('code').catch(() => null);
    if (!route) {
      const routeRes = await pool.query("SELECT * FROM tool_orchestrator WHERE tool_id = 'code' AND is_active = true LIMIT 1");
      if (routeRes.rows.length > 0) route = routeRes.rows[0];
    }

    const targets: Array<{ provider: string; model: string }> = [];
    if (route && route.is_active && route.primary_provider && route.primary_model) {
      targets.push({ provider: route.primary_provider.trim(), model: route.primary_model.trim() });
      if (route.fallback_1_provider && route.fallback_1_model) {
        targets.push({ provider: route.fallback_1_provider.trim(), model: route.fallback_1_model.trim() });
      }
      if (route.fallback_2_provider && route.fallback_2_model) {
        targets.push({ provider: route.fallback_2_provider.trim(), model: route.fallback_2_model.trim() });
      }
    }

    const suggestionSystemPrompt = `You generate next-step suggestions for a user who is building or editing a web app or site with an AI coding assistant.
Look at the conversation and the current app HTML, then propose 4 to 5 things the user might genuinely want to do next.

Rules:
- Each suggestion must be specific to THIS project (reference its actual features, sections, controls, or theme). No generic filler.
- NEVER suggest something the app already has. Read the current HTML carefully — if an element, control, section, or feature is already in the markup or script, do not suggest adding it.
- Mix categories when relevant: a new feature or interactive behavior, a visual/layout/theme tweak, content or data refinement, or a UX polish improvement.
- Keep "label" very short (3–6 words, sentence case, no trailing period) in ${isAr ? 'Arabic' : 'English'} — it renders on a compact chip button.
- Make "prompt" a clear, natural 1–2 sentence instruction in ${isAr ? 'Arabic' : 'English'} the user would send to the assistant to carry out that idea.
- Output ONLY a valid JSON array of objects: [{"label": "...", "prompt": "..."}, ...] with no markdown fences or extra text.`;

    const avoidLine = Array.isArray(recentLabels) && recentLabels.length > 0
      ? `\n\nDo NOT repeat or closely paraphrase any of these already-suggested ideas: ${recentLabels.slice(-15).join('; ')}. Come up with fresh angles.`
      : '';

    const userMsg = `Recent conversation:\n${String(transcript || '').slice(0, 3000)}\n\nCurrent app HTML (truncated):\n${String(htmlSnapshot || '').slice(0, 5000)}${avoidLine}\n\nReturn the JSON array of 4-5 suggestions now.`;

    let rawText = '';
    for (const target of targets) {
      try {
        const key = await getProviderKey(target.provider);
        if (!key && !target.provider.toLowerCase().includes('ollama')) continue;
        const urlKey = await getProviderUrlKey(target.provider).catch(() => undefined);
        const out = await callAIProvider(
          target.provider,
          target.model,
          key || '',
          userMsg,
          suggestionSystemPrompt,
          undefined,
          [],
          { stream: false, toolId: 'code', headerTimeoutMs: 10000 },
          urlKey || undefined
        );
        if (out && out.trim()) {
          rawText = out.trim();
          break;
        }
      } catch (_) {}
    }

    const parsed = tryParseJsonArrayOrObject(rawText);
    const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    const cleanSuggestions = list
      .filter((x: any) => x && typeof x.label === 'string' && typeof x.prompt === 'string' && x.label.trim() && x.prompt.trim())
      .slice(0, 5)
      .map((x: any) => ({ label: x.label.trim(), prompt: x.prompt.trim() }));

    return res.json({ success: true, suggestions: cleanSuggestions });
  } catch (err: any) {
    return res.json({ success: false, suggestions: [] });
  }
});

export default router;

