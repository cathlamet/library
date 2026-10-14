import { Asset, AssetType } from "./asset";


/**
 * width[2] + height[2] + depth[1]
 */
const ENCODED_METADATA_BYTE_LENGTH = 2 + 2 + 1;

export enum TextureAssetDepth {
  float = 3,
  ushort = 2,
  uchar = 1,
}

export interface TextureAssetOptions {
  assetId: number;
  payload: Float32Array | Uint16Array | Uint8Array;
  width: number;
  height: number;
}

export class TextureAsset implements Asset {
  /**
   * Basis compressed texture into KTX2
   */
  readonly type = AssetType.texture;

  /**
   * Unique-but-transient numerical asset identifier
   */
  assetId: number;

  /**
   * Raw texture binary payload
   */
  payload: Float32Array | Uint16Array | Uint8Array;

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

  constructor (options: TextureAssetOptions) {
    this.assetId = options.assetId;
    this.payload = options.payload;
    this.width = options.width;
    this.height = options.height;
    this.depth = this.payload instanceof Float32Array ? TextureAssetDepth.float : this.payload instanceof Uint16Array ? TextureAssetDepth.ushort : TextureAssetDepth.uchar;
  }

  encodeMetadata (): Uint8Array {
    const encodedBuffer = new Uint8Array(ENCODED_METADATA_BYTE_LENGTH);
    const encodedView = new DataView(encodedBuffer.buffer);
    let offset = 0;

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
}
