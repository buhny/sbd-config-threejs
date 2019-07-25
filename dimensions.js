class Dimensions {
  constructor(){
  }

  getBases() {
    return {
      solid : {
        recess : 30
      },
      wetClean : {
        fittingH : 10,
        pegRadiusSegments : 6,
        baseXOffset : 27,
        footH : 20,
        footR : 15.75,
        legH : 80.5,
        legR : 20.5,
        mountBtmW : 90,
        mountH : 20,
        mountTopW : 120,
        radiusSegs : 6
      }
    }
  }

  getCamera() {
    return {
      defaultFov : 25
    }
  }

  getDoors() {
    return {
      depth: 20,
      flushOffset: 8,
      heightSpacer: 6,
      wallThickness: 2,
      flush : {
        lockOffset: 40,
        offsetH : 4,
        pullBackW : 25,
        pullFrontW : 10
      },
      retractable : {
        lockBaseWidth: 52,
        lockBaseDepth: 14,
        pullBackH: 70,
        pullFrontH: 16
      },
      intKnob : {
        backD : 1,
        baseW : 56,
        baseH : 90,
        baseD : 4,
        baseR : 5,
        holeH : 25,
        holeInset: 3,
        xOffset : 14,
        lockOffset : 5
      },
      dhd : {
        barD : 24,
        barH : 32,
        doorFrameGap: 0.5,
        doorWOffset : 1,
        knobHOffsets: {
          h1525 : 749,
          h1350 : 599,
          h1225 : 449,
          h1050 : 299,
          h900 : 149,
          hDefault : 99
        }
      },
      sd : {
        btmH : 12,
        depth : 32,
        doorHOffset : 2,
        doorRightD : 10,
        knobT : 4,
        knobW : 24,
        lockX : -50,
        topH : 20,
        trackOffset : 6
      },
      lock: {
        length: 20,
        sideOffset : 35,
        bottomOffset : 37
      }
    }
  }

  getDrawers() {
    return {
      flange : {
        long : 8,
        shortDiff : 3
      },
      wallThickness : 2,
      widthOffset : 20
    }
  }

  getHandles() {
    return {
      sideOffset: 6,
      blackPlastic : {
        yOffset: -18,
        distanceApart : {
          default : 517,
          smaller : 364,
          smallest : 234
        },
        widthBreakPts : {
          smaller : 700,
          smallest : 500
        }
      },
      pushHandle : {
        handleD : -66,
        posX : 3,
        yOffset : -120,
        z : 100
      },
      steel : {
        rightXAdjust : 8,
        yOffset : -14
      },
      techSeries : {
        barD : 60,
        barY : 19,
        posX : 3,
        yOffset : -120,
        zOffset : 100
      },
      twoHandles : {
        sideW : 6.25,
        xOffset : 4
      }
    }
  }

  getHousing() {
    return {
      ceilingH : 38,
      floorH : 54,
      heightDiff: 100,
      wallThickness : 4, // Arbitrary
      sides : {
        width : 20, // Arbitrary
        inset : 1.5,
        bevelSide : 8,
        heightOffset: 10
      },
      badges : {
        height : 16,
        xOffset : 50,
        zOffset : 0.5,
        logo : {
          width: 64,
          height: 16,
          thickness: 3
        },
        miUSA : {
          width: 40,
          height: 16,
          thickness: 3
        }
      }
    }
  }

  getInterior() {
    return {
      depthOffset : 52,
      spaceGap : 2,
      widthOffset : 59
    }
  }

  getLocks() {
    return {
      cylinder : {
        diameter : 28,
        length : 3,
        radiusSegs : 24
      },
      lockBar : {
        width : 60,
        hOffset : 10,
        depth : 20,
        holeH : 50,
        holeWOffset : 20,
        tangW : 4,
        tangH : 42,
        tangD : 20,
      },
      lilo : {
        xOffset : 15.5,
        yOffset : 40,
        tangW : 15,
        tangH : 10,
        tangR : 3,
        coverL : 25,
        coverR : 4
      }
    }
  }

  getPulls() {
    return {
      pullD : 12,
      pullH : 22
    }
  }

  getTops() {
    return {
      mat : {
        height: 2,
        inset : 3
      },
      retainer : {
        wallT : 1.5
      }
    }
  }

  getTrays() {
    return {
      bottomH : 5,
      bottomGap : 2,
      sidewallH : 33,
      sidewallW : 20,
      faceH : 38,
      faceD : 2,
      faceOffset : 2
    }
  }

}
export let Dimension = new Dimensions();
