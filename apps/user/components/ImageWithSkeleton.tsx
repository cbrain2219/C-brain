"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

import styles from "./ImageWithSkeleton.module.css";

function getImageKey(src: ImageProps["src"]) {
  if (typeof src === "string") return src;

  return "default" in src ? src.default.src : src.src;
}

function SkeletonImage({ className, onError, onLoad, ...props }: ImageProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    if (image?.complete) {
      setIsPending(false);
    }
  }, [image]);

  const handleLoad: ImageProps["onLoad"] = (event) => {
    setIsPending(false);
    onLoad?.(event);
  };

  const handleError: ImageProps["onError"] = (event) => {
    setIsPending(false);
    onError?.(event);
  };

  return (
    <Image
      {...props}
      className={[className, isPending ? styles.pending : ""]
        .filter(Boolean)
        .join(" ")}
      onError={handleError}
      onLoad={handleLoad}
      ref={setImage}
    />
  );
}

export function ImageWithSkeleton({ src, ...props }: ImageProps) {
  return <SkeletonImage {...props} key={getImageKey(src)} src={src} />;
}
