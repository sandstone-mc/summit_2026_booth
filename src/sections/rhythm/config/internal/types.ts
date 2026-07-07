export type RenderingMode = 'extended' | 'compressed'

export enum Difficulty {
	EASY = 1,
	NORMAL = 2,
	HARD = 3,
	EXPERT = 4,
	MASTER = 5,
}

export enum CellType {
	FULL = 'full',
	SLAB_BOTTOM = 'slab_bottom',
	SLAB_TOP = 'slab_top',
}

export type Cell = CellType | null

export interface PanelConfig {
	x: number
	y: number
	z: number
	facing: number
	scale: number
}

export interface RhythmConfig {
	/** Audio mode. "extended" ships full OGG audio (large pack). "compressed" uses noteblock sounds only (~1MB). */
	rendering: RenderingMode

	/** World position of the gold line. Walls land here on the beat. The arena faces north: walls travel toward +z. */
	goldLine: [number, number, number]

	/** Size of the wall pattern grid. */
	pattern: {
		/** Number of columns. */
		width: number
		/** Number of rows. */
		height: number
	}

	/** Wall movement, hit detection and colors. */
	walls: {
		/** Blocks travelled per tick. */
		speed: number
		/** Blocks in front of the gold line where walls spawn. */
		spawnDistance: number
		/** Blocks past the gold line a wall travels before it despawns. */
		passDistance: number
		/** Ticks a wall lingers after it has been passed. */
		despawnDelay: number
		/** Distance at which a wall counts as hit. */
		hitRadius: number
		/** Distance at which a wall breaks. */
		breakRadius: number
		/** Ticks before the same wall can be hit again. */
		cooldownTicks: number
		/** Ticks between flash frames when a wall is hit. */
		flashInterval: number
		/** Percent chance to keep spawning from the same obstacle group. */
		groupContinuePercent: number
		/** Tint colors picked per wall. */
		colors: number[]
	}

	/** Fine-tune where the wall collision hitboxes sit, relative to each wall cell (world-space blocks). */
	collisions: {
		/**
		 * Blocks the parkour platform hitboxes run ahead of their visual. Standing is client-side and
		 * the client lerps entity teleports ~3 ticks, so moving hitboxes trail the glass without this.
		 */
		parkourLead: number
		/** Offset for interaction hitboxes (cells that have a wall directly above them). */
		interact: [number, number, number]
		/** Offset for happy_ghast hitboxes (cells with headroom above). */
		ghast: [number, number, number]
	}

	/**
	 * How the map depth is split around the gold line, in blocks.
	 * playable + playerRoom + boothWall + 1 must equal size[2]. The +1 is the gold line.
	 */
	mapLayout: {
		/** Blocks in front of the gold line, where walls travel. */
		playable: number
		/** Open space behind the gold line, inside the lane border. */
		playerRoom: number
		/** Behind playerRoom, holds the panels and the return point. */
		boothWall: number
		/** Lane width in blocks. */
		laneWidth: number
		/** Size of the map .nbt. Fixed by the structure file. */
		size: [number, number, number]
		/**
		 * World-space shift of the whole lit lane zone (border, shulkers, fragments) relative to
		 * the gold line. Moves the lights-delimited lane without touching the .nbt map or the walls.
		 */
		laneShift: [number, number, number]
	}

	/** Lives, countdown and scoring. */
	gameplay: {
		lives: {
			/** Lowest selectable life count. */
			min: number
			/** Highest selectable life count. */
			max: number
			/** Default life count. */
			default: number
		}
		/** Countdown length in seconds before a song starts. */
		countdown: number
		scoring: {
			/** Bonus points awarded each time the combo reaches a multiple of comboDivisor. */
			comboBonus: number
			/** Combo size that grants a bonus. */
			comboDivisor: number
			/** Combo value at which the end-of-game score multiplier caps (combo itself keeps counting). */
			maxCombo: number
			/** Combo milestones that trigger effects. */
			milestones: readonly number[]
		}
	}

	/** Border and particle visuals. */
	visuals: {
		border: {
			/** Number of stacked strips that make the glow gradient. */
			stripCount: number
			/** Border height in blocks. */
			height: number
			/** Default RGB color. */
			defaultColor: [number, number, number]
			/**
			 * World-space offsets for the border light strips. Each strip is two stacked,
			 * opposite-facing displays (a/b) that must be positioned separately.
			 */
			offset: {
				/** Left + right (side) strips: a = base facing, b = 180°-flipped twin. */
				sides: { a: [number, number, number]; b: [number, number, number] }
				/** Front + back strips: a = base facing, b = 180°-flipped twin. */
				frontBack: { a: [number, number, number]; b: [number, number, number] }
			}
			/** Multiplier that corrects the rendered strip length (font pixel calibration). 1 = raw. */
			lengthScale: {
				/** Length correction for the left + right (side) strips. */
				sides: number
				/** Length correction for the front + back strips. */
				frontBack: number
			}
		}
		/** Team colors cycled for the lane glow. */
		glowColors: readonly string[]
		pulse: {
			/** Fragment scale when pulsing. */
			activeScale: number
			/** Fragment scale at rest. */
			restScale: number
		}
	}

	/** Where the song audio plays from and how loud. */
	music: {
		/** Offset in blocks from the gold lane middle block where the sound emits. */
		offset: [number, number, number]
		/** Per-listener loudness of noteblock notes (0..1); they play at each listener. Audio segments instead play positionally from the lane middle. */
		volume: number
		/** Box, centered on the music position, that a player must be inside to hear the music. */
		hearable: {
			dx: number
			dy: number
			dz: number
		}
	}

	/** Leaderboard display. */
	leaderboard: {
		/** Number of entries shown. */
		size: number
		/** Colors used for the top ranks. */
		rankColors: readonly string[]
	}

	/** Booth UI panels. Offsets are relative to the gold line. */
	panels: {
		/** Settings panel offset from the gold line. */
		settingsOffset: [number, number, number]
		/** Yaw of the settings panel front: 0 = south, 90 = west, 180 = north, 270 = east. */
		settingsFacing: number
		/** Leaderboard panel offset from the gold line. */
		leaderboardOffset: [number, number, number]
		/** Yaw of the leaderboard panel front. */
		leaderboardFacing: number
		/** Character width of the song/lives/map value lines on the panels; longer song names scroll. */
		maxNameLength: number
		/** Scroll speed for long text. */
		scrollSpeed: number
		/** Padding string added around panel lines. */
		padding: string
		/** Spacer string used to size panels. */
		ruler: string
		/** Panel background color (ARGB). */
		background: number
	}
}
