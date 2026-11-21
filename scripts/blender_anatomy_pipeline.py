"""
================================================================================
JARVIS — PHOTOREALISTIC BLENDER 4.x ANATOMY PIPELINE (bpy)
================================================================================
Run locally with Blender 4.0+ to convert open-source 3D anatomy assets into a
photorealistic, WebGL-ready, Draco-compressed GLB for Project Jarvis Stage 2:

  1. Z-Anatomy (.blend)             — https://github.com/Z-Anatomy/Models-of-human-anatomy
  2. BodyParts3D / Anatomography    — https://lifesciencedb.jp/bp3d/?lng=en
  3. NIH 3D (3d.nih.gov)            — https://3d.nih.gov/collections/hra
  4. TotalSegmentator CT/MRI (.stl) — https://github.com/wasserth/TotalSegmentator
  5. SMPL-X / MakeHuman (.fbx/.obj) — https://smpl-x.is.tue.mpg.de/

USAGE:
  blender --background --python scripts/blender_anatomy_pipeline.py -- \
    --input ./raw_anatomy_assets \
    --output ./public/models/human_body_photoreal.glb \
    --target-tris 85000 \
    --render-preview ./public/models/human_body_cycles_preview.png
================================================================================
"""

import argparse
import math
import os
import sys

try:
    import bpy
except ImportError:
    print("ERROR: Run this script inside Blender:")
    print("  blender --background --python scripts/blender_anatomy_pipeline.py -- --input <dir> --output <file.glb>")
    sys.exit(1)


# PBR Subsurface Scattering (SSS) material presets keyed by Jarvis anatomical layer
ORGAN_SHADER_PRESETS = {
    "body-integumentary": {"color": (0.76, 0.57, 0.48, 1.0), "roughness": 0.42, "sss": 0.35, "alpha": 0.22},
    "body-skeletal":      {"color": (0.91, 0.88, 0.81, 1.0), "roughness": 0.48, "sss": 0.12, "alpha": 1.0},
    "body-muscular":      {"color": (0.58, 0.12, 0.14, 1.0), "roughness": 0.38, "sss": 0.28, "alpha": 0.85},
    "body-nervous":       {"color": (0.89, 0.72, 0.42, 1.0), "roughness": 0.32, "sss": 0.25, "alpha": 1.0},
    "body-endocrine":     {"color": (0.68, 0.34, 0.78, 1.0), "roughness": 0.35, "sss": 0.22, "alpha": 1.0},
    "body-heart":         {"color": (0.62, 0.08, 0.10, 1.0), "roughness": 0.24, "sss": 0.35, "alpha": 1.0},
    "body-vessels":       {"color": (0.74, 0.09, 0.12, 1.0), "roughness": 0.26, "sss": 0.20, "alpha": 1.0},
    "body-lymphatic":     {"color": (0.18, 0.65, 0.45, 1.0), "roughness": 0.35, "sss": 0.22, "alpha": 1.0},
    "body-lungs":         {"color": (0.74, 0.44, 0.48, 1.0), "roughness": 0.34, "sss": 0.40, "alpha": 0.92},
    "body-liver":         {"color": (0.36, 0.11, 0.08, 1.0), "roughness": 0.22, "sss": 0.25, "alpha": 1.0},
    "body-digestive":     {"color": (0.76, 0.46, 0.36, 1.0), "roughness": 0.30, "sss": 0.32, "alpha": 1.0},
    "body-urinary":       {"color": (0.48, 0.18, 0.24, 1.0), "roughness": 0.28, "sss": 0.25, "alpha": 1.0},
    "body-reproductive":  {"color": (0.78, 0.38, 0.48, 1.0), "roughness": 0.32, "sss": 0.28, "alpha": 1.0},
}

