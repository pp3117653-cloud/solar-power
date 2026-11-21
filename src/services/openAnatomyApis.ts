/**
 * ============================================================================
 * JARVIS — OPEN 3D ANATOMY ECOSYSTEM & LIVE SKETCHFAB DATA API v3 SERVICE
 * ============================================================================
 * Connects Project Jarvis Stage 2 to:
 *  - Sketchfab Data API v3 (live searchable downloadable CC-licensed 3D anatomy)
 *  - BodyParts3D / Anatomography (Japan DBCLS)
 *  - Z-Anatomy (Open-Source Blender 3D Atlas)
 *  - NIH 3D (3d.nih.gov Human Reference Atlas)
 *  - SMPL / SMPL-X & MakeHuman (Rigged Photorealistic Human Body)
 *  - Visible Human Project (NLM/NIH) & TotalSegmentator (CT/MRI Organ Meshes)
 *  - Open Anatomy Project & BioDigital Human Developer API
 */

export interface SketchfabAnatomyModel {
  uid: string;
  name: string;
  author: string;
  licenseLabel: string;
  thumbnailUrl: string;
  viewerUrl: string;
  embedUrl: string;
  vertexCount: number;
  faceCount: number;
  isDownloadable: boolean;
}

/**
 * Search Sketchfab's public model index without requiring a user token.
 * The panel treats an empty result as a normal offline/unavailable state.
 */
export async function searchSketchfabAnatomyModels(
  query: string,
  limit = 4,
): Promise<SketchfabAnatomyModel[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];
  const apiKey = import.meta.env.VITE_SKETCHFAB_API_KEY as string | undefined;
  if (!apiKey || (typeof navigator !== 'undefined' && !navigator.onLine)) return [];

  try {
    const params = new URLSearchParams({
      type: 'models',
      q: trimmedQuery,
      downloadable: 'true',
      count: String(Math.min(Math.max(limit, 1), 12)),
    });
    const response = await fetch(`https://api.sketchfab.com/v3/search?${params.toString()}`, {
      headers: { Authorization: `Token ${apiKey}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return [];

    const payload = (await response.json()) as {
      results?: Array<{
        uid?: string;
        name?: string;
        user?: { displayName?: string; username?: string };
        license?: { label?: string };
        thumbnails?: { images?: Array<{ url?: string }> };
        viewerUrl?: string;
        embedUrl?: string;
        vertexCount?: number;
        faceCount?: number;
        isDownloadable?: boolean;
      }>;
    };

    return (payload.results ?? []).flatMap((model) => {
      if (!model.uid || !model.name) return [];
      const thumbnailUrl = model.thumbnails?.images?.[0]?.url ?? '';
      return [{
        uid: model.uid,
        name: model.name,
        author: model.user?.displayName ?? model.user?.username ?? 'Unknown creator',
        licenseLabel: model.license?.label ?? 'License shown on Sketchfab',
        thumbnailUrl,
        viewerUrl: model.viewerUrl ?? `https://sketchfab.com/3d-models/${model.uid}`,
        embedUrl: model.embedUrl ?? `https://sketchfab.com/models/${model.uid}/embed`,
        vertexCount: model.vertexCount ?? 0,
        faceCount: model.faceCount ?? 0,
        isDownloadable: model.isDownloadable ?? false,
      } satisfies SketchfabAnatomyModel];
    });
  } catch {
    return [];
  }
}

export interface OpenAnatomySourceEntry {
  id: string;
  name: string;
  provider: string;
  formats: string;
  license: string;
  roleInJarvis: string;
  url: string;
}

