import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
//import font loader
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
//add text geometry
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

import Firebase from "./Firebase";
import Lettre from "./Lettre";
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib";
// import "three/examples/fonts/droid/droid_sans_bold.typeface.json"; // font;
export default class App {
  constructor() {
    this.position = 8;
    const urlParams = new URLSearchParams(window.location.search);
    this.version = urlParams.get("version");

    const loader = new FontLoader();

    loader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        this.font = font;
        this.init();
      }
    );

    // this.init();
  }

  async init() {
    this.data = await this.loadJSON("./json/beforeFight.json");
    this.audio = await this.loadAudio("./audio/beforeFight.mp3");
    this.prepare("beforeFight", this.data);
    this.initThree();
    this.createMap();
    if (this.version == 1) this.initStartButton();
    // this.start();
  }

  initStartButton() {
    const button = document.createElement("button");
    button.innerHTML = "Start";
    button.style.position = "absolute";
    //center the button in screen
    button.style.left = "50%";
    button.style.top = "50%";
    button.style.transform = "translate(-50%, -50%)";
    button.style.cursor = "pointer";
    button.addEventListener("click", () => {
      document.body.removeChild(button);
      this.start();
    });
    document.body.appendChild(button);
  }

  initThree() {
    this.angle = 0;
    this.counter = 0;
    this.scene = new THREE.Scene();

    // RectAreaLightUniformsLib.init();
    // const rectLight1 = new THREE.RectAreaLight(0xffffff, 5, 4, 4);
    // rectLight1.position.set(0, 1, 0);
    // this.scene.add(rectLight1);

    // this.scene.add(new RectAreaLightHelper(rectLight1));

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.z = this.position;

    this.camera.position.y = 3;
    this.camera.position.x = 0;
    this.camera.goal = this.camera.position;
    this.camera.lookAt(0, 0, 0);
    this.camera.targetView = new THREE.Vector3(0, 0, 0);

    // this.scene.fog = new THREE.Fog(0x000000, 0.005, 50);

    // add light
    const light = new THREE.AmbientLight(0x555555);
    this.scene.add(light);

    this.directionalLight = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 4, 1);
    this.directionalLight.castShadow = true;
    this.directionalLight.position.set(0, 10, 8);
    this.scene.add(this.directionalLight);

    //add "endless" grey plane as ground
    const planeGeometry = new THREE.PlaneGeometry(1200, 1200);
    // metal material and shininess

    const planeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.8,
      reflectivity: 0.5,
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    plane.rotateX(-Math.PI / 2);
    plane.position.y = -1;
    //set plane double sided
    plane.material.side = THREE.DoubleSide;

    this.scene.add(plane);

    // //create letter
    // // create a word
    // // create array of words composed with 6 letters only
    // this.words = ["viktor", "julien", "lucile", "michel", "lauren"];
    // this.matrices = [];
    // this.width = 6 * 6;
    // for (let index = 0; index < 6; index++) {
    //   this.matrices.push(new Lettre(this.scene, index * 6 - this.width / 2, 0));
    // }

    // setInterval(() => {
    //   const shifted = this.words.shift();
    //   this.words.push(shifted);
    //   const letters = shifted.split("");
    //   letters.forEach((letter, index) => {
    //     this.matrices[index].extrude(letter);
    //   });
    // }, 1000);

    this.firebase = new Firebase();
    setTimeout(() => {
      this.firebase.addEventListener(
        "TYPE_CITY/time",
        this.onSyncTime.bind(this)
      );

      this.firebase.addEventListener("ECAL/MID", (data) => {
        console.log(data);
      });

      // }
    }, 1000);
    this.firebase.send("TYPE_CITY/time", -1);

    this.animate();
  }

  createMap() {
    const spacing = 2;
    const nbr = this.allWords.length;
    const wordByLine = Math.ceil(nbr / 2);
    this.groupeElements = [];
    let index = 0;
    for (let i = 0; i < wordByLine; i++) {
      const text = this.allWords[index].text.toUpperCase();
      this.createAd(-6, 0, -i * spacing, text, this.font);
      index++;
    }
    for (let i = 0; i <= wordByLine; i++) {
      if (this.allWords[index]) {
        const text = this.allWords[index].text.toUpperCase();
        this.createAd(
          6,
          0,
          -wordByLine * spacing + i * spacing,
          text,
          this.font,
          true
        );
        index++;
      }
    }
    console.log("this.groupeElements", this.groupeElements);
  }

  onSyncTime(previousTime) {
    if (previousTime > -1) this.showWords(previousTime);
  }

  loadJSON(url) {
    return fetch(url).then((response) => response.json());
  }

  loadAudio(url) {
    const audio = new Audio();
    audio.src = url;
    audio.load();
    return audio;
  }

  prepare(name, data) {
    this.allWords = [];
    let pscreen = 1;
    data[name].forEach((element) => {
      element["timing"].forEach((word) => {
        if (word["screen"] && word["screen"] != pscreen) {
          pscreen = parseInt(word["screen"]);
        }
        this.allWords.push({
          text: word["word"],
          start: word["start_time"],
          end: word["start_end"],
          property: word["property"],
          screen: pscreen,
        });
      });
    });
  }

  start() {
    this.audio.play();
    // this.showWords(false, 0);
    this.firebase.send("TYPE_CITY/time", 0);
  }

  showWords(previousTime = 0) {
    const word = this.allWords.shift();
    // console.log(word);
    const goal = this.groupeElements.shift();
    if (word) {
      setTimeout(() => {
        this.moveCamera(goal);
      }, (word.start - previousTime) * 1000 - 700);
      setTimeout(() => {
        // if (this.version == word.screen)
        // this.createText(word.text.toUpperCase(), word.start, word.property);
        // this.moveCamera();
        if (this.version == 1) this.firebase.send("TYPE_CITY/time", word.start);
      }, (word.start - previousTime) * 1000);
    }
  }

  moveCamera(goal) {
    if (goal) {
      const _goal = new THREE.Object3D();
      _goal.position.set(goal.position.x, goal.position.y, goal.position.z);
      _goal.isRotated = goal.isRotated;
      if (goal.position.x > 0) _goal.position.x -= 0;
      else _goal.position.x += 0;

      this.camera.goal = _goal;
      // this.camera.position.set(
      //   goal.position.x,
      //   goal.position.y,
      //   goal.position.z + 3
      // );
      // this.camera.lookAt(goal.position.x, goal.position.y, goal.position.z);
    }
  }

  createText(text, previousTime, property) {
    //counter to randomize disposition
    this.counter++;
    // this.showWords(previousTime);
    // if (this.version == 1) this.firebase.send("TYPE_CITY/time", previousTime);
    // add text on scene
    const loader = new FontLoader();
    loader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const geometry = new TextGeometry(text, {
          font: font,
          size: property ? property["height"] : 1,
          height: 0.1,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.8,
          bevelSize: 0.001,
          bevelOffset: 0,
          bevelSegments: 1,
        });
        const material = new THREE.MeshPhongMaterial({
          color: property ? parseInt(property["color"], 16) : 0xffffff,
          flatShading: false,
        });
        this.text = new THREE.Mesh(geometry, material);
        this.text.geometry.computeBoundingBox();
        console.log(this.text.geometry.boundingBox.max.x);
        if (this.counter % 3 == 0) this.text.rotateZ(Math.PI / 2);
        this.position += 3;
        this.camera.goal = this.position + 5;
        // this.text.castShadow = true;
        // this.text.receiveShadow = true;
        this.text.position.z = this.position;
        this.text.position.x = this.position % 2 == 0 ? -1 : 1;
        this.text.position.y = 0;

        this.scene.add(this.text);
      } //end of load callback
    );
  }

  createTextForMap(text, x, z) {
    console.log(x);
    // const loader = new FontLoader();
    // loader.load(
    //   "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_regular.typeface.json",
    //   (font) => {
    const geometry = new TextGeometry(text, {
      font: this.font,
      size: 1,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.8,
      bevelSize: 0.001,
      bevelOffset: 0,
      bevelSegments: 1,
    });
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      flatShading: false,
    });
    this.text = new THREE.Mesh(geometry, material);
    this.text.geometry.computeBoundingBox();
    console.log(text, this.text.geometry.boundingBox);
    this.text.castShadow = true;
    this.text.receiveShadow = true;
    this.text.position.z = 0;
    let newX = !x ? 0 : x;
    this.text.position.x = newX;
    this.text.position.z = z;
    this.scene.add(this.text);

    // return this.text.geometry.boundingBox.max.x + newX + 0.5;
    //   } //end of load callback
    // );
  }

  animate() {
    this.angle += 0.001;
    // this.camera.position.x = Math.cos(this.angle) * 1;
    // // smooth camera movement
    // this.camera.position.z = this.lerp(
    //   this.camera.position.z,
    //   this.camera.goal,
    //   0.05
    // );
    // this.camera.lookAt(0, 0, 0);

    // this.camera.position.set(
    //   this.camera.goal.position.x,
    //   this.camera.goal.position.y,
    //   this.camera.goal.position.z + 3
    // );
    // console.log(this.camera);
    const speed = 0.09;
    if (this.camera.goal && this.camera.goal.position) {
      let goalX = this.camera.goal.position.x;
      let goalZ = this.camera.goal.position.z + 2;
      if (this.camera.goal.isRotated) {
        goalZ = this.camera.goal.position.z;
        goalX = this.camera.goal.position.x + 3;
        if (this.camera.goal.position.x >= 0)
          goalX = this.camera.goal.position.x - 3;
      }

      this.camera.position.x = this.lerp(this.camera.position.x, goalX, speed);
      this.camera.position.y = this.lerp(
        this.camera.position.y,
        this.camera.goal.position.y,
        speed
      );
      this.camera.position.z = this.lerp(this.camera.position.z, goalZ, speed);

      this.camera.targetView.x = this.lerp(
        this.camera.targetView.x,
        this.camera.goal.position.x,
        speed
      );
      this.camera.targetView.y = this.lerp(
        this.camera.targetView.y,
        this.camera.goal.position.y,
        speed
      );
      this.camera.targetView.z = this.lerp(
        this.camera.targetView.z,
        this.camera.goal.position.z,
        speed
      );

      this.camera.lookAt(
        this.camera.targetView.x,
        this.camera.targetView.y,
        this.camera.targetView.z
      );

      // set the spotlight position to the camera position
      // this.directionalLight.position.z = this.camera.position.z + 8;
      // this.directionalLight.position.y = 5;
    }

    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  createAd(x, y, z, text, font, side = false) {
    // console.log(text);
    // const colors = [0xf000ff, 0x001eff, 0x4deeea];
    const colors = [0xff0000, 0x0000ff];

    const group = new THREE.Group();

    const _geometry = new TextGeometry(text, {
      font: font,
      size: 0.5,
      height: 0.1,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.001,
      bevelOffset: 0,
      bevelSegments: 1,
    });
    // const _material = new THREE.MeshPhongMaterial({
    //   color: 0xffffff,
    //   flatShading: false,
    // });
    const _material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0,
      metalness: 0,
    });
    const _text = new THREE.Mesh(_geometry, _material);
    _text.geometry.computeBoundingBox();
    // _text.castShadow = true;
    _text.position.z = 0.01;

    // this.scene.add(_text);

    let offsetY = 0;
    if (Math.random() > 0.3) offsetY = Math.random() * 3 + 2;

    const width =
      _text.geometry.boundingBox.max.x - _text.geometry.boundingBox.min.x;
    const height =
      _text.geometry.boundingBox.max.y - _text.geometry.boundingBox.min.y;
    const margin = 0.2;

    let verticalHasTurned = false;
    let diffY = 0;
    if (offsetY == 0) {
      if (width > 1) {
        // _text.rotation.z = Math.PI / 2;
        // _text.position.x = width / 2;

        verticalHasTurned = true;
        diffY = width / 2 - 1 + margin / 2;
        // _text.position.y = 0;
      }
    }
    const _x = offsetY != 0 ? width + margin : 1;
    const _y =
      offsetY != 0
        ? height + margin + 0.1
        : verticalHasTurned
        ? width + margin
        : 2;
    const _z = 0.02;

    const geometry = new THREE.BoxGeometry(_x, _y, _z);
    // console.log(geometry);

    const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;

    const color = colors[Math.floor(Math.random() * colors.length)];
    const rectLight1 = new THREE.RectAreaLight(color, 30, _x, _y);
    rectLight1.rotation.y = Math.PI;
    rectLight1.position.set(0, 0, 0.011);
    group.add(rectLight1);

    _text.position.x = -width / 2;
    _text.position.y = -height / 2;

    if (verticalHasTurned) {
      _text.position.x = height / 2;
      _text.position.y = -width / 2;
      _text.rotation.z = Math.PI / 2;
    }

    // cube.receiveShadow = true;
    if (offsetY != 0 && Math.random() > 0.2) {
      // group.add(cube);
      group.add(new RectAreaLightHelper(rectLight1, color, true));
    } else group.add(new RectAreaLightHelper(rectLight1, color));
    group.add(_text);
    group.position.set(x + (0.5 - Math.random()) * 2, y + offsetY + diffY, z);

    if (Math.random() > 0.5) {
      group.rotation.y = (Math.PI / 2) * (side ? -1 : 1);
      group.isRotated = true;
    }
    group.name = text;

    this.scene.add(group);
    this.groupeElements.push(group);

    // _text.position.set(cube.position.x, cube.position.y, cube.position.z);
  }

  lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t;
  }
}
