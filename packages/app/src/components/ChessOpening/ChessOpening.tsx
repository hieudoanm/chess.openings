import { Chess } from 'chess.js';
import { FC, useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const sleep = (ms: number) => {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
};

export const ChessOpening: FC<{ pgn: string; isAutoPlay: boolean }> = ({
	pgn = '',
	isAutoPlay = false,
}) => {
	const openingGame: Chess = useMemo(() => new Chess(), []);
	openingGame.loadPgn(pgn);
	const history: string[] = openingGame.history();

	const [game, setGame] = useState(new Chess(INITIAL_FEN)); // State for the current position
	const gameRef = useRef(new Chess(INITIAL_FEN)); // Store game state in useRef (no re-render on changes)

	const isPlayingRef = useRef(false); // Ref to track if autoplay is already running

	// Play all moves in the history (this will be used in the autoplay)
	const play = useCallback(async () => {
		for (const move of history) {
			gameRef.current.move(move); // Update the game state (no re-render)
			setGame(new Chess(gameRef.current.fen())); // Trigger re-render with the new position
			await sleep(500); // Wait between each move
		}
	}, [history]);

	// Start autoplay (play the game once)
	const startAutoPlay = useCallback(async () => {
		if (isPlayingRef.current) return; // Prevent calling play if it's already running
		isPlayingRef.current = true;

		await play(); // Play the current game

		// After finishing the current game, reset the game state and stop autoplay
		gameRef.current = new Chess(INITIAL_FEN); // Reset game state to initial FEN
		isPlayingRef.current = false; // Mark autoplay as finished
	}, [play]);

	// Effect to start autoplay when isAutoPlay changes to true
	useEffect(() => {
		if (!isAutoPlay || isPlayingRef.current) return; // If not autoplay or already playing, do nothing

		const autoplayAsync = async () => {
			await startAutoPlay(); // Trigger autoplay
		};

		autoplayAsync(); // Start autoplay once when isAutoPlay is true
	}, [isAutoPlay, startAutoPlay]);

	return (
		<div className="border-base-300 relative aspect-square w-full border-t border-b">
			<Chessboard
				options={{
					showNotation: false,
					position: game.fen(), // Use the FEN from the state (`opening.fen()`)
					onPieceDrop: () => false, // Disable user interaction if needed
				}}
			/>
		</div>
	);
};
