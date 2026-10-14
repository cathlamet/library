import type { Quaternion, Vector3 } from "@dimforge/rapier3d-compat";

export class MathUtils {

  static rotate (quaternion: Quaternion, source: Vector3, target: Vector3): void {
    const ix = quaternion.w * source.x + quaternion.y * source.z - quaternion.z * source.y;
    const iy = quaternion.w * source.y + quaternion.z * source.x - quaternion.x * source.z;
    const iz = quaternion.w * source.z + quaternion.x * source.y - quaternion.y * source.x;
    const iw = -quaternion.x * source.x - quaternion.y * source.y - quaternion.z * source.z;

    target.x = ix * quaternion.w + iw * -quaternion.x + iy * -quaternion.z - iz * -quaternion.y;
    target.y = iy * quaternion.w + iw * -quaternion.y + iz * -quaternion.x - ix * -quaternion.z;
    target.z = iz * quaternion.w + iw * -quaternion.z + ix * -quaternion.y - iy * -quaternion.x;
  }

}
