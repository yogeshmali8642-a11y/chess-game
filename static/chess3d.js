/**
 * Knightfall Chess 3D Engine
 * WebGL 3D Chess Studio powered by Three.js
 */

(function () {
  const FILES = 'abcdefgh';
  const TILE_SIZE = 1.35;
  const HALF_BOARD = 4 * TILE_SIZE;

  // Board themes definition
  const THEMES = {
    royal: {
      name: 'Royal Classical',
      lightTile: 0xf5eedc,
      darkTile: 0x5a2d1d,
      lightRoughness: 0.18,
      darkRoughness: 0.22,
      border: 0x1f0f08,
      trim: 0xf59e0b,
      table: 0x0c0705
    },
    emerald: {
      name: 'Emerald Onyx',
      lightTile: 0xeeebd0,
      darkTile: 0x41684c,
      lightRoughness: 0.22,
      darkRoughness: 0.28,
      border: 0x1a241b,
      trim: 0xbf9b30,
      table: 0x0e1410
    },
    wood: {
      name: 'Italian Walnut',
      lightTile: 0xded2b9,
      darkTile: 0x8a5233,
      lightRoughness: 0.35,
      darkRoughness: 0.40,
      border: 0x2e180d,
      trim: 0xd4af37,
      table: 0x120c09
    },
    midnight: {
      name: 'Midnight Cyber',
      lightTile: 0xdce9f5,
      darkTile: 0x1f2937,
      lightRoughness: 0.15,
      darkRoughness: 0.20,
      border: 0x0f172a,
      trim: 0x06b6d4,
      table: 0x090d16
    },
    marble: {
      name: 'Carrara Marble',
      lightTile: 0xf3f4f6,
      darkTile: 0x374151,
      lightRoughness: 0.18,
      darkRoughness: 0.25,
      border: 0x111827,
      trim: 0x9ca3af,
      table: 0x0b0f19
    }
  };

  class Chess3D {
    constructor() {
      this.container = null;
      this.onSquareClicked = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.controls = null;
      this.animId = null;

      this.currentTheme = 'emerald';
      this.piecesGroup = null;
      this.boardGroup = null;
      this.markersGroup = null;
      this.tileMeshes = {}; // square -> mesh
      this.pieceMeshes = {}; // square -> mesh

      this.pieceGeometries = {};
      this.materials = {};

      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.hoveredSquare = null;

      this.cameraTargetPos = null;
      this.cameraStartPos = null;
      this.cameraLerpProgress = 1;

      this.animatingPieces = [];
      this.flipped = false;
      this.clock = new THREE.Clock();
    }

    init(container, onSquareClicked) {
      this.container = container;
      this.onSquareClicked = onSquareClicked;

      // Clean any existing canvas
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      const width = container.clientWidth || 640;
      const height = container.clientHeight || 640;

      // Renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.08;
      container.appendChild(this.renderer.domElement);

      // Scene
      this.scene = new THREE.Scene();

      // Camera
      this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      this.camera.position.set(0, 12.5, 11.5);

      // Controls
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.07;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.08; // don't go below table
      this.controls.minDistance = 6.0;
      this.controls.maxDistance = 26.0;
      this.controls.target.set(0, 0, 0);

      this.buildLighting();
      this.buildMaterials();
      this.buildGeometries();
      this.buildBoard();

      this.piecesGroup = new THREE.Group();
      this.scene.add(this.piecesGroup);

      this.markersGroup = new THREE.Group();
      this.scene.add(this.markersGroup);

      // Event listeners
      this.onPointerDown = this.handlePointerDown.bind(this);
      this.onPointerMove = this.handlePointerMove.bind(this);
      this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
      this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);

      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(container);

      this.animate();
    }

    buildLighting() {
      // Ambient soft glow
      const ambient = new THREE.AmbientLight(0xffffff, 0.75);
      this.scene.add(ambient);

      // Key light - warm directional with shadow
      const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.35);
      keyLight.position.set(9, 16, 11);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 40;
      keyLight.shadow.camera.left = -9;
      keyLight.shadow.camera.right = 9;
      keyLight.shadow.camera.top = 9;
      keyLight.shadow.camera.bottom = -9;
      keyLight.shadow.bias = -0.0004;
      this.scene.add(keyLight);

      // Fill light - cool blue-sky tone
      const fillLight = new THREE.DirectionalLight(0x90caf9, 0.65);
      fillLight.position.set(-11, 12, -9);
      this.scene.add(fillLight);

      // Rim light - sharp highlight
      const rimLight = new THREE.DirectionalLight(0xa7f3d0, 0.4);
      rimLight.position.set(0, 8, -12);
      this.scene.add(rimLight);
    }

    buildMaterials() {
      const theme = THEMES[this.currentTheme];

      // Pieces materials
      this.materials.whitePiece = new THREE.MeshStandardMaterial({
        color: 0xfcfaf2,
        roughness: 0.18,
        metalness: 0.08,
      });

      this.materials.blackPiece = new THREE.MeshStandardMaterial({
        color: 0x1b1c20,
        roughness: 0.22,
        metalness: 0.25,
      });

      this.materials.goldTrim = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.25,
        metalness: 0.85,
      });

      // Board tile materials
      this.materials.lightTile = new THREE.MeshStandardMaterial({
        color: theme.lightTile,
        roughness: theme.lightRoughness,
        metalness: 0.04
      });

      this.materials.darkTile = new THREE.MeshStandardMaterial({
        color: theme.darkTile,
        roughness: theme.darkRoughness,
        metalness: 0.08
      });

      // Border and plinth
      this.materials.boardBorder = new THREE.MeshStandardMaterial({
        color: theme.border,
        roughness: 0.35,
        metalness: 0.15
      });

      this.materials.boardTrim = new THREE.MeshStandardMaterial({
        color: theme.trim,
        roughness: 0.25,
        metalness: 0.8
      });

      this.materials.table = new THREE.MeshStandardMaterial({
        color: theme.table,
        roughness: 0.7,
        metalness: 0.05
      });

      // Marker materials
      this.materials.selectedMarker = new THREE.MeshBasicMaterial({
        color: 0xb8f36a,
        transparent: true,
        opacity: 0.55,
        depthWrite: false
      });

      this.materials.lastMoveMarker = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
      });

      this.materials.legalMoveDot = new THREE.MeshBasicMaterial({
        color: 0xb8f36a,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
      });

      this.materials.legalCaptureRing = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      });

      this.materials.checkPulse = new THREE.MeshBasicMaterial({
        color: 0xdc2626,
        transparent: true,
        opacity: 0.65,
        depthWrite: false
      });
    }

    buildGeometries() {
      // Lathe helper
      const createLathe = (points, segs = 32) => {
        const v = points.map(p => new THREE.Vector2(p[0], p[1]));
        const geom = new THREE.LatheGeometry(v, segs);
        geom.computeVertexNormals();
        return geom;
      };

      // Staunton base profile common to pieces
      const basePts = [
        [0, 0],
        [0.46, 0],
        [0.47, 0.03],
        [0.44, 0.08],
        [0.40, 0.12],
        [0.38, 0.18],
        [0.34, 0.22],
        [0.31, 0.28],
      ];

      // PAWN
      const pawnPts = [
        ...basePts,
        [0.26, 0.36],
        [0.20, 0.52],
        [0.17, 0.68],
        [0.22, 0.72],
        [0.22, 0.76],
        [0.15, 0.78],
        [0.18, 0.81],
        [0.23, 0.87],
        [0.24, 0.95],
        [0.20, 1.03],
        [0.12, 1.08],
        [0, 1.09]
      ];
      this.pieceGeometries.pawn = createLathe(pawnPts, 32);

      // ROOK
      const rookPts = [
        ...basePts,
        [0.30, 0.35],
        [0.27, 0.65],
        [0.25, 0.88],
        [0.32, 0.98],
        [0.36, 1.03],
        [0.37, 1.07],
        [0.35, 1.07],
        [0.35, 1.25],
        [0.28, 1.25],
        [0.28, 1.15],
        [0, 1.15]
      ];
      const rookBody = createLathe(rookPts, 32);
      
      // Castle crenellations (battlements)
      const rookGroup = new THREE.Group();
      rookGroup.add(new THREE.Mesh(rookBody));
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const toothGeom = new THREE.BoxGeometry(0.12, 0.14, 0.12);
        const tooth = new THREE.Mesh(toothGeom);
        tooth.position.set(Math.cos(angle) * 0.31, 1.25, Math.sin(angle) * 0.31);
        tooth.rotation.y = -angle;
        rookGroup.add(tooth);
      }
      this.pieceGeometries.rook = rookGroup;

      // KNIGHT
      const knightBasePts = [
        ...basePts,
        [0.32, 0.35],
        [0.30, 0.46],
        [0.24, 0.50],
        [0, 0.50]
      ];
      const knightBase = createLathe(knightBasePts, 32);

      // Extruded Staunton Horse Head
      const horseShape = new THREE.Shape();
      horseShape.moveTo(0.0, 0.0);
      horseShape.lineTo(-0.16, 0.30);
      horseShape.quadraticCurveTo(-0.20, 0.65, -0.12, 0.85); // mane / ear back
      horseShape.lineTo(-0.06, 0.95); // ear tip
      horseShape.lineTo(-0.01, 0.86); // ear front
      horseShape.quadraticCurveTo(0.12, 0.82, 0.22, 0.65); // forehead / nose bridge
      horseShape.quadraticCurveTo(0.32, 0.52, 0.26, 0.40); // muzzle snout
      horseShape.lineTo(0.16, 0.40); // mouth / chin
      horseShape.quadraticCurveTo(0.08, 0.25, 0.16, 0.0); // throat / chest
      horseShape.closePath();

      const horseGeom = new THREE.ExtrudeGeometry(horseShape, {
        depth: 0.24,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.03,
        bevelThickness: 0.03
      });
      horseGeom.center();
      horseGeom.rotateY(Math.PI / 2);
      horseGeom.translate(0, 0.95, 0);

      const knightGroup = new THREE.Group();
      knightGroup.add(new THREE.Mesh(knightBase));
      knightGroup.add(new THREE.Mesh(horseGeom));
      this.pieceGeometries.knight = knightGroup;

      // BISHOP
      const bishopPts = [
        ...basePts,
        [0.28, 0.35],
        [0.21, 0.65],
        [0.18, 0.90],
        [0.26, 0.98],
        [0.26, 1.02],
        [0.19, 1.04],
        [0.25, 1.12],
        [0.29, 1.25],
        [0.27, 1.38],
        [0.17, 1.48],
        [0.08, 1.54],
        [0, 1.56]
      ];
      const bishopBody = createLathe(bishopPts, 32);
      const bishopFinial = new THREE.SphereGeometry(0.07, 16, 16);
      bishopFinial.translate(0, 1.61, 0);

      const bishopGroup = new THREE.Group();
      bishopGroup.add(new THREE.Mesh(bishopBody));
      bishopGroup.add(new THREE.Mesh(bishopFinial));
      this.pieceGeometries.bishop = bishopGroup;

      // QUEEN
      const queenPts = [
        ...basePts,
        [0.32, 0.35],
        [0.24, 0.70],
        [0.19, 1.05],
        [0.28, 1.15],
        [0.30, 1.20],
        [0.23, 1.23],
        [0.26, 1.35],
        [0.34, 1.52],
        [0.38, 1.66],
        [0.32, 1.66],
        [0.12, 1.55],
        [0, 1.55]
      ];
      const queenBody = createLathe(queenPts, 32);
      const queenFinial = new THREE.SphereGeometry(0.09, 16, 16);
      queenFinial.translate(0, 1.74, 0);

      const queenGroup = new THREE.Group();
      queenGroup.add(new THREE.Mesh(queenBody));
      queenGroup.add(new THREE.Mesh(queenFinial));

      // 8 small coronet beads
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI * 2) / 8;
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12));
        bead.position.set(Math.cos(ang) * 0.36, 1.68, Math.sin(ang) * 0.36);
        queenGroup.add(bead);
      }
      this.pieceGeometries.queen = queenGroup;

      // KING
      const kingPts = [
        ...basePts,
        [0.34, 0.35],
        [0.26, 0.75],
        [0.22, 1.15],
        [0.32, 1.26],
        [0.34, 1.33],
        [0.25, 1.36],
        [0.31, 1.48],
        [0.37, 1.65],
        [0.36, 1.80],
        [0.25, 1.88],
        [0.12, 1.90],
        [0, 1.90]
      ];
      const kingBody = createLathe(kingPts, 32);

      // Regal 3D Cross
      const crossVertical = new THREE.BoxGeometry(0.07, 0.28, 0.07);
      crossVertical.translate(0, 2.05, 0);
      const crossHorizontal = new THREE.BoxGeometry(0.24, 0.07, 0.07);
      crossHorizontal.translate(0, 2.10, 0);

      const kingGroup = new THREE.Group();
      kingGroup.add(new THREE.Mesh(kingBody));
      kingGroup.add(new THREE.Mesh(crossVertical));
      kingGroup.add(new THREE.Mesh(crossHorizontal));
      this.pieceGeometries.king = kingGroup;
    }

    buildBoard() {
      if (this.boardGroup) {
        this.scene.remove(this.boardGroup);
      }
      this.boardGroup = new THREE.Group();
      this.tileMeshes = {};

      const borderThickness = 0.75;
      const boardWidth = HALF_BOARD * 2;
      const totalWidth = boardWidth + borderThickness * 2;
      const boardHeight = 0.55;

      // Outer table plinth
      const tableGeom = new THREE.BoxGeometry(totalWidth + 4, 0.3, totalWidth + 4);
      const tableMesh = new THREE.Mesh(tableGeom, this.materials.table);
      tableMesh.position.y = -0.42;
      tableMesh.receiveShadow = true;
      this.boardGroup.add(tableMesh);

      // Pedestal beveled plinth base
      const borderGeom = new THREE.BoxGeometry(totalWidth, boardHeight, totalWidth);
      const borderMesh = new THREE.Mesh(borderGeom, this.materials.boardBorder);
      borderMesh.position.y = -boardHeight / 2;
      borderMesh.receiveShadow = true;
      borderMesh.castShadow = true;
      this.boardGroup.add(borderMesh);

      // Brass / Metallic trim inlay between border and tiles
      const trimGeom = new THREE.BoxGeometry(boardWidth + 0.12, 0.04, boardWidth + 0.12);
      const trimMesh = new THREE.Mesh(trimGeom, this.materials.boardTrim);
      trimMesh.position.y = 0.01;
      this.boardGroup.add(trimMesh);

      // 64 individual tiles
      const tileGeom = new THREE.BoxGeometry(TILE_SIZE - 0.015, 0.15, TILE_SIZE - 0.015);

      for (let rank = 1; rank <= 8; rank++) {
        for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
          const file = FILES[fileIdx];
          const square = `${file}${rank}`;
          const isLight = (fileIdx + rank) % 2 !== 0;

          const tileMat = isLight ? this.materials.lightTile.clone() : this.materials.darkTile.clone();
          const tile = new THREE.Mesh(tileGeom, tileMat);

          const { x, z } = this.squareToWorld(square);
          tile.position.set(x, 0.075, z);
          tile.receiveShadow = true;
          tile.userData = { square, isLight, originalColor: tileMat.color.getHex() };

          this.tileMeshes[square] = tile;
          this.boardGroup.add(tile);
        }
      }

      this.scene.add(this.boardGroup);
    }

    squareToWorld(square) {
      const fileIdx = FILES.indexOf(square[0]);
      const rank = parseInt(square[1], 10);

      // standard: a1 is at (-3.5, 3.5)
      let x = (fileIdx - 3.5) * TILE_SIZE;
      let z = (4.5 - rank) * TILE_SIZE;

      if (this.flipped) {
        x = -x;
        z = -z;
      }
      return { x, z };
    }

    worldToSquare(x, z) {
      let normX = x / TILE_SIZE + 3.5;
      let normZ = 4.5 - z / TILE_SIZE;

      if (this.flipped) {
        normX = 7 - (normX - 0);
        normZ = 9 - normZ;
      }

      const fileIdx = Math.round(normX);
      const rank = Math.round(normZ);

      if (fileIdx >= 0 && fileIdx < 8 && rank >= 1 && rank <= 8) {
        return `${FILES[fileIdx]}${rank}`;
      }
      return null;
    }

    createPieceMesh(pieceChar) {
      const isWhite = pieceChar === pieceChar.toUpperCase();
      const type = pieceChar.toLowerCase();
      const typeMap = {
        p: 'pawn',
        r: 'rook',
        n: 'knight',
        b: 'bishop',
        q: 'queen',
        k: 'king'
      };
      const modelKey = typeMap[type] || 'pawn';
      const geomOrGroup = this.pieceGeometries[modelKey];
      const mat = isWhite ? this.materials.whitePiece : this.materials.blackPiece;

      let pieceObject;
      if (geomOrGroup.isGroup) {
        pieceObject = geomOrGroup.clone();
        pieceObject.traverse(child => {
          if (child.isMesh) {
            child.material = mat;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      } else {
        pieceObject = new THREE.Mesh(geomOrGroup, mat);
        pieceObject.castShadow = true;
        pieceObject.receiveShadow = true;
      }

      // Rotate Knights to face opponent
      if (type === 'n') {
        pieceObject.rotation.y = isWhite ? 0 : Math.PI;
      }

      const wrapper = new THREE.Group();
      wrapper.add(pieceObject);
      wrapper.userData = { piece: pieceChar, isWhite };
      return wrapper;
    }

    update(gameState, selectedSquare, selectedMoves, flipped) {
      if (this.flipped !== flipped) {
        this.flipped = flipped;
        // Re-position board tiles and pieces
        for (const [sq, tile] of Object.entries(this.tileMeshes)) {
          const { x, z } = this.squareToWorld(sq);
          tile.position.set(x, 0.075, z);
        }
      }

      this.updatePieces(gameState);
      this.updateMarkers(gameState, selectedSquare, selectedMoves);
    }

    updatePieces(gameState) {
      const currentPieces = gameState.pieces || {};
      const newPieceMeshes = {};

      // Check if last move had an animation target
      const lastMove = gameState.last_move;
      let animatedFrom = null;
      let animatedTo = null;
      if (lastMove && lastMove.length >= 4) {
        animatedFrom = lastMove.slice(0, 2);
        animatedTo = lastMove.slice(2, 4);
      }

      for (const [square, pieceChar] of Object.entries(currentPieces)) {
        const { x, z } = this.squareToWorld(square);

        let mesh = this.pieceMeshes[square];
        if (mesh && mesh.userData.piece === pieceChar) {
          // Re-use mesh
          mesh.position.set(x, 0.15, z);
          newPieceMeshes[square] = mesh;
          delete this.pieceMeshes[square];
        } else {
          // Check if piece came from animatedFrom
          let sourceMesh = animatedFrom && this.pieceMeshes[animatedFrom];
          if (sourceMesh && animatedTo === square) {
            // Animate movement from old square to new square!
            const fromPos = this.squareToWorld(animatedFrom);
            sourceMesh.position.set(fromPos.x, 0.15, fromPos.z);
            this.startMoveAnimation(sourceMesh, fromPos.x, fromPos.z, x, z);
            sourceMesh.userData.piece = pieceChar;
            newPieceMeshes[square] = sourceMesh;
            delete this.pieceMeshes[animatedFrom];
          } else {
            // Create new piece mesh
            const newMesh = this.createPieceMesh(pieceChar);
            newMesh.position.set(x, 0.15, z);
            this.piecesGroup.add(newMesh);
            newPieceMeshes[square] = newMesh;
          }
        }
      }

      // Any remaining meshes in this.pieceMeshes were captured or removed
      for (const [sq, mesh] of Object.entries(this.pieceMeshes)) {
        this.animateCapture(mesh);
      }
      this.pieceMeshes = newPieceMeshes;
    }

    startMoveAnimation(mesh, startX, startZ, endX, endZ) {
      const anim = {
        mesh,
        startX,
        startZ,
        endX,
        endZ,
        progress: 0,
        duration: 0.28, // seconds
        elapsed: 0
      };
      this.animatingPieces.push(anim);
    }

    animateCapture(mesh) {
      const startScale = mesh.scale.x;
      const startTime = performance.now();
      const dur = 260; // ms

      const step = () => {
        const p = Math.min((performance.now() - startTime) / dur, 1);
        mesh.scale.setScalar(startScale * (1 - p));
        mesh.position.y = 0.15 - p * 0.4;
        mesh.rotation.x += 0.05;
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          this.piecesGroup.remove(mesh);
        }
      };
      step();
    }

    updateMarkers(gameState, selectedSquare, selectedMoves) {
      // Clear markers
      while (this.markersGroup.children.length) {
        this.markersGroup.remove(this.markersGroup.children[0]);
      }

      // Reset tile colors
      for (const [sq, tile] of Object.entries(this.tileMeshes)) {
        tile.material.color.setHex(tile.userData.originalColor);
        tile.material.emissive.setHex(0x000000);
      }

      // 1. Highlight Last Move
      if (gameState.last_move && gameState.last_move.length >= 4) {
        const from = gameState.last_move.slice(0, 2);
        const to = gameState.last_move.slice(2, 4);
        [from, to].forEach(sq => {
          const tile = this.tileMeshes[sq];
          if (tile) {
            tile.material.emissive.setHex(0x382808);
            this.addTileGlowOverlay(sq, 0xf59e0b, 0.28);
          }
        });
      }

      // 2. Highlight Selected Square
      if (selectedSquare) {
        const tile = this.tileMeshes[selectedSquare];
        if (tile) {
          tile.material.emissive.setHex(0x2d4a14);
          this.addTileGlowOverlay(selectedSquare, 0xb8f36a, 0.45);
        }
      }

      // 3. Highlight Check
      if (gameState.check_square) {
        const tile = this.tileMeshes[gameState.check_square];
        if (tile) {
          tile.material.emissive.setHex(0x550e0e);
          this.addCheckPulse(gameState.check_square);
        }
      }

      // 4. Highlight Legal Moves
      if (selectedMoves && selectedMoves.length) {
        selectedMoves.forEach(move => {
          const toSq = move.to;
          const isCapture = !!gameState.pieces[toSq];
          if (isCapture) {
            this.addCaptureRing(toSq);
          } else {
            this.addLegalDot(toSq);
          }
        });
      }
    }

    addTileGlowOverlay(square, hexColor, opacity) {
      const { x, z } = this.squareToWorld(square);
      const geom = new THREE.PlaneGeometry(TILE_SIZE - 0.06, TILE_SIZE - 0.06);
      const mat = new THREE.MeshBasicMaterial({
        color: hexColor,
        transparent: true,
        opacity: opacity,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.155, z);
      this.markersGroup.add(mesh);
    }

    addLegalDot(square) {
      const { x, z } = this.squareToWorld(square);
      const geom = new THREE.CylinderGeometry(0.22, 0.22, 0.05, 24);
      const mat = this.materials.legalMoveDot;
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, 0.17, z);
      mesh.userData = { isMarker: true, square };
      this.markersGroup.add(mesh);
    }

    addCaptureRing(square) {
      const { x, z } = this.squareToWorld(square);
      const geom = new THREE.RingGeometry(0.38, 0.52, 32);
      const mat = this.materials.legalCaptureRing;
      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.175, z);
      mesh.userData = { isMarker: true, square };
      this.markersGroup.add(mesh);
    }

    addCheckPulse(square) {
      const { x, z } = this.squareToWorld(square);
      const geom = new THREE.RingGeometry(0.2, 0.58, 32);
      const mat = this.materials.checkPulse;
      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.178, z);
      this.markersGroup.add(mesh);
    }

    handlePointerDown(event) {
      // Raycast to find clicked square
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check board tiles first
      const tiles = Object.values(this.tileMeshes);
      const intersects = this.raycaster.intersectObjects(tiles, false);

      if (intersects.length > 0) {
        const square = intersects[0].object.userData.square;
        if (square && this.onSquareClicked) {
          this.onSquareClicked(square);
        }
      }
    }

    handlePointerMove(event) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const tiles = Object.values(this.tileMeshes);
      const intersects = this.raycaster.intersectObjects(tiles, false);

      if (intersects.length > 0) {
        this.renderer.domElement.style.cursor = 'pointer';
      } else {
        this.renderer.domElement.style.cursor = 'default';
      }
    }

    setCameraPreset(name) {
      const presets = {
        player: { x: 0, y: 12.0, z: this.flipped ? -11.5 : 11.5 },
        opponent: { x: 0, y: 12.0, z: this.flipped ? 11.5 : -11.5 },
        broadcast: { x: 9.5, y: 11.0, z: 9.5 },
        topdown: { x: 0.001, y: 15.5, z: 0.001 }
      };

      const target = presets[name] || presets.player;
      this.cameraStartPos = this.camera.position.clone();
      this.cameraTargetPos = new THREE.Vector3(target.x, target.y, target.z);
      this.cameraLerpProgress = 0;
    }

    setTheme(themeKey) {
      if (!THEMES[themeKey]) return;
      this.currentTheme = themeKey;
      const theme = THEMES[themeKey];

      // Update materials
      this.materials.lightTile.color.setHex(theme.lightTile);
      this.materials.lightTile.roughness = theme.lightRoughness;

      this.materials.darkTile.color.setHex(theme.darkTile);
      this.materials.darkTile.roughness = theme.darkRoughness;

      this.materials.boardBorder.color.setHex(theme.border);
      this.materials.boardTrim.color.setHex(theme.trim);
      this.materials.table.color.setHex(theme.table);

      // Re-assign tile colors
      for (const [sq, tile] of Object.entries(this.tileMeshes)) {
        const isLight = tile.userData.isLight;
        const color = isLight ? theme.lightTile : theme.darkTile;
        tile.userData.originalColor = color;
        tile.material.color.setHex(color);
      }
    }

    resize() {
      if (!this.container || !this.renderer || !this.camera) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (w === 0 || h === 0) return;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    animate() {
      this.animId = requestAnimationFrame(() => this.animate());

      const delta = this.clock.getDelta();

      // Camera lerp transition
      if (this.cameraLerpProgress < 1 && this.cameraTargetPos) {
        this.cameraLerpProgress += delta * 2.8;
        const t = Math.min(this.cameraLerpProgress, 1);
        const smoothT = t * t * (3 - 2 * t); // smoothstep
        this.camera.position.lerpVectors(this.cameraStartPos, this.cameraTargetPos, smoothT);
        this.controls.update();
      } else {
        this.controls.update();
      }

      // Piece move animations (jumping arc)
      for (let i = this.animatingPieces.length - 1; i >= 0; i--) {
        const a = this.animatingPieces[i];
        a.elapsed += delta;
        const t = Math.min(a.elapsed / a.duration, 1);
        const smoothT = t * (2 - t); // ease out

        const currX = a.startX + (a.endX - a.startX) * smoothT;
        const currZ = a.startZ + (a.endZ - a.startZ) * smoothT;
        // Parabolic arc jump
        const heightArc = Math.sin(t * Math.PI) * 0.85;

        a.mesh.position.set(currX, 0.15 + heightArc, currZ);

        if (t >= 1) {
          a.mesh.position.set(a.endX, 0.15, a.endZ);
          this.animatingPieces.splice(i, 1);
        }
      }

      this.renderer.render(this.scene, this.camera);
    }

    destroy() {
      if (this.animId) cancelAnimationFrame(this.animId);
      if (this.resizeObserver) this.resizeObserver.disconnect();
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
        this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
        if (this.renderer.domElement.parentNode) {
          this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        this.renderer.dispose();
      }
    }
  }

  window.Chess3D = Chess3D;
})();
