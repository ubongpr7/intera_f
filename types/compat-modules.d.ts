declare module "embla-carousel-react" {
  export interface EmblaCarouselType {
    canScrollPrev(): boolean;
    canScrollNext(): boolean;
    scrollPrev(): void;
    scrollNext(): void;
    on(event: string, callback: (api: EmblaCarouselType) => void): void;
    off(event: string, callback: (api: EmblaCarouselType) => void): void;
  }

  export type UseEmblaCarouselType = [
    (instance: HTMLElement | null) => void,
    EmblaCarouselType | undefined,
  ];

  export default function useEmblaCarousel(
    options?: { axis?: "x" | "y" } & Record<string, unknown>,
    plugins?: unknown,
  ): UseEmblaCarouselType;
}
declare module "cmdk";
declare module "vaul";
declare module "input-otp" {
  import * as React from "react";

  export const OTPInput: React.ForwardRefExoticComponent<
    React.InputHTMLAttributes<HTMLInputElement> & {
      containerClassName?: string;
    } & React.RefAttributes<HTMLInputElement>
  >;

  export const OTPInputContext: React.Context<{
    slots: Array<{
      char: string | null;
      hasFakeCaret: boolean;
      isActive: boolean;
    }>;
  }>;
}
declare module "react-resizable-panels";
declare module "next-themes";
declare module "sonner";
declare module "js-yaml" {
  const yaml: {
    load: (source: string) => unknown;
    dump?: (value: unknown) => string;
  };
  export default yaml;
}
