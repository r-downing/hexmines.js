
pyrange = n => [...Array(n).keys()];

/** holds data for a single tile on the game grid */
class Tile {
	constructor() {
		this.isMine = false;
		this.isLocked = false;
		this.isRevealed = false;
		this.numNeighborMines = 0;
	}
}

/** Main minesweeper control class */
class Mines {
	constructor(rows, cols, numMines) {
		this.numMines = numMines;
		this.minesPlaced = false;
		this._lost = false;
		this.numRevealed = 0;
		this._numLocked = 0;
		this.grid = pyrange(rows).map(e => pyrange(cols).map(f => new Tile()))
	}

	/** Gets the Tile from the specified row/column */
	tile(r, c) {
		return this.grid[r][c]
	}

	/** Get number of rows */
	get rows() {
		return this.grid.length;
	}

	/** Get number of columns */
	get cols() {
		return this.grid[0].length;
	}

	/** True if game lost (mine revealed) */
	get lost() {
		return this._lost
	}

	/** True if game won (all non-mine tiles revealed) */
	get won() {
		return (!this.lost) && ((this.numRevealed + this.numMines) == (this.rows * this.cols));
	}

	/** Number of tiles currently locked */
	get numLocked() {
		return this._numLocked;
	}

	/** Place mines randomly on board, avoiding initial guess tile r0,c0 */
	_placeMines(r0, c0) {
		this.minesPlaced = true;
		let safeSpaces = this.coords().filter(rc => !this.isNeighbor(r0, c0, ...rc));
		for (var i = 0; i < this.numMines; i++) {
			let [r, c] = safeSpaces.splice(Math.floor(Math.random() * safeSpaces.length), 1)[0];
			this.grid[r][c].isMine = true;
			let neighborhood = this.neighborhood(r, c);
			for (var j = 0; j < neighborhood.length; j++) {
				this.tile(...neighborhood[j]).numNeighborMines++;
			}
		}
	}

	/** Get list of [r, c] pairs of all tiles */
	coords() {
		return pyrange(this.rows).map(r => pyrange(this.cols).map(c => [r, c])).flat();
	}

	/** True if r, c is a valid coordinate set */
	isValid(r, c) {
		return (r >= 0) && (c >= 0) && (r < this.rows) && (c < this.cols);
	}

	/** True if r1,c1 is a neighbor of r2, c2 (adjacent/diagonal) */
	isNeighbor(r1, c1, r2, c2) {
		return (Math.abs(r1 - r2) <= 1) && (Math.abs(c1 - c2) <= 1);
	}

	/** Returns list of [r, c] pairs of all neighbor tiles of specified tile, including specified tile */
	neighborhood(r, c) {
		return this.coords().filter(rc => this.isNeighbor(r, c, ...rc))
	}

	/** Toggles locked state of specified tile, if unrevealed. Returns true if state changed */
	toggleLock(r, c) {
		if (!this.isValid(r, c) || !this.minesPlaced || this.tile(r, c).isRevealed || this.lost || this.won) {
			return false;
		}
		let tile = this.tile(r, c);
		tile.isLocked = !tile.isLocked;
		this._numLocked += tile.isLocked? 1 : -1;
	}

	/** Used internally when revealing a zero tile or auto-revealing neighbors */
	_select_unrevealed_neighbors(r, c)
	{
		let ret = false;
		let neighborhood = this.neighborhood(r, c);
		for (var j = 0; j < neighborhood.length; j++) {
			if(!this.tile(...neighborhood[j]).isRevealed) {
				ret |= this.select(...neighborhood[j]);
			}
		}
		return ret;
	}

	/** Select a tile to reveal by specifying row/column */
	select(r, c) {
		if (!this.isValid(r, c) || this.lost || this.won) return false;
		if (!this.minesPlaced) this._placeMines(r, c);
		if (this.tile(r, c).isLocked) return false;
		if (this.tile(r, c).isRevealed) {
			if (this.tile(r, c).numNeighborMines == this.neighborhood(r, c).filter(rc => this.tile(...rc).isLocked).length) {
				return this._select_unrevealed_neighbors(r, c)
			}
		} else {
			this.tile(r, c).isRevealed = true;
			this.numRevealed++;
			this._lost |= this.tile(r, c).isMine;
			if(this.tile(r, c).numNeighborMines == 0) {
				this._select_unrevealed_neighbors(r, c);
			}
			return true;
		}
	}
} /* class Mines */


/** Hexagonal variant of base Mines class. Rows zig-zag by 1/2 a hexagon */
class HexMines extends Mines {
	/** Modified to account for hex adjacency */
	isNeighbor(r1, c1, r2, c2) {
		if(r1 == r2) return Math.abs(c1 - c2) <= 1; //same row
		if(r1 > r2) return this.isNeighbor(r2, c2, r1, c1);
		if((r2 - r1) == 1) {
			if (c1 == c2) return true;
			let zigzag = (r2 % 2) ? -1 : 1;
			return (c2 - c1) == zigzag
		}
		return false;
	}
}
