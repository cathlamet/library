import { Asset, AssetType } from "./asset";

export interface ModelAssetOptions {
  assetId: number;
  payload: Uint8Array;
}

export class ModelAsset implements Asset {
  /**
   * Model
   */
  readonly type = AssetType.model;

  /**
   * Unique-but-transient numerical asset identifier
   */
  assetId: number;

  /**
   * Raw model binary payload
   */
  payload: Uint8Array;

  constructor (options: ModelAssetOptions) {
    this.assetId = options.assetId;
    this.payload = options.payload;
  }

  encodeMetadata (): Uint8Array {
    const buffer = new Uint8Array();
    return buffer;
  }

  encodePayload (): Uint8Array {
    return this.payload;
  }
}
