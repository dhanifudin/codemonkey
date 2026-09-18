import Phaser from 'phaser';
import { asset } from '$app/paths';
import type { Challenge, Command, Trigger, Vec2 } from '$lib/engine';
import type { Theme } from '$lib/content';
import { EventBus } from './EventBus';
import type { PlayableScene } from './PlayableScene';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 360;
const MOVE_MS = 320;

const BG_BY_THEME: Record<Theme, string> = {
	'jungle-night': 'bg-jungle-night',
	'beach-day': 'bg-beach-day',
	'jungle-day': 'bg-beach-day'
};

const SENSOR_TEXTURE: Record<Trigger, string> = {
	'blue-triangle': 'sensor-blue-triangle',
	'green-circle': 'sensor-green-circle',
	'red-square': 'sensor-red-square'
};

/** Side-view platformer renderer for the "arrows" movement levels — the
 * top-down GridScene's counterpart. It implements the same PlayableScene
 * contract so PhaserGame.svelte can drive either one identically; the two
 * never run at once. */
export default class SideScene extends Phaser.Scene implements PlayableScene {
	private challenge!: Challenge;
	private theme: Theme = 'jungle-night';
	private tileSize = 48;
	private offsetX = 0;
	private offsetY = 0;
	private player!: Phaser.GameObjects.Image;
	private playerBaseScale = 1;
	private facingSign: 1 | -1 = 1;
	private collectibleSprites = new Map<string, Phaser.GameObjects.Image>();
	private sensorSprites = new Map<Trigger, Phaser.GameObjects.Image>();

	constructor() {
		super('SideScene');
	}

	init(data: { challenge: Challenge; theme?: Theme }) {
		this.challenge = data.challenge;
		this.theme = data.theme ?? 'jungle-night';
	}

	preload() {
		this.load.svg('monkey', asset('/assets/monkey.svg'), { width: 128, height: 128 });
		this.load.svg('banana', asset('/assets/banana.svg'), { width: 96, height: 96 });
		this.load.svg('block-sand', asset('/assets/block-sand.svg'), { width: 128, height: 128 });
		this.load.svg('block-brick', asset('/assets/block-brick.svg'), { width: 128, height: 128 });
		this.load.svg('chest', asset('/assets/chest.svg'), { width: 128, height: 128 });
		this.load.svg('sensor-blue-triangle', asset('/assets/sensor-blue-triangle.svg'), { width: 128, height: 128 });
		this.load.svg('sensor-green-circle', asset('/assets/sensor-green-circle.svg'), { width: 128, height: 128 });
		this.load.svg('sensor-red-square', asset('/assets/sensor-red-square.svg'), { width: 128, height: 128 });
		this.load.svg('bg-jungle-night', asset('/assets/bg-jungle-night.svg'), { width: 480, height: 360 });
		this.load.svg('bg-beach-day', asset('/assets/bg-beach-day.svg'), { width: 480, height: 360 });
	}

	create() {
		const { width, height } = this.challenge.grid;
		this.tileSize = Math.floor(Math.min(CANVAS_WIDTH / width, CANVAS_HEIGHT / height, 96));
		this.offsetX = (CANVAS_WIDTH - this.tileSize * width) / 2;
		this.offsetY = (CANVAS_HEIGHT - this.tileSize * height) / 2;

		this.add.image(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, BG_BY_THEME[this.theme]).setDisplaySize(CANVAS_WIDTH, CANVAS_HEIGHT);
		this.drawTerrain();
		this.drawSensors();
		this.drawGoalChest();
		this.drawCollectibles();
		this.drawPlayer();

		EventBus.sceneReady(this);
	}

	/** Same formula as `standRow` in the interpreter — the row a monkey
	 * standing in column x rests on, or undefined for a gap column. */
	private standRow(x: number): number | undefined {
		const terrain = this.challenge.terrain ?? [];
		const h = terrain[x] ?? 0;
		if (h <= 0) return undefined;
		return this.challenge.grid.height - h - 1;
	}

	private tileCenter(pos: Vec2): Vec2 {
		return {
			x: this.offsetX + pos.x * this.tileSize + this.tileSize / 2,
			y: this.offsetY + pos.y * this.tileSize + this.tileSize / 2
		};
	}

	private drawTerrain() {
		const { width, height } = this.challenge.grid;
		const hasBananaAbove = new Set(
			this.challenge.entities.collectibles
				.filter((c) => this.standRow(c.pos.x) !== undefined && c.pos.y === this.standRow(c.pos.x)! - 1)
				.map((c) => c.pos.x)
		);
		for (let x = 0; x < width; x++) {
			const top = this.standRow(x);
			if (top === undefined) continue; // gap column — no ground drawn, background shows a pit
			for (let row = top; row < height; row++) {
				const c = this.tileCenter({ x, y: row });
				const texture = row === top && hasBananaAbove.has(x) ? 'block-brick' : 'block-sand';
				this.add.image(c.x, c.y, texture).setDisplaySize(this.tileSize, this.tileSize);
			}
		}
	}

	private drawSensors() {
		for (const sensor of this.challenge.sensors ?? []) {
			const row = this.standRow(sensor.x);
			if (row === undefined) continue;
			const c = this.tileCenter({ x: sensor.x, y: row - 1 });
			const sprite = this.add
				.image(c.x, c.y + this.tileSize * 0.1, SENSOR_TEXTURE[sensor.trigger])
				.setDisplaySize(this.tileSize * 0.7, this.tileSize * 0.7);
			this.sensorSprites.set(sensor.trigger, sprite);
		}
	}

