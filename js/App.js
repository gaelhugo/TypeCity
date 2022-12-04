import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
//import font loader
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
//add text geometry
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

export default class App {
  constructor() {
    this.position = 8;
    this.init();
  }

  async init() {
    this.data = await this.loadJSON("./json/obama.json");
    this.audio = await this.loadAudio("./audio/obama.mp3");
    this.prepare("obama", this.data);
    this.initThree();
    this.initStartButton();
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
    this.camera.goal = this.position;
    this.camera.position.y = 3;
    this.camera.position.x = 0;
    this.camera.lookAt(0, 0, 0);

    // this.scene.fog = new THREE.Fog(0x000000, 0.005, 50);

    // add light
    const light = new THREE.AmbientLight(0x333333);
    this.scene.add(light);

    this.directionalLight = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 4, 1);
    this.directionalLight.castShadow = true;
    this.directionalLight.position.set(0, 10, 8);
    this.scene.add(this.directionalLight);

    //add "endless" grey plane as ground
    const planeGeometry = new THREE.PlaneGeometry(1200, 1200);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    plane.rotateX(-Math.PI / 2);
    //set plane double sided
    plane.material.side = THREE.DoubleSide;

    this.scene.add(plane);
    this.animate();
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
    data[name].forEach((element) => {
      element["timing"].forEach((word) => {
        this.allWords.push({
          text: word["word"],
          start: word["start_time"],
          end: word["start_end"],
        });
      });
    });
  }

  start() {
    this.audio.play();
    this.showWords(true);
  }

  showWords(start = false, previousTime = 0) {
    const word = this.allWords.shift();
    if (word) {
      setTimeout(() => {
        this.createText(word.text.toUpperCase(), word.start);
      }, (word.start - previousTime) * 1000);
    }
  }

  createText(text, previousTime) {
    //counter to randomize disposition
    this.counter++;
    this.showWords(false, previousTime);
    // add text on scene
    const loader = new FontLoader();
    loader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const geometry = new TextGeometry(text, {
          font: font,
          size: 1,
          height: 0.01,
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
        if (this.counter % 3 == 0) this.text.rotateZ(Math.PI / 2);
        this.position += 3;
        this.camera.goal = this.position + 5;
        this.text.castShadow = true;
        this.text.receiveShadow = true;
        this.text.position.z = this.position;
        this.text.position.x = this.position % 2 == 0 ? -1 : 1;
        this.text.position.y = 0;

        this.scene.add(this.text);
      } //end of load callback
    );
  }

  animate() {
    this.angle += 0.001;
    this.camera.position.x = Math.cos(this.angle) * 1;
    // smooth camera movement
    this.camera.position.z = this.lerp(
      this.camera.position.z,
      this.camera.goal,
      0.05
    );
    this.camera.lookAt(0, 0, 0);
    //set the spotlight position to the camera position
    this.directionalLight.position.z = this.camera.position.z + 8;
    this.directionalLight.position.y = 5;
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t;
  }
}
