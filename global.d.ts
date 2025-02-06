// global.d.ts
export {};

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
    FC: any;
  }
}
