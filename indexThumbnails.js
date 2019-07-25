import { connect } from 'react-redux';
import React, { Component } from 'react';
import styles from "../configurator.scss";
import * as THREE from 'three';
window.THREE = global.THREE = THREE;
import Configurations from 'modules/Configurations'

import mcm from 'vendor/shaders/MatcapMaterial.js'
var MatcapMaterial = new mcm(THREE)

import mm from './material-manager.js'
var MaterialManager = new mm(THREE, MatcapMaterial);

import om from './obj-manager.js'
var ObjManager = new om();

import * as HELPER from './helpers.js';
import * as toolBoxHelper from 'Src/helpers';
import { Dimension } from './dimensions.js'
import { lights } from './lights.js'
import { Housing } from './housing.js'
import { Top } from './tops.js'
import { Base } from './bases.js'
import { Handle } from './handles.js'
import { interior } from './interiors.js'
import { Security } from './security.js'
import { Door } from './spaces/doors.js'
import { Locks } from './locks.js'

import { EffectComposer } from 'vendor/postprocessing/EffectComposer.js'
import { RenderPass } from 'vendor/postprocessing/RenderPass.js'
import { ShaderPass } from 'vendor/postprocessing/ShaderPass.js'
import { CopyShader } from 'vendor/shaders/CopyShader.js'
import { SSAARenderPass } from 'vendor/postprocessing/SSAARenderPass.js' // Anti-Aliasing.
import { VignetteShader } from 'vendor/shaders/VignetteShader.js' // Darkens canvas edges.

// The renderer is disconnected from Redux state and can only communicate with it through props passed to it in <Renderer /> tag.
export default class Renderer extends Component {
  constructor(props) {
      super(props);

      this.getAttributes = this.getAttributes.bind(this);
      this.getColor = this.getColor.bind(this);
      this.getCodeValue = this.getCodeValue.bind(this);
      this.setAttributes = this.setAttributes.bind(this);
  }

  componentWillMount(){
    this.clock = new THREE.Clock(); // Needed?
    this.scene = new THREE.Scene();
    this.scene.name = "Configure Scene";
    this.cameraSettings = Dimension.getCamera();

    this.inFocus = true;
    window.addEventListener("focusin", function(){
      this.inFocus = true;
    });
    window.addEventListener("focusout", function(){
      this.inFocus = false;
    });
    window.scene = this.scene;

    this.camera = new THREE.PerspectiveCamera(this.cameraSettings.defaultFov, window.innerWidth / window.innerHeight,
      1100, // Increase to improve depth buffer performance.
      12000);

    this.renderer = new THREE.WebGLRenderer( { alpha: true, antialias: false } );

    this.initPostProcessing();
    this.initMaterialMeshes();
    this.objManager = new ObjManager(this.materialManager);

    this.initialize();
  }

  componentDidMount() {
    this.setAttributes();
    this.canvas.appendChild(this.getDomElement());
    if ( this.props.renderCanvas === true ) {
      this.createThumbnail();
    }
    // console.log('thumbnail did mount');
  }

  componentWillUnmount() {
    HELPER.removeAndDisposeGeom( this.scene, this.cabinet );
    // console.log('unmounting from thumbnail');
  }

  getDomElement(){
      return this.renderer.domElement;
  }

  initPostProcessing(){
    // sets renderer background color to white
    this.renderer.setClearColor(0xffffff, 1);
    this.renderer.autoClearColor = true;

    // turning on shadows at renderer level
    this.renderer.shadowMap.enabled = true; // OK
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; //OK
    this.renderer.shadowMap.soft = true;

    // Fog it up!
    this.scene.fog = new THREE.Fog( 0xffffff, 4750, 8000 );

    //Effect Composer settings.
    this.composer = new EffectComposer( this.renderer );
    this.composer.addPass( new RenderPass( this.scene, this.camera ));

    const SSAAPass = new SSAARenderPass( this.scene, this.camera );
    SSAAPass.enabled = true;
    SSAAPass.needsSwap = true;
    this.composer.addPass( SSAAPass );
    this.composer.addPass( new ShaderPass( VignetteShader ));

    const copyPass = new ShaderPass(CopyShader)
    copyPass.needsSwap = false;
    copyPass.renderToScreen = true
    this.composer.addPass(copyPass);
  }

