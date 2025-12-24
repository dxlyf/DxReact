import * as THREEObj from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
const THREE=Object.assign({},THREEObj)
THREE.PointerLockControls=PointerLockControls
THREE.GLTFLoader=GLTFLoader
THREE.OrbitControls=OrbitControls
// game.js
class FPSGame {
    constructor() {
        // 游戏状态
        this.gameState = 'MENU'; // MENU, PLAYING, PAUSED, GAME_OVER
        this.score = 0;
        this.wave = 1;
        this.maxEnemies = 10;
        
        // 玩家属性
        this.player = {
            health: 100,
            maxHealth: 100,
            speed: 5,
            jumpForce: 8,
            isGrounded: false,
            weapons: [],
            currentWeaponIndex: 0,
            ammo: {
                rifle: { current: 30, total: 120, max: 30 },
                shotgun: { current: 8, total: 40, max: 8 },
                pistol: { current: 12, total: 60, max: 12 }
            }
        };

        // 敌人数组
        this.enemies = [];
        this.enemySpawnPoints = [];
        
        // Three.js对象
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // 游戏世界
        this.world = {
            gravity: -9.8,
            floor: null,
            walls: [],
            obstacles: [],
            lights: []
        };

        // 音频
        this.audio = {
            bgm: null,
            sounds: {}
        };

        // 输入状态
        this.keys = {};
        this.mouse = { x: 0, y: 0, buttons: {} };
        
        // 动画和效果
        this.clock = new THREE.Clock();
        this.mixers = [];
        this.particles = [];
        
        // 物理
        this.raycaster = new THREE.Raycaster();
        
        // 初始化
        this.init();
    }

    init() {
        // 初始化Three.js场景
        this.initScene();
        
        // 初始化游戏世界
        this.initWorld();
        
        // 初始化玩家
        this.initPlayer();
        
        // 初始化敌人
        this.initEnemies();
        
        // 初始化武器
        this.initWeapons();
        
        // 初始化音频
        this.initAudio();
        
        // 初始化UI
        this.initUI();
        
        // 初始化事件监听器
        this.initEventListeners();
        
        // 开始游戏循环
        this.gameLoop();
    }

