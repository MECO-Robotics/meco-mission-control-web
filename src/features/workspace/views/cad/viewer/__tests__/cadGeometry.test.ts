import { validateCadMeshes, type CadMesh } from "../cadGeometry";

const triangle = (): CadMesh => ({ name: "Plate", attributes: { position: { array: [0, 0, 0, 10, 0, 0, 0, 10, 0] } }, index: { array: [0, 1, 2] } });

test("keeps assembly positions and part colors without recentering individual parts", () => {
  const first = triangle();
  const second = triangle();
  second.attributes.position.array = second.attributes.position.array.map((value, index) => index % 3 === 0 ? value + 20 : value);
  second.color = [1, 0, 0];
  expect(validateCadMeshes([first, second])).toEqual([first, second]);
});

test("rejects geometry-free STEP output", () => {
  expect(() => validateCadMeshes([])).toThrow("no displayable");
});

test.each([[-1, 1, 2], [0, 1, 9], [0, 1, 1.5], [0, 1]])("rejects invalid triangles %j", (...indices) => {
  const mesh = triangle();
  mesh.index.array = indices;
  expect(() => validateCadMeshes([mesh])).toThrow("invalid geometry");
});

test("rejects nonfinite vertex coordinates", () => {
  const mesh = triangle();
  mesh.attributes.position.array[0] = NaN;
  expect(() => validateCadMeshes([mesh])).toThrow("invalid geometry");
});
