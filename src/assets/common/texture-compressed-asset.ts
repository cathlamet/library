import { Asset, AssetType } from "./asset";
import { TextureAssetDepth } from "./texture-asset";


/**
 * layerCount[1] + count * layerAssetIds[2] + width[2] + height[2] + depth[1]
 */
const ENCODED_METADATA_BYTE_LENGTH = 1 + 2 + 2 + 1;

export interface TextureCompressedAssetOptions {
  assetId: number;
  payload: Float32Array | Uint16Array | Uint8Array;
  layerAssetIds: number[];
  width: number;
  height: number;
}

export class TextureCompressedAsset implements Asset {
  /**
   * Basis compressed KTX2 texture
   */
  readonly type = AssetType.texture_compressed;

  /**
   * Unique-but-transient numerical asset identifier
   */
  assetId: number;

  /**
   * Raw texture binary payload
   */
  payload: Float32Array | Uint16Array | Uint8Array;

  /**
   * Asset ID of layers of texture
   */
  layerAssetIds: number[];

  /**
   *
   */
  width: number;

  /**
   *
   */
  height: number;

  /**
   *
   */
  depth: TextureAssetDepth;

  constructor (options: TextureCompressedAssetOptions) {
    this.assetId = options.assetId;
    this.payload = options.payload;
    this.layerAssetIds = options.layerAssetIds;
    this.width = options.width;
    this.height = options.height;
    this.depth = this.payload instanceof Float32Array ? TextureAssetDepth.float : this.payload instanceof Uint16Array ? TextureAssetDepth.ushort : TextureAssetDepth.uchar;
  }

  encodeMetadata (): Uint8Array {
    const encodedBuffer = new Uint8Array(ENCODED_METADATA_BYTE_LENGTH + this.layerAssetIds.length * 2);
    const encodedView = new DataView(encodedBuffer.buffer);
    let offset = 0;

    encodedView.setUint8(offset, this.layerAssetIds.length);
    offset += 1;

    for (const layerAssetId of this.layerAssetIds) {
      encodedView.setUint16(offset, layerAssetId, false);
      offset += 2;
    }

    encodedView.setUint16(offset, this.width, false);
    offset += 2;

    encodedView.setUint16(offset, this.height, false);
    offset += 2;

    encodedView.setUint8(offset, this.depth);
    offset += 1;

    return encodedBuffer;
  }

  encodePayload (): Uint8Array {
    return new Uint8Array(this.payload.buffer, this.payload.byteOffset, this.payload.byteLength);
  }

  static decode (assetId: number, metadata: Uint8Array, rawPayload: Uint8Array): TextureCompressedAsset {
    const metadataView = new DataView(metadata.buffer, metadata.byteOffset, metadata.byteLength);
    let offset = 0;

    const layerCount = metadataView.getUint8(offset);
    offset += 1;

    const layerAssetIds = [];
    for (let index = 0; index < layerCount; index++) {
      layerAssetIds.push(metadataView.getUint16(offset, false));
      offset += 2;
    }

    const width = metadataView.getUint16(offset, false);
    offset += 2;

    const height = metadataView.getUint16(offset, false);
    offset += 2;

    const depth = metadataView.getUint8(offset) as TextureAssetDepth;
    offset += 1;

    let payload: Float32Array | Uint16Array | Uint8Array = rawPayload;
    if (depth === TextureAssetDepth.float) {
      payload = new Float32Array(rawPayload.buffer, rawPayload.byteOffset, rawPayload.byteLength / Float32Array.BYTES_PER_ELEMENT);
    }
    else if (depth === TextureAssetDepth.ushort) {
      payload = new Uint16Array(rawPayload.buffer, rawPayload.byteOffset, rawPayload.byteLength / Uint16Array.BYTES_PER_ELEMENT);
    }

    return new TextureCompressedAsset({
      assetId,
      payload,
      layerAssetIds,
      width,
      height,
    });
  }
}
