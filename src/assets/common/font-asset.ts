import { Asset, AssetType } from "./asset";


/**
 * width[2] + style[1]
 */
const ENCODED_METADATA_BYTE_LENGTH = 2 + 1;

export enum FontAssetStyle {
  normal = 0
}

export interface FontAssetOptions {
  assetId: number;
  payload: Uint8Array;
  weight: number;
  style: FontAssetStyle;
}

export class FontAsset implements Asset {
  /**
   * Font sluggish geomtry
   */
  readonly type = AssetType.font_sluggish;

  /**
   * Unique-but-transient numerical asset identifier
   */
  assetId: number;

  /**
   * Binary font sluggish geometry data
   */
  payload: Uint8Array;

  /**
   * Font weight
   */
  weight: number;

  /**
   * Font style
   */
  style: FontAssetStyle;

  constructor (options: FontAssetOptions) {
    this.assetId = options.assetId;
    this.payload = options.payload;
    this.weight = options.weight;
    this.style = options.style;
  }

  encodeMetadata (): Uint8Array {
    const encodedBuffer = new Uint8Array(ENCODED_METADATA_BYTE_LENGTH);
    const encodedView = new DataView(encodedBuffer.buffer);
    let offset = 0;

    encodedView.setUint16(offset, this.weight, false);
    offset += 2;

    encodedView.setUint8(offset, this.style);
    offset += 1;

    return encodedBuffer;
  }

  encodePayload (): Uint8Array {
    return this.payload;
  }

  static decode (assetId: number, metadata: Uint8Array, payload: Uint8Array): FontAsset {
    const metadataView = new DataView(metadata.buffer, metadata.byteOffset, metadata.byteLength);
    let offset = 0;

    const weight = metadataView.getUint16(offset, false);
    offset += 2;

    const style = metadataView.getUint8(offset) as FontAssetStyle;
    offset += 1;

    return new FontAsset({
      assetId,
      payload,
      weight,
      style
    });
  }
}
