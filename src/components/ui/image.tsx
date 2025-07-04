interface CustomImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function Image({ src, alt, width = 100, height = 100, className }: CustomImageProps) {
  return <Image src={src} alt={alt} width={width} height={height} className={className} />;
}
