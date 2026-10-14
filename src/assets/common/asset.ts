
export enum AssetType {
  font = 30,
  font_sluggish = 31,
  material_pbr = 40,
  model = 50,
  pack = 1,
  texture = 20,
  texture_compressed = 21,
  texture_compressed_layer = 22,
}

export interface Asset {
  /**
   * Unique-but-transient numerical asset identifier
   */
  assetId: number;

  /**
   * Type of asset (for serialization)
   */
  type: AssetType;

  /**
   * Encode asset metadata into raw binary buffer
   */
  encodeMetadata (): Uint8Array;

  /**
   * Encode asset payload into raw binary buffer
   */
  encodePayload (): Uint8Array;
}
