import Phaser from 'phaser';
import { asset } from '$app/paths';
import type { Challenge, Command, Direction, Vec2 } from '$lib/engine';
import { EventBus } from './EventBus';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 360;
const MOVE_MS = 320;
const TURN_MS = 220;

/** Angle to rotate the monkey sprite, and which way to mirror it, per
 * facing direction. The art is drawn facing right; "left" is a horizontal
 * mirror rather than a 180° rotation so the monkey never renders upside
 * down. Only the up<->left and left<->down transitions cross a mirror
 * boundary — see playCommands' turn handling. */
const FACING_TRANSFORM: Record<Direction, { angle: number; sign: 1 | -1 }> = {
	right: { angle: 0, sign: 1 },
	down: { angle: 90, sign: 1 },
	up: { angle: -90, sign: 1 },
	left: { angle: 0, sign: -1 }
};

export default class GridScene extends Phaser.Scene {
	private challenge!: Challenge;
	private tileSize = 48;
	private offsetX = 0;
	private offsetY = 0;
	private player!: Phaser.GameObjects.Image;
	private playerBaseScale = 1;
	private collectibleSprites = new Map<string, Phaser.GameObjects.Image>();

	constructor() {
		super('GridScene');
	}

	init(data: { challenge: Challenge }) {
		this.challenge = data.challenge;
	}

	preload() {
		// asset() paths must be literal so SvelteKit's generated Asset union
		// can verify each file actually exists under static/.
		this.load.svg('monkey', asset('/assets/monkey.svg'), { width: 128, height: 128 });
		this.load.svg('banana', asset('/assets/banana.svg'), { width: 96, height: 96 });
		this.load.svg('tile-grass', asset('/assets/tile-grass.svg'), { width: 128, height: 128 });
		this.load.svg('tile-dirt', asset('/assets/tile-dirt.svg'), { width: 128, height: 128 });
		this.load.svg('rock', asset('/assets/rock.svg'), { width: 128, height: 128 });
		this.load.svg('pit', asset('/assets/pit.svg'), { width: 128, height: 128 });
		this.load.svg('goal-flag', asset('/assets/goal-flag.svg'), { width: 128, height: 128 });
		this.load.svg('leaf', asset('/assets/leaf-bg.svg'), { width: 240, height: 140 });
	}

	create() {
		const { width, height } = this.challenge.grid;
		this.tileSize = Math.floor(Math.min(CANVAS_WIDTH / width, CANVAS_HEIGHT / height, 96));
		this.offsetX = (CANVAS_WIDTH - this.tileSize * width) / 2;
		this.offsetY = (CANVAS_HEIGHT - this.tileSize * height) / 2;

		this.drawBackground();
		this.drawGrid();
		this.drawGoalFlag();
		this.drawObstacles();
		this.drawCollectibles();
		this.drawPlayer();

		EventBus.sceneReady(this);
	}

	private tileCenter(pos: Vec2): Vec2 {
		return {
			x: this.offsetX + pos.x * this.tileSize + this.tileSize / 2,
			y: this.offsetY + pos.y * this.tileSize + this.tileSize / 2
		};
	}

	private drawBackground() {
		this.add.tileSprite(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 'tile-grass');
		// Jungle framing in the corners the grid doesn't cover.
		this.add.image(-10, CANVAS_HEIGHT + 10, 'leaf').setOrigin(0, 1).setScale(0.8);
		this.add.image(CANVAS_WIDTH + 10, CANVAS_HEIGHT + 10, 'leaf').setOrigin(1, 1).setScale(0.8).setFlipX(true);
	}

