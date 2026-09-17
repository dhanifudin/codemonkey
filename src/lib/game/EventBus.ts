import Phaser from 'phaser';
import type GridScene from './GridScene';

/** Request/response between Svelte and Phaser goes through direct method
 * calls on the scene (see PhaserGame.svelte); this bus only carries the
 * one-way "the scene exists, here it is" handshake, matching the standard
 * Phaser+framework template pattern. */
class TypedEventBus extends Phaser.Events.EventEmitter {
	sceneReady(scene: GridScene) {
		this.emit('scene-ready', scene);
	}
}

export const EventBus = new TypedEventBus();
