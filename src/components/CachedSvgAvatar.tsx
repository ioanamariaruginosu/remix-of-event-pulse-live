import { useCachedAvatar } from "@/lib/avatar-cache";

type Props = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  clipPath?: string;
};

/** <image> inside an <svg> that swaps to the cached data URL once available. */
export function CachedSvgAvatar({ url, x, y, width, height, clipPath }: Props) {
  const href = useCachedAvatar(url);
  return (
    <image
      href={href}
      xlinkHref={href}
      x={x}
      y={y}
      width={width}
      height={height}
      clipPath={clipPath}
      preserveAspectRatio="xMidYMid slice"
    />
  );
}
