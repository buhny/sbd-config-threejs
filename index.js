import React, { PureComponent } from 'react';
import { connect, Provider } from 'react-redux';
import Settings from 'modules/Settings';
import Configurations from 'modules/Configurations';
import styles from "./renderer.scss";
import * as THREE from 'three';
import deepEqual from 'deep-equal'; // compare two objects, deepEqual( object1, object2)
window.THREE = global.THREE = THREE;

import oc from 'vendor/orbit-controls.js';
THREE.OrbitControls = new oc(THREE);

import mcm from 'vendor/shaders/MatcapMaterial.js'
var MatcapMaterial = new mcm(THREE)

import mm from './material-manager.js'
var MaterialManager = new mm(THREE, MatcapMaterial);

import om from './obj-manager.js'
var ObjManager = new om();

import * as HELPER from './helpers.js';
import * as toolBoxHelper from 'Src/helpers';
import { Dimension } from './dimensions.js'
import { Thumbnail } from './thumbnails.js'

import { Light } from './lights.js'
import { Room } from './room.js'
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
// import { SMAAPass } from 'vendor/postprocessing/SMAAPass.js' // Anti-Aliasing.
// import { SMAAShader } from 'vendor/shaders/SMAAShader.js' // Anti-Aliasing.
import { SSAOShader } from 'vendor/shaders/SSAOShader.js' // Darken creases.
import { VignetteShader } from 'vendor/shaders/VignetteShader.js' // Darkens canvas edges.
import { OutlinePass } from 'vendor/postprocessing/OutlinePass.js' // Outlines things.

