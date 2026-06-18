import * as THREE from "three";
import type { AlgorithmResult } from "../data/types";
import type { RendererHandle } from "./renderLifecycle";

export function renderThreeScene(canvas: HTMLCanvasElement, result: AlgorithmResult): RendererHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f8fafc");
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(0, 1.5, 8);
  const light = new THREE.DirectionalLight("#ffffff", 2);
  light.position.set(3, 4, 5);
  scene.add(light);
  scene.add(new THREE.AmbientLight("#ffffff", 1));

  if (result.metrics?.helper !== "隐藏辅助线") {
    scene.add(new THREE.GridHelper(8, 8, "#116d6e", "#d9e2ec"));
  }

  const count = Number(result.metrics?.objects ?? 5);
  const meshes: THREE.Mesh[] = [];
  for (let index = 0; index < count; index += 1) {
    const geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(index / Math.max(1, count), 0.6, 0.48)
    });
    const mesh = new THREE.Mesh(geometry, material);
    const angle = (index / count) * Math.PI * 2;
    mesh.position.set(Math.cos(angle) * 2.2, 0.45, Math.sin(angle) * 2.2);
    meshes.push(mesh);
    scene.add(mesh);
  }

  let frame = 0;
  const resize = () => {
    const width = Math.max(320, canvas.clientWidth || 640);
    const height = Math.max(260, canvas.clientHeight || 420);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const tick = () => {
    resize();
    meshes.forEach((mesh, index) => {
      mesh.rotation.x += 0.006 + index * 0.001;
      mesh.rotation.y += 0.01 + index * 0.001;
    });
    renderer.render(scene, camera);
    frame = window.requestAnimationFrame(tick);
  };
  tick();

  return {
    cleanup: () => {
      window.cancelAnimationFrame(frame);
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      renderer.dispose();
    }
  };
}
