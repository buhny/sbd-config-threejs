import SubdivisionModifier from 'three-subdivision-modifier'


module.exports = function(THREE, MatcapMaterial) {

  class MaterialManager {
    constructor(){
      this.materials = {};
      this.materials.tops = {}
      this.materials.casters = {}

      this.materialMeshes = new THREE.Group();
      // this.materialMeshes.visible = false;

      this.init();
    }

    init(){
      const loader = new THREE.TextureLoader();

      this.textureLibrary = {
        envMap: loader.load('/textures/envmaps/industrial_roomBlur.jpg'),
        wallsDiffused: loader.load('/textures/maps/walls-diffused.jpg'),
        floorShadow: loader.load('/textures/maps/box-shadow2.jpg'),
        metalSheetNormal: loader.load( "/textures/maps/metal-powdercoat/NormalMapIntense.png" ),
        plasticBlack: new MatcapMaterial("/textures/matcap/black-plastic.png"),
        plasticWindowed: new MatcapMaterial("/textures/matcap/windowed-plastic.png"),
        steelBuffed: new MatcapMaterial("/textures/matcap/buffed-steel.png"),
        steelHalo: new MatcapMaterial("/textures/matcap/halo-steel.png"),
        steelGrip: loader.load('/textures/maps/lock_integrated-texture.jpg'),
        laminateGray: loader.load('/textures/maps/laminate-texture.jpg'),
        butcherBlockMain: loader.load('/textures/maps/butcher-block.jpg'),
        butcherBlockEnd: loader.load('/textures/maps/wood-long-endgrain.jpg'),
        particleBoardTop: loader.load('/textures/maps/tops_lista-top.jpg'),
        particleBoardSide: loader.load('/textures/maps/tops_lista-side.jpg'),
        rubberColor: loader.load("/textures/maps/rubber/rubber-mat_m.png"),
        rubberNormal: loader.load( "/textures/maps/rubber/rubber-mat_n.jpg" ),
        rubberReflection:loader.load("/textures/maps/rubber/rubber-mat_r.png"),
        badgeBrandFace: loader.load('/textures/maps/LISTA-badge-front.jpg'),
        badgeMIUSAFace: loader.load('/textures/maps/logo-miusa.png'),
        lockKeyedFace: loader.load('/textures/maps/lock_texture.jpg'),
        lockKeypadColor: loader.load( "/textures/maps/lock-keypad_basecolor.jpg" ),
        lockKeypadNormal: loader.load( "/textures/maps/lock-keypad_normal.jpg" ),
        lockKeypadRoughness: loader.load( "/textures/maps/lock-keypad_roughness.jpg" )
      }

      // Create Materials Library
      this.library = {
        wallsDiffused: this.createWallsMaterial(),
        // floorDiffused: this.createRoomDiffusedMaterial(),
        floorShadow: this.createFloorShadowMaterial(),
        basic:  this.createStandardMetalMaterial(),
        blackPlastic: new MatcapMaterial("/textures/matcap/black-plastic.png"),
        buffedSteel: new MatcapMaterial("/textures/matcap/buffed-steel.png"),
        grayLaminate: this.createPlasticLamMaterial(),
        haloSteel: new MatcapMaterial("/textures/matcap/halo-steel.png"),
        windowedPlastic: new MatcapMaterial("/textures/matcap/windowed-plastic.png"),
        lock: this.createLockFaceMaterial(),
        badge: this.createLogoBadgeMaterial(),
        miusa: this.createMIUSAMaterial(),
        wood: this.createButcherBlock(),
        listaTop: this.createListaTopMaterial(),
        rubber: this.createRubberMaterial(),
        knobIntTexture: this.createKnobIntegratedMaterial(),
        lockKeypad: this.createKeypadLockMaterial()
        // basicDrawer: this.createStandardMetalDrawerMaterial(),
        // bronze: new MatcapMaterial("/textures/matcap/bronze.jpg"),
        // buffedSteel: this.createShinyMetalWithShadows(),
        // chrome: new MatcapMaterial("/textures/matcap/chrome.jpg"),
        // copperPlastic: new MatcapMaterial("/textures/matcap/copper-plastic.png"),
        // flatGray: new MatcapMaterial("/textures/matcap/flat-gray.jpg"),
        // haloSteel: this.createShinyMetalWithShadows(),
        // litSteel: new MatcapMaterial("/textures/matcap/lit-steel.jpg"),
        // matteSteel: new MatcapMaterial("/textures/matcap/matte-steel.png"),
        // scuffedAluminum: new MatcapMaterial("/textures/matcap/matcap-aluminum-scuffed.jpg"),
        // scuffedIron: new MatcapMaterial("/textures/matcap/matcap-iron-scuffed.jpg"),
        // shinyShadows: this.createShinyMetalWithShadows(),
      }

      // console.log(this.library);

      // selections used throughout project (aliases)
      this.materials.base = this.library.basic;
      this.materials.metalPaintedExt = this.library.basic.clone();
      this.materials.metalPaintedExtTrans = this.library.basic.clone();
      this.materials.metalPaintedExtTrans.transparent = true;
      this.materials.metalPaintedInt = this.library.basic.clone();
      // this.materials.baseDrawer = this.library.basicDrawer;
      this.materials.accessories = this.library.haloSteel;
      this.materials.plasticBlack = this.library.blackPlastic;
      this.materials.tops.stainless = this.library.buffedSteel;
      this.materials.tops.resin = this.library.windowedPlastic;
      this.materials.tops.wood = this.library.wood;
      this.materials.tops.lista = this.library.listaTop;
      this.materials.tops.plastic = this.library.grayLaminate;
      this.materials.tops.rubber = this.library.rubber;
      this.materials.handleCap = this.library.blackPlastic;
      this.materials.casters.black = this.library.blackPlastic;
      this.materials.casters.silver = this.library.haloSteel;
      this.materials.floorShadow = this.library.floorShadow;
      this.materials.floorDiffused = this.library.floorDiffused;
      this.materials.wallsDiffused = this.library.wallsDiffused;
      this.materials.lockFace = this.library.lock;
      this.materials.lockKeypad = this.library.lockKeypad;
      this.materials.knobIntTexture = this.library.knobIntTexture;
      this.materials.logoFace = this.library.badge;
      this.materials.miUSAFace = this.library.miusa;
      // this.materials.shinyShadows = this.library.shinyShadows;
    }

    // Environmental

    createFloorShadowMaterial(){
      let shadowTexture = this.textureLibrary.floorShadow;

      return new THREE.MeshBasicMaterial({
        transparent: true,
        blending: THREE.MultiplyBlending,
        color: new THREE.Color( 0xffffff ),
        map: shadowTexture
      })
    }

    createWallsMaterial(){
      let mapTexture = this.textureLibrary.wallsDiffused;

      return new THREE.MeshBasicMaterial({
        // transparent: true,
        // blending: THREE.MultiplyBlending,
        // color: 0xffffff,
        side: THREE.BackSide,
        map: mapTexture
      })
    }

    // Metals

    createStandardMetalMaterial(){
      let normalTexture = this.textureLibrary.metalSheetNormal;

      normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
      normalTexture.repeat.set( 4, 4 );

      return new THREE.MeshPhongMaterial( {
        color: 0xffffff,
        specular: 0x464646,
        shininess: 23,
        envMap: this.textureLibrary.envMap,
        combine: THREE.MixOperation,
        reflectivity: 0.1,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2( 0.08, 0.08 )
      });
    }

    // createShinyMetalWithShadows(){
    //   return new THREE.MeshPhongMaterial({
    //     color: 0xB9C3CA,
    //     combine: THREE.Multiply,
    //     envMap: this.textureLibrary.envMap,
    //     reflectivity: 0.15,
    //     shininess: 90,
    //     specular:0xffffff
    //   })
    // }

    // Plastics

    createPlasticLamMaterial(){
      let normalTexture = this.textureLibrary.laminateGray;

      return new THREE.MeshPhongMaterial({
        color: 0xbdbab2,
        normalMap: normalTexture
      })
    }

    // Rubber

    createRubberMaterial(){
      let colorTexture = this.textureLibrary.rubberColor,
          reflectionTexture = this.textureLibrary.rubberNormal,
          normalTexture = this.textureLibrary.rubberReflection;

      colorTexture.wrapS = colorTexture.wrapT = THREE.RepeatWrapping;
      reflectionTexture.wrapS = reflectionTexture.wrapT = THREE.RepeatWrapping;
      normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;

      colorTexture.repeat.set( 6, 9 );
      reflectionTexture.repeat.set( 6, 9 );
      normalTexture.repeat.set( 6, 9 );

      return new THREE.MeshPhongMaterial( {
        color: 0xffffff,
        specular: 0xffffff,
        shininess: 100,
        combine: THREE.MixOperation,
        reflectivity: 0.9,
        map: colorTexture,
        envMap: this.textureLibrary.envMap,
        normalMap: normalTexture,
        specularMap: reflectionTexture
      });
    }

    // Woods

    createButcherBlock(){
      let grainTexture = this.textureLibrary.butcherBlockMain;

      let sideGrainTexture = grainTexture.clone();
      sideGrainTexture.wrapS = THREE.RepeatWrapping;
      sideGrainTexture.repeat.set(2,0.2);
      sideGrainTexture.needsUpdate = true; // Needed for cloned textures.

      let endGrainTexture = this.textureLibrary.butcherBlockEnd;
      endGrainTexture.wrapS = THREE.RepeatWrapping;
      endGrainTexture.repeat.set(4.5,.65);

      let topGrain = new THREE.MeshLambertMaterial({ map: grainTexture }),
          sideGrain = new THREE.MeshLambertMaterial({ map: sideGrainTexture }),
          endGrain = new THREE.MeshLambertMaterial({
        map: endGrainTexture }),
          materials = [
           endGrain, endGrain,
           topGrain, topGrain,
           sideGrain, sideGrain
          ];

      return materials ;
    }

    createListaTopMaterial(){
      let topTexture = this.textureLibrary.particleBoardTop;
      topTexture.wrapS = topTexture.wrapT = THREE.RepeatWrapping;
      topTexture.repeat.set( 3, 3 );

      let sideTexture = this.textureLibrary.particleBoardSide;
      sideTexture.wrapS = THREE.RepeatWrapping;
      sideTexture.repeat.set( 8, 1 );

      let topGrain = new THREE.MeshLambertMaterial({ map: topTexture }),
          sideGrain = new THREE.MeshLambertMaterial({ map: sideTexture }),
          materials = [
           sideGrain, sideGrain,
           topGrain, topGrain,
           sideGrain, sideGrain
          ];

      return materials ;
    }

    // Pictures/Faces

    createLockFaceMaterial(){
      var lockTexture = this.textureLibrary.lockKeyedFace;
      return new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: lockTexture,
        normalMap: lockTexture,
        normalScale: new THREE.Vector2( 10, 10  )
      })
    }

    createLogoBadgeMaterial(){
      let badgeFace = this.textureLibrary.badgeBrandFace;
      badgeFace.wrapS = badgeFace.wrapT = THREE.RepeatWrapping;

      let face = new THREE.MeshBasicMaterial({ map: badgeFace })

      return face;
    }

    createMIUSAMaterial(){
      let badgeFace = this.textureLibrary.badgeMIUSAFace;
      badgeFace.wrapS = badgeFace.wrapT = THREE.RepeatWrapping;
      badgeFace.repeat.set( 0.90, 0.68 );
      badgeFace.offset.set( 0.045, 0.16 );

      let face = new THREE.MeshBasicMaterial({ map: badgeFace })

      return face ;
    }

    // Model maps

    createKnobIntegratedMaterial(){
      const rough = this.textureLibrary.steelGrip;

      rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
      rough.repeat.set( 0.02, 0.02 );

      const face = new THREE.MeshPhongMaterial({ map: rough }),
            side = this.textureLibrary.steelHalo,
            materials = [
             face, side,
             side, side,
             side, side
            ];

      return materials ;
    }

    createKeypadLockMaterial(){
      const mapTexture = this.textureLibrary.lockKeypadColor,
            normalTexture = this.textureLibrary.lockKeypadNormal,
            roughnessTexture = this.textureLibrary.lockKeypadRoughness;

      return new THREE.MeshStandardMaterial( {
        color: 0xffffff,
        envMap : this.textureLibrary.envMap,
        map: mapTexture,
        metalness : 0.55,
        normalMap : normalTexture,
        roughness: 0.9,
        roughnessMap: roughnessTexture
      })
    }

    // Unused

    // createStandardMetalDrawerMaterial(){
    //   var textureLoader = new THREE.TextureLoader();
    //   var normalTexture = textureLoader.load( "/textures/maps/metal-powdercoat/NormalMapStrong.png" );
    //   var shadowTexture = textureLoader.load( "/textures/maps/drawer-shadow.jpg" );
    //   var specTexture = textureLoader.load( "/textures/maps/metal-powdercoat/SpecularMap.png" );
    //   normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
    //   normalTexture.repeat.set( 20, 2 );
    //   shadowTexture.repeat.set( 1, 1 );
    //
    //   specTexture.wrapS = specTexture.wrapT = THREE.RepeatWrapping;
    //   specTexture.repeat.set( 40, 4 );
    //
    //   return new THREE.MeshPhongMaterial( {
    //     color: 0xffffff,
    //     specular: 0x464646,
    //     shininess: 23,
    //     specularMap: specTexture,
    //     envMap: this.textureLibrary.envMap,
    //     combine: THREE.MixOperation,
    //     reflectivity: 0.7,
    //     map: shadowTexture, //textureLoader.load( "/textures/normals/extruded-metal.jpg" ),
    //     normalMap: normalTexture,
    //     normalScale: new THREE.Vector2( 0.08, 0.08 )
    //   });
    // }

    // createRoomDiffusedMaterial(){
    //   // var shadowTexture = loader.load('/textures/maps/ground-diffused.jpg');
    //   // var shadowTexture = loader.load('/textures/maps/floor_checker.png');
    //   var shadowTexture = loader.load('/textures/maps/floor_concrete.png'); // (7,7)
    //   // var shadowTexture = loader.load('/textures/maps/floor_wood.png'); // (4,4)
    //   shadowTexture.wrapS = shadowTexture.wrapT = THREE.RepeatWrapping;
    //   shadowTexture.repeat.set(7,7);
    //   return new THREE.MeshBasicMaterial({
    //     // transparent: true,
    //     // blending: THREE.MultiplyBlending,
    //     color: 0xffffff,
    //     map: shadowTexture
    //   })
    // }

  }

  return MaterialManager;
}
