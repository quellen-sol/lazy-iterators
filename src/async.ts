export class AyncLazyIterator<T> {
  constructor(public readonly iterable: AsyncIterable<T>) { }

  async collect(): Promise<T[]> {
    const res: T[] = [];
    for await (const result of this.iterable) {
      res.push(result);
    }
    return res;
  }

  map<U>(fn: (value: T) => U): AyncLazyIterator<U> {
    const { iterable } = this;
    const generator = async function* () {
      for await (const item of iterable) {
        yield fn(item);
      }
    }

    return new AyncLazyIterator(generator());
  }

  filter<S extends T>(fn: (item: T) => item is S): AyncLazyIterator<S>
  filter(fn: (item: T) => boolean): AyncLazyIterator<T>
  filter(fn: (item: T) => boolean): AyncLazyIterator<T> {
    const { iterable } = this;
    const generator = async function* () {
      for await (const item of iterable) {
        if (fn(item)) {
          yield item;
        }
      }
    }

    return new AyncLazyIterator(generator());
  }

  chunks(chunkSize: number, truncateChunks = false): AyncLazyIterator<T[]> {
    if (chunkSize <= 0) {
      throw new Error("LazyIterator - Cannot create chunks of size 0 or lower");
    }
    if (chunkSize === Infinity) {
      throw new Error("LazyIterator - Cannot create chunks of size Infinity");
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

    return new AyncLazyIterator(generator());
  }

  rev(): AyncLazyIterator<T> {
    // We can only reverse if the iterable is an array
    if (!Array.isArray(this.iterable)) {
      throw new Error("LazyIterator - Cannot reverse non-array iterables");
    }
    const { iterable } = this;
    const generator = async function* () {
      for (let i = iterable.length - 1; i >= 0; i--) {
        yield iterable[i];
      }
    }

    return new AyncLazyIterator(generator());
  }
}