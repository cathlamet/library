import { KTX2Loader } from "three/examples/jsm/Addons.js";

import { type Asset } from '../../assets/common/asset';
import { TextureCompressedLayerAsset } from "../../assets/common/texture-compressed-layer-asset";
import { TextureCompressedAsset } from "../../assets/common/texture-compressed-asset";
import { CompressedArrayTexture, CompressedTexture } from "three";


export interface TextureManagerCache {
  assetIdByManifestId: Map<string, number>;
  assetByAssetId: Map<number, Asset>;

}

export class TextureManager {
  cache: TextureManagerCache;
  loader: KTX2Loader;

  constructor (cache: TextureManagerCache) {
    this.cache = cache;
    this.loader = new KTX2Loader();
    this.loader.setTranscoderPath('/basis/');
  }


  async create (id: string): Promise<CompressedTexture | CompressedArrayTexture> {
    const assetId = this.cache.assetIdByManifestId.get(id);
    if (!assetId) {
      throw new Error("Unable to load texture assetId");
    }

    const asset = this.cache.assetByAssetId.get(assetId);

    let textureAsset = undefined;
    if (asset instanceof TextureCompressedLayerAsset) {
      textureAsset = this.cache.assetByAssetId.get(asset.textureAssetId) as TextureCompressedAsset;
    }
    else if (asset instanceof TextureCompressedAsset) {
      textureAsset = asset;
    }

    if (!textureAsset) {
      throw new Error("Unable to load texture asset");
    }

    return new Promise((resolve, reject) => {
      try {
        const textureBuffer = textureAsset.payload.buffer.slice(
          textureAsset.payload.byteOffset,
          textureAsset.payload.byteOffset + textureAsset.payload.byteLength
        ) as ArrayBuffer;
        this.loader.parse(textureBuffer, (tex) => resolve(tex));
      }
      catch (err) {
        reject(err);
      }
    });
  }
}
