import { Summary } from 'benny/lib/internal/common-types';

export default function interpret(summary: Summary, size: number, divisor: number) {
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
