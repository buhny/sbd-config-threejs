import * as THREE from 'three'
// import { Dimension } from '../dimensions.js'

// Pulls are used on drawers & trays.
export class Pull {
  constructor(width, om){
    this.width = width;
    this.pull = {
      handle : om.meshes.drawerHandle,
      leftCap : om.meshes.drawerHandleCap,
      rightCap : om.meshes.drawerHandleCap,
      capMat : om.materialManager.materials.handleCap
    }

    return this.createPull();
  }

  createPull(){
    const handleMesh = this.pull.handle.clone(),
          leftCap = this.pull.leftCap.clone(),
          rightCap = this.pull.rightCap.clone(),
          capMat = this.pull.capMat,
          capBB = new THREE.Box3().setFromObject( leftCap ),
          capW = Math.floor( capBB.max.x + Math.abs( capBB.min.x ) ),
          handleWoCapsWidth = this.width - capW*2,
          handleX = handleWoCapsWidth/2 + (handleWoCapsWidth * 0.01);

    let pullGrp = new THREE.Group();

    // Turn on shadows.
    leftCap.traverse(function(m){
      if ( m instanceof THREE.Mesh ){
        m.castShadow = true;
        m.receiveShadow = true;
      }
      m.material = capMat;
    })
    rightCap.traverse(function(m){
      if ( m instanceof THREE.Mesh ){
        m.castShadow = true;
        m.receiveShadow = true;
      }
      m.material = capMat;
    })
    handleMesh.traverse(function(m){
      if ( m instanceof THREE.Mesh ){
        m.castShadow = true;
        m.receiveShadow = true;
      }
    })
    // Scale to drawer width.
    handleMesh.scale.set(handleWoCapsWidth,1,1);
    handleMesh.position.setX( -handleX );
    // Position end caps.
    leftCap.position.setX( -handleX + (handleWoCapsWidth * 0.01) - 0.5 );
    rightCap.position.setX( handleX - (handleWoCapsWidth * 0.01) );
    // Add parts to the group.
    pullGrp.add(handleMesh).add(leftCap).add(rightCap);
    pullGrp.name = "pull";

    return pullGrp;
  }

}
