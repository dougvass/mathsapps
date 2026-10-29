// Reads an STL 3D file (binary or text) and measures it.
export type StlInfo = {
  triangles: number;
  volumeCm3: number;
  sizeMm: [number, number, number];
};

function isBinary(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 84) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(80, true);
  return 84 + count * 50 === bytes.byteLength;
}

export function measureStl(bytes: Uint8Array): StlInfo {
  let volume = 0;
  let triangles = 0;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  const addTriangle = (v: number[]) => {
    for (let i = 0; i < 9; i++) {
      if (!Number.isFinite(v[i])) throw new Error("This file has broken numbers in it.");
      const axis = i % 3;
      if (v[i] < min[axis]) min[axis] = v[i];
      if (v[i] > max[axis]) max[axis] = v[i];
    }
    // Signed volume of the tetrahedron from the origin to this triangle.
    volume +=
      (v[0] * (v[4] * v[8] - v[5] * v[7]) - v[1] * (v[3] * v[8] - v[5] * v[6]) + v[2] * (v[3] * v[7] - v[4] * v[6])) / 6;
    triangles++;
  };

  if (isBinary(bytes)) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = view.getUint32(80, true);
    for (let t = 0; t < count; t++) {
      const base = 84 + t * 50 + 12; // skip the normal
      const v: number[] = [];
      for (let i = 0; i < 9; i++) v.push(view.getFloat32(base + i * 4, true));
      addTriangle(v);
    }
  } else {
    const text = new TextDecoder().decode(bytes);
    if (!/^\s*solid/i.test(text)) throw new Error("That doesn't look like an STL file.");
    const numbers = [...text.matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/gi)].map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
    if (numbers.length % 3 !== 0) throw new Error("This STL file looks broken.");
    for (let i = 0; i < numbers.length; i += 3) addTriangle([...numbers[i], ...numbers[i + 1], ...numbers[i + 2]]);
  }

  if (triangles === 0) throw new Error("This STL file is empty.");
  return {
    triangles,
    volumeCm3: Math.abs(volume) / 1000,
    sizeMm: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
  };
}
