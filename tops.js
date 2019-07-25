import * as THREE from 'three'
import * as HELPER from './helpers.js'
import { Dimension } from './dimensions.js'
import { Housing } from './housing.js'

class Tops {
  constructor(){
    // this.topMesh = new THREE.Object3D;
    this.top = Dimension.getTops();
  }

  init( props, mm ) {
    this.props = props;
    this.materials = mm;
    this.top.code = this.props.top.code.value;
    this.top.height = this.props.top.metricHeightMm.value;
    this.housingH = this.props.housingPoints + Dimension.getHousing().heightDiff;

    // Create each top depending on style.
    switch (this.top.code) {
      case 'none':
        this.top.mesh = undefined;
        this.top.yOffset = 0;
        break;
      case 'bct':
      case 'pct':
      case 'rct':
      case 'ssct':
      case 'lt':
        this.top.mesh = this.createFlushTop();
        break;
      case 'rt':
        this.top.mesh = this.createRetainerTop();
        break;
      case 'missing':
        this.top.mesh = this.createMatTop();
        break;
      case 'ssc':
        this.top.mesh = this.createStainlessCover();
        break;
      default:
        break;
    }

    if (this.top.mesh !== undefined) {
      this.top.mesh.name = "top";
      this.top.mesh.castShadow = true;
    }

    return this.top.mesh;
  } // END init()

  getYOffset(){
    switch (this.top.code) {
      case 'bct':
      case 'pct':
      case 'rct':
      case 'ssct':
      case 'lt':
      case 'rt':
      case 'missing':
        this.top.yOffset = this.top.height/2;
        break;
      case 'ssc':
        let height = this.getCoverH();
        this.top.mesh = this.top.height/2 - height/2;;
        break;
      default:
        break;
    }

    return this.top.yOffset;
  }

  createFlushTop(){
    let geom = new THREE.BoxBufferGeometry( this.props.housingWidth, this.top.height, this.props.housingDepth ),
        material,
        flushTopMesh;

    switch (this.top.code) {
      case 'bct':
        material = this.materials.tops.wood;
        break;
      case 'pct':
        material = this.materials.tops.plastic;
        break;
      case 'rct':
        material = this.materials.tops.resin;
        break;
      case 'ssct':
        material = this.materials.tops.stainless;
        break;
      case 'lt':
        material = this.materials.tops.lista;
        break;
      default:
        break;
    }

    flushTopMesh = new THREE.Mesh( geom, material);
    flushTopMesh.position.setY( this.housingH + this.getYOffset() );

    return flushTopMesh;
  }

  getCoverH() {
    return this.top.height + Dimension.getHousing().ceilingH;
  }

  createStainlessCover() {
    let height = this.getCoverH(),
        width = this.props.housingWidth + this.top.height*2,
        depth = this.props.housingDepth + this.top.height*2,
        geom = new THREE.BoxBufferGeometry( width, height, depth ),
        material = this.materials.tops.stainless,
        stainlessCoverMesh = new THREE.Mesh( geom, material);

    this.top.yOffset = this.top.height/2 - height/2;
    stainlessCoverMesh.position.setY(this.housingH + this.top.yOffset);

    // Move badges to sit on cover.
    Housing.positionBadges( this.top.code, this.top.height );

    return stainlessCoverMesh;
  }

  createMatTop() {
    let height = this.top.code === 'missing' ? this.top.height : this.top.mat.height,
        width = this.props.housingWidth - this.top.mat.inset,
        depth = this.props.housingDepth - this.top.mat.inset,
        geom = new THREE.BoxBufferGeometry( width, height, depth ),
        material = this.materials.tops.rubber,
        matTopMesh = new THREE.Mesh( geom, material);

    matTopMesh.position.setY( this.housingH + this.getYOffset() );

    return matTopMesh;
  }

  createRetainerTop() {
    let thickness = this.top.retainer.wallT,
        sideGeom = new THREE.BoxGeometry( this.props.housingDepth, this.top.height,thickness ),
        backGeom = new THREE.BoxGeometry( this.props.housingWidth, this.top.height,thickness ),
        rightMesh = new THREE.Mesh( sideGeom ),
        leftMesh = new THREE.Mesh( sideGeom ),
        backMesh = new THREE.Mesh( backGeom ),
        meshes = [],
        mergedWallsMesh,
        mat = this.createMatTop(),
        retainerTop = new THREE.Object3D();

    leftMesh.rotation.y = -(Math.PI / 2);
    rightMesh.rotation.y = Math.PI / 2;
    backMesh.position.set(0, 0, -this.props.housingDepth/2 + thickness/2);
    leftMesh.position.set(-this.props.housingWidth/2 + thickness/2, 0, 0);
    rightMesh.position.set(this.props.housingWidth/2 - thickness/2, 0, 0);
    meshes.push( backMesh, leftMesh, rightMesh);

    mergedWallsMesh = new THREE.Mesh( HELPER.mergeMeshes(meshes), this.materials.metalPaintedExt );
    mergedWallsMesh.name = "retainerWalls";

    mat.name = "retainerMat";
    mat.position.setY(-this.top.yOffset + mat.geometry.parameters.height/2);

    retainerTop.name = "retainerGrp";
    retainerTop.add( mergedWallsMesh ).add( mat );

    retainerTop.position.setY( this.housingH + this.getYOffset() );

    return retainerTop;
  }

}

export let Top = new Tops();
