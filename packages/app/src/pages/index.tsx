import { ChessOpening } from '@chess.openings/components/ChessOpening';
import openings from '@chess.openings/data/openings.json';
import { Opening } from '@chess.openings/types/chess.types';
import { NextPage } from 'next';
import { ChangeEvent, useEffect, useState } from 'react';

const longLineOpenings: Opening[] = openings.filter(({ pgn }) => {
	const moves = pgn.split(' ').filter((_, index) => index % 3 === 0);
	return moves.length >= 10;
});

const groups: string[] = [
	...new Set(longLineOpenings.map(({ group }) => group)),
];

const groupOptions = groups
	.map((group) => {
		const filteredOpenings = longLineOpenings.filter(
			({ group: groupOption }) => group === groupOption,
		);
		const total: number = filteredOpenings.length;
		const superGroup: string =
			(filteredOpenings.at(0)?.pgn ?? '').split(' ').at(1) ?? '';
		return { superGroup, group, total };
	})
	.sort((a, b) => {
		if (a.superGroup === b.superGroup) {
			if (a.total === b.total) {
				return a.group > b.group ? 1 : -1;
			}
			return a.total > b.total ? 1 : -1;
		}
		return a.superGroup > b.superGroup ? 1 : -1;
	});

const superGroupOptions = [
	...new Set(groupOptions.map(({ superGroup }) => superGroup)),
];

const HomePage: NextPage = () => {
	const [activeSlide, setActiveSlide] = useState<number>(1); // To track active slide
	const [selectedGroup, setSelectedGroup] = useState(
		groupOptions.at(0)?.group ?? '',
	);

	const filteredOpenings: Opening[] = (longLineOpenings as Opening[]).filter(
		({ group }) => selectedGroup === group,
	);

	const scrollToSlide = (slideIndex: number) => {
		const el = document.getElementById(slideIndex.toString());
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	};

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				const next = Math.min(activeSlide + 1, filteredOpenings.length);
				scrollToSlide(next);
			}

			if (e.key === 'ArrowUp') {
				e.preventDefault();
				const prev = Math.max(activeSlide - 1, 1);
				scrollToSlide(prev);
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [activeSlide, filteredOpenings.length]);

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

	return (
		<div className="flex h-screen w-screen flex-col gap-y-0 overflow-hidden p-0 md:gap-y-8 md:p-8">
			<div className="mx-auto w-full max-w-md md:max-w-sm">
				<select
					id="group"
					name="group"
					className="select w-full focus:outline-none"
					value={selectedGroup}
					onChange={(event: ChangeEvent<HTMLSelectElement>) => {
						setActiveSlide(0);
						setSelectedGroup(event.target.value);
					}}>
					{superGroupOptions.map((superGroupOption) => {
						return (
							<optgroup key={superGroupOption} label={superGroupOption}>
								{groupOptions
									.filter(({ superGroup }) => superGroup === superGroupOption)
									.map(({ group, total }) => {
										return (
											<option key={group} value={group}>
												{group} ({total})
											</option>
										);
									})}
							</optgroup>
						);
					})}
				</select>
			</div>
			<div className="scrollbar-none h-full grow snap-y snap-mandatory overflow-y-auto scroll-smooth">
				{filteredOpenings.map((opening: Opening, index: number) => (
					<div
						id={(index + 1).toString()}
						key={`${opening.eco.toString()}-${opening.name.toString().replaceAll(' ', '-').replaceAll(':', ' ')}-${index}`} // Add an ID to each slide
						className="slide flex h-full snap-start items-center justify-center">
						{/* Aspect Ratio for Video - set directly on the container */}
						<div className="border-base-300 relative flex h-full max-h-fit w-full max-w-md flex-col overflow-hidden border shadow-2xl md:max-w-sm">
							<div className="flex h-full w-full grow items-center justify-center">
								<ChessOpening
									pgn={opening.pgn}
									isAutoPlay={activeSlide === index + 1}
								/>
							</div>
							<div className="border-base-300 flex w-full flex-col gap-y-1 border-t px-2 py-1 md:px-4 md:py-2">
								<h2 className="truncate font-semibold">
									{index + 1}/{filteredOpenings.length}. {opening.subgroup}
								</h2>
								<p className="text-primary line-clamp-3 text-xs">
									{opening.pgn}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default HomePage;
