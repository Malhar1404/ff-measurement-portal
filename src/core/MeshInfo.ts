import { makeAutoObservable } from 'mobx';
import * as THREE from 'three';

export type MeshImageView = 'front' | 'back' | 'left' | 'right';

export type MeshImagePaths = Record<MeshImageView, string>;

export class MeshInfo {
  private _id: string;
  private _name: string;
  private _mesh: THREE.Mesh;
  private _isVisible: boolean;
  private _imagePaths: MeshImagePaths;
  constructor(
    id: string,
    name: string,
    mesh: THREE.Mesh,
    imagePaths?: Partial<MeshImagePaths>,
  ) {
    this._id = id;
    this._name = name;
    this._mesh = mesh;
    this._isVisible = true;
    this._imagePaths = {
      front: '',
      back: '',
      left: '',
      right: '',
      ...imagePaths,
    };
    makeAutoObservable(this);
  }

  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }

  get item() {
    return this._mesh;
  }

  get isVisible() {
    return this._isVisible;
  }

  get imagePaths() {
    return this._imagePaths;
  }

  setIsVisible(isVisible: boolean) {
    this._isVisible = isVisible;
  }

  setMesh(mesh: THREE.Mesh) {
    this._mesh = mesh;
  }

  setImagePath(view: MeshImageView, path: string) {
    this._imagePaths[view] = path;
  }

  setImagePaths(imagePaths: Partial<MeshImagePaths>) {
    this._imagePaths = {
      ...this._imagePaths,
      ...imagePaths,
    };
  }

  changeColor(color: string) {
    // Create a new material to avoid affecting other meshes
    const newMaterial = (
      this._mesh.material as THREE.MeshStandardMaterial
    ).clone();
    newMaterial.color.set(color);
    this._mesh.material = newMaterial;
  }

  static parseMeshInfo(mesh: THREE.Mesh) {
    return new MeshInfo(mesh.id.toString(), mesh.name, mesh);
  }
}
