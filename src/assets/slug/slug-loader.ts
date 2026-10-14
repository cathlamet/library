import * as THREE from 'three/webgpu';
import { CodePoint } from './slug-geometry';

/**
 * Original version created as https://github.com/manthrax/JSlug
 */

const TEXTURE_WIDTH = 4096; // FIXME: TODO: remove or make configuration
const SLUGGISH_HEADER_TOKEN = "SLUGGISH";

/**
 * Parsed payload containing character layout metrics and generated DataTextures
 * suitable for GPU binding inside shaders.
 */
export interface ParsedSlugData {
    codePoints: Map<number, CodePoint>;
    curvesTex: THREE.DataTexture;
    bandsTex: THREE.DataTexture;
    ascender: number;
    descender: number;
    lineGap: number;
    unitsPerEm: number;
}

/**
 * Handles binary extraction and decoding of font resolution glyph data,
 * producing WebGPU-ready integer and floating point DataTextures.
 */
export class SlugLoader {
    public manager: THREE.LoadingManager;

    constructor(manager?: THREE.LoadingManager) {
        this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
    }

    /**
     * Asynchronously loads a slug binary asset from a remote or local URI.
     */
    public load(
        url: string,
        onLoad: (data: ParsedSlugData) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: unknown) => void
    ): void {
        const loader = new THREE.FileLoader(this.manager);
        loader.setResponseType('arraybuffer');

        loader.load(
            url,
            (buffer: string | ArrayBuffer) => {
                try {
                    if (typeof buffer === 'string') {
                        throw new Error('Loader returned invalid text data instead of an ArrayBuffer.');
                    }
                    onLoad(this.parse(buffer));
                } catch (e) {
                    if (onError) {
                        onError(e as Error);
                    } else {
                        console.error(e);
                    }
                }
            },
            onProgress,
            onError as (event: unknown) => void
        );
    }

    /**
     * Parses the binary payload buffer directly into data structures and WebGPU compatible textures.
     */
    public parse(buffer: ArrayBufferLike): ParsedSlugData {
        const dataView = new DataView(buffer);
        let offset = 0;

        // Verify File Header Identifier Magic Bytes
        const headerBytes = new Uint8Array(buffer, offset, 8);
        let headerStr = '';
        for (let i = 0; i < 8; i++) {
            headerStr += String.fromCharCode(headerBytes[i]);
        }

        if (headerStr !== SLUGGISH_HEADER_TOKEN) {
            throw new Error(`Invalid header found (${headerStr} instead of ${SLUGGISH_HEADER_TOKEN})`);
        }
        offset += 8;

        // Extract glyph map elements count
        const codePointCount = dataView.getUint16(offset, true);
        offset += 2;

        const codePoints = new Map<number, CodePoint>();
        for (let i = 0; i < codePointCount; i++) {
            const cp: CodePoint = {
                codePoint: dataView.getUint32(offset, true),
                width: dataView.getUint32(offset + 4, true),
                height: dataView.getUint32(offset + 8, true),
                advanceWidth: dataView.getUint32(offset + 12, true),
                bearingX: dataView.getInt32(offset + 16, true),
                bearingY: dataView.getInt32(offset + 20, true),
                bandCount: dataView.getUint32(offset + 24, true),
                bandDimX: dataView.getUint32(offset + 28, true),
                bandDimY: dataView.getUint32(offset + 32, true),
                bandsTexCoordX: dataView.getUint16(offset + 36, true),
                bandsTexCoordY: dataView.getUint16(offset + 38, true),
            };
            codePoints.set(cp.codePoint, cp);
            offset += 40;
        }

        // Curves Texture Configuration
        const curvesTexWidth = dataView.getUint16(offset, true);
        offset += 2;
        const curvesTexHeight = dataView.getUint16(offset, true);
        offset += 2;
        const curvesTexBytes = dataView.getUint32(offset, true);
        offset += 4;

        if (curvesTexWidth === 0 || curvesTexHeight === 0 || curvesTexBytes === 0 || curvesTexWidth !== TEXTURE_WIDTH) {
            throw new Error("Invalid curves texture dimensions");
        }

        const curvesTexels = curvesTexWidth * curvesTexHeight;
        const curvesData = new Float32Array(curvesTexels * 4); // RGBA32F layout representation
        const curvesBuffer = buffer.slice(offset, offset + curvesTexBytes);
        const incomingCurvesData = new Float32Array(curvesBuffer);
        curvesData.set(incomingCurvesData);
        offset += curvesTexBytes;

        // Bands Texture Configuration
        const bandsTexWidth = dataView.getUint16(offset, true);
        offset += 2;
        const bandsTexHeight = dataView.getUint16(offset, true);
        offset += 2;
        const bandsTexBytes = dataView.getUint32(offset, true);
        offset += 4;

        if (bandsTexWidth === 0 || bandsTexHeight === 0 || bandsTexBytes === 0 || bandsTexWidth !== TEXTURE_WIDTH) {
            throw new Error("Invalid bands texture dimensions");
        }

        const bandsTexels = bandsTexWidth * bandsTexHeight;
        const bandsData = new Uint32Array(bandsTexels * 2); // RG32UI layout representation
        const bandsBuffer = buffer.slice(offset, offset + bandsTexBytes);
        const incomingBandsData = new Uint32Array(bandsBuffer);
        bandsData.set(incomingBandsData);
        offset += bandsTexBytes;

        // Global font metrics recovery
        let ascender = 0, descender = 0, lineGap = 0, unitsPerEm = 0;
        if (offset + 16 <= buffer.byteLength) {
            ascender = dataView.getInt32(offset, true);
            offset += 4;
            descender = dataView.getInt32(offset, true);
            offset += 4;
            lineGap = dataView.getInt32(offset, true);
            offset += 4;
            unitsPerEm = dataView.getInt32(offset, true);
            offset += 4;
        }

        // Instantiate DataTextures with exact formats matching modern WebGPU expectations.
        // For Float32 textures, RGBAFormat + FloatType maps directly to WebGPU 'rgba32float'
        const curvesTex = new THREE.DataTexture(curvesData, curvesTexWidth, curvesTexHeight, THREE.RGBAFormat, THREE.FloatType);
        curvesTex.minFilter = THREE.NearestFilter;
        curvesTex.magFilter = THREE.NearestFilter;
        curvesTex.generateMipmaps = false;
        curvesTex.needsUpdate = true;

        // For Unsigned Integer textures, RGIntegerFormat + UnsignedIntType maps directly to WebGPU 'rg32uint'
        const bandsTex = new THREE.DataTexture(bandsData, bandsTexWidth, bandsTexHeight, THREE.RGIntegerFormat, THREE.UnsignedIntType);
        bandsTex.minFilter = THREE.NearestFilter;
        bandsTex.magFilter = THREE.NearestFilter;
        bandsTex.generateMipmaps = false;
        bandsTex.needsUpdate = true;

        return {
            codePoints,
            curvesTex,
            bandsTex,
            ascender,
            descender,
            lineGap,
            unitsPerEm
        };
    }
}