  initMaterialMeshes(){
    this.materialManager = new MaterialManager();
    this.materialManager.materialMeshes.name = "material manager";
    this.scene.add(this.materialManager.materialMeshes)
  }


  initialize() {
    // console.log("INITIALIZE");
    // BUILD WITH SELECTION DEFAULTS

    const thumbnailWidth = 488,
          thumbnailHeight = 274;

    this.camera.position.set(0, 0, 4500);
    this.camera.up = new THREE.Vector3(0,1,0);
    this.camera.lookAt(new THREE.Vector3(0,0,0));

    // Set up renderer and aspect ratio for thumbnail size.
    this.renderer.setSize( thumbnailWidth, thumbnailHeight );
    this.composer.setSize( thumbnailWidth, thumbnailHeight );
    this.camera.aspect = thumbnailWidth / thumbnailHeight;
    this.renderer.setPixelRatio(2); // Set for consistent image export size across devices.

    this.floorY = -299;

    this.cabinet = new THREE.Group();
    this.cabinet.name = "Cabinet";

    // Initial build.
    this.objManager.whenLoaded( () => {
      // Initialize the evergreen components.

      this.housing = Housing.init( this.objManager, this.attributes );
      this.interior = interior.init( this.attributes, this.objManager );
      this.cabinet.add( this.housing ).add( this.interior );

      this.floorShadow = this.materialManager.materials.floorShadow;
      this.changeHousingShadow();

      // Initialize optional components if present.
      if ( this.attributes.interiorItems.length > -1 )
        this.updateInterior();
      if ( this.attributes.base.code.value !== 'none' )
        this.changeBase();
      if ( this.attributes.handle.code.value !== 'none' )
        this.changeHandle();
      if ( this.attributes.top.code.value !== 'none' )
        this.changeTop();
      if ( this.attributes.security.code.value !== 'none' )
        this.changeSecurity();
    });

    this.cabinet.position.setY( this.floorY );
    this.scene.add( this.cabinet );

    lights.init();
  } // END initialize()


  /******** CHANGE SELECTIONS **********/

  changeHousingDimensions(w,h,d){
    // console.log("CHANGEHOUSINGDIMENSIONS");
    let housing = this.cabinet.getObjectByName('housingGroup');

    HELPER.removeAndDisposeGeom( this.cabinet, housing );

    // Rebuild the housing.
    this.housing = Housing.createHousing( this.attributes );
    this.cabinet.add( this.housing );

    if ( h )
      this.changeOtherHeights();

    if ( w || d )
      this.changeFootprint();

    this.changeCabinetPosition();
  }

  changeOtherHeights(){
    // console.log("CHANGEOTHERHEIGHTS");
    const housingHOffset = Dimension.getHousing().heightDiff;
    // Move top.
    if ( this.attributes.top.code.value !== 'none' && this.top ) {
      let topY = Top.getYOffset(),
          newY = this.attributes.housingPoints + housingHOffset + topY;

      this.top.position.setY( newY );
    }

    // Move handles.
    if (this.attributes.handle.code.value !== "none" && this.handleMesh ) {
      let handleY = Handle.getYOffset(),
          newY = this.attributes.housingPoints + housingHOffset + handleY;

      this.handleMesh.position.setY( newY);
    }
  }

  changeFootprint(){
    // console.log("CHANGEFOOTPRINT");
    this.changeHousingShadow();
    this.changeBase();
    this.changeHandle();
    this.changeTop();
  }

  changeCabinetPosition(){
    let baseH = this.attributes.base.metricHeight.value === undefined ? 0 : this.attributes.base.metricHeight.value;
    this.cabinet.position.setY( this.floorY + baseH );
  }


  changeHousingShadow(){
    let shadow = this.cabinet.getObjectByName('housingShadow');

    HELPER.removeAndDisposeGeom( this.cabinet, shadow );

    const housingShadow = Housing.housingShadow( this.attributes.housingWidth, this.attributes.housingDepth, this.floorShadow );
    housingShadow.position.setY( -this.attributes.base.metricHeight.value );
    this.cabinet.add( housingShadow );
  }

