import openings from '@chess.openings/data/openings.json';
import { Chess } from 'chess.js';
import { NextPage } from 'next';
import {
	ChangeEvent,
	FC,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { Chessboard } from 'react-chessboard';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const groups: string[] = [...new Set(openings.map(({ group }) => group))];
const groupOptions = groups
	.map((group) => {
		const total = openings.filter(
			({ group: groupOption }) => groupOption === group,
		).length;
		return { group, total };
	})
	.filter(({ total = 0 }) => {
		return total <= 100;
	})
	.sort((a, b) => {
		if (a.total === b.total) {
			return a.group > b.group ? 1 : -1;
		}
		return a.total > b.total ? 1 : -1;
	});

type Opening = {
	eco: string;
	group: string;
	subgroup: string;
	name: string;
	pgn: string;
};

const sleep = (ms: number) => {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
};

const ChessOpening: FC<{ pgn: string; isAutoPlay: boolean }> = ({
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
		<div className="relative aspect-square w-fit">
			<Chessboard
				options={{
					position: game.fen(), // Use the FEN from the state (`opening.fen()`)
					onPieceDrop: () => false, // Disable user interaction if needed
				}}
			/>
		</div>
	);
};

const HomePage: NextPage = () => {
	const [activeSlide, setActiveSlide] = useState<number>(1); // To track active slide
	const [selectedGroup, setSelectedGroup] = useState(
		groupOptions.at(0)?.group ?? '',
	);

	// Use the IntersectionObserver API to detect which slide is active
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const videoId = parseInt(entry.target.id);
						setActiveSlide(videoId); // Set the active slide based on the id
					}
				});
			},
			{ threshold: 0.5 }, // Trigger when 50% of the element is visible
		);

		// Observe all video containers
		const slides = document.querySelectorAll('.slide');
		slides.forEach((slide) => observer.observe(slide));

		return () => {
			slides.forEach((slide) => observer.unobserve(slide));
		};
	}, [selectedGroup]);

	const filteredOpenings: Opening[] = (openings as Opening[]).filter(
		({ group }) => selectedGroup === group,
	);

	return (
		<div className="flex h-screen w-screen flex-col gap-y-8 overflow-hidden py-8">
			<div className="mx-auto max-w-sm">
				<select
					id="group"
					name="group"
					className="select mx-auto w-full max-w-xs"
					value={selectedGroup}
					onChange={(event: ChangeEvent<HTMLSelectElement>) => {
						setActiveSlide(0);
						setSelectedGroup(event.target.value);
					}}>
					{groupOptions.map(({ group, total }) => {
						return (
							<option key={group} value={group}>
								{group} ({total})
							</option>
						);
					})}
				</select>
			</div>
			<div className="h-full grow snap-y snap-mandatory overflow-y-auto scroll-smooth">
				{filteredOpenings.map((opening: Opening, index: number) => (
					<div
						id={(index + 1).toString()}
						key={`${opening.eco.toString()}-${opening.name.toString().replaceAll(' ', '-').replaceAll(':', ' ')}-${index}`} // Add an ID to each slide
						className="slide flex h-full snap-start items-center justify-center">
						{/* Aspect Ratio for Video - set directly on the container */}
						<div className="border-base-300 relative aspect-[9/16] h-full max-h-fit rounded-xl border">
							<div className="flex h-full w-full items-center justify-center">
								<div className="border-base-200 border-t border-b">
									<ChessOpening
										pgn={opening.pgn}
										isAutoPlay={activeSlide === index + 1}
									/>
								</div>
							</div>
							{/* Caption Text */}
							<div className="absolute right-0 bottom-4 left-0 z-10 flex w-full flex-col gap-y-1 px-4">
								<h2 className="truncate font-bold text-white">
									{index + 1}. {opening.group}
								</h2>
								<p className="truncate text-xs text-white">{opening.name}</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default HomePage;
