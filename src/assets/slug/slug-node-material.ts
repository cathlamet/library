// @ts-nocheck
import { Color, Node, NodeMaterial, NormalBlending, Texture, OneMinusSrcAlphaFactor, SrcAlphaFactor, MaxEquation, CustomBlending, FrontSide } from 'three/webgpu';
import {
  vec2, vec3, vec4, uvec4, attribute, texture, positionLocal, modelViewMatrix,
  cameraProjectionMatrix, varying, uint, int, ivec2, Loop, float, Discard, If, length,
  Fn, clamp, max, min, abs, sqrt, dFdx, dFdy, textureLoad, select, smoothstep, uniform, userData,
  mix
} from 'three/tsl';

/**
 * Original version created as https://github.com/manthrax/JSlug
 */

export interface SlugNodeMaterialOptions {
  curvesTexure?: Texture;
  bandsTexure?: Texture;
}

export class SlugNodeMaterial extends NodeMaterial {
  constructor(parameters: SlugNodeMaterialOptions = {}) {
    super();

    this.transparent = true;
    this.precision = 'highp';
    this.blending = NormalBlending;
    this.side = FrontSide;
    this.alphaTest = 0.01;

    const opacityNode = userData('opacity', 'float');
    const colorUniform = userData('color', 'color');

    const aScaleBias = attribute('aScaleBias', 'vec4');
    const aGlyphBandScale = attribute('aGlyphBandScale', 'vec4');
    const aBandMaxTexCoords = attribute('aBandMaxTexCoords', 'vec4');

    const defaultTex = new Texture();
    const curvesTexNode = texture(parameters.curvesTexure ?? defaultTex);
    const bandsTexNode = texture(parameters.bandsTexure ?? defaultTex);

    const vTexCoords = varying(positionLocal.xy.mul(0.5).add(0.5), 'vTexCoords');
    const vGlyphBandScale = varying(aGlyphBandScale, 'vGlyphBandScale');
    const vBandMaxTexCoords = varying(uvec4(aBandMaxTexCoords), 'vBandMaxTexCoords');

    const vertexNode = (): Node => {
      const transformed = vec3(positionLocal.xy.mul(aScaleBias.xy).add(aScaleBias.zw), 0.0);
      return cameraProjectionMatrix.mul(modelViewMatrix).mul(vec4(transformed, 1.0));
    };

    const TraceRayCurveH = (p1, p2, p3, pixelsPerEm) => {
      const maxP = max(max(p1.x, p2.x), p3.x);
      const valid1 = maxP.mul(pixelsPerEm).greaterThanEqual(float(-0.5));

      const shift1 = select(p1.y.greaterThan(0.0), float(2.0), float(0.0));
      const shift2 = select(p2.y.greaterThan(0.0), float(4.0), float(0.0));
      const shift3 = select(p3.y.greaterThan(0.0), float(8.0), float(0.0));
      const shift = shift1.add(shift2).add(shift3);

      const code = uint(0x2E74).shiftRight(uint(shift)).bitAnd(uint(3));
      const valid2 = code.greaterThan(uint(0));

      const a = p1.sub(p2.mul(2.0)).add(p3);
      const b = p1.sub(p2);
      const c = p1.y;

      const a_y_safe = select(abs(a.y).lessThan(0.00001), float(0.00001), a.y);
      const ayr = float(1.0).div(a_y_safe);

      const discriminant = max(b.y.mul(b.y).sub(a.y.mul(c)), float(0.0));
      const d = sqrt(discriminant);

      const t1_quad = b.y.sub(d).mul(ayr);
      const t2_quad = b.y.add(d).mul(ayr);

      const b_y_safe = select(abs(b.y).lessThan(0.000001), float(0.000001), b.y);
      const t_linear = c.div(b_y_safe.mul(2.0));

      const is_linear = abs(a.y).lessThan(0.00001);
      const t1 = select(is_linear, t_linear, t1_quad);
      const t2 = select(is_linear, t_linear, t2_quad);

      const coverageNode = float(0.0).toVar();

      const has_t1 = code.bitAnd(uint(1)).greaterThan(uint(0));
      const x1 = a.x.mul(t1).sub(b.x.mul(2.0)).mul(t1).add(p1.x);
      const cov1 = clamp(x1.mul(pixelsPerEm).add(0.5), 0.0, 1.0);
      coverageNode.assign(select(has_t1, coverageNode.add(cov1), coverageNode));

      const has_t2 = code.greaterThan(uint(1));
      const x2 = a.x.mul(t2).sub(b.x.mul(2.0)).mul(t2).add(p1.x);
      const cov2 = clamp(x2.mul(pixelsPerEm).add(0.5), 0.0, 1.0);
      coverageNode.assign(select(has_t2, coverageNode.sub(cov2), coverageNode));

      return select(valid1.and(valid2), coverageNode, float(0.0));
    };

    const TraceRayBand = Fn(([bandData, pixelsPerEm, isVertical]) => {
      const coverage = float(0.0).toVar();
      const bandCount = uint(bandData.x);
      const bandStart = uint(bandData.y);

      Loop({ start: uint(0), end: bandCount }, ({ i }) => {
        const curveOffset = bandStart.add(uint(i));
        const curveU = int(curveOffset.bitAnd(uint(0xFFF)));
        const curveV = int(curveOffset.shiftRight(uint(12)));

        const curveLocTexel = textureLoad(bandsTexNode, ivec2(curveU, curveV), 0);
        const curveLoc = ivec2(int(curveLocTexel.x), int(curveLocTexel.y));

        const p12Raw = textureLoad(curvesTexNode, curveLoc, 0);
        const p3Raw = textureLoad(curvesTexNode, ivec2(curveLoc.x.add(int(1)), curveLoc.y), 0);

        const scaleXY = vGlyphBandScale.xy;
        const scaleXY4 = vec4(scaleXY, scaleXY);

        const p12 = p12Raw.div(scaleXY4).sub(vec4(vTexCoords, vTexCoords));
        const p3 = p3Raw.xy.div(scaleXY).sub(vTexCoords);

        const p1_final = select(isVertical, p12.yx, p12.xy);
        const p2_final = select(isVertical, p12.wz, p12.zw);
        const p3_final = select(isVertical, p3.yx, p3.xy);

        coverage.addAssign(TraceRayCurveH(p1_final, p2_final, p3_final, pixelsPerEm));
      });

      return coverage;
    });

    const fragmentNode = Fn(() => {
      const fdx = dFdx(vTexCoords);
      const fdy = dFdy(vTexCoords);

      const filterWidth = length(vec4(fdx, fdy)).toVar('filterWidth');
      const fw_safe = max(filterWidth, float(0.00001));
      const pixelsPerEmVal = float(1.0).div(fw_safe);
      const pixelsPerEmClamped = clamp(vec2(pixelsPerEmVal, pixelsPerEmVal), vec2(1.0, 1.0), vec2(512.0, 512.0));

      const idxX = clamp(uint(vTexCoords.x.mul(vGlyphBandScale.z)), uint(0), uint(vBandMaxTexCoords.x));
      const idxY = clamp(uint(vTexCoords.y.mul(vGlyphBandScale.w)), uint(0), uint(vBandMaxTexCoords.y));

      const hBandOffset = vBandMaxTexCoords.w.mul(uint(4096)).add(vBandMaxTexCoords.z).add(idxY);
      const hU = int(hBandOffset.bitAnd(uint(0xFFF)));
      const hV = int(hBandOffset.shiftRight(uint(12)));
      const hBandData = uvec4(textureLoad(bandsTexNode, ivec2(hU, hV), 0)).xy;

      const vBandOffset = vBandMaxTexCoords.w.mul(uint(4096)).add(vBandMaxTexCoords.z).add(vBandMaxTexCoords.y).add(uint(1)).add(idxX);
      const vU = int(vBandOffset.bitAnd(uint(0xFFF)));
      const vV = int(vBandOffset.shiftRight(uint(12)));
      const vBandData = uvec4(textureLoad(bandsTexNode, ivec2(vU, vV), 0)).xy;

      const coverageX = TraceRayBand(hBandData, pixelsPerEmClamped.x, false);
      const coverageY = TraceRayBand(vBandData, pixelsPerEmClamped.y, true);

      const alphaX = min(abs(coverageX), float(1.0));
      const alphaY = min(abs(coverageY), float(1.0));
      const slugAlpha = alphaX.add(alphaY).mul(0.5);
      const finalAlpha = slugAlpha.mul(opacityNode);

      If(finalAlpha.lessThan(float(0.01)), () => { Discard(); });
      return vec4(colorUniform, finalAlpha);
    });

    this.vertexNode = vertexNode();
    this.fragmentNode = fragmentNode();
  }
}
