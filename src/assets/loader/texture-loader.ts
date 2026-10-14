import { Cache, TextureLoader as ThreeTextureLoader } from 'three/webgpu';


export class TextureLoader {
  textureLoader: ThreeTextureLoader;

  constructor () {
    Cache.enabled = true

    this.textureLoader = new ThreeTextureLoader();
  }

  // cacheImage (url: string, path: string, blob: any): Promise<void> {
  //   return new Promise((resolve: any, reject: any) => {
  //     const objUrl = URL.createObjectURL(blob);
  //     const image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img') as HTMLImageElement;

  //     image.onload = () => {
  //       URL.revokeObjectURL(objUrl);
  //       document.body.removeChild(image);
  //       this.textureLoader.load(url, (texture) => {
  //         Cache.add(url, texture);
  //         Cache.add(path, texture);
  //         resolve();
  //       }, undefined, reject);
  //     };

  //     image.src = objUrl;
  //     image.style.display = 'none';
  //     document.body.appendChild(image);
  //   });
  // }

  // async load (url: string, item: AssetItem, _progressCallback: any): Promise<void> {
  //   if (!!Cache.get(url)) {
  //     return Promise.resolve();
  //   }

  //   return new Promise((resolve: any, reject: any) => {
  //     this.textureLoader.load(url, (texture) => {
  //       Cache.add(url, texture);
  //       Cache.add(item.path, texture);
  //       resolve();
  //     }, undefined, reject);
  //   });

  // }
}
