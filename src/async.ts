export class AsyncLazyIterator<T> {
  constructor(public readonly iterable: AsyncIterable<T>) { }

  async collect(): Promise<T[]> {
    const res: T[] = [];
    for await (const result of this.iterable) {
      res.push(result);
    }
    return res;
  }

  map<U>(fn: (value: T) => U): AsyncLazyIterator<U> {
    const { iterable } = this;
    const generator = async function* () {
      for await (const item of iterable) {
        yield fn(item);
      }
    }

    return new AsyncLazyIterator(generator());
  }

  filter<S extends T>(fn: (item: T) => item is S): AsyncLazyIterator<S>
  filter(fn: (item: T) => boolean): AsyncLazyIterator<T>
  filter(fn: (item: T) => boolean): AsyncLazyIterator<T> {
    const { iterable } = this;
    const generator = async function* () {
      for await (const item of iterable) {
        if (fn(item)) {
          yield item;
        }
      }
    }

    return new AsyncLazyIterator(generator());
  }

  chunks(chunkSize: number, truncateChunks = false): AsyncLazyIterator<T[]> {
    if (chunkSize <= 0) {
      throw new Error("AsyncLazyIterator - Cannot create chunks of size 0 or lower");
    }
    if (chunkSize === Infinity) {
      throw new Error("AsyncLazyIterator - Cannot create chunks of size Infinity");
    }
    const { iterable } = this;
    const generator = async function* () {
      let currChunk: T[] = [];
      for await (const item of iterable) {
        currChunk.push(item);
        if (currChunk.length === chunkSize) {
          yield currChunk;
          currChunk = [];
        }
      }

      // Yield any partially completed chunks if truncateChunks === false
      if (currChunk.length > 0 && truncateChunks === false) {
        yield currChunk;
      }
    }

    return new AsyncLazyIterator(generator());
  }

  rev(): AsyncLazyIterator<T> {
    // We can only reverse if the iterable is an array
    if (!Array.isArray(this.iterable)) {
      throw new Error("AsyncLazyIterator - Cannot reverse non-array iterables");
    }
    const { iterable } = this;
    const generator = async function* () {
      for (let i = iterable.length - 1; i >= 0; i--) {
        yield iterable[i];
      }
    }

    return new AsyncLazyIterator(generator());
  }
}