// The renderer is disconnected from Redux state and can only communicate with it through props passed to it in <Renderer /> tag.
class Renderer extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      rendererStarted: false
    };

    this.attributes = {};

    this.resizeFunctions =  this.resizeFunctions.bind(this);
    this.setAttributes = this.setAttributes.bind(this);

    this.initMaterialMeshes(); // Make sure textures are loaded in before meshes for non-configurator entry points.
  }


  prepareRenderer(){
    this.clock = new THREE.Clock(); // Needed?
    this.scene = new THREE.Scene();
    this.scene.name = "Configure Scene";
    this.cameraSettings = Dimension.getCamera();

    // Frame rate throttling controls for requestAnimationFrame.
    this.throttle = {
      stop : false,
      fpsInterval : 0,
      now : 0,
      then : 0,
      elapsed : 0
    }

    this.inFocus = true;
    window.addEventListener("focusin", function(){
      this.inFocus = true;
    });
    window.addEventListener("focusout", function(){
      this.inFocus = false;
    });
    window.scene = this.scene;

    this.camera = new THREE.PerspectiveCamera(this.cameraSettings.defaultFov, window.innerWidth / window.innerHeight,
      500, // Increase to improve depth buffer performance.
      12000);
    this.camera.updateProjectionMatrix();

    this.renderer = new THREE.WebGLRenderer( { alpha: true, antialias: false } );

    // Orbit Controls for temporary camera liberation
    this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.5;
    this.controls.rotateSpeed = 0.2;
		this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.minPolarAngle = Math.PI/4;
    this.controls.maxPolarAngle = Math.PI/2;
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.1;
    this.controls.target = new THREE.Vector3(0, 100, 0);
    this.controls.minDistance = 2000;
    this.controls.maxDistance = 5000;
    // this.controls.minDistance = 200; // for testing
    // this.controls.maxDistance = 5000; // for testing
    this.controls.minAzimuthAngle = -Math.PI/1.5; // radians
    this.controls.maxAzimuthAngle = Math.PI/1.5;

    this.initPostProcessing();
    this.objManager = new ObjManager(this.materialManager);

    this.initialize();
    this.resizeTimer = null;
  }

  finishRendererStart(){
    if(this.canvas){
      this.canvas.appendChild(this.getDomElement());
    }

    window.addEventListener("resize", this.resizeFunctions);
    this.resizeFunctions();
    // this.loop();
    this.startAnimating(9);
  }


  resizeFunctions(){
    clearTimeout(this.resizeTimer);

    this.resizeTimer = setTimeout( ()=> {
      //debouncing resize functions
      let canvasHeight = null;
      if(this.getDomElement().parentNode){
        canvasHeight = this.getDomElement().parentNode.offsetHeight;
      } else {
        canvasHeight =  window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
      }

      let windowWidth =  window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
      if(windowWidth < 768){
          canvasHeight = canvasHeight - document.getElementById('toolBoxHolder').offsetHeight;
      }
      this.updateCanvasSize(this.canvas.offsetWidth, canvasHeight);
    }, 10);
  }

  componentWillUnmount() {
    // HELPER.disposeMaterials( this.cabinet );
    clearTimeout(this.resizeTimer)
    HELPER.removeAndDisposeGeom( this.scene, this.cabinet );
    window.removeEventListener("resize",  this.resizeFunctions);
  }

  getDomElement(){
      return this.renderer.domElement;
  }

  updateCanvasSize(width, height) {
    let bodyTag = document.documentElement.getElementsByTagName('body')[0];

    this.renderer.setPixelRatio( window.devicePixelRatio ? window.devicePixelRatio : 1 ); // one has to call renderer.setPixelRatio before calling renderer.setSize.

    let pixelRatio = this.renderer.getPixelRatio(),
        newWidth  = Math.floor( width ) || 1,
        newHeight = Math.floor( height ) || 1;

    this.renderer.setSize( width, height );
    this.composer.setSize( newWidth, newHeight, pixelRatio );

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.composer.render(); // FF won't resize canvas unless we rerender - window.resize should probably be debounced at some point
  }

  initPostProcessing(){
    // sets renderer background color to white
    this.renderer.setClearColor(0xffffff, 1);
    this.renderer.setPixelRatio( window.devicePixelRatio ? window.devicePixelRatio : 1 ); // one has to call renderer.setPixelRatio before calling renderer.setSize.
    this.renderer.autoClearColor = true;

    // turning on shadows at renderer level
    this.renderer.shadowMap.enabled = true; // OK
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; //OK
    this.renderer.shadowMap.soft = true;

    // Fog it up!
    this.scene.fog = new THREE.Fog( 0xffffff, 4850, 8000 );

    //Effect Composer settings.
    this.composer = new EffectComposer( this.renderer );
    this.composer.addPass( new RenderPass( this.scene, this.camera ));

    const SSAAPass = new SSAARenderPass( this.scene, this.camera );
    SSAAPass.sampleLevel = this.renderer.getPixelRatio() > 1 ? 2 : 1;
    SSAAPass.enabled = true;
    SSAAPass.needsSwap = true;
    this.composer.addPass( SSAAPass );

    this.composer.addPass( new ShaderPass( SSAOShader ));
    this.composer.addPass( new ShaderPass( VignetteShader ));

    this.outyPass = new OutlinePass( new THREE.Vector2(window.innerWidth, window.innerWidth), this.scene, this.camera );
    this.outyPass.hiddenEdgeColor = new THREE.Color( 0xffffff );
    this.outyPass.edgeStrength = 2.0;
    this.outyPass.edgeGlow = 1.0;
    this.outyPass.edgeThickness = 4.0;
    this.outyPass.pulsePeriod = 3;
    this.composer.addPass( this.outyPass );

    // And draw to the screen
    const copyPass = new ShaderPass(CopyShader)
    copyPass.needsSwap = false;
    copyPass.renderToScreen = true
    this.composer.addPass(copyPass);
  }

  initMaterialMeshes(){
    // TODO: see about need to destroy this?
    this.materialManager = new MaterialManager();
    this.materialManager.materialMeshes.name = "material manager";
    // this.scene.add(this.materialManager.materialMeshes)
  }


  initialize() {
    // console.log('initialize');
    // BUILD WITH SELECTION DEFAULTS
    this.selectedSpace;
    this.screenshotCounter = 0;

    this.cameraYDefault = this.attributes.housingPoints !== undefined ? this.attributes.housingPoints + 500 : 1000;
    this.setCameraTarget();

    this.camera.position.set(0, this.cameraYDefault, 4500);
    this.camera.up = new THREE.Vector3(0,1,0);
    this.camera.lookAt(new THREE.Vector3(0,300,0)) //Overridden by orbit controls later.

    Room.init( this.materialManager.materials.floorDiffused, this.materialManager.materials.wallsDiffused );

    this.floorY = -299;
    this.isConfigurationViewResetNeeded = this.props.title === 'configurator' ? false : true;

    this.cabinet = new THREE.Group();
    this.cabinet.name = "Cabinet";

    // Initial build.
    this.objManager.whenLoaded( () => {

      // Initialize the evergreen components.
      this.housing = Housing.init( this.objManager, this.attributes );

      this.interior = interior.init( this.attributes, this.objManager );

      this.floorShadow = this.materialManager.materials.floorShadow;
      const shadowContainer = Housing.housingShadow(this.attributes.housingWidth, this.attributes.housingDepth, this.floorShadow, this.floorY);

      this.cabinet.add( this.housing ).add( this.interior ).add( shadowContainer );

      // Initialize optional components if present.
      if (this.attributes.interiorItems.length > -1 )
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

    // this.cabinet.rotation.y = Math.PI / 4;
    this.cabinet.position.setY( this.floorY );
    this.scene.add( this.cabinet );
    if(this.props.title === 'configurator'){
      let THIS = this;
        (function(toolBoxHelper){
            let timeout = setTimeout(function() { toolBoxHelper.hideFullLoader(); }, 500);
        })(toolBoxHelper)
    }

    // Light it up!
    Light.letThereBe();

  } // END initialize()


  /******** CHANGE SELECTIONS **********/

  changeHousingDimensions(w,h,d){

    let housing = this.cabinet.getObjectByName('housingGroup');

    HELPER.removeAndDisposeGeom( this.cabinet, housing );

    // Rebuild the housing.
    this.housing = Housing.createHousing( this.attributes );
    this.cabinet.add( this.housing );

    if ( h )
      this.changeOtherHeights();

    if ( w || d )

      this.changeFootprint();

    // Move the camera up for taller cabinets.
    // this.props.housingPoints > 1000 ? this.controls.target.y = 500 : this.controls.target.y = 300;
    this.setCameraTarget();

    this.changeCabinetPosition();
  }

  changeOtherHeights(){

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

    this.changeHousingShadow();
    this.changeBase();
    this.changeHandle();
    this.changeTop();
  }

  changeCabinetPosition(){
    let baseH = this.attributes.base.metricHeight.value === undefined ? 0 : this.attributes.base.metricHeight.value;
    this.cabinet.position.setY( this.floorY + baseH );
  }

  setCameraTarget(){
    // this.props.housingPoints > 1000 ? this.controls.target.y = 500 : this.controls.target.y = 300;
    this.controls.target.y = this.attributes.housingPoints/3;
  }

  changeHousingShadow(){
    let shadow = this.cabinet.getObjectByName('housingShadow');

    HELPER.removeAndDisposeGeom( this.cabinet, shadow );

    const housingShadow = Housing.housingShadow( this.attributes.housingWidth, this.attributes.housingDepth, this.floorShadow );
    housingShadow.position.setY( -this.attributes.base.metricHeight.value );
    this.cabinet.add( housingShadow );
  }

  changeHousingColor(){

    this.materialManager.materials.metalPaintedExt.color.setHex( parseInt(this.attributes.colorExt, 16) );
    this.materialManager.materials.metalPaintedExtTrans.color.setHex( parseInt(this.attributes.colorExt, 16) );
  }

  changeInteriorColor(){

    this.materialManager.materials.metalPaintedInt.color.setHex( parseInt( this.attributes.colorInt, 16 ) );
  }

  changeBase(){

    let base = this.cabinet.getObjectByName('base');

    HELPER.removeAndDisposeGeom( this.cabinet, base );

    this.baseMesh = this.attributes.base.code.value !== 'none' ? Base.init( this.attributes, this.objManager ) : undefined;

    // Add it to the Cabinet Group
    if (this.baseMesh) {

      this.baseMesh.name = "base";
      this.cabinet.add( this.baseMesh );
    }
    this.changeCabinetPosition();
    this.changeHousingShadow();

  } // END changeBase()

  changeBaseSide() {

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
      Housing.positionLock( grp, lm, code );
    }
  }

  changeTransparency( isTransparent ){
    let opacityVal = isTransparent ? 0.15 : 1.0,
        getRuleGroups = toolBoxHelper.getShared('getRuleGroups');

    if ( isTransparent ) {

      Object.entries( this.props.currentConfiguration.configuration.values ).forEach( ([key, value]) => {
        // Check that the component property exists bc shelfqty is WIP.
        if ( value.componentPositions[0].component ) {
          let currComponent = value.componentPositions[0].component;

          // Check if the component has at setTransparency rule.
          if( toolBoxHelper.isComponentInRuleGroup( currComponent, getRuleGroups().settransparency ) ){
            //  This component should be transparent.
            this.transparentComponent = currComponent;
            // Only checking for double hinged doors atm.
            if ( this.transparentComponent.attributes.code.value === 'doubledoors' ) {

              if ( this.invisibles === undefined || this.invisibles.length <= 0 ) {
                const doors = this.cabinet.getObjectByName('securityMesh'),
                      badgeLogo = this.cabinet.getObjectByName('logoBadge'),
                      badgeMIUSA = this.cabinet.getObjectByName('miUSABadge');

                this.invisibles = [];
                this.invisibles.push( doors, badgeLogo, badgeMIUSA );
              }

              this.invisibles.forEach( el => el.visible = false );

              // HELPER.changeMaterialTransparency( doors, isTransparent, opacityVal );
            }
          }
        }
      })
    } else if ( this.transparentComponent ) {

      if ( this.transparentComponent.attributes.code.value === 'doubledoors' ) {

        this.invisibles.forEach( el => el.visible = true );

        // HELPER.changeMaterialTransparency( doors, isTransparent, opacityVal );
      }

      this.transparentComponent = null;
    }
  }

  updateInterior(){
    this.interior = interior.update(this.attributes);
  }

  /******** END CHANGE HANDLERS **********/


  startAnimating(fps) {
    this.throttle.fpsInterval = 1000 / fps;
    // Checks for performance.now support else falls back to Date.now.
    this.throttle.then = window.performance.now ?
             (performance.now() + performance.timing.navigationStart) :
             Date.now();
    this.animate();

  }

  animate() {
    // request another frame
    requestAnimationFrame(this.animate.bind(this));

    // calc elapsed time since last loop
    this.throttle.now = window.performance.now ?
             (performance.now() + performance.timing.navigationStart) :
             Date.now();
    this.throttle.elapsed = this.throttle.now - this.throttle.then;

    // if enough time has elapsed, draw the next frame
    if (this.throttle.elapsed > this.throttle.fpsInterval) {

        // Get ready for next frame by setting then=now, but also adjust for your
        // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
        this.throttle.then = this.throttle.now - (this.throttle.elapsed % this.throttle.fpsInterval);

        // Put your drawing code here
        // Animate drawer & trays open.
        if (this.selectedSpace !== undefined) {
          // Open the selected space.
          let spaceType = this.selectedSpace.type.nameCode;
          if (spaceType === "drawer" || spaceType === "tray") {
            let animateSpace = scene.getObjectByName( spaceType + this.selectedSpace.position);
            let spaceZ = animateSpace.position.z;
            if (spaceZ < this.attributes.housingDepth.value/4){
              animateSpace.position.setZ(spaceZ + 10);
            }
          }

          // TODO: Close the rest.
        }

        this.composer.render();
    }
  }

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


  setAttributes(currentConfiguration){
    return {
      base: this.getAttributes( currentConfiguration.configuration.values.basetype ),
      colorExt: this.getColor( currentConfiguration.configuration.values.exteriorcolor ),
      colorInt: this.getColor( currentConfiguration.configuration.values.interiorcolor ),
      handle: this.getAttributes( currentConfiguration.configuration.values.handle ),
      handlePosition: this.getCodeValue( currentConfiguration.configuration.values.handleposition ),
      housingDepth: currentConfiguration.configuration.values.depth.componentPositions[0].component.attributes.numericValue.value,
      housingPoints: currentConfiguration.configuration.values.height.componentPositions[0].component.attributes.numericValue.value,
      housingLock: this.getCodeValue( currentConfiguration.configuration.values.locks ),
      housingWidth: currentConfiguration.configuration.values.width.componentPositions[0].component.attributes.numericValue.value,
      interiorHeights: currentConfiguration.configuration.values.interiorheight.componentPositions,
      interiorItems: currentConfiguration.configuration.values.interiortype.componentPositions,
      latch: this.getCodeValue( currentConfiguration.configuration.values.latch ),
      security: this.getAttributes( currentConfiguration.configuration.values.security ),
      top: this.getAttributes( currentConfiguration.configuration.values.toptype )
    };
  }

  shouldComponentUpdate(nextProps, nextState){
    if(!this.props.currentConfiguration.configuration || (this.props.title === this.props.title &&
      this.props.GenerateThumbnail === nextProps.GenerateThumbnail &&
      deepEqual(this.props.currentConfiguration, nextProps.currentConfiguration) &&
    deepEqual(this.props.transparencyRule, nextProps.transparencyRule))){
      return false;
    }
    return true;
  }

  componentDidUpdate(prevProps) {
    // console.log('componentDidUpdate');
    if(toolBoxHelper.getShared('getRenderCanvas') && toolBoxHelper.getShared('saveConfigurationWithImage')){
      // toolBoxHelper.getShared('getRenderCanvas')();
      // toolBoxHelper.getShared('saveConfigurationWithImage')();
    }
    if(!this.props.currentConfiguration.configuration || Object.keys(this.props.currentConfiguration.configuration).length === 0){
      return null;
    }
    if(Object.keys(prevProps.currentConfiguration.configuration).length > 0){
      this.prevAttributes = this.setAttributes(prevProps.currentConfiguration);
    } else {
      this.prevAttributes = {};
    }

    this.attributes = this.setAttributes(this.props.currentConfiguration);

    if(!this.state.rendererStarted){
      this.prepareRenderer();
      this.setState({ rendererStarted: true }, this.finishRendererStart) ;
    }

    if ( this.props.title === 'configurator' ) {
      this.resetConfiguratorViewDefaults( this.isConfigurationViewResetNeeded );
    }

    let positionsUpdated = false,
        baseUpdated = false,
        handleUpdated = false,
        securityUpdated = false;

    // Let's make sure everything is loaded first.
    this.objManager.whenLoaded( () => {

      // ANY housing dimension change.
      if (  this.prevAttributes.housingPoints !== this.attributes.housingPoints ||
            this.prevAttributes.housingWidth !== this.attributes.housingWidth ||
            this.prevAttributes.housingDepth !== this.attributes.housingDepth ) {

        let x = false,
            y = false,
            z = false;

        if ( this.prevAttributes.housingWidth !== this.attributes.housingWidth )
          x = true;
        if ( this.prevAttributes.housingPoints !== this.attributes.housingPoints )
          y = true;
        if ( this.prevAttributes.housingDepth !== this.attributes.housingDepth )
          z = true;


        this.changeHousingDimensions(x,y,z);

        if ( x || z )
          baseUpdated = true;
          handleUpdated = true;

        if ( y )
          //baseUpdated = true;
          handleUpdated = true;

        if ( !positionsUpdated )
          this.updateInterior();
          positionsUpdated = true;

        if ( !securityUpdated )
          this.changeSecurity();
          securityUpdated = true;
      }

      // Change colors.
      if ( this.prevAttributes.colorExt !== this.attributes.colorExt ) {
        this.changeHousingColor();
      }
      if ( this.prevAttributes.colorInt !== this.attributes.colorInt ) {
        this.changeInteriorColor();
      }

      if ( this.prevAttributes.base !== this.attributes.base ) {

        if ( !baseUpdated )
          this.changeBase();
          baseUpdated = true;
      }

      if ( this.prevAttributes.handle !== this.attributes.handle ) {

        if ( !handleUpdated )
          this.changeHandle();
          handleUpdated = true;
      }

      if ( this.prevAttributes.handlePosition !== this.attributes.handlePosition && !handleUpdated ) {
        if ( !handleUpdated )
          this.changeHandleSide();

        if ( !baseUpdated )
          this.changeBaseSide();
      }

      if ( this.prevAttributes.top !== this.attributes.top ) {
        this.changeTop();
      }

      if ( this.prevAttributes.interiorItems !== this.attributes.interiorItems ||
        this.prevAttributes.interiorItems.length !== this.attributes.interiorItems.length ||
        this.prevAttributes.interiorHeights !== this.attributes.interiorHeights ) {

        if ( !positionsUpdated )
          this.updateInterior();
          positionsUpdated = true;

        // Set a selected position.
        // this.props.selectedPosition !== undefined ? this.props.selectedPosition.interiortypeinteriorheightdividershelfqty.position : null;
        // this.selectedSpace = this.props.setPositions.find( position => position.selected === true );
        this.selectedSpace = undefined;
      }

      if ( !deepEqual(prevProps.currentConfiguration.selectedPositions, this.props.currentConfiguration.selectedPositions) ) {
        let posObj = this.props.currentConfiguration.selectedPositions;

        if ( posObj === undefined  || (Object.keys(posObj).length === 0 && posObj.constructor === Object) ) {
          return // Sometimes selectedPositions is {}
        } else {
          // if position has a value
          if ( this.props.currentConfiguration.selectedPositions.interiortypeinteriorheightdividershelfqty.position ) {
            let selectedName = 'position_' + this.props.currentConfiguration.selectedPositions.interiortypeinteriorheightdividershelfqty.position,
                selectedObj = this.cabinet.getObjectByName(selectedName);

            this.outyPass.selectedObjects = [selectedObj]; // Add selected position to OutlinePass.
          } else {
            // remove any selected position objects
            this.outyPass.selectedObjects = [];
          }
        }
      }

      if ( prevProps.transparencyRule.settransparency !== this.props.transparencyRule.settransparency ) {
        let tr = ( this.props.transparencyRule.settransparency) ? true : false;
        this.changeTransparency( tr );
      }

      if ( this.prevAttributes.latch !== this.attributes.latch && this.attributes.interiorItems.some( (pos) => { return pos.component.attributes.code.value === 'drawer'; } )) {
        if ( !positionsUpdated )
          this.updateInterior();
          positionsUpdated = true;
      }

      if ( this.prevAttributes.housingLock !== this.attributes.housingLock ){
          this.changeHousingLock();
      }

      if ( this.prevAttributes.security !==this.attributes.security ) {
        if ( !securityUpdated )
          this.changeSecurity();
          securityUpdated = true;
      }

      if ( this.props.GenerateThumbnail === true ) {
        this.props.setTakeScreenshot(false);
        this.createThumbnail();
      }

    });  // END whenLoaded()

    this.initializedComponents = false;
  }


  render() {
    if(this.controls){
      this.controls.update();
    }

   return (
     <div className={`${styles.canvasHolder}`} >
       <div className={ styles.canvasInnerHolder } ref={(canvas) => { this.canvas = canvas; }}></div>
     </div>
   );
  }

  createThumbnail() {
    // console.log('createThumbnail');
    this.composer.render();
    Thumbnail.setUpCanvas( this.controls, this.scene, this.renderer, this.composer, this.camera, this.cabinet );
    Thumbnail.positionMainThumb( this.attributes );
    Thumbnail.positionWallPlanningThumb();
    Thumbnail.saveImages( this.props );
    // Thumbnail.popUpImage();
    this.isConfigurationViewResetNeeded = true;
    this.resetConfiguratorViewDefaults( this.isConfigurationViewResetNeeded );
  }

  resetConfiguratorViewDefaults( needsReset ) {
    // console.log('resetConfiguratorViewDefaults()');
    if ( this.props.title === 'configurator' && needsReset === true ) {
      // console.log('resetting Configurator defaults');
      // Reset functions.
      Thumbnail.resetCanvasforConfigurator( this.floorY );
      this.setCameraTarget(); // Reset camera target.
      this.resizeFunctions(); // Reset renderer & composer size then render.
      Housing.housingShadow(this.attributes.housingWidth, this.attributes.housingDepth, this.floorShadow, this.floorY); // Add cabinet shadow back.
      this.isConfigurationViewResetNeeded === false;
    }
  }

}

const mapDispatchToProps = (dispatch) => {
    return {
      setTakeScreenshot: (takeScreenshot)=> dispatch(Settings.actions.setTakeScreenshot(takeScreenshot))
  }
}

function mapStateToProps(state){
  return {
    currentConfiguration: Configurations.selectors.getCurrentConfiguration(state),
    transparencyRule: Settings.selectors.getRuleGroups(state),
    GenerateThumbnail: Settings.selectors.getGenerateThumbnail(state)
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(Renderer);
