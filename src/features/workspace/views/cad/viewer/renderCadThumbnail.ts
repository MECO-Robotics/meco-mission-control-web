import { AmbientLight, Box3, BufferGeometry, Color, DirectionalLight, Float32BufferAttribute, Mesh, MeshStandardMaterial, OrthographicCamera, Scene, Vector3, WebGLRenderer } from "three";
import type { CadMesh } from "./cadGeometry";

// One small still per explicit save; rows display ordinary images, not WebGL scenes.
export function renderCadThumbnail(part: CadMesh): string {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true });
  const geometry = new BufferGeometry();
  const material = new MeshStandardMaterial({
    color: part.color ? new Color().setRGB(...part.color, "srgb") : "#b8c7d9",
    metalness: 0.15, roughness: 0.65,
  });
  try {
    renderer.setSize(192, 192);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0, 0);
    geometry.setAttribute("position", new Float32BufferAttribute(part.attributes.position.array, 3));
    geometry.setIndex(part.index.array);
    if (part.attributes.normal) geometry.setAttribute("normal", new Float32BufferAttribute(part.attributes.normal.array, 3));
    else geometry.computeVertexNormals();
    const mesh = new Mesh(geometry, material);
    const bounds = new Box3().setFromObject(mesh);
    const center = bounds.getCenter(new Vector3());
    const radius = Math.max(bounds.getSize(new Vector3()).length() / 2, 0.001);
    mesh.position.sub(center);
    const halfFrame = radius * 1.15;
    const camera = new OrthographicCamera(-halfFrame, halfFrame, halfFrame, -halfFrame, radius / 100, radius * 10);
    camera.up.set(0, 0, 1);
    camera.position.copy(new Vector3(1, -1, 0.8).normalize().multiplyScalar(radius * 3));
    camera.lookAt(0, 0, 0);
    const scene = new Scene();
    scene.add(mesh, new AmbientLight(0xffffff, 1.4));
    const light = new DirectionalLight(0xffffff, 2.5);
    light.position.set(1, -2, 3);
    scene.add(light);
    renderer.render(scene, camera);
    // Capture immediately after render, before the drawing buffer is cleared.
    const url = renderer.domElement.toDataURL("image/png");
    if (!url.startsWith("data:image/png;base64,")) throw new Error("The part image could not be rendered.");
    return url;
  } finally {
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }
}