  changeHousingColor(){
    // console.log('changeHousingColor');
    this.materialManager.materials.metalPaintedExt.color.setHex( parseInt(this.attributes.colorExt, 16) );
    this.materialManager.materials.metalPaintedExtTrans.color.setHex( parseInt(this.attributes.colorExt, 16) );
  }

  changeInteriorColor(){
    // console.log('changeInteriorColor');
    this.materialManager.materials.metalPaintedInt.color.setHex( parseInt( this.attributes.colorInt, 16 ) );
  }

  changeBase(){
    // console.log('CHANGEBASE');
    let base = this.cabinet.getObjectByName('base');

    HELPER.removeAndDisposeGeom( this.cabinet, base );

    this.baseMesh = this.attributes.base.code.value !== 'none' ? Base.init( this.attributes, this.objManager ) : undefined;

    // Add it to the Cabinet Group
    if (this.baseMesh) {
      // console.log('BASE IS NOT UNDEFINED SO ADD TO CABINET');
      this.baseMesh.name = "base";
      this.cabinet.add( this.baseMesh );
    }
    this.changeCabinetPosition();
    this.changeHousingShadow();

  } // END changeBase()

  changeBaseSide() {
    // console.log('CHANGE BASE SIDE');
    let base = this.cabinet.getObjectByName('base');

    HELPER.removeAndDisposeGeom( this.cabinet, base );

    this.attributes.base.mobile.value ? (
      this.baseMesh = Base.getCasterSides( this.attributes.handlePosition ),
      this.baseMesh.name = "base",
      this.cabinet.add( this.baseMesh )
    ) : (
      this.changeBase()
    );
  }

  changeHandle() {
    // console.log('CHANGEHANDLE');
    let code = this.attributes.handle.code.value,
        handle = this.cabinet.getObjectByName('cabinetHandle'),
        side = HELPER.convertHandleSide(this.attributes.handlePosition),
        handleCode = this.attributes.handle.code.value;

    HELPER.removeAndDisposeGeom( this.cabinet, handle );

    // Create handle or placeholder.
    this.handleMesh = code !== 'none' ? Handle.init( this.attributes, this.objManager ) : undefined;

    if ( this.handleMesh ) {
      this.handleMesh.name = "cabinetHandle";
      this.cabinet.add( this.handleMesh );
    }

    // Move the badges.
    if ( code === 'none' )
      side = null;

    Housing.moveLogosForHandles( side, handleCode );
  }

  changeHandleSide(){
    // console.log('CHANGEHANDLE SIDE');
    if ( this.handleMesh ) {
      let handlePos = this.attributes.handlePosition,
          side = HELPER.convertHandleSide(this.attributes.handlePosition),
          handleGrp = this.cabinet.getObjectByName('cabinetHandle'),
          handleCode = this.attributes.handle.code.value;

      Handle.getHandleSide( handleGrp, handlePos );
      Housing.moveLogosForHandles( side, handleCode );
    }
  }

  changeTop(){
    // console.log('CHANGETOP');
    let topObj = this.cabinet.getObjectByName('top');

    HELPER.removeAndDisposeGeom( this.cabinet, topObj );

    this.top = Top.init( this.attributes, this.materialManager.materials );

    if ( this.top )
      this.cabinet.add( this.top );
  }

  changeSecurity(){
    let code = this.attributes.security.code.value,
        security = this.cabinet.getObjectByName('securityMesh');

    HELPER.removeAndDisposeGeom( this.cabinet, security );

    this.securityMesh = code !== 'none' ? Security.update( this.attributes, this.objManager ) : undefined;

    if ( this.securityMesh ) {
      this.securityMesh.name = "securityMesh";
      this.cabinet.add( this.securityMesh );
    }

    Housing.positionBadges( code );
  }

  changeHousingLock(){
    const code = this.attributes.housingLock,
          grp = this.cabinet.getObjectByName('housingGroup'),
          hl = this.cabinet.getObjectByName('housingLock');

    if ( hl ) {
      HELPER.removeAndDisposeGeom( grp, hl );
    }

    if ( code !== 'nl' ) {
      let lm = Housing.createLock( code );
      Housing.positionLock( grp, lm );
    }
  }