KEYWORD_TO_LAYER = [
    ("heart", "body-heart"), ("myocard", "body-heart"), ("aorta", "body-vessels"), ("vein", "body-vessels"), ("arter", "body-vessels"),
    ("lung", "body-lungs"), ("trachea", "body-lungs"), ("bronch", "body-lungs"),
    ("brain", "body-nervous"), ("cerebr", "body-nervous"), ("cerebell", "body-nervous"), ("spinal", "body-nervous"), ("nerv", "body-nervous"),
    ("liver", "body-liver"), ("hepat", "body-liver"), ("gallbladder", "body-liver"),
    ("stomach", "body-digestive"), ("intestin", "body-digestive"), ("colon", "body-digestive"), ("esophag", "body-digestive"), ("pancrea", "body-digestive"),
    ("kidney", "body-urinary"), ("renal", "body-urinary"), ("bladder", "body-urinary"), ("ureter", "body-urinary"),
    ("spleen", "body-lymphatic"), ("thymus", "body-lymphatic"), ("lymph", "body-lymphatic"),
    ("thyroid", "body-endocrine"), ("adrenal", "body-endocrine"), ("pituitary", "body-endocrine"),
    ("bone", "body-skeletal"), ("skull", "body-skeletal"), ("rib", "body-skeletal"), ("vertebr", "body-skeletal"), ("femur", "body-skeletal"), ("pelvis", "body-skeletal"), ("skelet", "body-skeletal"),
    ("muscl", "body-muscular"), ("bicep", "body-muscular"), ("pector", "body-muscular"), ("deltoid", "body-muscular"), ("diaphragm", "body-muscular"),
    ("skin", "body-integumentary"), ("smpl", "body-integumentary"), ("makehuman", "body-integumentary"), ("body", "body-integumentary"),
]


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(description="Jarvis Photorealistic Blender Anatomy Pipeline")
    ap.add_argument("--input", required=True, help="Directory or .blend/.glb/.obj/.stl file from Z-Anatomy, BodyParts3D, NIH 3D, TotalSegmentator, or SMPL-X")
    ap.add_argument("--output", default="./public/models/human_body_photoreal.glb", help="Output Draco-compressed .glb path")
    ap.add_argument("--target-tris", type=int, default=85000, help="Target total triangle budget for 60 FPS WebGL")
    ap.add_argument("--render-preview", default="", help="Optional 4K Cycles photorealistic render PNG path")
    return ap.parse_args(argv)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def classify_layer(name: str) -> str:
    low = name.lower()
    for kw, layer in KEYWORD_TO_LAYER:
        if kw in low:
            return layer
    return "body-skeletal"


def create_sss_material(layer_id: str) -> bpy.types.Material:
    mat_name = f"JarvisPBR_{layer_id}"
    if mat_name in bpy.data.materials:
        return bpy.data.materials[mat_name]
    cfg = ORGAN_SHADER_PRESETS.get(layer_id, ORGAN_SHADER_PRESETS["body-skeletal"])
    mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = cfg["color"]
    bsdf.inputs["Roughness"].default_value = cfg["roughness"]
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = cfg["sss"]
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.25 if cfg["roughness"] < 0.35 else 0.05
    if cfg["alpha"] < 1.0:
        bsdf.inputs["Alpha"].default_value = cfg["alpha"]
        mat.blend_method = "BLEND"
    return mat


def import_assets(input_path: str):
    files = []
    if os.path.isdir(input_path):
        for root, _, fnames in os.walk(input_path):
            for fn in sorted(fnames):
                ext = os.path.splitext(fn)[1].lower()
                if ext in (".obj", ".stl", ".glb", ".gltf", ".fbx", ".blend"):
                    files.append(os.path.join(root, fn))
    elif os.path.isfile(input_path):
        files.append(input_path)

    for fp in files:
        ext = os.path.splitext(fp)[1].lower()
        print(f"[Jarvis Blender] Importing {fp}")
        if ext == ".blend":
            with bpy.data.libraries.load(fp, link=False) as (data_from, data_to):
                data_to.objects = data_from.objects
            for obj in data_to.objects:
                if obj is not None:
                    bpy.context.collection.objects.link(obj)
        elif ext == ".obj":
            bpy.ops.wm.obj_import(filepath=fp)
        elif ext == ".stl":
            bpy.ops.wm.stl_import(filepath=fp)
        elif ext in (".glb", ".gltf"):
            bpy.ops.import_scene.gltf(filepath=fp)
        elif ext == ".fbx":
            bpy.ops.import_scene.fbx(filepath=fp)


