import * as THREE from 'three/webgpu';

/**
 * Original version created as https://github.com/manthrax/JSlug
 */

// Strong typing declarations for the Slug library payload structures
export interface CodePoint {
    codePoint: number;
    width: number;
    height: number;
    bandDimX: number;
    bandDimY: number;
    bandCount: number;
    bandsTexCoordX: number;
    bandsTexCoordY: number;
    advanceWidth: number;
    bearingX: number;
    bearingY: number;
}

export interface SlugData {
    ascender?: number;
    descender?: number;
    lineGap?: number;
    unitsPerEm: number;
    codePoints: Map<number, CodePoint>;
}

export interface TextOptions {
    fontScale?: number;
    lineHeight?: number;
    startX?: number;
    startY?: number;
    justify?: 'left' | 'center' | 'right';
}

export class SlugGeometry extends THREE.InstancedBufferGeometry {
    public maxGlyphs: number;
    public glyphCount: number;

    // Explicit Float32Array handles for fast CPU manipulation
    private aScaleBias: Float32Array;
    private aGlyphBandScale: Float32Array;
    private aBandMaxTexCoords: Float32Array;

    constructor(maxGlyphs = 1024) {
        super();

        this.maxGlyphs = maxGlyphs;
        this.glyphCount = 0;
        this.instanceCount = 0;

        // 1. Base Quad Geometry (-1 to 1 vertex bounds matched with 0 to 1 UV spaces)
        const vertices = new Float32Array([
            -1.0, -1.0,
            -1.0,  1.0,
             1.0,  1.0,
             1.0, -1.0
        ]);

        const uvs = new Float32Array([
            0.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0
        ]);

        const normals = new Float32Array([
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0
        ]);

        const indices = new Uint16Array([
            0, 2, 1,
            0, 3, 2
        ]);

        this.setIndex(new THREE.BufferAttribute(indices, 1));
        this.setAttribute('position', new THREE.BufferAttribute(vertices, 2));
        this.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        this.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

        // 2. WebGPU-Ready Instanced Attributes Configuration
        this.aScaleBias = new Float32Array(maxGlyphs * 4);
        this.aGlyphBandScale = new Float32Array(maxGlyphs * 4);
        this.aBandMaxTexCoords = new Float32Array(maxGlyphs * 4);

        const attrScaleBias = new THREE.InstancedBufferAttribute(this.aScaleBias, 4);
        attrScaleBias.setUsage(THREE.DynamicDrawUsage);
        this.setAttribute('aScaleBias', attrScaleBias);

        const attrGlyphBandScale = new THREE.InstancedBufferAttribute(this.aGlyphBandScale, 4);
        attrGlyphBandScale.setUsage(THREE.DynamicDrawUsage);
        this.setAttribute('aGlyphBandScale', attrGlyphBandScale);

        const attrBandMaxTexCoords = new THREE.InstancedBufferAttribute(this.aBandMaxTexCoords, 4);
        attrBandMaxTexCoords.setUsage(THREE.DynamicDrawUsage);
        this.setAttribute('aBandMaxTexCoords', attrBandMaxTexCoords);

        // Ensure structures are properly allocated
        this.boundingBox = new THREE.Box3();
        this.boundingSphere = new THREE.Sphere();
    }

    /**
     * Clears out existing instances resetting geometry layouts
     */
    public clear(): void {
        this.glyphCount = 0;
        this.instanceCount = 0;
        if (this.boundingBox) this.boundingBox.makeEmpty();
        if (this.boundingSphere) this.boundingSphere.radius = 0;
    }

    /**
     * Updates native bounding box to sphere mappings for clean frustum culling
     */
    public computeBoundingSphere(): void {
        if (!this.boundingBox || this.boundingBox.isEmpty()) {
            (this.boundingSphere as THREE.Sphere).set(new THREE.Vector3(), 0);
        } else {
            this.boundingBox.getBoundingSphere(this.boundingSphere as THREE.Sphere);
        }
    }

