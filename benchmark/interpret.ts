import { Summary } from 'benny/lib/internal/common-types';

export default function interpret(summary: Summary, size: number, divisor: number) {
  // console.log('summary', summary.results[0].details);
  // eslint-disable-next-line no-console
  console.table(
    summary.results.map((result) => ({
      name: result.name,
      ops: result.ops * divisor,
      throughput: ((result.ops * divisor * size) / 1024 / 1024).toFixed(2),
      margin: result.margin,
      completed: result.completed,
      size,
      divisor,
    })),
  );
}

export const benchmarkOptions = {
  initCount: 2,
  minTime: 2,
  minSamples: 20,
};
