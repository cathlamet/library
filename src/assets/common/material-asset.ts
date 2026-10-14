import { Asset, AssetType } from "./asset";


/**
 * 6 pointers + roughness + metalness
 */
const ENCODED_METADATA_BYTE_LENGTH = 8 * 2;

export interface MaterialAssetOptions {
  assetId: number;
  albedoAssetId: number;
  normalAssetId: number;
  bumpAssetId: number;
  occlusionAssetId: number;
  roughnessAssetId: number;
  roughness: number;
  metalnessAssetId: number;
  metalness: number;
}

export class MaterialAsset implements Asset {
  /**
   * PBR material
   */
  readonly type = AssetType.material_pbr;

  /**
   * Unique-but-transient numerical asset identifier
   */
  assetId: number;

  albedoAssetId: number;
  normalAssetId: number;
  bumpAssetId: number;
  occlusionAssetId: number;
  roughnessAssetId: number;
  roughness: number;
  metalnessAssetId: number;
  metalness: number;

  constructor (options: MaterialAssetOptions) {
    this.assetId = options.assetId;
    this.albedoAssetId = options.albedoAssetId;
    this.normalAssetId = options.normalAssetId;
    this.bumpAssetId = options.bumpAssetId;
    this.occlusionAssetId = options.occlusionAssetId;
    this.roughnessAssetId = options.roughnessAssetId;
    this.roughness = options.roughness;
    this.metalnessAssetId = options.metalnessAssetId;
    this.metalness = options.metalness;
  }

  encodeMetadata (): Uint8Array {
    const encodedBuffer = new Uint8Array(ENCODED_METADATA_BYTE_LENGTH);
    const encodedView = new DataView(encodedBuffer.buffer);
    let offset = 0;

    encodedView.setUint16(offset, this.albedoAssetId, false);
    offset += 2;

    encodedView.setUint16(offset, this.normalAssetId, false);
    offset += 2;

    encodedView.setUint16(offset, this.bumpAssetId, false);
    offset += 2;

    encodedView.setUint16(offset, this.occlusionAssetId, false);
    offset += 2;

    encodedView.setUint16(offset, this.roughnessAssetId, false);
    offset += 2;

    encodedView.setFloat16(offset, this.roughness, false);
    offset += 2;

    encodedView.setUint16(offset, this.metalnessAssetId, false);
    offset += 2;

    encodedView.setFloat16(offset, this.metalness, false);
    offset += 2;

    return encodedBuffer;
  }

  encodePayload (): Uint8Array {
    return new Uint8Array();
  }

  static decode (assetId: number, metadata: Uint8Array, _payload: Uint8Array): MaterialAsset {
    const metadataView = new DataView(metadata.buffer, metadata.byteOffset, metadata.byteLength);
    let offset = 0;

    const albedoAssetId = metadataView.getUint16(offset, false);
    offset += 2;

    const normalAssetId = metadataView.getUint16(offset, false);
    offset += 2;

    const bumpAssetId = metadataView.getUint16(offset, false);
    offset += 2;

    const occlusionAssetId = metadataView.getUint16(offset, false);
    offset += 2;

    const roughnessAssetId = metadataView.getUint16(offset, false);
    offset += 2;

    const roughness = metadataView.getFloat16(offset, false);
    offset += 2;

    const metalnessAssetId = metadataView.getUint16(offset, false);
    offset += 2;

    const metalness = metadataView.getFloat16(offset, false);
    offset += 2;

    return new MaterialAsset({
      assetId,
      albedoAssetId,
      normalAssetId,
      bumpAssetId,
      occlusionAssetId,
      roughnessAssetId,
      roughness,
      metalnessAssetId,
      metalness,
    });
  }
}
