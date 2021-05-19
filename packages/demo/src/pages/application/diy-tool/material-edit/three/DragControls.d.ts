import {
	Camera,
	EventDispatcher,
	Object3D
} from 'three';

export class DragControls extends EventDispatcher {

	constructor(objects: Object3D[], camera: Camera, domElement?: HTMLElement);

	object: Camera;

	//
	type: 'move' | 'rotate' | 'swing';
	limit: {
		// circle
		maxC?: number;
		// square
		maxS?: {
			maxX: number;
			maxZ: number;
			rotate: number;
			radius: number;
		}
	}
	heightObjects: Object3D[];
	veneerObjects: Object3D[];
	getSelectedObjects: () => Object3D;
	setLockObject: (lockObject: Object3D) => void;
	getLockObject: () => Object3D;

	// API

	enabled: boolean;
	transformGroup: boolean;

	activate(): void;
	deactivate(): void;
	dispose(): void;
	getObjects(): Object3D[];

}
