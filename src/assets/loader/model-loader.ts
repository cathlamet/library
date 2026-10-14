import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


export class ModelLoader {
  gltfLoader: GLTFLoader;

  constructor () {
    this.gltfLoader = new GLTFLoader();
  }

  async parse (manifestId: string, buffer: ArrayBuffer): Promise<void> {
    const model = await this.gltfLoader.parseAsync(buffer, manifestId);
    console.log(model);
  }
}

