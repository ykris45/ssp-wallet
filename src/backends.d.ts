declare module '@storage/backends' {
  interface Backend {
    node: string;
  }
  type backends = Record<string, Backend>;
  let backends: backends;
}
