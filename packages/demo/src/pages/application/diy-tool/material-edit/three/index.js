import {
  Scene,
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  WebGLRenderer,
  PCFSoftShadowMap,
  TextureLoader,
  CubeTextureLoader,
  RepeatWrapping,
  Vector2,
  Mesh,
  CylinderGeometry,
  MeshPhongMaterial,
  Color,
  BackSide,
  Vector3,
  Euler,
  Matrix4,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DragControls } from './DragControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import { loadFont, loadCard, createText } from './Text3D';
import {
  setMeshParams,
  selectAnimation,
  selectLocaltion,
  forMesh,
} from './tools';
import {
  setObjectHeight,
  setVeneer,
  findCollisionPoints,
  getCollisionPosition,
  findCollisionPoints3D,
} from './collision';
import G, { panInfo, cursorInfo } from './globalValues';

function ThreeObject(params) {
  const { getMeshParams, type, width, height, cakeInfo, rotateSpeed } = params,
    isBack = type === 'back',
    isFront = type === 'front',
    isShowcase = type === 'showcase',
    far = 20000,
    lightFar = 200,
    store = [],
    dragObjects = [], //可拖曳物件
    heightObjects = [], //测高物件
    veneerObjects = [], //贴面物件
    moveLimit = [];

  let ready = false,
    autoRender = false,
    orgAutoRender = autoRender,
    onClickModel = null,
    pan = null,
    cursor = null,
    card = null,
    font = null,
    logo = null,
    text = null,
    selected = null,
    orgMaterials = null,
    cakeSize = G.CakeDiam,
    cakeColor = -1,
    speedRate = 1,
    cardInfo = params.cardInfo
      ? params.cardInfo
      : {
        url: `${G.HostUrl}/Card.glb`,
        type: '字牌',
        name: '字牌',
        deep: 0,
        canMove: true,
        canRotate: true,
        canSwing: false,
        canVeneer: false,
        canSelect: true,
        isMult: false,
      },
    textFont = params.font; // ? params.font : `${G.HostUrl}/STXINWEI.TTF`;

  //场景
  const scene = new Scene();

  //灯光
  scene.add(new AmbientLight(0x999999));
  let directionalLight = new DirectionalLight(0x666666, 1);
  directionalLight.position.set(far, far, far).normalize();
  scene.add(directionalLight);
  directionalLight = new DirectionalLight(0x101010, 1);
  directionalLight.position.set(far / 6, far, far / 3).normalize();
  directionalLight.shadow.camera.near = -lightFar; //产生阴影的最近距离
  directionalLight.shadow.camera.lightFar = lightFar; //产生阴影的最远距离
  directionalLight.shadow.camera.left = -lightFar; //产生阴影距离位置的最左边位置
  directionalLight.shadow.camera.right = lightFar; //最右边
  directionalLight.shadow.camera.top = lightFar; //最上边
  directionalLight.shadow.camera.bottom = -lightFar; //最下面
  directionalLight.shadow.mapSize.height = 256; //使用多少像素生成阴影 默认512
  directionalLight.shadow.mapSize.width = 256; //使用多少像素生成阴影 默认512
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  directionalLight = new DirectionalLight(0x333333, 1);
  directionalLight.position.set(-far, far, -far).normalize();
  scene.add(directionalLight);

  //相机
  const camera = new PerspectiveCamera(30, width / height, 1, far);
  if (isBack) {
    //设置相机位置
    camera.position.set(0, 0, 600);
  } else {
    camera.position.set(0, 800, 800);
  }
  camera.lookAt(scene.position); //设置相机方向(指向的场景对象)

  //渲染器
  const renderer = new WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: true,
  });
  renderer.setSize(width, height); //设置渲染区域尺寸
  if (type !== 'showcase') {
    renderer.setPixelRatio(2);
  }
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setClearColor(0xbcb0a6, 1); //设置背景颜色

  //场景控制器
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.autoRotate = false;
  controls.autoRotateSpeed = rotateSpeed || 2;
  controls.enablePan = false;
  controls.zoomSpeed = 0.5;
  controls.minDistance = 700; //设置相机距离原点的最远距离
  controls.maxDistance = 2000; //设置相机距离原点的最远距离
  if (isBack) {
    controls.minDistance = 50;
  }
  var orgTime = 0; //减少运算量
  function controlsHandle(event) {
    if (Date.now() - orgTime < 16) return;
    orgTime = Date.now();
    animate();
  }
  if (!autoRender) controls.addEventListener('change', controlsHandle);

  //物件控制器
  const dragControls = new DragControls(
    dragObjects,
    camera,
    renderer.domElement,
  );
  dragControls.heightObjects = heightObjects;
  dragControls.veneerObjects = veneerObjects;
  dragControls.moveLimit = moveLimit;
  dragControls.transformGroup = true;
  dragControls.type = 'move';
  dragControls.enabled = !isShowcase;
  function dragHandle(event) {
    if (!dragControls.enabled) return;
    switch (event.type) {
      case 'hoveron': // 鼠标略过事件
        break;
      case 'dragstart': // 开始拖拽
        dragControls.setLockObject(null);
        const model = dragControls.getSelectedObjects();
        if (isFront) selected = model;
        if (model) {
          controls.saveState();
          controls.enabled = false;
        }
        setCursor(model);
        if (onClickModel) onClickModel(model, 0);
        break;
      case 'drag':
        break;
      case 'dragend': // 拖拽结束
        controls.reset();
        controls.enabled = true;
        break;
      default:
        break;
    }
    if (!autoRender) animate();
  }
  dragControls.addEventListener('dragstart', dragHandle);
  dragControls.addEventListener('drag', dragHandle);
  dragControls.addEventListener('dragend', dragHandle);

  // postprocessing
  let composer, effectFXAA, outlinePass;
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  outlinePass = new OutlinePass(new Vector2(width, height), scene, camera);
  composer.addPass(outlinePass);
  effectFXAA = new ShaderPass(FXAAShader);
  effectFXAA.uniforms['resolution'].value.set(1 / width, 1 / height);
  composer.addPass(effectFXAA);
  outlinePass.edgeStrength = type === 'showcase' ? 2.0 : 4.0;
  outlinePass.edgeGlow = 0;
  outlinePass.edgeThickness = 2.0;
  outlinePass.visibleEdgeColor.set(new Color(0xa4a4a4));
  outlinePass.hiddenEdgeColor.set(new Color(0x666666));

  // 场景渲染
  function animate() {
    if (autoRender) {
      requestAnimationFrame(animate);
      controls.update();
    }
    // renderer.render(scene, camera);
    composer.render();
  }

  //处理光标
  function setCursor(group) {
    if (group) {
      if (cursor) selectLocaltion(group, cursor);
      let meshs = [];
      forMesh(group.getObjectByName('models'), mesh => meshs.push(mesh));
      outlinePass.selectedObjects = meshs;
    } else {
      if (cursor) cursor.visible = false;
      outlinePass.selectedObjects = [];
    }
  }

  function autoRotateSpeed() {
    let test = 5;
    let skip = 180; //约3秒
    let time = null;
    let times = [];

    let step = 0;
    function runTest() {
      if (step > 0) {
        step--;
      } else if (time === null) time = new Date().getTime();
      else if (test > times.length) {
        let tmp = new Date().getTime();
        tmp = tmp - time;
        times.push(tmp);
        time = new Date().getTime();
      } else {
        let total = 0;
        for (let i = 0; i < times.length; i++) {
          total += times[i];
        }
        let rate = total / times.length;
        controls.autoRotateSpeed = rate * 0.12 * speedRate;
        time = null;
        times.length = 0;
        step = skip;
      }
      requestAnimationFrame(runTest);
    }
    runTest();
  }

  function sendSuccess(success, error, msg, ...params) {
    if (success)
      try {
        success(...params);
      } catch (ex) {
        sendError(error, msg + '\r\n调用success失败\r\n' + ex.stack);
      }
  }
  function sendError(error, msg) {
    if (error) error(msg);
  }

  function loadPan(success, error) {
    loadModel(
      {
        url: `${G.HostUrl}/dizuo.glb`,
        name: 'pan',
      },
      (group) => {
        pan = group;
        pan.rotation.y = Math.PI / 4;
        sendSuccess(success, error, '加载底座成功');
      },
      (err) => {
        sendError(error, '加载底座失败\r\n' + err.stack);
      },
      panInfo,
    );
  }
  function loadCursor(success, error) {
    if (autoRender) loadModel(
      {
        url: `${G.HostUrl}/models/basic/point.glb`, //--
        name: 'cursor',
      },
      (group) => {
        cursor = group;
        selectAnimation(cursor);
        scene.add(cursor);
        cursor.visible = false;
        cursor.getObjectByName('gPy').position.y = G.CakeDeep + G.CakeHeight;
        sendSuccess(success, error, '加载光标成功');
      },
      (err) => {
        sendError(error, '加载光标失败\r\n' + err.stack);
      },
      cursorInfo,
    );
    else sendSuccess(success, error, '加载光标成功');
  }
  function loadBasicCake(success, error) {
    if (cakeInfo) {
      loadModel(
        cakeInfo,
        () => {
          if (!autoRender) animate();
          sendSuccess(success, error, '加载默认蛋糕成功');
        },
        (err) => {
          sendError('加载默认蛋糕失败\r\n' + err.stack);
        },
      );
    } else {
      if (!autoRender) animate();
      sendSuccess(success, error, '');
    }
  }
  //启动
  function start(success, error) {
    if (ready) {
      sendSuccess(success, error, '已启动');
      return;
    }
    loadPan(() => {
      autoRotateSpeed();
      if (autoRender) animate();
      ready = true;
      if (isBack) {
        loadBasicCake(success, error);
      } else if (isFront) {
        loadCursor(() => {
          loadBasicCake(success, error);
        }, error);
      } else {
        sendSuccess(success, error, '启动成功');
      }
    }, error);
  }
  //显示背景
  function showBackgroud(urls, success, error) {
    if (!urls) {
      sendSuccess(success, error, '');
      return;
    }
    new CubeTextureLoader().load(
      urls,
      (map) => {
        scene.background = map;
        scene.data = urls;
        if (!autoRender) animate();
        sendSuccess(success, error, '加载背景成功', map);
      },
      undefined,
      (err) => {
        sendError(error, '加载背景失败\r\n' + err.stack);
      },
    );
  }
  //显示logo
  function showLogo(data, success, error) {
    if (!data) {
      sendSuccess(success, error, '');
      return;
    }
    let {
      url, // 图片url
      opacity, // 透明度
      radiusTop, // 圆柱顶部半径
      radiusBottom, // 圆柱底部半径
      height, // 圆柱高度
      y, // 圆柱Y轴位置
      emissive, // 自发光
      offset, // 贴图偏移
      repeat, // 贴图密度
    } = data;
    opacity = opacity ? opacity : 0.5;
    radiusTop = radiusTop ? radiusTop : 2000;
    radiusBottom = radiusBottom ? radiusBottom : 2000;
    height = height ? height : 500;
    y = y ? y : 0;
    emissive = emissive ? emissive : 0xffffff;
    offset = offset ? offset : new Vector2(0.5, 0);
    repeat = repeat ? repeat : new Vector2(-12, 1);
    new TextureLoader().load(
      url,
      (map) => {
        map.wrapS = map.wrapT = RepeatWrapping;
        map.offset = offset;
        map.repeat = repeat;
        logo = new Mesh(
          new CylinderGeometry(radiusTop, radiusBottom, height, 64, 1, true),
          new MeshPhongMaterial({
            map,
            emissive: new Color(emissive),
            transparent: true,
            opacity: opacity,
            side: BackSide,
          }),
        );
        logo.position.y = y;
        logo.data = data;
        scene.add(logo);
        if (!autoRender) animate();
        sendSuccess(success, error, '加载Logo成功', logo);
      },
      undefined,
      (err) => {
        sendError(error, '加载背景失败\r\n' + err.stack);
      },
    );
  }
  //更改背景透明度
  function setLogoOpacity(num) {
    if (logo) logo.material.opacity = num;
  }

  //加载模型
  function loadModel(info, success, error, data) {
    if (!data) data = getMeshParams(info);
    const objectType = data.type;
    //检查重复
    if (!isBack && !data.isMult) {
      const arr = findObjects({ name: data.name });
      if (arr.length > 0) {
        arr[0].info = info;
        sendSuccess(success, error, '模型已加载', arr[0]);
        return;
      }
    }
    //检查规格
    if (checkOffSpec(data)) {
      sendError(error, '规格不符');
      return;
    }
    new GLTFLoader().load(
      data.url,
      (gltf) => {
        let model = gltf.scene;
        setMeshParams(model, info, data)
          .then((group) => {
            logicalRelation(group);

            //处理位置
            if (pan) group.position.y = pan.position.y;
            if (objectType === '蛋糕') {
              requestAnimationFrame(() => {
                setSceneHeight();
              });
            } else if (['围边', '淋边', '夹心'].includes(objectType)) {
            } else if (objectType === '贴面') {
              stickFromCameraToCake(group);
            } else if (ready) {
              group.position.copy(getCollisionPosition(group, group.position, moveLimit));
              setObjectHeight(group, heightObjects);
            }

            addToScene(group);
            if (ready) {
              if (isBack) {
                const ms = [];
                forMesh(model, (mesh) => {
                  const m = mesh.material.clone();
                  ms.push(m);
                  m.MeshId = mesh.uuid;
                });
                orgMaterials = ms;
              }
            }
            if (!autoRender) {
              animate();
              animate();
            }
            selected = group;
            sendSuccess(success, error, '加载模型成功', group);
          })
          .catch((err) => {
            sendError(error, '加载材质失败\r\n' + err.stack);
          });
      },
      undefined,
      (err) => {
        sendError(error, '模型加载失败\r\n' + err.stack);
      },
    );
  }
  //检查不合规格
  function checkOffSpec(objectData, cakeData) {
    if (isBack) return false;
    if (!['围边', '淋边', '大摆件', '夹心'].includes(objectData.type))
      return false;
    if (!cakeData) {
      const cakes = findObjects({ type: '蛋糕' });
      if (cakes.length > 0) cakeData = findObjects({ type: '蛋糕' })[0].data;
      else return false;
    }
    let cShape = cakeData.shape,
      oShape = objectData.shape,
      cSpecs = cakeData.specs,
      oSpecs = objectData.specs;
    if (!cShape) cShape = '圆形';
    if (!oShape) oShape = '圆形';
    if (!cSpecs) cSpecs = '20*6cm';
    if (!oSpecs) oSpecs = '20*6cm';
    return cShape !== oShape || cSpecs !== oSpecs;
  }
  //逻辑关系
  const defaultExclude = {
    蛋糕: { type: ['蛋糕', '围边', '淋边', '贴面', '大摆件', '夹心'] },
    夹心: { type: ['夹心'] },
    围边: { type: ['围边', '淋边', '贴面'] },
    淋边: { type: ['围边', '淋边', '大摆件'] },
    贴面: { type: ['围边'] },
    大摆件: { type: ['大摆件', '淋边'] },
  };
  function logicalRelation(group) {
    const data = group.data;
    const { type, shape, specs, outside, inside } = data;
    if (isBack && type === '夹心') {
      if (shape === '球形') {
        group.getObjectByName('models').position.x = -40;
        group.getObjectByName('modelsMirror').position.x = 40;
      } else {
        group.getObjectByName('modelsMirror').position.set(40, 0, 40);
      }
    }
    if (isBack && type === '蛋糕') {
      findObjects({ type }).forEach(cake => deleteObject(cake));
      return;
    }
    if (['摆件'].includes(data.type) && !data.collisionPoints) {
      data.collisionPoints = findCollisionPoints(group);
    }
    let excludeObjects = [];
    let includeObjects = [];
    let exclude = data.exclude ? data.exclude : defaultExclude[type];
    let include = data.include;
    if (!include) {
      if (type === '蛋糕') {
        include = {
          type: { $not: '蛋糕' },
          shape,
          specs,
        };
      } else if (['围边'].includes(type)) {
        include = {
          type: '围边',
          $or: {
            outside: { $lteq: inside },
            inside: { $gteq: outside },
          },
        };
      } else if (['淋边'].includes(type)) {
        include = {
          type: ['大摆件'],
          outside: { $lteq: inside },
        };
      } else if (['大摆件'].includes(type)) {
        include = {
          type: ['淋边'],
          inside: { $gteq: outside },
        };
      }
    }
    if (exclude) excludeObjects = findObjects(exclude);
    if (include) includeObjects = findObjects(include, excludeObjects);
    excludeObjects.forEach((object) => {
      if (!includeObjects.includes(object)) {
        if (type === '蛋糕' && checkOffSpec(object.data, data)) {
          deleteObject(object);
        } else {
          let objs = [];
          exclude = object.data.exclude
            ? object.data.exclude
            : defaultExclude[object.data.type];
          if (exclude) {
            objs = findObjects(exclude, [group]);
            if (objs.length > 0) {
              if (
                !object.data.include ||
                findObjects(object.data.include, [group]).length === 0
              ) {
                deleteObject(object);
              }
            }
          }
        }
      }
    });
  }
  function addToScene(group) {
    addDragObject(group);
    addHeightObject(group);
    addVeneerObject(group);
    addMoveLimit(group);
    scene.add(group);
    if (ready) store.push(group);
  }
  //处理可拖曳物
  function addDragObject(group) {
    if (group.data.canSelect || (isBack && group.data.type === '蛋糕')) {
      dragObjects.push(group);
      setCursor(group);
    }
  }
  //处理测高物件
  function addHeightObject(group) {
    if (['蛋糕', '底盘'].includes(group.data.type)) heightObjects.push(group);
    sortObjects(heightObjects);
  }
  //处理贴面物件
  function addVeneerObject(group) {
    if (['蛋糕'].includes(group.data.type)) veneerObjects.push(group);
    sortObjects(veneerObjects);
  }
  //处理移动区域
  function addMoveLimit(group) {
    if (group.data.type === '蛋糕') {
      moveLimit[0] = group;
    }
  }

  //处理数组排序，以蛋糕为第一个元素
  function sortObjects(arr) {
    const cakes = findObjects({ type: '蛋糕' }, arr);
    const sandwich = findObjects({ type: '夹心' }, arr);
    const others = findObjects({ type: { $not: ['蛋糕', '夹心'] } }, arr);
    arr.length = 0;
    cakes.forEach((group) => {
      arr.push(group);
    });
    sandwich.forEach((group) => {
      arr.push(group);
    });
    others.forEach((group) => {
      arr.push(group);
    });
  }

  // 初始化字牌
  function initText(success, error) {
    loadTextCard(
      cardInfo,
      () => {
        loadTextFont(
          textFont,
          () => {
            sendSuccess(success, error, '初始化字牌成功', { card, font });
          },
          error,
        );
      },
      error,
    );
  }
  function loadTextCard(info, success, error) {
    cardInfo = info;
    const data = getMeshParams(cardInfo);
    loadCard(
      data.url,
      data.scale,
      (c) => {
        card = c;
        sendSuccess(success, error, '加载字牌成功', card);
      },
      (err) => {
        sendError(error, '加载字牌失败\r\n' + err.stack);
      },
    );
  }
  function loadTextFont(url, success, error) {
    if (url) {
      textFont = url;
      loadFont(
        url,
        (f) => {
          font = f;
          textFont = url;
          sendSuccess(success, error, '加载字体成功', font);
        },
        (err) => {
          sendError(error, '加载字体失败\r\n' + err.stack);
        },
      );
    } else {
      sendSuccess(success, error, '无字体', font);
    }
  }
  //展示字牌
  function showText(txt, success, error, refresh) {
    if (card === null && error) error('字体未始化');
    const data = getMeshParams(cardInfo);
    data.text = txt;
    data.textFont = textFont;

    if (text) {
      deleteObject(text);
    }
    if (txt === '') {
      sendSuccess(success, error, '', null);
    } else {
      let position = new Vector3(),
        rotation = new Euler();
      if (text && !refresh) {
        let gRy = text.getObjectByName('gRy'),
          gRxz = text.getObjectByName('gRxz');
        position = new Vector3(
          text.position.x,
          gRy.position.y,
          text.position.z,
        );
        rotation = new Euler(gRxz.rotation.x, gRy.rotation.y, gRxz.rotation.z);
      }
      try {
        if (font) text = createText(txt, card, font);
        else text = createText(txt, card);
        data.collisionPoints = findCollisionPoints(text);
        text = Object.assign(text, { data, info: cardInfo });
        let gRy = text.getObjectByName('gRy'),
          gRxz = text.getObjectByName('gRxz');
        text.position.set(position.x, 0, position.z);
        gRy.position.y = position.y;
        gRy.rotation.y = rotation.y;
        gRxz.rotation.set(rotation.x, 0, rotation.z);
        text.position.copy(getCollisionPosition(text, text.position, moveLimit));
        setObjectHeight(text, heightObjects);
        addToScene(text);
        setCursor(text);
        if (!autoRender) animate();
        sendSuccess(success, error, '展示字牌成功', text);
      } catch (err) {
        sendError(error, '字牌创建失败\r\n' + err.stack);
      }
    }
  }
  //锁定选择模型
  function setLockObject(model) {
    dragControls.setLockObject(model);
    selected = model;
    if (model) {
      controls.saveState();
      controls.enabled = false;
      setCursor(model);
    }
  }
  //重置模型
  function resetObject(group) {
    if (!group) return;
    const gRy = group.getObjectByName('gRy');
    const gRxz = group.getObjectByName('gRxz');
    const orgXZ = gRxz.orgXZ;
    gRy.rotation.y = 0;
    gRy.position.y = group.data.y || 0;
    gRxz.rotation.x = orgXZ ? orgXZ.x : 0;
    gRxz.rotation.z = orgXZ ? orgXZ.z : 0;
    if (!autoRender) animate();
  }
  //刷新场景模型的Y轴
  function setSceneHeight() {
    store.forEach((g) => {
      if (['摆件', '插牌', '字牌', '大摆件'].includes(g.data.type)) {
        g.position.copy(getCollisionPosition(g, g.position, moveLimit));
        setObjectHeight(g, heightObjects);
      }
    });
    if (!autoRender) animate();
  }
  function findSkuObjects() {
    let data = getSceneObjectWithoutCake(),
      cake = findObjects({ type: '蛋糕' });
    return [data, cake];
  }
  //查找模型 并且(默认):$and 或者:$or 非:$not 小于:$lt 小于等于:$lteq 大于:$gt 大于等于:$gteq
  function findObjects(data, array) {
    if (!array) array = store;
    let arr = [];
    function compare(g, kv, key) {
      if (kv[0] === '$not') {
        if (kv[1] instanceof Array) {
          return !kv[1].includes(g.data[key]);
        } else {
          return kv[1] !== g.data[key];
        }
      } else if (kv[0] === '$lt') {
        return g.data[key] < kv[1];
      } else if (kv[0] === '$lteq') {
        return g.data[key] <= kv[1];
      } else if (kv[0] === '$gt') {
        return g.data[key] > kv[1];
      } else if (kv[0] === '$gteq') {
        return g.data[key] >= kv[1];
      }
    }
    function check(g, kv) {
      if (kv[1] instanceof Array) {
        return kv[1].includes(g.data[kv[0]]);
      } else if (typeof kv[1] === 'object') {
        return Object.entries(kv[1]).every((item) => compare(g, item, kv[0]));
      } else {
        return [kv[1]].includes(g.data[kv[0]]);
      }
    }
    function checkItem(g, kv) {
      if (
        !(kv[1] instanceof Array) &&
        typeof kv[1] === 'object' &&
        ['$and', '$or'].includes(kv[0])
      ) {
        const kvis = Object.entries(kv[1]);
        if (kv[0] === '$and') {
          return checkGroup(g, kvis);
        } else {
          return checkGroup(g, kvis, true);
        }
      } else {
        return check(g, kv);
      }
    }
    function checkGroup(g, kvs, or) {
      if (or) return kvs.some((kv) => checkItem(g, kv));
      else return kvs.every((kv) => checkItem(g, kv));
    }
    const kvs = Object.entries(data);
    array.forEach((g) => {
      if (checkGroup(g, kvs)) arr.push(g);
    });
    return arr;
  }
  //查找除蛋糕外的模型
  function getSceneObjectWithoutCake() {
    return findObjects({ type: { $not: ['蛋糕', '夹心'] } });
  }
  //删除
  function deleteObject(object, withoutRender) {
    if (!object) object = selected;
    if (object) {
      if (cursor) {
        cursor.visible = false;
        scene.add(cursor);
      }
      scene.remove(object);
      let index = store.indexOf(object);
      if (index !== -1) store.splice(index, 1);
      index = dragObjects.indexOf(object);
      if (index !== -1) dragObjects.splice(index, 1);
      index = heightObjects.indexOf(object);
      if (index !== -1) heightObjects.splice(index, 1);
      index = veneerObjects.indexOf(object);
      if (index !== -1) veneerObjects.splice(index, 1);
      if (object.data.type === '蛋糕') {
        moveLimit[0] = null;
      } else if (object.data.type === '大摆件') {
        moveLimit[1] = null;
      }
    }
    if (!withoutRender && !autoRender) animate();
  }
  //清空场景
  function clearScene(withCake) {
    let keep = 0;
    while (store.length > keep) {
      let object = store[keep];
      if (!withCake && (object.data.type === '蛋糕' || (!isBack && object.data.type === '夹心'))) {
        keep++;
      } else deleteObject(object, isBack);
    }
    if (!autoRender) animate();
  }
  //截图
  function getImage(withoutBackgroud) {
    outlinePass.selectedObjects = [];
    if (withoutBackgroud) {
      renderer.setClearColor(0xbcb0a6, 0.0);
      const hide = findObjects({ type: store.length > 1 ? ['蛋糕'] : [] }),
        background = scene.background;
      scene.background = null;
      if (logo) logo.visible = false;
      pan.visible = false;
      hide.forEach((obj) => {
        obj.visible = false;
      });
      renderer.render(scene, camera);
      let img = renderer.domElement.toDataURL('image/png');
      renderer.setClearColor(0xbcb0a6, 1);
      scene.background = background;
      if (logo) logo.visible = true;
      pan.visible = true;
      hide.forEach((obj) => {
        obj.visible = true;
      });
      renderer.render(scene, camera);
      return img;
    } else {
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    }
  }
  function getSceneImages(num) {
    const position = camera.position.clone();
    camera.position.set(0, 250, 500);
    camera.lookAt(scene.position);
    renderer.setPixelRatio(1);
    const imgs = [];
    const arc = Math.PI * 2 / num;
    for (let i = 0; i < num; i++) {
      renderer.render(scene, camera);
      imgs.push(renderer.domElement.toDataURL('image/png'));
      camera.applyMatrix4(new Matrix4().makeRotationY(arc));
    }
    camera.position.copy(position);
    camera.lookAt(scene.position);
    if (type !== 'showcase') {
      renderer.setPixelRatio(2);
    }
    renderer.render(scene, camera);
    return imgs;
  }
  //生成场景数据
  function getSceneData() {
    const backgroundInfo = scene.data,
      logoInfo = logo ? logo.data : undefined,
      objectsInfo = [];
    let products = findSkuObjects();
    const sandwich = findObjects({ type: '夹心' });
    products = products[1].concat(sandwich).concat(products[0]);
    products.forEach((object) => {
      if (['底盘', '光标'].includes(object.data.type)) return;
      const gRy = object.getObjectByName('gRy'),
        gRxz = object.getObjectByName('gRxz'),
        group = gRy.getObjectByName('models'),
        { info, data } = object;
      objectsInfo.push({
        info,
        data,
        position: {
          x: object.position.x,
          y: gRy.position.y,
          z: object.position.z,
        },
        rotation: { x: gRxz.rotation.x, y: gRy.rotation.y, z: gRxz.rotation.z },
        scale: group.scale.clone(),
      });
    });
    return {
      backgroundInfo,
      logoInfo,
      objectsInfo,
      size: cakeSize,
      color: cakeColor,
      cameraPosition: [camera.position.x, camera.position.y, camera.position.z],
    };
  }
  //还原场景
  function setSceneData(json, success, error) {
    clearScene(true);
    pan.position.y = 0;
    const {
      backgroundInfo,
      logoInfo,
      objectsInfo,
      cameraPosition,
    } = json;
    const objects = [...objectsInfo];
    let step = 0;
    if (backgroundInfo)
      backgroundInfo.forEach((url, i) => {
        backgroundInfo[i] = /^http/g.test(url) ? url : `${G.HostUrl}/${url}`;
      });
    if (logoInfo)
      logoInfo.url = /^http/g.test(logoInfo.url)
        ? logoInfo.url
        : `${G.HostUrl}/${logoInfo.url}`;

    function begin() {
      if (step === 0)
        showBackgroud(
          backgroundInfo,
          () => {
            step++;
            begin();
          },
          (err) => {
            if (step === 0) {
              step++;
              begin();
            }
          },
        );
      else if (step === 1)
        showLogo(
          logoInfo,
          () => {
            step++;
            begin();
          },
          (err) => {
            if (step === 1) {
              step++;
              begin();
            }
          },
        );
      else {
        objects.sort((a, b) => {
          if (a.data.type === '蛋糕') return -1;
          else if (b.data.type === '蛋糕') return 1;
          else return 0;
        });
        load();
      }
    }
    function setLocaltion(object, info) {
      const gRy = object.getObjectByName('gRy'),
        gRxz = object.getObjectByName('gRxz');
      gRxz.rotation.set(info.rotation.x, 0, info.rotation.z);
      delete gRxz.orgXZ; //重置摆动
      gRy.position.set(0, info.position.y, 0);
      gRy.rotation.set(0, info.rotation.y, 0);
      object.position.set(info.position.x, 0, info.position.z);
      object.updateWorldMatrix(false, true);
      if (object.data.type === '贴面') {
        setVeneer(object, veneerObjects);
      } else if (object.data.canMove) {
        setObjectHeight(object, heightObjects);
      }
      if (!autoRender) animate();
      load();
    }
    function load() {
      if (objects.length > 0) {
        let object = objects.shift();
        if (['蛋糕', '夹心', '围边', '淋面'].includes(object.data.type)) {
          object.data.y = G.CakeDeep;
          object.position.y = G.CakeDeep;
        }
        if (object.data.text && object.data.text !== '') {
          if (card === null || font === null) {
            initText(
              () => {
                showText(
                  object.data.text,
                  (group) => {
                    setLocaltion(group, object);
                  },
                  (err) => {
                    sendError(error, '加载文本失败\r\n' + err.stack);
                  },
                  true,
                );
              },
              (err) => {
                sendError(error, '初始化字牌失败\r\n' + err.stack);
              },
            );
          } else {
            showText(
              object.data.text,
              (group) => {
                setLocaltion(group, object);
              },
              (err) => {
                sendError(error, '加载文本失败\r\n' + err.stack);
              },
              true,
            );
          }
        } else {
          loadModel(
            object.info,
            (group) => {
              setLocaltion(group, object);
            },
            error,
            object.data,
          );
        }
      } else {
        camera.position.set(
          cameraPosition[0],
          cameraPosition[1],
          cameraPosition[2],
        );
        if (!autoRender) {
          controls.update();
          animate();
        }
        sendSuccess(success, error, '还原场景成功');
      }
    }
    begin();
  }
  //取模型名与材质名
  function getMeshNames(group) {
    if (!group) group = selected;
    if (!group) return [];
    const arr = [];
    forMesh(group.getObjectByName('models'), (mesh) => {
      arr.push({
        mesh: mesh.name,
        material: mesh.material.name,
      });
    });
    return arr;
  }
  //更改模型参数
  function changMeshParams(info, success, error, object) {
    if (!object) object = selected;
    if (!info || !object) {
      sendSuccess(success, error, '', null);
      return;
    }
    const group = object.getObjectByName('models');
    const data = getMeshParams(info);
    forMesh(group, (mesh) => {
      orgMaterials.forEach((m) => {
        if (m.MeshId === mesh.uuid) {
          mesh.material = m.clone();
        }
      });
    });
    deleteObject(object);
    let changeType = object.data.type !== data.type;
    if (changeType) {
      if (object.data.type === '蛋糕') {
        loadBasicCake(
          () => {
            formatObject();
          },
          (err) => {
            sendError(error, '加载基础蛋糕失败\r\n' + err.stack);
          },
        );
      } else {
        formatObject();
      }
    } else {
      formatObject();
    }
    function formatObject() {
      setMeshParams(group, info, data)
        .then((group) => {
          logicalRelation(group);
          group.position.copy(object.position);
          const objectType = group.data.type;
          //处理位置
          if (objectType === '蛋糕') {
            if (changeType)
              requestAnimationFrame(() => {
                setSceneHeight();
              });
          } else if (['围边', '淋边'].includes(objectType)) {
          } else if (objectType === '贴面') {
            if (changeType) {
              stickFromCameraToCake(group);
            } else {
              group
                .getObjectByName('gPy')
                .position.copy(object.getObjectByName('gPy').position);
              group
                .getObjectByName('gRy')
                .rotation.copy(object.getObjectByName('gRy').rotation);
            }
          } else {
            setObjectHeight(group, heightObjects);
          }

          addToScene(group);
          selected = group;
          if (!autoRender) {
            animate();
            animate();
          }
          sendSuccess(success, error, '更改模型参数成功', group);
        })
        .catch((err) => {
          sendError(error, '加载材质失败\r\n' + err.stack);
          if (!autoRender) animate();
        });
    }
  }
  //把物件贴在蛋糕旁边
  function stickToCake(object, outside) {
    if (!object) object = selected;
    if (object) {
      setVeneer(object, veneerObjects, outside);
    }
    if (!autoRender) animate();
  }
  //把物件以相机方向贴在蛋糕旁边
  function stickFromCameraToCake(object, outside) {
    setObjectHeight(object, [pan]);
    object.position.set(camera.position.x, pan.position.y, camera.position.z);
    object.updateWorldMatrix(false, true);
    stickToCake(object, outside);
  }
  //显示夹心
  function showSandwich(success) {
    let opacity = 1;
    let left = 0;
    store.forEach((group) => {
      const { type } = group.data;
      if (type !== '夹心') {
        forMesh(group, (mesh) => {
          mesh.org = {
            opacity: mesh.material.opacity,
            transparent: mesh.material.transparent,
          };
          mesh.material.transparent = true;
          mesh.castShadow = false;
        });
      } else {
        group.lookAt(
          new Vector3(camera.position.x, group.position.y, camera.position.z),
        );
      }
    });
    function run() {
      if (opacity > 0) {
        opacity -= 0.04;
        store.forEach((group) => {
          const { type } = group.data;
          if (type !== '夹心') {
            forMesh(group, (mesh) => {
              mesh.material.opacity = opacity * mesh.org.opacity;
            });
          }
        });
      } else if (left <= 40) {
        left += 2;
        store.forEach((group) => {
          const { type, shape } = group.data;
          if (type === '夹心') {
            if (shape === '球形') {
              group.getObjectByName('models').position.x = -left;
              group.getObjectByName('modelsMirror').position.x = left;
            } else {
              group.getObjectByName('modelsMirror').position.set(left, 0, left);
            }
          }
        });
      } else {
        if (!controls.autoRotate) setAutoRotate(true);
        if (success) success();
        return;
      }
      if (!autoRender) animate();
      requestAnimationFrame(run);
    }
    run();
  }
  //隐藏夹心
  function hideSandwich(success) {
    let opacity = 0;
    let left = 40;
    if (controls.autoRotate) setAutoRotate(false);
    function run() {
      if (left > 0) {
        left -= 2;
        store.forEach((group) => {
          const { type, shape } = group.data;
          if (type === '夹心') {
            if (shape === '球形') {
              group.getObjectByName('models').position.x = -left;
              group.getObjectByName('modelsMirror').position.x = left;
            } else {
              group.getObjectByName('modelsMirror').position.set(left, 0, left);
            }
          }
        });
      } else if (opacity < 1) {
        opacity += 0.04;
        store.forEach((group) => {
          const { type } = group.data;
          if (type !== '夹心') {
            forMesh(
              group,
              (mesh) => (mesh.material.opacity = opacity * mesh.org.opacity),
            );
          }
        });
      } else {
        if (success) success();
        return;
      }
      if (!autoRender) animate();
      requestAnimationFrame(run);
    }
    run();
  }
  function getCollisionPointGroup(group) {
    if (!group) group = selected;
    if (!group) return;
    return findCollisionPoints3D(group.getObjectByName('models'));
  }

  function setAutoRender(v) {
    autoRender = v;
    if (autoRender) {
      controls.removeEventListener('change', controlsHandle);
      animate();
    } else controls.addEventListener('change', controlsHandle);
  }
  function setAutoRotate(v) {
    controls.autoRotate = v;
    if (v) {
      if (!autoRender) setAutoRender(true);
    } else {
      setAutoRender(orgAutoRender);
    }
  }

  Object.defineProperties(this, {
    domElement: {
      get: () => {
        return renderer.domElement;
      },
    },
    onClickModel: {
      get: () => {
        return onClickModel;
      },
      set: (v) => {
        onClickModel = v;
      },
    },
    ready: {
      get: () => {
        return ready;
      },
    },
    font: {
      get: () => {
        return font;
      },
    },
    card: {
      get: () => {
        return card;
      },
    },
    initText: { value: initText },
    loadTextCard: { value: loadTextCard },
    loadTextFont: { value: loadTextFont },
    showLogo: { value: showLogo },
    showBackgroud: { value: showBackgroud },
    animate: { value: animate },
    start: { value: start },
    loadModel: { value: loadModel },
    showText: { value: showText },
    autoRotate: {
      get: () => {
        return controls.autoRotate;
      },
      set: setAutoRotate,
    },
    getImage: { value: getImage },
    getSceneImages: { value: getSceneImages },
    findObjects: { value: findObjects },
    clearScene: { value: clearScene },
    deleteObject: { value: deleteObject },
    getSceneObjectWithoutCake: { value: getSceneObjectWithoutCake },
    dragType: {
      get: () => {
        return dragControls.type;
      },
      set: (v) => {
        dragControls.type = v;
      },
    },
    cursor: {
      get: () => {
        return cursor;
      },
    },
    setLockObject: { value: setLockObject },
    setLogoOpacity: { value: setLogoOpacity },
    getSceneData: { value: getSceneData },
    setSceneData: { value: setSceneData },
    selected: {
      get: () => {
        return selected;
      },
      set: (v) => {
        if (cursor) cursor.visible = v.data.canSelect;
        selected = v;
      },
    },
    resetObject: { value: resetObject },
    findSkuObjects: { value: findSkuObjects },
    setSceneHeight: { value: setSceneHeight },
    changMeshParams: { value: changMeshParams },
    getMeshNames: { value: getMeshNames },
    store: {
      get: () => {
        return store;
      },
    },
    dragObjects: {
      get: () => {
        return dragObjects;
      },
    },
    heightObjects: {
      get: () => {
        return heightObjects;
      },
    },
    stickToCake: { value: stickToCake },
    stickFromCameraToCake: { value: stickFromCameraToCake },
    speedRate: {
      get: () => {
        return speedRate;
      },
      set: (v) => {
        speedRate = v;
      },
    },
    autoRender: {
      get: () => {
        return autoRender;
      },
      set: (v) => {
        orgAutoRender = v;
        setAutoRender(v);
      },
    },
    showSandwich: { value: showSandwich },
    hideSandwich: { value: hideSandwich },
    checkOffSpec: { value: checkOffSpec },
    getCollisionPointGroup: { value: getCollisionPointGroup },
  });
}

ThreeObject.prototype.constructor = ThreeObject;

export default ThreeObject;