  updateInterior(){
    // console.log("UPDATEINTERIOR()");
    this.interior = interior.update(this.attributes);
  }

  /******** END CHANGE HANDLERS **********/

  /******************* PROPS FOR 3D *************************************/
      getAttributes( path ) {
        return path !== undefined ? path.componentPositions[0].component.attributes : undefined;
      }
      getColor( colorPath ) {
        return colorPath !== undefined ? colorPath.componentPositions[0].component.attributes.hexColor.value : 0xffffff;
      }
      getCodeValue( path ) {
        if(path){
          return path.componentPositions[0].component !== undefined ? path.componentPositions[0].component.attributes.code.value : null;
        } else {
          return null;
        }

      }
  /******************* END PROPS FOR 3D *************************************/

  setAttributes(){
    this.attributes = {};
    this.attributes.base = this.getAttributes( this.props.configuration.values.basetype );
    this.attributes.colorExt = this.getColor( this.props.configuration.values.exteriorcolor );
    this.attributes.colorInt = this.getColor( this.props.configuration.values.interiorcolor );
    this.attributes.handle = this.getAttributes( this.props.configuration.values.handle );
    this.attributes.handlePosition = this.getCodeValue( this.props.configuration.values.handleposition );
    this.attributes.housingDepth = this.props.configuration.values.depth.componentPositions[0].component.attributes.numericValue.value;
    this.attributes.housingPoints = this.props.configuration.values.height.componentPositions[0].component.attributes.numericValue.value;
    this.attributes.housingLock = this.getCodeValue( this.props.configuration.values.locks ) ;
    this.attributes.housingWidth = this.props.configuration.values.width.componentPositions[0].component.attributes.numericValue.value;
    this.attributes.interiorHeights = this.props.configuration.values.interiorheight.componentPositions;
    this.attributes.interiorItems = this.props.configuration.values.interiortype.componentPositions;
    this.attributes.latch = this.getCodeValue( this.props.configuration.values.latch );
    this.attributes.security = this.getAttributes( this.props.configuration.values.security );
    this.attributes.top = this.getAttributes( this.props.configuration.values.toptype );
  }

  componentDidUpdate(prevProps){
    this.setAttributes();

    let positionsUpdated = false,
        baseUpdated = false,
        handleUpdated = false,
        securityUpdated = false;

    // Let's make sure everything is loaded first.
    this.objManager.whenLoaded( () => {
      // console.log("COMPONENTDIDUPDATE WHENLOADED");
      // ANY housing dimension change.
      if (  prevProps.housingPoints !== this.attributes.housingPoints ||
            prevProps.housingWidth !== this.attributes.housingWidth ||
            prevProps.housingDepth !== this.attributes.housingDepth ) {
        // console.log("ANY HOUSING DIMENSION CHANGE");
        let x = false,
            y = false,
            z = false;

        if ( prevProps.housingWidth !== this.attributes.housingWidth )
          x = true;
        if ( prevProps.housingPoints !== this.attributes.housingPoints )
          y = true;
        if ( prevProps.housingDepth !== this.attributes.housingDepth )
          z = true;

        this.changeHousingDimensions( x, y, z );

        if ( x || z )
          baseUpdated = true;
          handleUpdated = true;

        if ( y )
          baseUpdated = true;
          handleUpdated = true;

        if ( !positionsUpdated )
          this.updateInterior();
          positionsUpdated = true;

        if ( !securityUpdated )
          this.changeSecurity();
          securityUpdated = true;
      }

      // Change colors.
      if ( prevProps.colorExt !== this.attributes.colorExt ) {
        this.changeHousingColor();
      }
      if ( prevProps.colorInt !== this.attributes.colorInt ) {
        this.changeInteriorColor();
      }

      if ( prevProps.base !== this.attributes.base ) {
        // console.log("BASE SELECTOR UPDATED");
        if ( !baseUpdated )
          this.changeBase();
          baseUpdated = true;
      }

      if ( prevProps.handle !== this.attributes.handle ) {
        // console.log("HANDLE SELECTOR UPDATED");
        if ( !handleUpdated )
          this.changeHandle();
          handleUpdated = true;
      }

      if ( prevProps.handlePosition !== this.attributes.handlePosition && !handleUpdated ) {
        // console.log("HANDLE POSITION SELECTOR UPDATED");
        if ( !handleUpdated )
          this.changeHandleSide();

        if ( !baseUpdated )
          this.changeBaseSide();
      }

      if ( prevProps.top !== this.attributes.top ) {
        this.changeTop();
      }

      if ( prevProps.interiorItems !== this.attributes.interiorItems ||
        prevProps.interiorItems.length !== this.attributes.interiorItems.length ||
        prevProps.interiorHeights !== this.attributes.interiorHeights ) {

        if ( !positionsUpdated )
          this.updateInterior();
          positionsUpdated = true;

      }

      if ( prevProps.latch !== this.attributes.latch && this.attributes.interiorItems.some( (pos) => { return pos.component.attributes.code.value === 'drawer'; } )) {
        if ( !positionsUpdated )
          this.updateInterior();
          positionsUpdated = true;
      }

      if ( prevProps.housingLock !== this.attributes.housingLock ){
          this.changeHousingLock();
      }

      if ( prevProps.security !== this.attributes.security ) {
        if ( !securityUpdated )
          this.changeSecurity();
          securityUpdated = true;
      }

      if ( this.props.renderCanvas === true ) {
        this.createThumbnail();
      }

    });  // END whenLoaded()
  }

