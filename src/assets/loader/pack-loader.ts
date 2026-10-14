import { Cache, FileLoader } from 'three/webgpu';

import { AssetRecord, PACK_MAGIC_NUMBER, PACK_SCHEMA_VERSION } from '../common/pack-asset';
import { Asset, AssetType } from '../common/asset';
import { FontAsset } from '../common/font-asset';
import { TextureCompressedLayerAsset } from '../common/texture-compressed-layer-asset';
import { TextureCompressedAsset } from '../common/texture-compressed-asset';
import { MaterialAsset } from '../common/material-asset';


export interface DecodedPack {
  assetIdByManifestId: Map<string, number>;
  assetByAssetId: Map<number, Asset>;
}

function unpackBundle (buffer: Uint8Array): DecodedPack | undefined {
  const decoder = new TextDecoder();
  const bufferView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let offset = 0;

  const magic = bufferView.getUint32(offset, false);
  if (magic !== PACK_MAGIC_NUMBER) {
    console.error(`Invalid magic number: Expected ${PACK_MAGIC_NUMBER}, got ${magic}`);
    return undefined;
  }
  offset += 4;

  const version = bufferView.getUint8(offset);
  if (version !== PACK_SCHEMA_VERSION) {
    console.error(`Schema version mismatch: Expected ${PACK_SCHEMA_VERSION}, got ${version}`);
    return undefined;
  }
  offset += 1;

  const assetCount = bufferView.getUint16(offset, false);
  offset += 2;

  const assetRecords: AssetRecord[] = [];
  for (let i = 0; i < assetCount; i++) {
    const assetId = bufferView.getUint16(offset, false);
    offset += 2;
    const type = bufferView.getUint8(offset);
    offset += 1;

    const record = new AssetRecord(assetId, type);

    record.offsetMetadata = bufferView.getUint32(offset, false);
    offset += 4;
    record.sizeMetadata = bufferView.getUint32(offset, false);
    offset += 4;

    record.offsetPayload = bufferView.getUint32(offset, false);
    offset += 4;
    record.sizePayload = bufferView.getUint32(offset, false);
    offset += 4;

    assetRecords.push(record);
  }

  const manifestIdCount = bufferView.getUint16(offset, false);
  offset += 2;

  const assetIdByManifestId = new Map<string, number>();
  for (let i = 0; i < manifestIdCount; i++) {
    const assetId = bufferView.getUint16(offset, false);
    offset += 2;

    const manifestIdLength = bufferView.getUint16(offset, false);
    offset += 2;

    const stringBuffer = buffer.subarray(offset, offset + manifestIdLength);
    offset += manifestIdLength;

    assetIdByManifestId.set(decoder.decode(stringBuffer), assetId);
  }

  const assetByAssetId: Map<number, Asset> = new Map();
  for (const record of assetRecords) {
    const metadata = record.sizeMetadata > 0 ? buffer.subarray(record.offsetMetadata, record.offsetMetadata + record.sizeMetadata) : new Uint8Array(0);
    const payload = record.sizePayload > 0 ? buffer.subarray(record.offsetPayload, record.offsetPayload + record.sizePayload) : new Uint8Array(0);

    if (record.type == AssetType.font_sluggish) {
      assetByAssetId.set(record.assetId, FontAsset.decode(record.assetId, metadata, payload));
    }
    else if (record.type == AssetType.material_pbr) {
      assetByAssetId.set(record.assetId, MaterialAsset.decode(record.assetId, metadata, payload));
    }
    else if (record.type == AssetType.model) {

    }
    else if (record.type == AssetType.texture_compressed) {
      assetByAssetId.set(record.assetId, TextureCompressedAsset.decode(record.assetId, metadata, payload));
    }
    else if (record.type == AssetType.texture_compressed_layer) {
      assetByAssetId.set(record.assetId, TextureCompressedLayerAsset.decode(record.assetId, metadata, payload));
    }
  }

  return {
    assetIdByManifestId,
    assetByAssetId,
  };
}

export class PackLoader {
  fileLoader: FileLoader;

  constructor () {
    Cache.enabled = true

    this.fileLoader = new FileLoader();
    this.fileLoader.setResponseType('arraybuffer');
  }

  async load (url: string, onProgress: (event: ProgressEvent) => void): Promise<DecodedPack | undefined> {
    const cached = Cache.get(url);
    if (!!cached) {
      return cached;
    }

    const compressedBuffer = await this.fileLoader.loadAsync(url, onProgress) as ArrayBuffer;
    const responseStream = new Response(compressedBuffer).body;
    if (responseStream) {
      const decompressedStream = responseStream.pipeThrough(new DecompressionStream('gzip'));
      const buffer = await new Response(decompressedStream).arrayBuffer();
      const bundle = unpackBundle(new Uint8Array(buffer));
      Cache.add(url, bundle);
      return bundle;
    }
    return undefined;
  }
}
