import { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      {...props}
    >
      <circle cx="32" cy="32" r="30" fill="#2563EB" />
      <path d="M24 22V42L44 32L24 22Z" fill="white" />
    </svg>
  );
}
