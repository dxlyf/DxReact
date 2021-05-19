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
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DragControls } from './DragControls';
import { loadFont, loadCard, createText } from './Text3D';
import {
  setMeshParams,
  selectAnimation,
  selectLocaltion,
  forMesh,
} from './tools';
import {
  setObjectHeight,
  getHeight,
  setVeneer,
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
    defaultExclude = {
      '蛋糕': { type: ['蛋糕', '围边', '淋边', '贴面', '大摆件'] },
      '围边': { type: ['围边', '淋边', '贴面'] },
      '淋边': { type: ['围边', '淋边'] },
      '贴面': { type: ['围边'] },
      '大摆件': { type: ['大摆件'] }
    };

  let ready = false,
    autoRender = isFront,
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
    textFont = params.font ? params.font : `${G.HostUrl}/FZSTK.TTF`;

  //场景
  const scene = new Scene();

  //灯光
  scene.add(new AmbientLight(0x999999));
  var directionalLight = new DirectionalLight(0x666666, 1);
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
  renderer.setPixelRatio(window.devicePixelRatio);
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
  if (!autoRender) controls.addEventListener('change', animate);

  //物件控制器
  const dragControls = new DragControls(
    dragObjects,
    camera,
    renderer.domElement,
  );
  dragControls.heightObjects = heightObjects;
  dragControls.veneerObjects = veneerObjects;
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
          if (cursor) selectLocaltion(model, cursor);
        } else {
          if (cursor) cursor.visible = false;
        }
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

  // 场景渲染
  function animate() {
    if (autoRender) {
      requestAnimationFrame(animate);
      controls.update();
    }
    renderer.render(scene, camera);
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
        addToScene(pan);
        sendSuccess(success, error, '加载底座成功');
      },
      (err) => {
        sendError(error, '加载底座失败\r\n' + err.stack);
      },
      panInfo,
    );
  }
  function loadCursor(success, error) {
    loadModel(
      {
        url: `${G.HostUrl}/point.glb`,
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
      loadBasicCake(success, error);
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
      () => {
        sendError(error, '加载背景失败');
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
      error,
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
    if (!data.isMult) {
      const arr = findObjects({ name: data.name });
      if (arr.length > 0) {
        sendSuccess(success, error, '模型已加载', arr[0]);
        return;
      }
    }
    //检查规格
    if (['围边', '淋边', '大摆件'].includes(data.type)) {
      let cake = findObjects({ type: '蛋糕' });
      if (cake.length > 0) {
        if (checkOffSpec(cake[0].data, data)) {
          sendError(error, '规格不符');
          return;
        }
      }
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
                setCakeSize(cakeSize);
              });
            } else if (['围边', '淋边'].includes(objectType)) {
              setOtherSize(group, cakeSize / G.CakeDiam);
            } else if (objectType === '贴面') {
              stickFromCameraToCake(group);
            } else if (ready) {
              setObjectHeight(group, heightObjects);
            }

            addToScene(group);
            if (ready) {
              if (isBack) {
                const ms = [];
                forMesh(model, (mesh) => {
                  const m = mesh.material.clone();
                  ms.push(m);
                  m.MeshName = mesh.name;
                });
                orgMaterials = ms;
                if (!autoRender) {
                  animate();
                  animate();
                }
              }
            }
            selected = group;
            sendSuccess(success, error, '加载模型成功', group);
          })
          .catch((err) => {
            sendError(error, '加载材质失败\r\n' + err.stack);
          });
      },
      undefined,
      function (err) {
        sendError(error, '模型加载失败\r\n' + err.stack);
      },
    );
  }
  //检查不合规格
  function checkOffSpec(orgData, nowData){
    return orgData.shape !== nowData.shape ||
    (nowData.type !== '大摆件' && orgData.specs !== nowData.specs) ||
    (nowData.type === '大摆件' && nowData.outside > cakeSize)
  }
  //逻辑关系
  function logicalRelation(group) {
    const data = group.data;
    const { type, shape, specs, outside, inside } = data;
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
        }
      } else if (['大摆件', '围边'].includes(type)) {
        include = {
          $or: {
            outside: { $lteq: inside },
            inside: { $gteq: outside }
          }
        };
      }
    }
    if (exclude) excludeObjects = findObjects(exclude);
    if (include) includeObjects = findObjects(include, excludeObjects);
    excludeObjects.forEach((object) => {
      if (!includeObjects.includes(object)) {
        if (
          type === '蛋糕' &&
          ['围边', '淋边', '大摆件'].includes(object.data.type) &&
          checkOffSpec(data, object.data)
        ) {
          deleteObject(object);
        } else {
          let objs = [];
          exclude = object.data.exclude ? object.data.exclude : defaultExclude[object.data.type];
          if (exclude) {
            objs = findObjects(exclude, [group]);
            if (objs.length > 0) {
              if (!object.data.include || findObjects(object.data.include, [group]).length === 0) {
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
    scene.add(group);
    if (ready) store.push(group);
  }
  //处理可拖曳物
  function addDragObject(group) {
    if (group.data.canSelect || (isBack && group.data.type === '蛋糕')) {
      dragObjects.push(group);
      if (cursor) requestAnimationFrame(() => {
        selectLocaltion(group, cursor);
      });
    }
  }
  //处理测高物件
  function addHeightObject(group) {
    if (['蛋糕', '底盘'].includes(group.data.type)) heightObjects.push(group);
    sortObjects(veneerObjects);
  }
  //处理贴面物件
  function addVeneerObject(group) {
    if (['蛋糕'].includes(group.data.type)) veneerObjects.push(group);
    sortObjects(veneerObjects);
  }
  //处理数组排序，以蛋糕为第一个元素
  function sortObjects(arr) {
    const cakes = findObjects({ type: '蛋糕' }, arr);
    const others = findObjects({ type: { $not: '蛋糕' } }, arr);
    arr.length = 0;
    cakes.forEach((group) => { arr.push(group) });
    others.forEach((group) => { arr.push(group) });
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
    loadCard(data.url, data.scale)
      .then((c) => {
        card = c;
        sendSuccess(success, error, '加载字牌成功', card);
      })
      .catch((err) => {
        sendError(error, '加载字牌失败\r\n' + err.stack);
      });
  }
  function loadTextFont(url, success, error) {
    if (url) textFont = url;
    loadFont(url)
      .then((f) => {
        font = f;
        textFont = url;
        sendSuccess(success, error, '加载字体成功', font);
      })
      .catch((err) => {
        sendError(error, '加载字体失败\r\n' + err.stack);
      });
  }
  //展示字牌
  function showText(txt, success, error, refresh) {
    if ((font === null || card === null) && error) error('字体未始化');
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
        rotation = new Euler(-Math.PI / 9, 0, 0);
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
        text = createText(txt, font, card);
        text = Object.assign(text, { data, info: cardInfo });
        let gPy = text.getObjectByName('gPy'),
          gRy = text.getObjectByName('gRy'),
          gRxz = text.getObjectByName('gRxz');
        text.position.set(position.x, 0, position.z);
        gPy.position.y = getHeight(text.position, heightObjects);
        gRy.position.y = position.y;
        gRy.rotation.y = rotation.y;
        gRxz.rotation.set(rotation.x, 0, rotation.z);
        addToScene(text);
        if (cursor) selectLocaltion(text, cursor);
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
      if (cursor) selectLocaltion(model, cursor);
    }
  }
  //重置模型
  function resetObject(group) {
    if (!group) return;
    group.getObjectByName('gRy').rotation.y = 0;
    group.getObjectByName('gRy').position.y = group.data.y || 0;
    group.getObjectByName('gRxz').rotation.x = 0;
    group.getObjectByName('gRxz').rotation.z = 0;
    if (!autoRender) animate();
  }
  //刷新场景模型的Y轴
  function setSceneHeight() {
    store.forEach((g) => {
      if (g.data.canMove) {
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
        return kv[1].includes(g.data[kv[0]]);;
      } else if (typeof kv[1] === 'object') {
        return Object.entries(kv[1]).every(item => compare(g, item, kv[0]));
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
      if (or) return kvs.some(kv => checkItem(g, kv));
      else return kvs.every(kv => checkItem(g, kv));
    }
    const kvs = Object.entries(data);
    array.forEach((g) => {
      if (checkGroup(g, kvs)) arr.push(g);
    });
    return arr;
  }
  //查找除蛋糕外的模型
  function getSceneObjectWithoutCake() {
    return findObjects({ type: { $not: '蛋糕' } });
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
    }
    if (!withoutRender && !autoRender) animate();
  }
  //清空场景
  function clearScene(withCake) {
    let keep = 0;
    while (store.length > keep) {
      let object = store[keep];
      if (!withCake && object.data.type === '蛋糕') {
        keep++;
      } else deleteObject(object, isBack);
    }
    if (!autoRender) animate();
  }
  //截图
  function getImage(withoutBackgroud) {
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
    } else return renderer.domElement.toDataURL('image/png');
  }
  //生成场景数据
  function getSceneData() {
    const backgroundInfo = scene.data,
      logoInfo = logo ? logo.data : undefined,
      objectsInfo = [];
    let products = findSkuObjects();
    products = products[1].concat(products[0]);
    products.forEach((object) => {
      if (['底盘', '光标'].includes(object.data.type)) return;
      const gRy = object.getObjectByName('gRy'),
        gRxz = object.getObjectByName('gRxz'),
        group = gRxz.children[0],
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
      size,
      color,
      cameraPosition,
    } = json;

    step1();
    function step1() {
      showBackgroud(backgroundInfo, step2, (err) => {
        step2();
      });
    }
    function step2() {
      showLogo(logoInfo, step3, (err) => {
        step3();
      });
    }
    function step3() {
      const objects = [...objectsInfo];
      function setLocaltion(object, info) {
        const gRy = object.getObjectByName('gRy'),
          gRxz = object.getObjectByName('gRxz'),
          group = gRxz.children[0];
        group.scale.copy(info.scale);
        object.updateWorldMatrix(false, true);
        gRxz.rotation.set(info.rotation.x, 0, info.rotation.z);
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
          if (object.data.text && object.data.text !== '') {
            if (card === null || font === null) {
              initText(() => {
                showText(
                  object.data.text,
                  (group) => {
                    setLocaltion(group, object);
                  },
                  error,
                  true,
                );
              }, error);
            } else {
              showText(
                object.data.text,
                (group) => {
                  setLocaltion(group, object);
                },
                error,
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
          cakeSize = size;
          if (color !== -1) setCakeColor(color);
          if (!autoRender) {
            controls.update();
            animate();
          }
          sendSuccess(success, error, '还原场景成功');
        }
      }
      load();
    }
  }
  //取模型名与材质名
  function getMeshNames(group) {
    if (!group) group = selected;
    if (!group) return [];
    const arr = [];
    forMesh(group, (mesh) => {
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
    const group = object.getObjectByName('gRxz').children[0];
    const data = getMeshParams(info);
    forMesh(group, (mesh) => {
      orgMaterials.forEach((m) => {
        if (m.MeshName === mesh.name) {
          mesh.material = m.clone();
        }
      });
    });
    deleteObject(object);
    let changeType = object.data.type !== data.type;
    if (changeType) {
      if (object.data.type === '蛋糕') {
        loadBasicCake(() => {
          formatObject();
        }, error);
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
            if (changeType) requestAnimationFrame(() => {
              setCakeSize(cakeSize);
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
  //更改蛋糕尺寸
  function setCakeSize(size) {
    const cakes = findObjects({ type: '蛋糕' });
    let cake = null;
    for (let key in cakes) {
      cake = cakes[key];
      const group = cake.getObjectByName('gRxz').children[0];
      const sr = size / cakeSize;
      group.scale.set(sr * group.scale.x, group.scale.y, sr * group.scale.z);
      group.updateWorldMatrix(false, true);

      const objs = findObjects({ type: ['围边', '淋边'] });
      objs.forEach((obj) => {
        setOtherSize(obj, sr);
      });
      cakeSize = size;
      break;
    }
    const objs = findObjects({ type: '贴面' });
    objs.forEach((obj) => {
      setVeneer(obj, veneerObjects);
    });
    setSceneHeight();
  }
  //根据蛋糕尺寸等比绽放模型尺寸
  function setOtherSize(obj, sr) {
    const g = obj.getObjectByName('gRxz').children[0];
    g.scale.set(sr * g.scale.x, g.scale.y, sr * g.scale.z);
    g.updateWorldMatrix(false, true);
  }
  //更改蛋糕颜色
  function setCakeColor(color) {
    const arr = findObjects({ type: '蛋糕' });
    cakeColor = color;
    for (let key in arr) {
      forMesh(arr[key], (mesh) => {
        mesh.material.color = new Color(color);
        return false;
      });
    }
    if (!autoRender) animate();
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
      set: (v) => {
        controls.autoRotate = v;
      },
    },
    getImage: { value: getImage },
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
    setCakeSize: { value: setCakeSize },
    setCakeColor: { value: setCakeColor },
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
        autoRender = v;
        if (autoRender) {
          controls.removeEventListener('change', animate);
          animate();
        } else controls.addEventListener('change', animate);
      },
    },
  });
}

ThreeObject.prototype.constructor = ThreeObject;

export default ThreeObject;