	private drawGoalChest() {
		if (this.challenge.goal.type !== 'reachTile') return;
		const c = this.tileCenter(this.challenge.goal.target);
		this.add.image(c.x, c.y - this.tileSize * 0.1, 'chest').setDisplaySize(this.tileSize * 0.85, this.tileSize * 0.85);
	}

	private drawCollectibles() {
		for (const item of this.challenge.entities.collectibles) {
			const c = this.tileCenter(item.pos);
			const sprite = this.add.image(c.x, c.y, 'banana').setDisplaySize(this.tileSize * 0.5, this.tileSize * 0.5);
			this.collectibleSprites.set(item.id, sprite);
			this.tweens.add({
				targets: sprite,
				y: c.y - this.tileSize * 0.08,
				duration: 700,
				yoyo: true,
				repeat: -1,
				ease: 'Sine.easeInOut'
			});
		}
	}

	private drawPlayer() {
		const c = this.tileCenter(this.challenge.entities.playerStart);
		const size = this.tileSize * 0.85;
		this.player = this.add.image(c.x, c.y, 'monkey').setDisplaySize(size, size);
		this.playerBaseScale = this.player.scaleX;
		this.facingSign = this.challenge.entities.playerFacing === 'left' ? -1 : 1;
		this.player.setScale(this.playerBaseScale * this.facingSign, this.playerBaseScale);
	}

	private tweenPromise(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
		return new Promise((resolve) => {
			this.tweens.add({ ...config, onComplete: () => resolve() });
		});
	}

	resetScene(): void {
		this.scene.restart({ challenge: this.challenge, theme: this.theme });
	}

	async playCommands(commands: Command[], speedMultiplier = 1, onCommand?: (cmd: Command) => void): Promise<void> {
		const moveMs = MOVE_MS / speedMultiplier;

		for (const cmd of commands) {
			onCommand?.(cmd);
			switch (cmd.type) {
				case 'move': {
					const from = this.tileCenter(cmd.from);
					const to = this.tileCenter(cmd.to);
					const sign = cmd.facing === 'left' ? -1 : 1;
					if (sign !== this.facingSign) {
						this.facingSign = sign;
						this.player.setScale(this.playerBaseScale * sign, this.playerBaseScale);
					}
					const climbing = cmd.to.y < cmd.from.y;
					const dropping = cmd.to.y > cmd.from.y;
					await this.tweenPromise({
						targets: this.player,
						x: to.x,
						y: to.y,
						duration: climbing ? moveMs * 1.2 : moveMs,
						ease: dropping ? 'Bounce.easeOut' : 'Sine.easeInOut'
					});
					void from; // only used for symmetry with GridScene's shape
					break;
				}
				case 'jumpUp': {
					const apex = this.tileCenter(cmd.at);
					const baseY = this.player.y;
					const arcMs = moveMs * 1.1;
					await new Promise<void>((resolve) => {
						this.tweens.addCounter({
							from: 0,
							to: 1,
							duration: arcMs,
							ease: 'Sine.easeInOut',
							onUpdate: (tween) => {
								const t = tween.getValue() ?? 1;
								this.player.y = Phaser.Math.Linear(baseY, apex.y, Math.sin(t * Math.PI));
							},
							onComplete: () => {
								this.player.y = baseY;
								resolve();
							}
						});
					});
					break;
				}
				case 'blocked': {
					const original = this.player.x;
					await this.tweenPromise({
						targets: this.player,
						x: original + 6 * this.facingSign,
						duration: 60,
						yoyo: true,
						repeat: 2,
						ease: 'Sine.easeInOut'
					});
					break;
				}
				case 'fall': {
					await this.tweenPromise({
						targets: this.player,
						y: this.player.y + this.tileSize * 2,
						alpha: 0,
						angle: this.player.angle + 180,
						duration: 550,
						ease: 'Cubic.easeIn'
					});
					break;
				}
				case 'collect': {
					const sprite = this.collectibleSprites.get(cmd.itemId);
					if (sprite) {
						this.tweens.killTweensOf(sprite);
						await this.tweenPromise({ targets: sprite, scale: 0, alpha: 0, duration: moveMs * 0.6, ease: 'Back.easeIn' });
						sprite.destroy();
					}
					break;
				}
				case 'procEnter': {
					const sensor = this.sensorSprites.get(cmd.trigger);
					if (sensor) {
						await this.tweenPromise({
							targets: sensor,
							scale: sensor.scale * 1.35,
							duration: 180,
							yoyo: true,
							ease: 'Sine.easeInOut'
						});
					}
					break;
				}
				case 'procExit':
					break;
				case 'win': {
					await this.tweenPromise({
						targets: this.player,
						scaleY: this.playerBaseScale * 1.3,
						scaleX: this.playerBaseScale * 1.3 * this.facingSign,
						duration: 220,
						yoyo: true,
						ease: 'Back.easeOut'
					});
					break;
				}
				case 'lose': {
					await this.tweenPromise({ targets: this.player, alpha: 0.4, duration: 150, yoyo: true, repeat: 1 });
					break;
				}
				default:
					break;
			}
		}
	}
}