def normalize_and_shade(target_tris: int):
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    if not meshes:
        raise RuntimeError("No mesh objects imported. Verify --input path contains .blend/.obj/.stl/.glb/.fbx files.")

    # Compute combined bounding box to normalize height to ~3.4 Jarvis units centered at origin
    min_co = [1e9, 1e9, 1e9]
    max_co = [-1e9, -1e9, -1e9]
    total_polys = 0
    for obj in meshes:
        total_polys += len(obj.data.polygons)
        for v in obj.bound_box:
            w = obj.matrix_world @ bpy.mathutils.Vector(v) if hasattr(bpy, "mathutils") else obj.matrix_world @ obj.data.vertices[0].co
            for i in range(3):
                min_co[i] = min(min_co[i], w[i])
                max_co[i] = max(max_co[i], w[i])

    center = [(min_co[i] + max_co[i]) * 0.5 for i in range(3)]
    height = max(0.001, max_co[2] - min_co[2])
    scale_factor = 3.4 / height
    decimate_ratio = min(1.0, target_tris / max(1, total_polys * 2))

    for obj in meshes:
        obj.location.x = (obj.location.x - center[0]) * scale_factor
        obj.location.y = (obj.location.y - center[1]) * scale_factor
        obj.location.z = (obj.location.z - center[2]) * scale_factor
        obj.scale *= scale_factor

        layer_id = classify_layer(obj.name)
        if not obj.name.startswith(layer_id):
            obj.name = f"{layer_id}__{obj.name}"

        mat = create_sss_material(layer_id)
        obj.data.materials.clear()
        obj.data.materials.append(mat)

        # Smooth shading + optional WebGL decimation
        for poly in obj.data.polygons:
            poly.use_smooth = True
        if decimate_ratio < 0.98 and len(obj.data.polygons) > 300:
            mod = obj.modifiers.new(name="JarvisWebGLDecimate", type="DECIMATE")
            mod.ratio = max(0.08, decimate_ratio)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=mod.name)


def render_cycles_preview(preview_path: str):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 96
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.filepath = preview_path

    # Studio 3-point medical lighting
    cam_data = bpy.data.cameras.new("JarvisCam")
    cam = bpy.data.objects.new("JarvisCam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (0.0, -5.8, 0.25)
    cam.rotation_euler = (math.radians(88), 0, 0)
    scene.camera = cam

    for name, loc, energy, color in [
        ("KeyLight", (3.5, -4.0, 4.0), 420, (1.0, 0.96, 0.92)),
        ("FillLight", (-4.0, -3.0, 2.0), 180, (0.72, 0.86, 1.0)),
        ("RimLight", (0.0, 4.5, 3.0), 260, (0.45, 0.82, 1.0)),
    ]:
        ldata = bpy.data.lights.new(name=name, type="AREA")
        ldata.energy = energy
        ldata.color = color
        lobj = bpy.data.objects.new(name=name, object_data=ldata)
        lobj.location = loc
        bpy.context.collection.objects.link(lobj)

    bpy.ops.render.render(write_still=True)
    print(f"[Jarvis Blender] Cycles render saved -> {preview_path}")


def main():
    args = parse_args()
    reset_scene()
    import_assets(args.input)
    normalize_and_shade(args.target_tris)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=args.output,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_materials="EXPORT",
        export_normals=True,
    )
    print(f"[Jarvis Blender] Exported photorealistic Draco GLB -> {args.output}")

    if args.render_preview:
        render_cycles_preview(args.render_preview)


if __name__ == "__main__":
    main()
