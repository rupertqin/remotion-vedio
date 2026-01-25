export {};

declare global {
  const require: {
    context(
      directory: string,
      useSubdirectories?: boolean,
      regExp?: RegExp
    ): {
      (id: string): string;
      keys(): string[];
      <T>(id: string): T;
      resolve(id: string): string;
      id: string;
    };
  };
}
