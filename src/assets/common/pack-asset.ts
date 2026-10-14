import { Asset, AssetType } from "./asset";


export const PACK_MAGIC_NUMBER = 0x43415448; // CATH - Cathlamet Asset Pack
export const PACK_SCHEMA_VERSION = 1;

export class AssetRecord {
  assetId: number;
  type: AssetType;

  offsetMetadata: number = 0;
  sizeMetadata: number = 0;

  offsetPayload: number = 0;
  sizePayload: number = 0;

  static byteLength (): number {
    return 2   // assetId
      + 1      // type
      + 4 + 4  // metadata (offset + size)
      + 4 + 4; // payload (offset + size)
  }

  constructor (assetId: number, type: AssetType) {
    this.assetId = assetId;
    this.type = type;
  }
}

export interface PackAssetOptions {
  assetId: number;
  assetIds: number[];
}

export class PackAsset implements Asset {
  /**
   * Pack of assets
   */
  readonly type = AssetType.pack;

  /**
   * Unique-but-transient numerical asset identifier
   */
  assetId: number;

  /**
   * Assets within this pack
   */
  assetIds: number[];

  constructor (options: PackAssetOptions) {
    this.assetId = options.assetId;
    this.assetIds = options.assetIds;
  }

  encodeMetadata (): Uint8Array {
    const buffer = new Uint8Array();
    return buffer;
  }

  encodePayload (): Uint8Array {
    const buffer = new Uint8Array();
    return buffer;
  }
}
