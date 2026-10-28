declare module 'ffprobe-static' {
  const ffprobeStatic: {
    path: string;
  };
  export default ffprobeStatic;
}

declare module 'html-to-text' {
  export function convert(html: string, options?: any): string;
}
