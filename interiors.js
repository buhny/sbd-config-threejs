import * as THREE from 'three'
// import mcm from 'vendor/shaders/MatcapMaterial.js'
// let MatcapMaterial = new mcm(THREE)
// import mm from './material-manager.js'
// let MaterialManager = new mm(THREE, MatcapMaterial);
// import om from './obj-manager.js'
// let ObjManager = new om();
import * as HELPER from './helpers.js'
import { Dimension } from './dimensions.js'
import { Drawer } from './spaces/drawers.js'
import { Tray } from './spaces/trays.js'
import { Shelf } from './spaces/shelves.js'
import { Door } from './spaces/doors.js'

// import * as HELPER from './helpers.js'

class Interiors {
  constructor(){
    this.interior = new THREE.Group();
    this.interior.name = "interior";
    this.interiorDims = Dimension.getInterior();
    this.housingDims = Dimension.getHousing();

    this.positions = [];
    // this.frontColor;
    // this.frontMaterial;
    // this.lilo = true;
    // this.drawerLatchSide = "right";

    //Store loaded mats & meshes for reuse.
    this.loaded = {};
  }

  init(props, om) {
    // console.log('INTERIOR INIT');
    this.props = props;
    this.objManager = om;

    let intColor = this.props.colorInt;
    this.objManager.materialManager.materials.metalPaintedInt.color.setHex( parseInt( intColor, 16) );

    return this.interior;
  } // END init()

  update(props){
    // console.log('INTERIOR UPDATE');
    this.props = props;
    this.positions = this.props.interiorItems;
    this.positionHeights = this.props.interiorHeights.map(function(obj) {
      return {
        points : obj.component.attributes.metricHeightMm.value, usableH : obj.component.attributes.usableMm.value
      }
    });

    // this.frontColor = parseInt(this.props.selectedDrawerColor.value, 16);
    // this.frontMaterial.color.setHex(this.frontColor);



    let ceilingH = this.housingDims.ceilingH,
        yPos = this.props.housingPoints + this.housingDims.heightDiff - ceilingH,
        spaceSettings = {
          intWidth : this.props.housingWidth - this.interiorDims.widthOffset,
          intDepth : this.props.housingDepth - this.interiorDims.depthOffset
        },
        doorSettings = {}

    // Remove all the old spaces.
    while( this.interior.children.length > 0 ) {
      let slot = this.interior.children[this.interior.children.length - 1];

      HELPER.removeAndDisposeGeom( this.interior, slot );
    }

    // Get any meshes needed.
    this.positions.forEach(function(space) {
      switch (space.component.attributes.code.value) {
        case 'drawer':
        case 'tray':
          if ( this.loaded.drawerTrayPull === undefined ) {
            this.loaded.drawerTrayPull = {
              handle : this.objManager.meshes.drawerHandle.clone(),
              leftCap : this.objManager.meshes.drawerHandleCap.clone(),
              rightCap : this.objManager.meshes.drawerHandleCap.clone(),
              capMat : this.objManager.materialManager.materials.handleCap
            }
          }
          break;
        case 'LST_FDL':
        case 'LST_FDR':
        case 'retractable':
          if ( this.loaded.doors === undefined ) {
            this.loaded.doors = {
              lockFace : this.objManager.materialManager.materials.lockFace
            }
          }
          break;
        case 'shelf':
        default:
          break;
      }
    }, this);

    // Add the new spaces back in.
    this.positions.forEach(function(space, i) {
      //console.log(space);
      spaceSettings.height = this.positionHeights[i].points - this.interiorDims.spaceGap;
      spaceSettings.usableHeight = this.positionHeights[i].usableH; //drawer basket heights
      spaceSettings.points = this.positionHeights[i].points;
      //console.log('spaceSettings: ');
      //console.log(spaceSettings);

      let spaceMesh;
      switch (space.component.attributes.code.value) {
        case 'space':
          // Do nothing, its a space.
          spaceMesh = new THREE.Mesh();
          break;
        case 'drawer':
          spaceSettings.latch = this.props.latch;
          spaceMesh = new Drawer( spaceSettings, this.objManager );
          spaceMesh.position.setY( yPos - spaceSettings.points/2 );
          break;
        case 'tray':
          // let trayMats = {
          //   front : this.frontMaterial,
          //   bottom : this.objManager.materialManager.materials.tops.stainless };
          spaceMesh = new Tray( spaceSettings, this.objManager );
          let spaceMeshBB = new THREE.Box3().setFromObject( spaceMesh ),
              spaceMeshH = spaceMeshBB.max.y + Math.abs( spaceMeshBB.min.y );
          spaceMesh.position.setY( yPos - (spaceSettings.height - Math.abs(spaceMeshBB.min.y)) );
          break;
        case 'shelf':
          spaceMesh = new Shelf(spaceSettings);
          spaceMesh.position.setY( yPos - (spaceSettings.height - 15/2) );
          break;
        case 'LST_FDR':
        case 'LST_FDL':
          doorSettings = {
            door : {
              type : "flush",
              hinge : space.component.attributes.code.value === 'LST_FDR' ? 'right' : 'left',
              // hinge : space.type.doorHingePosition.side.toLowerCase(),
              lock : "standard"
            },
            space : spaceSettings
          }
          let flushDoor = new Door( doorSettings, this.objManager );
          spaceMesh = flushDoor.flush();
          spaceMesh.position.setY( yPos - spaceSettings.points/2 );
          break;
        case 'retractable':
          doorSettings = {
            door : {
              type : "retractable",
              lock : "standard"
            },
            space : spaceSettings
          }
          let retractableDoor = new Door( doorSettings, this.objManager );
          spaceMesh = retractableDoor.retractable();
          spaceMesh.position.setY( yPos - spaceSettings.points/2 - (Dimension.getDoors().heightSpacer - 2) );
          break;
        default:
          spaceMesh = new THREE.Mesh (
            new THREE.BoxGeometry(spaceSettings.intWidth, spaceSettings.height, spaceSettings.intDepth),
            new THREE.MeshPhongMaterial( { color: 0xff0000, wireframe: false } )
          );
          break;
      }

      yPos = yPos - spaceSettings.points;
      spaceMesh.name = 'position_' + (i+1); // Use this name for the outline.
      this.interior.add(spaceMesh);
    }, this);

    // console.log(this.interior);
    this.interior.name = "interior";
    return this.interior;
  }

  changeColor(hex) {
    this.frontColor = hex;
    // this.frontMaterial.color.setHex(this.frontColor);
  }

  getCeilingH(){
    return 42; // TODO: add to data
  }

}

export let interior = new Interiors();
