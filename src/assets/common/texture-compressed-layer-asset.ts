import { Asset, AssetType } from "./asset";


/**
 * textureAssetId[2] + textureLayer[1]
 */
const ENCODED_METADATA_BYTE_LENGTH = 2 + 1;

export interface TextureCompressedLayerOptions {
  assetId: number;
  textureAssetId: number;
  textureLayer: number;
}

export class TextureCompressedLayerAsset implements Asset {
  /**
   * Single layer of a basis compressed KTX2 texture
   */
  readonly type = AssetType.texture_compressed_layer;

  /**
   * Unique-but-transient numerical asset identifier
   */
  assetId: number;

  /**
   * Parent texture asset ID containing this layer
   */
  textureAssetId: number;

  /**
   * Layer within parent texture
   */
  textureLayer: number;

  constructor (options: TextureCompressedLayerOptions) {
    this.assetId = options.assetId;
    this.textureAssetId = options.textureAssetId;
    this.textureLayer = options.textureLayer;
  }

  encodeMetadata (): Uint8Array {
    const encodedBuffer = new Uint8Array(ENCODED_METADATA_BYTE_LENGTH);
    const encodedView = new DataView(encodedBuffer.buffer);
    let offset = 0;

    encodedView.setUint16(offset, this.textureAssetId, false);
    offset += 2;

    encodedView.setUint8(offset, this.textureLayer);
    offset += 1;

    return encodedBuffer;
  }

  encodePayload (): Uint8Array {
    return new Uint8Array(0);
  }

  static decode (assetId: number, metadata: Uint8Array, _payload: Uint8Array): TextureCompressedLayerAsset {
    const metadataView = new DataView(metadata.buffer, metadata.byteOffset, metadata.byteLength);
    let offset = 0;

    const textureAssetId = metadataView.getUint16(offset, false);
    offset += 2;

    const textureLayer = metadataView.getUint8(offset);
    offset += 1;

    return new TextureCompressedLayerAsset({
      assetId,
      textureAssetId,
      textureLayer,
    });
  }
}
