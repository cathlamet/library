import { Color, Mesh } from "three/webgpu";

import { type Asset } from '../../assets/common/asset';
import { type FontAsset } from '../../assets/common/font-asset';
import { SlugLoader, type ParsedSlugData } from "../../assets/slug/slug-loader";
import { SlugNodeMaterial } from "../../assets/slug/slug-node-material";
import { SlugGeometry } from "../../assets/slug/slug-geometry";

export interface FontManagerCache {
  assetIdByManifestId: Map<string, number>;
  assetByAssetId: Map<number, Asset>;

  fontSluggishByAssetId: Map<number, ParsedSlugData>;
  fontMaterialByAssetId: Map<number, SlugNodeMaterial>;
}

export class FontManager {
  cache: FontManagerCache;
  loader: SlugLoader;

  constructor (cache: FontManagerCache) {
    this.cache = cache;
    this.loader = new SlugLoader();
  }

  loadSluggish (assetId: number): ParsedSlugData {
    const cachedSlug = this.cache.fontSluggishByAssetId.get(assetId);
    if (cachedSlug) {
      return cachedSlug;
    }

    const asset = this.cache.assetByAssetId.get(assetId) as FontAsset;
    if (!asset) {
      throw new Error("Unable to load sluggish asset");
    }

    const slug = this.loader.parse(asset.payload.buffer.slice(asset.payload.byteOffset, asset.payload.byteOffset + asset.payload.byteLength));
    if (!slug) {
      throw new Error("Unable to load sluggish");
    }

    this.cache.fontSluggishByAssetId.set(assetId, slug);
    return slug;
  }

  create (id: string, text: string, size: number, color: Color): any {
    const assetId = this.cache.assetIdByManifestId.get(id);
    if (!assetId) {
      throw new Error("Unable to load sluggish assetId");
    }

    const sluggish = this.loadSluggish(assetId);

    let material = this.cache.fontMaterialByAssetId.get(assetId);
    if (!material) {
      material = new SlugNodeMaterial({ curvesTexure: sluggish.curvesTex, bandsTexure: sluggish.bandsTex });
      this.cache.fontMaterialByAssetId.set(assetId, material);
    }

    const geometry = new SlugGeometry(text.length);
    geometry.addText(text, sluggish, {
        justify: 'left'
    });

    const mesh = new Mesh(geometry, material);
    mesh.userData.color = color;
    mesh.userData.opacity = 1.0;
    mesh.userData.progress = 1.0;
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.set(size / 1000, size / 1000, 1);

    return mesh;
  }
}
