export const getVariableLengthChunks = (maxLen: number): number[][] => {
	const chunks = [];
	let x = 0;
	for (let len = 0; len <= maxLen; len++) {
		const chunk: number[] = [];
		for (let i = 0; i < len; i++) {
			chunk.push(x);
			x = (x + 1) % 256;
		}
		chunks.push(chunk);
	}

	for (let len = maxLen; len >= 0; len--) {
		const chunk: number[] = [];
		for (let i = 0; i < len; i++) {
			chunk.push(x);
			x = (x + 1) % 256;
		}
		chunks.push(chunk);
	}

	return chunks;
};
