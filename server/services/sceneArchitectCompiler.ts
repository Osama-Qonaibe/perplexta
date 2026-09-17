import { pool } from '../db/index.js';
import { buildSystemPrompt } from '../config/protocol.js';
import { callAIProvider, getProviderKey } from './ai.js';

export interface ArchitectedSceneOutput {
  media_type: 'image' | 'video';
  aspect_ratio: '16:9' | '9:16' | '1:1' | '4:5' | string;
  prompt: string;
  negative_prompt: string;
  camera_motion: 'static' | 'pan_left' | 'pan_right' | 'zoom_in' | 'drone_orbit' | 'smooth_tracking' | string;
  lighting_setup: 'volumetric rim lighting' | 'golden hour' | 'studio softbox' | 'cyberpunk neon' | 'natural daylight' | string;
  rendering_style: 'photorealistic' | 'cinematic_film' | '3d_octane' | 'digital_art' | string;
  seed: number;
}

export async function compileSceneWithArchitect(
  rawPrompt: string,
  options?: { userLang?: string; userId?: number; preferredModelId?: string }
): Promise<ArchitectedSceneOutput> {
  const userLang = options?.userLang || 'ar';
  const systemPrompt = buildSystemPrompt('Perplexta', 'scene_architect', userLang);

  let provider = '';
  let model = options?.preferredModelId || '';

  try {
    const routeRes = await pool.query(
      'SELECT primary_provider, primary_model FROM tool_orchestrator WHERE tool_id = $1 AND is_active = true',
      ['scene_architect']
    );
    if (routeRes.rows && routeRes.rows.length > 0) {
      if (routeRes.rows[0].primary_provider) provider = routeRes.rows[0].primary_provider;
      if (!options?.preferredModelId && routeRes.rows[0].primary_model) model = routeRes.rows[0].primary_model;
    }
  } catch (err) {
    console.warn('[SceneArchitectCompiler] Could not fetch tool_orchestrator route for scene_architect:', err);
  }

  // Fallback to chat_fast or perplexta_analysis if scene_architect has no route configured
  if (!provider || !model) {
    try {
      const fastRes = await pool.query(
        "SELECT primary_provider, primary_model FROM tool_orchestrator WHERE tool_id IN ('chat_fast', 'perplexta_analysis') AND is_active = true AND primary_provider != '' AND primary_model != '' LIMIT 1"
      );
      if (fastRes.rows && fastRes.rows.length > 0) {
        if (!provider) provider = fastRes.rows[0].primary_provider;
        if (!model) model = fastRes.rows[0].primary_model;
      }
    } catch (e) {}
  }

  const isVideo = /video|fideo|فيديو|تحريك|سينمائي|animate|clip/i.test(rawPrompt);

  // If no model is configured in the Orchestrator or no API key, safely return deterministic output with Zero Model Query
  const apiKey = provider ? await getProviderKey(provider) : null;
  if (!provider || !model || !apiKey) {
    return {
      media_type: isVideo ? 'video' : 'image',
      aspect_ratio: isVideo ? '16:9' : '1:1',
      prompt: rawPrompt,
      negative_prompt: 'blurry, low resolution, deformed anatomy, extra limbs, bad eyes, text, watermark, shaky camera, low frame rate, artifacts',
      camera_motion: isVideo ? 'smooth_tracking' : 'static',
      lighting_setup: 'volumetric rim lighting',
      rendering_style: 'cinematic_film',
      seed: -1
    };
  }

  try {
    const fullPrompt = `${systemPrompt}\n\n[INPUT PROMPT TO ARCHITECT]:\n${rawPrompt}`;
    const rawResult = await callAIProvider(
      provider,
      model,
      apiKey || '',
      fullPrompt,
      systemPrompt,
      undefined,
      [],
      { temperature: 0.2 }
    );

    // Strip markdown code fences if present
    let cleaned = rawResult.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/g, '').trim();

    // Parse JSON
    let parsed: Partial<ArchitectedSceneOutput> = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Attempt to extract JSON using regex
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Scene Architect JSON response.');
      }
    }

    const isVideo = /video|fideo|فيديو|تحريك|سينمائي|animate|clip/i.test(rawPrompt);

    return {
      media_type: parsed.media_type === 'video' || isVideo ? 'video' : 'image',
      aspect_ratio: parsed.aspect_ratio || (isVideo ? '16:9' : '1:1'),
      prompt: parsed.prompt || rawPrompt,
      negative_prompt: parsed.negative_prompt || 'blurry, low resolution, deformed anatomy, extra limbs, bad eyes, text, watermark, shaky camera, low frame rate, artifacts',
      camera_motion: parsed.camera_motion || (isVideo ? 'smooth_tracking' : 'static'),
      lighting_setup: parsed.lighting_setup || 'volumetric rim lighting',
      rendering_style: parsed.rendering_style || 'cinematic_film',
      seed: typeof parsed.seed === 'number' ? parsed.seed : -1
    };
  } catch (err: any) {
    console.error('[SceneArchitectCompiler] Optimization warning:', err.message);
    const isVideo = /video|fideo|فيديو|تحريك|سينمائي|animate|clip/i.test(rawPrompt);
    return {
      media_type: isVideo ? 'video' : 'image',
      aspect_ratio: isVideo ? '16:9' : '1:1',
      prompt: `Cinematic master shot, detailed anatomy, professional lighting: ${rawPrompt}`,
      negative_prompt: 'blurry, low resolution, deformed anatomy, extra limbs, bad eyes, text, watermark, shaky camera, low frame rate, artifacts',
      camera_motion: isVideo ? 'smooth_tracking' : 'static',
      lighting_setup: 'volumetric rim lighting',
      rendering_style: 'cinematic_film',
      seed: -1
    };
  }
}
