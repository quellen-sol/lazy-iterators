export class LazyIterator<T> {
  constructor(public readonly iterable: Iterable<T>) { }

  collect(): T[] {
    return [...this.iterable];
  }

  map<U>(fn: (value: T) => U): LazyIterator<U> {
    const { iterable } = this;
    const generator = function* () {
      for (const item of iterable) {
        yield fn(item);
      }
    }

    return new LazyIterator(generator());
  }

  filter<S extends T>(fn: (item: T) => item is S): LazyIterator<S>
  filter(fn: (item: T) => boolean): LazyIterator<T>
  filter(fn: (item: T) => boolean): LazyIterator<T> {
    const { iterable } = this;
    const generator = function* () {
      for (const item of iterable) {
        if (fn(item)) {
          yield item;
        }
      }
    }

    return new LazyIterator(generator());
  }

  chunks(chunkSize: number, truncateChunks = false): LazyIterator<T[]> {
    if (chunkSize <= 0) {
      throw new Error("LazyIterator - Cannot create chunks of size 0 or lower");
    }
    if (chunkSize === Infinity) {
      throw new Error("LazyIterator - Cannot create chunks of size Infinity");
    }
    const { iterable } = this;
    const generator = function* () {
      let currChunk: T[] = [];
      for (const item of iterable) {
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

    return new LazyIterator(generator());
  }

  rev(): LazyIterator<T> {
    // We can only reverse if the iterable is an array
    if (!Array.isArray(this.iterable)) {
      throw new Error("LazyIterator - cannot rev(): iterable provided is not an array")
    }

    const iter = this.iterable as T[];
    const generator = function* () {
      for (let i = iter.length - 1; i > -1; i--) {
        yield iter[i];
      }
    }

    return new LazyIterator(generator());
  }
}
