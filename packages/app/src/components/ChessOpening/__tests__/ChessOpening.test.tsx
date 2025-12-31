import { render } from '@testing-library/react';
import { ChessOpening } from '../ChessOpening';

describe('ChessOpening', () => {
	it('renders correctly', () => {
		const { container } = render(
			<ChessOpening pgn={'1. e4'} isAutoPlay={false} />,
		);
		expect(container).toMatchSnapshot();
	});
});
