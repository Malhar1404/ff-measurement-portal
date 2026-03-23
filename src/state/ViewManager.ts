import { makeAutoObservable } from 'mobx';

import { MeshInfoJson } from '../types';
import { StateManager } from './StateManager';

interface LogEntry {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
}

export class ViewManager {
  private _libState: StateManager;
  private _meshInfoJson: MeshInfoJson | null = null;
  private _jsonUrl = './init.json';
  private _logs: LogEntry[] = [];
  private _isSkirtVisible = true;
  private _isSkirtTransformVisible = false;
  private _showDebugPoints = true;
  private _activeCategoryTab: 'adult' | 'kid' = 'adult';
  private _isInitialLoading = false;

  constructor(libState: StateManager) {
    this._libState = libState;
    makeAutoObservable(this);

    // Add initial logs
    this.addLog('Application initialized', 'info');
    this.addLog('3D Viewer ready', 'success');
  }

  get meshInfoJson() {
    return this._meshInfoJson;
  }

  setMeshInfoJson(meshInfoJson: MeshInfoJson) {
    this._meshInfoJson = meshInfoJson;
  }

  get glbUrl() {
    return this._meshInfoJson?.glbUrl;
  }

  get jsonUrl() {
    return this._jsonUrl;
  }

  setJsonUrl(jsonUrl: string) {
    this._jsonUrl = jsonUrl;
  }

  get logs() {
    return this._logs;
  }

  addLog(message: string, type: LogEntry['type'] = 'info') {
    const logEntry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      message,
      timestamp: new Date(),
      type,
    };
    this._logs.push(logEntry);

    // Keep only last 50 logs to prevent memory issues
    if (this._logs.length > 50) {
      this._logs = this._logs.slice(-50);
    }
  }

  clearLogs() {
    this._logs = [];
  }

  get hasLandmarkData() {
    return this._libState.meshesManager.hasLandmarkData;
  }
  get isSkirtVisible() {
    return this._isSkirtVisible;
  }
  toggleSkirtVisibility() {
    this._isSkirtVisible = !this._isSkirtVisible;
  }
  setIsSkirtVisible(value: boolean) {
    this._isSkirtVisible = value;
  }

  get isSkirtTransformVisible() {
    return this._isSkirtTransformVisible;
  }

  setIsSkirtTransformVisible(value: boolean) {
    this._isSkirtTransformVisible = value;
  }

  get showDebugPoints() {
    return this._showDebugPoints;
  }

  setShowDebugPoints(value: boolean) {
    this._showDebugPoints = value;
  }

  get activeCategoryTab() {
      return this._activeCategoryTab;
  }

  setActiveCategoryTab(value: 'adult' | 'kid') {
      this._activeCategoryTab = value;
  }

  get isInitialLoading() {
      return this._isInitialLoading;
  }

  setIsInitialLoading(value: boolean) {
      this._isInitialLoading = value;
  }
}