export const OPEN_3D_ANATOMY_SOURCES: OpenAnatomySourceEntry[] = [
  {
    id: 'z-anatomy',
    name: 'Z-Anatomy (Blender 3D Atlas)',
    provider: 'Z-Anatomy Open Source Project',
    formats: '.blend → .glb (via Blender pipeline)',
    license: 'CC BY-SA 4.0',
    roleInJarvis: 'Complete labeled Blender 3D human anatomy atlas ready for our blender_anatomy_pipeline.py script.',
    url: 'https://github.com/Z-Anatomy/Models-of-human-anatomy',
  },
  {
    id: 'bodyparts3d',
    name: 'BodyParts3D / Anatomography',
    provider: 'DBCLS (Japan)',
    formats: '.obj / 3D polygon dictionary',
    license: 'CC BY-SA 2.1 Japan',
    roleInJarvis: 'Anatomically referenced 3D organ, bone, and muscle polygon meshes.',
    url: 'https://lifesciencedb.jp/bp3d/?lng=en',
  },
  {
    id: 'nih-3d',
    name: 'NIH 3D (Human Reference Atlas)',
    provider: 'National Institutes of Health (3d.nih.gov)',
    formats: '.glb / .stl / .obj',
    license: 'Public Domain / CC BY',
    roleInJarvis: 'Clinically reviewed 3D organs and Visible Human Project meshes downloadable directly as GLB/STL.',
    url: 'https://3d.nih.gov/collections/hra',
  },
  {
    id: 'sketchfab',
    name: 'Sketchfab Data API v3',
    provider: 'Sketchfab',
    formats: 'glTF / GLB / USDZ (CC-licensed)',
    license: 'Per-model CC license (check each)',
    roleInJarvis: 'Live real-time searchable 3D anatomy models streamed directly in the Stage 2 drawer below.',
    url: 'https://sketchfab.com/Z-Anatomy',
  },
  {
    id: 'smplx',
    name: 'SMPL / SMPL-X',
    provider: 'Max Planck Institute for Intelligent Systems',
    formats: '.fbx / .pkl / Blender add-on',
    license: 'Non-commercial / Research License',
    roleInJarvis: 'Realistic rigged body shell with articulated hands and adjustable shape/pose.',
    url: 'https://smpl-x.is.tue.mpg.de/',
  },
  {
    id: 'visible-human',
    name: 'Visible Human Project (VHP)',
    provider: 'U.S. National Library of Medicine (NIH)',
    formats: 'CT, MRI & Cryosection Slices',
    license: 'Open / NLM Public Dataset',
    roleInJarvis: 'Real human cadaver CT/MRI volumetric ground truth for anatomical organ reconstruction.',
    url: 'https://catalog.data.gov/dataset/visible-human-project',
  },
  {
    id: 'open-anatomy',
    name: 'Open Anatomy Project (TA2)',
    provider: 'Brigham & Women’s Hospital / NIH',
    formats: 'Open 3D Atlases & Terminologia Anatomica 2',
    license: 'Open Source / Free Educational',
    roleInJarvis: 'MRI/CT-derived brain, inner ear, knee, and abdomen atlases standardized to TA2 nomenclature.',
    url: 'https://www.openanatomy.org/',
  },
  {
    id: 'makehuman',
    name: 'MakeHuman / MPFB (Blender Plugin)',
    provider: 'MakeHuman Community',
    formats: 'Blender MPFB2 / .fbx / .glb',
    license: 'CC0 / Open Source',
    roleInJarvis: 'Parametric photorealistic human body shell & skin generator directly inside Blender.',
    url: 'https://static.makehumancommunity.org/',
  },
  {
    id: 'totalsegmentator',
    name: 'TotalSegmentator (CT/MRI AI)',
    provider: 'University Hospital Basel (GitHub)',
    formats: 'NIfTI / .stl / .glb (>100 organs)',
    license: 'Apache 2.0',
    roleInJarvis: 'Segments real CT & MRI scans into >100 labeled anatomical organ meshes ready for Blender.',
    url: 'https://github.com/wasserth/totalsegmentator',
  },
  {
    id: 'biodigital',
    name: 'BioDigital Human Viewer API',
    provider: 'BioDigital',
    formats: 'Web Widget & Content API (Free Tier)',
    license: 'Free Tier / Commercial API',
    roleInJarvis: 'Optional cloud-hosted interactive 3D anatomy & pathology widget integration.',
    url: 'https://developer.biodigital.com/',
  },
];