    initScene() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 10, 100);

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.6, 0);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // 创建指针锁定控制
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        
        // 添加环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        this.world.lights.push(ambientLight);

        // 添加方向光（模拟太阳）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        this.world.lights.push(directionalLight);
    }

    initWorld() {
        // 创建地面
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        this.world.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.world.floor.rotation.x = -Math.PI / 2;
        this.world.floor.receiveShadow = true;
        this.scene.add(this.world.floor);

        // 创建墙壁
        this.createWalls();
        
        // 创建障碍物
        this.createObstacles();
        
        // 创建装饰物
        this.createDecorations();
        
        // 创建生成点
        this.createSpawnPoints();
    }

    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            roughness: 0.7,
            metalness: 0.3
        });

        // 创建围墙
        const wallHeight = 10;
        const wallThickness = 2;
        
        // 北墙
        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(100, wallHeight, wallThickness),
            wallMaterial
        );
        northWall.position.set(0, wallHeight/2, -50);
        northWall.castShadow = true;
        northWall.receiveShadow = true;
        this.scene.add(northWall);
        this.world.walls.push(northWall);

        // 南墙
        const southWall = new THREE.Mesh(
            new THREE.BoxGeometry(100, wallHeight, wallThickness),
            wallMaterial
        );
        southWall.position.set(0, wallHeight/2, 50);
        southWall.castShadow = true;
        southWall.receiveShadow = true;
        this.scene.add(southWall);
        this.world.walls.push(southWall);

        // 东墙
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, 100),
            wallMaterial
        );
        eastWall.position.set(50, wallHeight/2, 0);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        this.scene.add(eastWall);
        this.world.walls.push(eastWall);

        // 西墙
        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, 100),
            wallMaterial
        );
        westWall.position.set(-50, wallHeight/2, 0);
        westWall.castShadow = true;
        westWall.receiveShadow = true;
        this.scene.add(westWall);
        this.world.walls.push(westWall);
    }

    createObstacles() {
        const crateMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1
        });

        // 创建一些箱子作为障碍物
        const cratePositions = [
            { x: -20, z: -20, scale: 2 },
            { x: 20, z: -20, scale: 1.5 },
            { x: 0, z: 0, scale: 3 },
            { x: -30, z: 10, scale: 2 },
            { x: 25, z: 25, scale: 1.8 },
            { x: -15, z: 30, scale: 2.2 }
        ];

        cratePositions.forEach(pos => {
            const crate = new THREE.Mesh(
                new THREE.BoxGeometry(pos.scale, pos.scale, pos.scale),
                crateMaterial
            );
            crate.position.set(pos.x, pos.scale/2, pos.z);
            crate.castShadow = true;
            crate.receiveShadow = true;
            this.scene.add(crate);
            this.world.obstacles.push(crate);
        });

        // 创建一些柱子
        const pillarMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x777777,
            roughness: 0.6,
            metalness: 0.4
        });

        const pillarPositions = [
            { x: -35, z: -35 },
            { x: 35, z: -35 },
            { x: -35, z: 35 },
            { x: 35, z: 35 }
        ];

        pillarPositions.forEach(pos => {
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1, 10, 16),
                pillarMaterial
            );
            pillar.position.set(pos.x, 5, pos.z);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.scene.add(pillar);
            this.world.obstacles.push(pillar);
        });
    }

    createDecorations() {
        // 添加一些随机方块作为装饰
        for (let i = 0; i < 20; i++) {
            const size = Math.random() * 2 + 0.5;
            const material = new THREE.MeshStandardMaterial({ 
                color: Math.random() * 0xffffff,
                roughness: Math.random(),
                metalness: Math.random()
            });
            
            const cube = new THREE.Mesh(
                new THREE.BoxGeometry(size, size, size),
                material
            );
            
            cube.position.set(
                (Math.random() - 0.5) * 80,
                size / 2,
                (Math.random() - 0.5) * 80
            );
            
            cube.castShadow = true;
            cube.receiveShadow = true;
            this.scene.add(cube);
        }

        // 添加一些灯光装饰
        for (let i = 0; i < 10; i++) {
            const light = new THREE.PointLight(
                new THREE.Color(Math.random(), Math.random(), Math.random()),
                1,
                20
            );
            
            light.position.set(
                (Math.random() - 0.5) * 80,
                Math.random() * 5 + 2,
                (Math.random() - 0.5) * 80
            );
            
            this.scene.add(light);
            this.world.lights.push(light);

            // 添加灯光的可视化
            const lightHelper = new THREE.Mesh(
                new THREE.SphereGeometry(0.5),
                new THREE.MeshBasicMaterial({ color: light.color })
            );
            lightHelper.position.copy(light.position);
            this.scene.add(lightHelper);
        }
    }

    createSpawnPoints() {
        // 创建敌人生成点
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 40;
            
            this.enemySpawnPoints.push({
                x: Math.cos(angle) * radius,
                z: Math.sin(angle) * radius
            });
        }
    }

    initPlayer() {
        // 创建玩家模型（简单的胶囊体）
        const playerGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const playerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0000ff,
            transparent: true,
            opacity: 0.5
        });
        
        this.player.mesh = new THREE.Mesh(playerGeometry, playerMaterial);
        this.player.mesh.position.y = 1;
        this.player.mesh.castShadow = true;
        this.scene.add(this.player.mesh);

        // 创建玩家碰撞体（用于物理检测）
        this.player.collider = new THREE.Box3();
        this.player.velocity = new THREE.Vector3();
        
        // 创建第一人称武器模型
        this.createWeaponModel();
    }

    createWeaponModel() {
        // 创建步枪模型
        const rifleGroup = new THREE.Group();
        
        // 枪身
        const rifleBody = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.2, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        rifleGroup.add(rifleBody);
        
        // 枪管
        const rifleBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        rifleBarrel.position.z = -0.4;
        rifleBarrel.rotation.x = Math.PI / 2;
        rifleGroup.add(rifleBarrel);
        
        // 枪托
        const rifleStock = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.2, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        rifleStock.position.x = -0.4;
        rifleGroup.add(rifleStock);
        
        // 弹匣
        const rifleMagazine = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.4, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x0000ff })
        );
        rifleMagazine.position.x = 0.2;
        rifleGroup.add(rifleMagazine);
        
        rifleGroup.position.set(0.3, -0.2, -0.5);
        rifleGroup.rotation.y = Math.PI / 10;
        this.camera.add(rifleGroup);
        
        this.player.weaponModel = rifleGroup;
        this.player.weapons.push({
            name: 'Assault Rifle',
            damage: 25,
            fireRate: 600,
            range: 100,
            type: 'rifle',
            model: rifleGroup
        });
    }

    initEnemies() {
        // 预创建一些敌人
        for (let i = 0; i < this.maxEnemies; i++) {
            this.spawnEnemy();
        }
    }

    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;
        
        // 随机选择一个生成点
        const spawnPoint = this.enemySpawnPoints[
            Math.floor(Math.random() * this.enemySpawnPoints.length)
        ];
        
        // 创建敌人模型
        const enemyGeometry = new THREE.CapsuleGeometry(0.5, 2, 4, 8);
        const enemyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const enemyMesh = new THREE.Mesh(enemyGeometry, enemyMaterial);
        enemyMesh.position.set(spawnPoint.x, 1, spawnPoint.z);
        enemyMesh.castShadow = true;
        enemyMesh.receiveShadow = true;
        
        // 创建敌人对象
        const enemy = {
            mesh: enemyMesh,
            health: 100,
            maxHealth: 100,
            speed: 2 + Math.random(),
            damage: 10,
            detectionRange: 30,
            attackRange: 5,
            attackCooldown: 0,
            state: 'patrol', // patrol, chase, attack, dead
            patrolTarget: new THREE.Vector3(
                (Math.random() - 0.5) * 80,
                0,
                (Math.random() - 0.5) * 80
            ),
            lastAttackTime: 0
        };
        
        this.scene.add(enemyMesh);
        this.enemies.push(enemy);
        
        // 更新敌人计数器显示
        this.updateEnemyCounter();
    }

    initWeapons() {
        // 初始化武器数组
        this.player.weapons = [
            {
                name: 'Assault Rifle',
                damage: 25,
                fireRate: 600, // 每分钟射击次数
                range: 100,
                type: 'rifle',
                currentAmmo: this.player.ammo.rifle.current,
                maxAmmo: this.player.ammo.rifle.max,
                totalAmmo: this.player.ammo.rifle.total,
                reloadTime: 2.0,
                isReloading: false,
                lastShotTime: 0,
                recoil: 0.1,
                spread: 0.01
            },
            {
                name: 'Shotgun',
                damage: 15,
                pellets: 8,
                fireRate: 120,
                range: 20,
                type: 'shotgun',
                currentAmmo: this.player.ammo.shotgun.current,
                maxAmmo: this.player.ammo.shotgun.max,
                totalAmmo: this.player.ammo.shotgun.total,
                reloadTime: 3.0,
                isReloading: false,
                lastShotTime: 0,
                recoil: 0.3,
                spread: 0.1
            },
            {
                name: 'Pistol',
                damage: 20,
                fireRate: 300,
                range: 50,
                type: 'pistol',
                currentAmmo: this.player.ammo.pistol.current,
                maxAmmo: this.player.ammo.pistol.max,
                totalAmmo: this.player.ammo.pistol.total,
                reloadTime: 1.5,
                isReloading: false,
                lastShotTime: 0,
                recoil: 0.05,
                spread: 0.005
            }
        ];
        
        this.updateWeaponDisplay();
    }

    initAudio() {
        // 创建音频上下文
        this.audio.context = new (window.AudioContext || window.webkitAudioContext)();
        
        // 预定义音频文件（实际项目中需要加载真实音频文件）
        this.audio.sounds = {
            shoot: { url: '', buffer: null },
            reload: { url: '', buffer: null },
            hit: { url: '', buffer: null },
            death: { url: '', buffer: null },
            enemyHit: { url: '', buffer: null },
            enemyDeath: { url: '', buffer: null }
        };
        
        // 在实际项目中，这里需要加载音频文件
        // this.loadAudioFiles();
    }

    initUI() {
        // 更新UI显示
        this.updateHealthDisplay();
        this.updateAmmoDisplay();
        this.updateScoreDisplay();
        this.updateEnemyCounter();
    }

    initEventListeners() {
        // 键盘事件
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // 鼠标事件
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // 窗口大小调整
        window.addEventListener('resize', () => this.onWindowResize());
        
        // 指针锁定变化
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        document.addEventListener('mozpointerlockchange', () => this.onPointerLockChange());
        
        // UI按钮事件
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('resume-button').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-button').addEventListener('click', () => this.restartGame());
        document.getElementById('restart-button-2').addEventListener('click', () => this.restartGame());
        document.getElementById('menu-button').addEventListener('click', () => this.showMenu());
        document.getElementById('menu-button-2').addEventListener('click', () => this.showMenu());
        
        // 防止右键菜单
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onKeyDown(e) {
        this.keys[e.code] = true;
        
        // 游戏控制
        switch(e.code) {
            case 'KeyP':
            case 'Escape':
                if (this.gameState === 'PLAYING') {
                    this.pauseGame();
                } else if (this.gameState === 'PAUSED') {
                    this.resumeGame();
                }
                break;
                
            case 'KeyR':
                if (this.gameState === 'PLAYING') {
                    this.reloadWeapon();
                }
                break;
                
            case 'Digit1':
                this.switchWeapon(0);
                break;
                
            case 'Digit2':
                this.switchWeapon(1);
                break;
                
            case 'Digit3':
                this.switchWeapon(2);
                break;
                
            case 'Space':
                if (this.gameState === 'PLAYING' && this.player.isGrounded) {
                    this.player.velocity.y = this.player.jumpForce;
                    this.player.isGrounded = false;
                }
                break;
        }
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
    }

    onMouseDown(e) {
        this.mouse.buttons[e.button] = true;
        
        if (this.gameState === 'PLAYING' && e.button === 0) {
            this.shoot();
        }
    }

    onMouseUp(e) {
        this.mouse.buttons[e.button] = false;
    }

    onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onPointerLockChange() {
        if (document.pointerLockElement === document.body ||
            document.mozPointerLockElement === document.body) {
            // 指针已锁定
            if (this.gameState === 'PLAYING') {
                this.controls.enabled = true;
            }
        } else {
            // 指针未锁定
            this.controls.enabled = false;
            
            if (this.gameState === 'PLAYING') {
                this.pauseGame();
            }
        }
    }

    startGame() {
        this.gameState = 'PLAYING';
        this.score = 0;
        this.wave = 1;
        this.player.health = this.player.maxHealth;
        
        // 重置敌人
        this.enemies.forEach(enemy => this.scene.remove(enemy.mesh));
        this.enemies = [];
        
        // 生成新敌人
        this.maxEnemies = 5;
        this.initEnemies();
        
        // 更新UI
        this.updateHealthDisplay();
        this.updateScoreDisplay();
        this.updateEnemyCounter();
        
        // 隐藏菜单
        document.getElementById('menu').style.display = 'none';
        document.getElementById('death-screen').style.display = 'none';
        
        // 请求指针锁定
        document.body.requestPointerLock = document.body.requestPointerLock ||
                                          document.body.mozRequestPointerLock;
        document.body.requestPointerLock();
    }

    pauseGame() {
        this.gameState = 'PAUSED';
        this.controls.enabled = false;
        document.getElementById('pause-menu').style.display = 'flex';
    }

    resumeGame() {
        this.gameState = 'PLAYING';
        document.getElementById('pause-menu').style.display = 'none';
        
        if (document.pointerLockElement === document.body ||
            document.mozPointerLockElement === document.body) {
            this.controls.enabled = true;
        } else {
            document.body.requestPointerLock();
        }
    }

    restartGame() {
        this.startGame();
    }

    showMenu() {
        this.gameState = 'MENU';
        this.controls.enabled = false;
        document.getElementById('menu').style.display = 'flex';
        document.getElementById('death-screen').style.display = 'none';
        document.getElementById('pause-menu').style.display = 'none';
    }

    gameOver() {
        this.gameState = 'GAME_OVER';
        this.controls.enabled = false;
        document.getElementById('death-screen').style.display = 'flex';
        this.showMessage('游戏结束!', 5000);
    }

    updateHealthDisplay() {
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('health-fill').style.width = `${healthPercent}%`;
        document.getElementById('health-text').textContent = 
            `${Math.round(this.player.health)}/${this.player.maxHealth}`;
    }

    updateAmmoDisplay() {
        const weapon = this.player.weapons[this.player.currentWeaponIndex];
        document.querySelector('.ammo-current').textContent = weapon.currentAmmo;
        document.querySelector('.ammo-total').innerHTML = 
            `/${weapon.totalAmmo}`;
    }

    updateWeaponDisplay() {
        const weapon = this.player.weapons[this.player.currentWeaponIndex];
        document.getElementById('weapon-display').textContent = weapon.name;
    }

    updateScoreDisplay() {
        document.getElementById('score-display').textContent = this.score;
    }

    updateEnemyCounter() {
        document.getElementById('enemy-counter').textContent = 
            `敌人: ${this.enemies.length}/${this.maxEnemies}`;
    }

    showMessage(text, duration = 2000) {
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = text;
        messageElement.style.opacity = 1;
        
        setTimeout(() => {
            messageElement.style.opacity = 0;
        }, duration);
    }

    shoot() {
        const weapon = this.player.weapons[this.player.currentWeaponIndex];
        const now = Date.now();
        
        // 检查是否可以射击
        if (weapon.isReloading) return;
        if (weapon.currentAmmo <= 0) {
            this.reloadWeapon();
            return;
        }
        if (now - weapon.lastShotTime < 60000 / weapon.fireRate) return;
        
        // 消耗弹药
        weapon.currentAmmo--;
        weapon.lastShotTime = now;
        
        // 更新显示
        this.updateAmmoDisplay();
        
        // 播放射击音效
        this.playSound('shoot');
        
        // 武器后坐力动画
        this.weaponRecoil(weapon);
        
        // 创建射线检测
        this.raycaster.setFromCamera(new THREE.Vector2(), this.camera);
        
        // 根据武器类型处理射击
        if (weapon.type === 'shotgun') {
            // 霰弹枪：发射多个弹丸
            for (let i = 0; i < weapon.pellets; i++) {
                this.processShot(weapon, true);
            }
        } else {
            // 步枪/手枪：发射单发
            this.processShot(weapon);
        }
        
        // 创建枪口闪光效果
        this.createMuzzleFlash();
        
        // 创建弹壳效果
        this.createShellEject();
    }

    processShot(weapon, isPellet = false) {
        // 添加散布
        const spread = isPellet ? weapon.spread * 2 : weapon.spread;
        const direction = new THREE.Vector3();
        direction.copy(this.camera.getWorldDirection(new THREE.Vector3()));
        
        // 添加随机散布
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.z += (Math.random() - 0.5) * spread;
        direction.normalize();
        
        this.raycaster.ray.set(this.camera.position, direction);
        
        // 检测碰撞
        const intersects = this.raycaster.intersectObjects(
            this.enemies.map(e => e.mesh),
            true
        );
        
        if (intersects.length > 0) {
            const enemyMesh = intersects[0].object;
            const enemy = this.enemies.find(e => e.mesh === enemyMesh);
            
            if (enemy && enemy.state !== 'dead') {
                // 击中敌人
                enemy.health -= weapon.damage;
                
                // 创建击中效果
                this.createHitEffect(intersects[0].point);
                
                // 播放击中音效
                this.playSound('enemyHit');
                
                // 检查敌人是否死亡
                if (enemy.health <= 0) {
                    this.killEnemy(enemy);
                    this.score += 100;
                    this.updateScoreDisplay();
                    this.showMessage(`击杀! +100分`, 1000);
                    
                    // 检查是否需要生成新敌人
                    if (this.enemies.length < this.maxEnemies) {
                        setTimeout(() => this.spawnEnemy(), 1000);
                    }
                }
            }
        }
        
        // 创建弹痕效果
        const wallIntersects = this.raycaster.intersectObjects(
            [...this.world.walls, ...this.world.obstacles],
            true
        );
        
        if (wallIntersects.length > 0) {
            this.createBulletHole(wallIntersects[0]);
        }
    }

    weaponRecoil(weapon) {
        // 简单的武器后坐力动画
        if (this.player.weaponModel) {
            // 快速向上移动
            this.player.weaponModel.position.y += weapon.recoil;
            
            // 添加随机左右抖动
            this.player.weaponModel.position.x += (Math.random() - 0.5) * weapon.recoil * 0.2;
            
            // 重置位置（动画）
            setTimeout(() => {
                this.player.weaponModel.position.y -= weapon.recoil * 0.8;
            }, 50);
            
            setTimeout(() => {
                this.player.weaponModel.position.y -= weapon.recoil * 0.2;
            }, 100);
        }
    }

    createMuzzleFlash() {
        const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        
        // 将闪光添加到枪口位置
        if (this.player.weaponModel) {
            const gunPosition = this.player.weaponModel.position.clone();
            gunPosition.z -= 0.5;
            flash.position.copy(gunPosition);
            flash.position.add(this.camera.position);
            flash.scale.set(3, 3, 3);
        } else {
            flash.position.copy(this.camera.position);
            flash.position.add(this.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.5));
        }
        
        this.scene.add(flash);
        
        // 淡出动画
        let opacity = 0.8;
        const animateFlash = () => {
            opacity -= 0.1;
            flashMaterial.opacity = opacity;
            flash.scale.multiplyScalar(0.8);
            
            if (opacity <= 0) {
                this.scene.remove(flash);
            } else {
                requestAnimationFrame(animateFlash);
            }
        };
        
        animateFlash();
    }

    createShellEject() {
        const shellGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6);
        const shellMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffcc00,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        
        // 设置弹壳位置和速度
        if (this.player.weaponModel) {
            const ejectPosition = this.player.weaponModel.position.clone();
            ejectPosition.x += 0.1;
            shell.position.copy(ejectPosition);
            shell.position.add(this.camera.position);
        } else {
            shell.position.copy(this.camera.position);
            shell.position.x += 0.1;
        }
        
        shell.rotation.x = Math.PI / 2;
        this.scene.add(shell);
        
        // 弹壳物理
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 2 + 1,
            (Math.random() - 0.5) * 2
        );
        
        const rotationSpeed = new THREE.Vector3(
            Math.random() * 10,
            Math.random() * 10,
            Math.random() * 10
        );
        
        let lifeTime = 0;
        const maxLifeTime = 2;
        
        const animateShell = () => {
            lifeTime += 0.016; // 假设60fps
            
            if (lifeTime >= maxLifeTime) {
                this.scene.remove(shell);
                return;
            }
            
            // 应用重力
            velocity.y += this.world.gravity * 0.016;
            
            // 更新位置
            shell.position.x += velocity.x * 0.016;
            shell.position.y += velocity.y * 0.016;
            shell.position.z += velocity.z * 0.016;
            
            // 更新旋转
            shell.rotation.x += rotationSpeed.x * 0.016;
            shell.rotation.y += rotationSpeed.y * 0.016;
            shell.rotation.z += rotationSpeed.z * 0.016;
            
            // 地面碰撞检测
            if (shell.position.y < 0.05) {
                shell.position.y = 0.05;
                velocity.y = Math.abs(velocity.y) * 0.5; // 反弹
                
                // 减慢速度
                velocity.x *= 0.9;
                velocity.z *= 0.9;
                rotationSpeed.multiplyScalar(0.9);
            }
            
            requestAnimationFrame(animateShell);
        };
        
        animateShell();
    }

    createHitEffect(position) {
        // 创建击中粒子效果
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // 设置随机位置和速度
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                Math.random() * 4,
                (Math.random() - 0.5) * 4
            );
            
            particle.position.copy(position);
            particles.add(particle);
        }
        
        this.scene.add(particles);
        this.particles.push(particles);
        
        // 粒子动画
        let lifeTime = 0;
        const maxLifeTime = 1;
        
        const animateParticles = () => {
            lifeTime += 0.016;
            
            if (lifeTime >= maxLifeTime) {
                this.scene.remove(particles);
                const index = this.particles.indexOf(particles);
                if (index > -1) this.particles.splice(index, 1);
                return;
            }
            
            particles.children.forEach(particle => {
                particle.position.x += particle.userData.velocity.x * 0.016;
                particle.position.y += particle.userData.velocity.y * 0.016;
                particle.position.z += particle.userData.velocity.z * 0.016;
                
                particle.userData.velocity.y += this.world.gravity * 0.016;
                
                // 淡出效果
                particle.material.opacity = 0.8 * (1 - lifeTime / maxLifeTime);
            });
            
            requestAnimationFrame(animateParticles);
        };
        
        animateParticles();
    }

    createBulletHole(intersect) {
        // 创建弹痕贴图（简单的方法：使用一个圆面片）
        const holeGeometry = new THREE.CircleGeometry(0.05, 8);
        const holeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            side: THREE.DoubleSide
        });
        
        const bulletHole = new THREE.Mesh(holeGeometry, holeMaterial);
        
        // 将弹痕放置在碰撞点
        bulletHole.position.copy(intersect.point);
        
        // 根据碰撞面的法线旋转弹痕
        bulletHole.lookAt(
            intersect.point.x + intersect.face.normal.x,
            intersect.point.y + intersect.face.normal.y,
            intersect.point.z + intersect.face.normal.z
        );
        
        // 稍微移出表面以避免z-fighting
        bulletHole.position.add(
            intersect.face.normal.clone().multiplyScalar(0.01)
        );
        
        this.scene.add(bulletHole);
        
        // 在几秒后移除弹痕
        setTimeout(() => {
            this.scene.remove(bulletHole);
        }, 30000); // 30秒后消失
    }

    killEnemy(enemy) {
        enemy.state = 'dead';
        
        // 播放死亡音效
        this.playSound('enemyDeath');
        
        // 创建死亡效果
        this.createDeathEffect(enemy.mesh.position);
        
        // 移除敌人
        this.scene.remove(enemy.mesh);
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
        
        // 更新计数器
        this.updateEnemyCounter();
        
        // 检查是否所有敌人都被消灭
        if (this.enemies.length === 0) {
            this.nextWave();
        }
    }

    createDeathEffect(position) {
        // 创建爆炸粒子效果
        const particleCount = 30;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff6600,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // 设置随机方向
            const angle = Math.random() * Math.PI * 2;
            const power = Math.random() * 3 + 1;
            
            particle.userData.velocity = new THREE.Vector3(
                Math.cos(angle) * power,
                Math.random() * 3 + 1,
                Math.sin(angle) * power
            );
            
            particle.position.copy(position);
            particles.add(particle);
        }
        
        this.scene.add(particles);
        this.particles.push(particles);
        
        // 粒子动画
        let lifeTime = 0;
        const maxLifeTime = 2;
        
        const animateParticles = () => {
            lifeTime += 0.016;
            
            if (lifeTime >= maxLifeTime) {
                this.scene.remove(particles);
                const index = this.particles.indexOf(particles);
                if (index > -1) this.particles.splice(index, 1);
                return;
            }
            
            particles.children.forEach(particle => {
                particle.position.x += particle.userData.velocity.x * 0.016;
                particle.position.y += particle.userData.velocity.y * 0.016;
                particle.position.z += particle.userData.velocity.z * 0.016;
                
                particle.userData.velocity.y += this.world.gravity * 0.016;
                
                // 淡出效果
                particle.material.opacity = 0.8 * (1 - lifeTime / maxLifeTime);
            });
            
            requestAnimationFrame(animateParticles);
        };
        
        animateParticles();
    }

    nextWave() {
        this.wave++;
        this.maxEnemies += 2; // 每波增加2个敌人
        
        this.showMessage(`第 ${this.wave} 波!`, 3000);
        
        // 生成新一波敌人
        for (let i = 0; i < this.maxEnemies; i++) {
            setTimeout(() => this.spawnEnemy(), i * 500);
        }
        
        // 玩家恢复部分生命值
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
        this.updateHealthDisplay();
    }

    reloadWeapon() {
        const weapon = this.player.weapons[this.player.currentWeaponIndex];
        
        if (weapon.isReloading) return;
        if (weapon.currentAmmo === weapon.maxAmmo) return;
        if (weapon.totalAmmo <= 0) {
            this.showMessage('弹药不足!', 1000);
            return;
        }
        
        weapon.isReloading = true;
        
        // 播放装填音效
        this.playSound('reload');
        
        this.showMessage('装填中...', weapon.reloadTime * 1000);
        
        // 装填完成
        setTimeout(() => {
            const ammoNeeded = weapon.maxAmmo - weapon.currentAmmo;
            const ammoToAdd = Math.min(ammoNeeded, weapon.totalAmmo);
            
            weapon.currentAmmo += ammoToAdd;
            weapon.totalAmmo -= ammoToAdd;
            
            weapon.isReloading = false;
            this.updateAmmoDisplay();
            this.showMessage('装填完成', 1000);
        }, weapon.reloadTime * 1000);
    }

    switchWeapon(index) {
        if (index < 0 || index >= this.player.weapons.length) return;
        if (this.player.currentWeaponIndex === index) return;
        
        this.player.currentWeaponIndex = index;
        
        // 隐藏所有武器模型
        if (this.player.weaponModel) {
            this.camera.remove(this.player.weaponModel);
        }
        
        // 显示当前武器模型
        const weapon = this.player.weapons[index];
        if (weapon.model) {
            this.camera.add(weapon.model);
            this.player.weaponModel = weapon.model;
        }
        
        this.updateWeaponDisplay();
        this.updateAmmoDisplay();
        
        this.showMessage(`切换至: ${weapon.name}`, 1000);
    }

    playSound(soundName) {
        // 在实际项目中，这里会播放实际的音频
        console.log(`播放音效: ${soundName}`);
        
        // 简单示例：创建一个临时的振荡器
        try {
            const oscillator = this.audio.context.createOscillator();
            const gainNode = this.audio.context.createGain();
            
            // 根据声音类型设置频率
            let frequency = 440;
            switch(soundName) {
                case 'shoot': frequency = 800; break;
                case 'reload': frequency = 300; break;
                case 'hit': frequency = 200; break;
                case 'enemyHit': frequency = 400; break;
                case 'enemyDeath': frequency = 150; break;
            }
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audio.context.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, this.audio.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audio.context.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audio.context.currentTime + 0.1);
        } catch (e) {
            console.log('音频上下文不支持');
        }
    }

    updatePlayer(deltaTime) {
        if (this.gameState !== 'PLAYING') return;
        
        const moveSpeed = this.player.speed * deltaTime;
        const moveVector = new THREE.Vector3();
        
        // 处理移动输入
        if (this.keys['KeyW']) moveVector.z -= moveSpeed;
        if (this.keys['KeyS']) moveVector.z += moveSpeed;
        if (this.keys['KeyA']) moveVector.x -= moveSpeed;
        if (this.keys['KeyD']) moveVector.x += moveSpeed;
        
        // 应用重力
        this.player.velocity.y += this.world.gravity * deltaTime;
        
        // 移动玩家
        this.player.mesh.position.x += moveVector.x + this.player.velocity.x * deltaTime;
        this.player.mesh.position.y += this.player.velocity.y * deltaTime;
        this.player.mesh.position.z += moveVector.z + this.player.velocity.z * deltaTime;
        
        // 同步相机位置
        this.camera.position.copy(this.player.mesh.position);
        this.camera.position.y += 1.6; // 眼睛高度
        
        // 地面碰撞检测
        if (this.player.mesh.position.y < 0) {
            this.player.mesh.position.y = 0;
            this.player.velocity.y = 0;
            this.player.isGrounded = true;
        }
        
        // 墙壁碰撞检测
        const playerBox = new THREE.Box3().setFromObject(this.player.mesh);
        
        for (const wall of this.world.walls) {
            const wallBox = new THREE.Box3().setFromObject(wall);
            
            if (playerBox.intersectsBox(wallBox)) {
                // 简单的碰撞响应：将玩家推离墙壁
                const overlap = new THREE.Box3();
                overlap.copy(playerBox).intersect(wallBox);
                
                const overlapSize = overlap.getSize(new THREE.Vector3());
                
                // 找到最小重叠方向
                if (overlapSize.x < overlapSize.z) {
                    if (this.player.mesh.position.x < wall.position.x) {
                        this.player.mesh.position.x -= overlapSize.x;
                    } else {
                        this.player.mesh.position.x += overlapSize.x;
                    }
                } else {
                    if (this.player.mesh.position.z < wall.position.z) {
                        this.player.mesh.position.z -= overlapSize.z;
                    } else {
                        this.player.mesh.position.z += overlapSize.z;
                    }
                }
                
                this.camera.position.copy(this.player.mesh.position);
                this.camera.position.y += 1.6;
            }
        }
        
        // 障碍物碰撞检测
        for (const obstacle of this.world.obstacles) {
            const obstacleBox = new THREE.Box3().setFromObject(obstacle);
            
            if (playerBox.intersectsBox(obstacleBox)) {
                const overlap = new THREE.Box3();
                overlap.copy(playerBox).intersect(obstacleBox);
                
                const overlapSize = overlap.getSize(new THREE.Vector3());
                
                // 将玩家推离障碍物
                if (overlapSize.x < overlapSize.z) {
                    if (this.player.mesh.position.x < obstacle.position.x) {
                        this.player.mesh.position.x -= overlapSize.x;
                    } else {
                        this.player.mesh.position.x += overlapSize.x;
                    }
                } else {
                    if (this.player.mesh.position.z < obstacle.position.z) {
                        this.player.mesh.position.z -= overlapSize.z;
                    } else {
                        this.player.mesh.position.z += overlapSize.z;
                    }
                }
                
                this.camera.position.copy(this.player.mesh.position);
                this.camera.position.y += 1.6;
            }
        }
        
        // 敌人攻击检测
        for (const enemy of this.enemies) {
            if (enemy.state === 'dead') continue;
            
            const distance = this.player.mesh.position.distanceTo(enemy.mesh.position);
            
            if (distance < enemy.attackRange) {
                const now = Date.now();
                if (now - enemy.lastAttackTime > 1000) { // 每秒攻击一次
                    this.player.health -= enemy.damage;
                    enemy.lastAttackTime = now;
                    
                    this.updateHealthDisplay();
                    this.showMessage(`受到攻击! -${enemy.damage}`, 500);
                    
                    // 播放受伤音效
                    this.playSound('hit');
                    
                    // 屏幕震动效果
                    this.screenShake(0.3);
                    
                    // 检查玩家是否死亡
                    if (this.player.health <= 0) {
                        this.player.health = 0;
                        this.updateHealthDisplay();
                        this.gameOver();
                    }
                }
            }
        }
    }

    updateEnemies(deltaTime) {
        for (const enemy of this.enemies) {
            if (enemy.state === 'dead') continue;
            
            // 计算到玩家的距离
            const distanceToPlayer = enemy.mesh.position.distanceTo(this.player.mesh.position);
            
            switch(enemy.state) {
                case 'patrol':
                    // 巡逻状态
                    if (distanceToPlayer < enemy.detectionRange) {
                        enemy.state = 'chase';
                        break;
                    }
                    
                    // 移动到巡逻目标
                    const directionToTarget = new THREE.Vector3()
                        .subVectors(enemy.patrolTarget, enemy.mesh.position)
                        .normalize();
                    
                    enemy.mesh.position.x += directionToTarget.x * enemy.speed * deltaTime;
                    enemy.mesh.position.z += directionToTarget.z * enemy.speed * deltaTime;
                    
                    // 面向移动方向
                    if (directionToTarget.length() > 0.1) {
                        enemy.mesh.lookAt(
                            enemy.mesh.position.x + directionToTarget.x,
                            enemy.mesh.position.y,
                            enemy.mesh.position.z + directionToTarget.z
                        );
                    }
                    
                    // 如果到达目标，选择新的目标
                    if (enemy.mesh.position.distanceTo(enemy.patrolTarget) < 2) {
                        enemy.patrolTarget.set(
                            (Math.random() - 0.5) * 80,
                            0,
                            (Math.random() - 0.5) * 80
                        );
                    }
                    break;
                    
                case 'chase':
                    // 追逐玩家
                    if (distanceToPlayer > enemy.detectionRange * 1.5) {
                        enemy.state = 'patrol';
                        break;
                    }
                    
                    if (distanceToPlayer < enemy.attackRange) {
                        enemy.state = 'attack';
                        break;
                    }
                    
                    // 向玩家移动
                    const directionToPlayer = new THREE.Vector3()
                        .subVectors(this.player.mesh.position, enemy.mesh.position)
                        .normalize();
                    
                    enemy.mesh.position.x += directionToPlayer.x * enemy.speed * 1.5 * deltaTime;
                    enemy.mesh.position.z += directionToPlayer.z * enemy.speed * 1.5 * deltaTime;
                    
                    // 面向玩家
                    enemy.mesh.lookAt(
                        this.player.mesh.position.x,
                        enemy.mesh.position.y,
                        this.player.mesh.position.z
                    );
                    break;
                    
                case 'attack':
                    // 攻击玩家
                    if (distanceToPlayer > enemy.attackRange) {
                        enemy.state = 'chase';
                        break;
                    }
                    
                    // 已经在上面的攻击检测中处理了攻击逻辑
                    break;
            }
            
            // 确保敌人不离开地面
            enemy.mesh.position.y = 1;
        }
    }

    screenShake(intensity) {
        const originalPosition = this.camera.position.clone();
        
        let shakeTime = 0;
        const shakeDuration = 0.3;
        
        const shake = () => {
            shakeTime += 0.016;
            
            if (shakeTime >= shakeDuration) {
                this.camera.position.copy(originalPosition);
                return;
            }
            
            // 随机震动
            this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * intensity;
            this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * intensity;
            this.camera.position.z = originalPosition.z + (Math.random() - 0.5) * intensity;
            
            requestAnimationFrame(shake);
        };
        
        shake();
    }

    gameLoop() {
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        
        // 更新玩家
        this.updatePlayer(deltaTime);
        
        // 更新敌人
        if (this.gameState === 'PLAYING') {
            this.updateEnemies(deltaTime);
        }
        
        // 更新动画混合器
        for (const mixer of this.mixers) {
            mixer.update(deltaTime);
        }
        
        // 渲染场景
        this.renderer.render(this.scene, this.camera);
        
        // 继续游戏循环
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 启动游戏
window.addEventListener('load', () => {
    const game = new FPSGame();
    window.game = game; // 便于调试
});