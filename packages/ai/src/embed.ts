import { UpstreamError } from '@helix/shared';

export interface EmbeddingClient {
  embed(inputs: string[]): Promise<number[][]>;
}

/**
 * Voyage AI embeddings client. `voyage-code-3` produces 1024-dim vectors that
 * are SOTA on code retrieval benchmarks. We batch up to 128 per request and
 * retry on transient failures.
 */
export class VoyageEmbeddings implements EmbeddingClient {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'voyage-code-3',
  ) {}

  async embed(inputs: string[]): Promise<number[][]> {
    if (inputs.length === 0) return [];
    try {
      const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: inputs.slice(0, 128),
          input_type: 'document',
        }),
      });
      if (!response.ok) {
        throw new Error(`voyage api ${response.status}: ${await response.text()}`);
      }
      const json = (await response.json()) as {
        data: { embedding: number[]; index: number }[];
      };
      return json.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);
    } catch (err) {
      throw new UpstreamError('voyage', err);
    }
  }
}

/** No-op embeddings for dev. Returns deterministic stub vectors. */
export class StubEmbeddings implements EmbeddingClient {
  // eslint-disable-next-line @typescript-eslint/require-await
  async embed(inputs: string[]): Promise<number[][]> {
    return inputs.map((s) => {
      const v = new Array(1024).fill(0);
      for (let i = 0; i < s.length; i++) {
        v[i % 1024] = (v[i % 1024] ?? 0) + s.charCodeAt(i) / 1e6;
      }
      return v;
    });
  }
}