	private drawGrid() {
		const { width, height } = this.challenge.grid;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const c = this.tileCenter({ x, y });
				this.add.image(c.x, c.y, 'tile-dirt').setDisplaySize(this.tileSize, this.tileSize);
			}
		}
		const g = this.add.graphics();
		g.lineStyle(2, 0xc79a5e, 0.6);
		for (let x = 0; x <= width; x++) {
			g.lineBetween(
				this.offsetX + x * this.tileSize,
				this.offsetY,
				this.offsetX + x * this.tileSize,
				this.offsetY + height * this.tileSize
			);
		}
		for (let y = 0; y <= height; y++) {
			g.lineBetween(
				this.offsetX,
				this.offsetY + y * this.tileSize,
				this.offsetX + width * this.tileSize,
				this.offsetY + y * this.tileSize
			);
		}
	}

	private drawGoalFlag() {
		if (this.challenge.goal.type !== 'reachTile') return;
		const c = this.tileCenter(this.challenge.goal.target);
		this.add.image(c.x, c.y - this.tileSize * 0.1, 'goal-flag').setDisplaySize(this.tileSize * 0.8, this.tileSize * 0.8);
	}

	private drawObstacles() {
		for (const obstacle of this.challenge.entities.obstacles) {
			const c = this.tileCenter(obstacle.pos);
			if (obstacle.kind === 'rock') {
				this.add.image(c.x, c.y, 'rock').setDisplaySize(this.tileSize * 0.85, this.tileSize * 0.85);
			} else {
				// Pits are flat (ground-level), unlike the raised rock.
				this.add.image(c.x, c.y, 'pit').setDisplaySize(this.tileSize * 0.9, this.tileSize * 0.9);
			}
		}
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
		const t = FACING_TRANSFORM[this.challenge.entities.playerFacing];
		this.player.setAngle(t.angle);
		this.player.setScale(this.playerBaseScale * t.sign, this.playerBaseScale);
	}

	private tweenPromise(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
		return new Promise((resolve) => {
			this.tweens.add({ ...config, onComplete: () => resolve() });
		});
	}

	/** Restarts the scene from the challenge's initial state — used by the
	 * "Reset" control so a kid can re-run without losing their program. */
	resetScene(): void {
		this.scene.restart({ challenge: this.challenge });
	}

	/** Plays a command stream from the engine back as animation, one command
	 * at a time so it reads as "the monkey is doing what I coded" rather
	 * than an instant jump-cut. */
	async playCommands(commands: Command[], speedMultiplier = 1, onCommand?: (cmd: Command) => void): Promise<void> {
		const moveMs = MOVE_MS / speedMultiplier;
		const turnMs = TURN_MS / speedMultiplier;

		for (const cmd of commands) {
			onCommand?.(cmd);
			switch (cmd.type) {
				case 'move': {
					const target = this.tileCenter(cmd.to);
					// Cosmetic hop, fired alongside the position tween rather
					// than awaited, so it doesn't add to the step duration.
					this.tweens.add({
						targets: this.player,
						scaleY: this.playerBaseScale * 0.82,
						duration: moveMs / 2,
						yoyo: true,
						ease: 'Sine.easeInOut'
					});
					await this.tweenPromise({ targets: this.player, x: target.x, y: target.y, duration: moveMs, ease: 'Sine.easeInOut' });
					break;
				}
				case 'jump': {
					// A 2-tile hop arcs over the skipped tile rather than
					// sliding flat, so it reads as "jump" not "fast move".
					const from = this.tileCenter(cmd.from);
					const to = this.tileCenter(cmd.to);
					const jumpMs = (MOVE_MS * 1.4) / speedMultiplier;
					const arcHeight = this.tileSize * 0.5;
					await new Promise<void>((resolve) => {
						this.tweens.addCounter({
							from: 0,
							to: 1,
							duration: jumpMs,
							ease: 'Sine.easeInOut',
							onUpdate: (tween) => {
								const t = tween.getValue() ?? 1;
								this.player.x = Phaser.Math.Linear(from.x, to.x, t);
								this.player.y = Phaser.Math.Linear(from.y, to.y, t) - Math.sin(t * Math.PI) * arcHeight;
							},
							onComplete: () => resolve()
						});
					});
					break;
				}
				case 'turn': {
					const t = FACING_TRANSFORM[cmd.to];
					await this.tweenPromise({
						targets: this.player,
						angle: t.angle,
						scaleX: this.playerBaseScale * t.sign,
						duration: turnMs,
						ease: 'Sine.easeInOut'
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
				case 'blocked': {
					const original = this.player.x;
					await this.tweenPromise({
						targets: this.player,
						x: original + 6,
						duration: 60,
						yoyo: true,
						repeat: 2,
						ease: 'Sine.easeInOut'
					});
					break;
				}
				case 'fall': {
					// Distinct from 'blocked' — the monkey drops into the pit
					// rather than bumping and staying put.
					await this.tweenPromise({
						targets: this.player,
						y: this.player.y + this.tileSize * 0.3,
						scale: 0,
						angle: this.player.angle + 180,
						alpha: 0,
						duration: 500,
						ease: 'Cubic.easeIn'
					});
					break;
				}
				case 'win': {
					await this.tweenPromise({
						targets: this.player,
						scaleY: this.playerBaseScale * 1.3,
						scaleX: this.playerBaseScale * 1.3 * (this.player.scaleX < 0 ? -1 : 1),
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
			}
		}
	}
}
