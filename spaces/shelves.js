import * as THREE from 'three'
import * as HELPER from '../helpers.js'

export class Shelf {
  constructor(space){
    this.height = space.height;  // currently unused
    this.shelfH = 13;
    this.shelfBackH = 55;
    this.shelfBackT = 2;
    this.shelfDOffset = 14;
    this.intWidth = space.intWidth + 28;
    // this.intDepth = space.intDepth + 14;
    this.intDepth = space.intDepth;
    this.matGray = new THREE.MeshPhongMaterial();
    this.matGray.color.setHex(0xC0C0C0);

    return this.createShelf();
  }

  createShelf() {
    let meshes = [],
        shelfBaseGeom = new THREE.BoxGeometry(this.intWidth, this.shelfH, this.intDepth),
        shelfBackGeom = new THREE.BoxGeometry(this.intWidth, this.shelfBackH, this.shelfBackT),
        shelfBase = new THREE.Mesh( shelfBaseGeom ),
        shelfBack = new THREE.Mesh( shelfBackGeom );

    shelfBack.position.set(0, this.shelfBackH/2, -(this.intDepth/2 - this.shelfBackT/2));

    meshes.push(shelfBase);
    meshes.push(shelfBack);

    let shelfMesh = new THREE.Mesh( HELPER.mergeMeshes( meshes ), this.matGray );
    shelfMesh.position.setZ( -this.shelfDOffset );
    shelfMesh.castShadow = true;
    shelfMesh.receiveShadow = true;
    shelfMesh.name = 'shelf';

    return shelfMesh;
  }

}