    /**
     * Appends an individual character glyph directly into array allocations
     */
    public addGlyph(
        codePointData: CodePoint,
        x: number,
        y: number,
        width: number,
        height: number,
        _displayWidth?: number,
        _displayHeight?: number
    ): boolean {
        if (this.glyphCount >= this.maxGlyphs) {
            console.warn("Max glyphs reached within Instanced Buffer limit.");
            return false;
        }

        const i = this.glyphCount;

        // Quads stretch from -1 to 1. Compute offsets and midpoint translations.
        const sx = width / 2.0;
        const sy = height / 2.0;
        const cx = x + sx;
        const cy = y + sy;

        this.aScaleBias[i * 4 + 0] = sx;
        this.aScaleBias[i * 4 + 1] = sy;
        this.aScaleBias[i * 4 + 2] = cx;
        this.aScaleBias[i * 4 + 3] = cy;

        // Dynamic multi-point tracking for spatial bounding updates
        if (this.boundingBox) {
          this.boundingBox.expandByPoint(new THREE.Vector3(cx - sx, cy - sy, 0));
          this.boundingBox.expandByPoint(new THREE.Vector3(cx + sx, cy + sy, 0));
        }

        // Packed Glyph mapping ratios
        this.aGlyphBandScale[i * 4 + 0] = codePointData.width;
        this.aGlyphBandScale[i * 4 + 1] = codePointData.height;
        this.aGlyphBandScale[i * 4 + 2] = codePointData.width / codePointData.bandDimX;
        this.aGlyphBandScale[i * 4 + 3] = codePointData.height / codePointData.bandDimY;

        // UV Coordinate Boundaries / Multi-Band Index Data
        this.aBandMaxTexCoords[i * 4 + 0] = codePointData.bandCount - 1;
        this.aBandMaxTexCoords[i * 4 + 1] = codePointData.bandCount - 1;
        this.aBandMaxTexCoords[i * 4 + 2] = codePointData.bandsTexCoordX;
        this.aBandMaxTexCoords[i * 4 + 3] = codePointData.bandsTexCoordY;

        this.glyphCount++;
        this.instanceCount = this.glyphCount;
        return true;
    }

    /**
     * Signals WebGPU pipeline backend to process data changes on next render phase
     */
    public updateBuffers(): void {
        (this.getAttribute('aScaleBias') as THREE.BufferAttribute).needsUpdate = true;
        (this.getAttribute('aGlyphBandScale') as THREE.BufferAttribute).needsUpdate = true;
        (this.getAttribute('aBandMaxTexCoords') as THREE.BufferAttribute).needsUpdate = true;

        this.computeBoundingSphere();
    }

    /**
     * Loops through string arrays to calculate position and insert text instances
     */
    public addText(text: string, slugData: SlugData, options: TextOptions = {}): void {
        const ascender = slugData.ascender ?? 0;
        const descender = slugData.descender ?? 0;
        const lineGap = slugData.lineGap ?? 0;
        const defaultLineHeight = slugData.unitsPerEm > 0 ? (ascender - descender + lineGap) : 2000;

        const {
            fontScale = 1.0,
            lineHeight = defaultLineHeight * fontScale,
            startX = 0,
            startY = 0,
            justify = 'left'
        } = options;

        const lines = text.split('\n');
        let currentY = startY;

        for (const line of lines) {
            let lineWidth = 0;
            let j = 0;

            // Pass 1: Metric measuring loop for alignment transformations
            while (j < line.length) {
                const charCode = line.codePointAt(j);
                if (charCode === undefined) break;

                j += charCode > 0xFFFF ? 2 : 1;
                const data = slugData.codePoints.get(charCode) || slugData.codePoints.get(-1);

                if (data) {
                    lineWidth += data.advanceWidth * fontScale;
                } else if (line[j - 1] === ' ') {
                    lineWidth += 600 * fontScale;
                }
            }

            let currentX = startX;
            if (justify === 'center') {
                currentX -= lineWidth / 2.0;
            } else if (justify === 'right') {
                currentX -= lineWidth;
            }

            // Pass 2: Matrix generation loop injecting layouts into underlying arrays
            let k = 0;
            while (k < line.length) {
                const charCode = line.codePointAt(k);
                if (charCode === undefined) break;

                k += charCode > 0xFFFF ? 2 : 1;
                const data = slugData.codePoints.get(charCode) || slugData.codePoints.get(-1);

                if (data) {
                    if (data.width > 0 && data.height > 0) {
                        const quadW = data.width * fontScale;
                        const quadH = data.height * fontScale;
                        const px = currentX + data.bearingX * fontScale;
                        const py = currentY + data.bearingY * fontScale;

                        this.addGlyph(data, px, py, quadW, quadH, 0, 0);
                    }
                    currentX += data.advanceWidth * fontScale;
                } else if (line[k - 1] === ' ') {
                    currentX += 600 * fontScale;
                }
            }

            currentY -= lineHeight;
        }

        this.updateBuffers();
    }
}
