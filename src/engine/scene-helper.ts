import { Scene, Mesh, BoxGeometry, MeshBasicMaterial } from 'three/webgpu';

export class SceneHelper {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public addCube(size: number = 1, color: number = 0x00ff00): Mesh {
    const geometry = new BoxGeometry(size, size, size);
    const material = new MeshBasicMaterial({ color });
    const cube = new Mesh(geometry, material);
    this.scene.add(cube);
    return cube;
  }
}