  createThumbnail() {
    // Setup for generating thumbnails.
    this.positionCameraAndCabinet(); // Position camera and cabinet for thumbnail.
    this.createAndReturnImage(); // Generate screenshot of canvas.
  }

  positionCameraAndCabinet(){
    // Zero out for calculations.
    this.camera.lookAt(new THREE.Vector3(0,0,0));
    this.camera.position.set( 0, 0, 4500 );
    this.cabinet.position.setY(0);
    this.cabinet.rotation.y = 0;

    // Using PerspectiveCamera
    let bb = new THREE.Box3().setFromObject( this.cabinet ), //bounding box of cabinet
        bbWidth = new THREE.Box3().setFromObject( this.cabinet.getObjectByName('housingGroup') ),
        camPos = this.camera.position,
        dist = camPos.z - bb.max.z, //distance from the camera to the _closest face_ of the cube
        height = Math.floor( bb.max.y + Math.abs( bb.min.y )) + 30, // height of cube. ALSO HACKY ADJUSTMENT HERE.
        width = Math.floor( bbWidth.max.x +  Math.abs( bbWidth.min.x )), //housing shadow throws things off - is 2.2x housing width
        aspect = this.camera.aspect,
        fov = height > width ? 2 * Math.atan( height / ( 2 * dist ) ) * ( 180 / Math.PI ) : 2 * Math.atan( ( width / aspect ) / ( 2 * dist )) * ( 180 / Math.PI ), // https://stackoverflow.com/questions/14614252/how-to-fit-camera-to-object
        cabinetHAdjusted = height/2 + Math.floor( bb.min.y ), // Bases are added in -Y space.
        cameraYOffset = 300, // Arbitrary.
        cabinetYModifier = this.attributes.housingDepth < 725 ? 0.04 : 0.08; // Shallow vs full depth.

    this.camera.fov = fov;  // Set the new fov.
    this.camera.updateProjectionMatrix(); // Make sure camera is updated.

    // this.render();
    // Adjust position in case there's a base, which are added in -Y.
    this.cabinet.position.y = -cabinetHAdjusted;

    // Overhead thumbnails.
    this.camera.position.setY(cabinetHAdjusted + cameraYOffset); // camera above a bit
    this.camera.lookAt(new THREE.Vector3(0,0,0));
    // this.composer.render();
    this.cabinet.position.y += cameraYOffset * cabinetYModifier; // Tweak the cabinet height based on the shallow or full depth.

  }

  createAndReturnImage() {
    // console.log('createAndReturnImage()');
    this.composer.render();
    this.props.saveConfigurationWithImage( this.props.configuration, this.renderer.domElement.toDataURL() );
  }

  render() {
    // console.log('render');
    this.composer.render();

   return (
     <div className={ styles.canvasInnerHolder } ref={(canvas) => { this.canvas = canvas; }}></div>
   );
  }

}
