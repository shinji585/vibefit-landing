import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function LayoutGridIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <path
        d="M3.333 4.583c0-.69.56-1.25 1.25-1.25H7.5c.69 0 1.25.56 1.25 1.25V7.5c0 .69-.56 1.25-1.25 1.25H4.583c-.69 0-1.25-.56-1.25-1.25V4.583zM3.333 12.5c0-.69.56-1.25 1.25-1.25H7.5c.69 0 1.25.56 1.25 1.25v2.917c0 .69-.56 1.25-1.25 1.25H4.583c-.69 0-1.25-.56-1.25-1.25V12.5zM11.25 4.583c0-.69.56-1.25 1.25-1.25h2.917c.69 0 1.25.56 1.25 1.25V7.5c0 .69-.56 1.25-1.25 1.25H12.5c-.69 0-1.25-.56-1.25-1.25V4.583zM11.25 12.5c0-.69.56-1.25 1.25-1.25h2.917c.69 0 1.25.56 1.25 1.25v2.917c0 .69-.56 1.25-1.25 1.25H12.5c-.69 0-1.25-.56-1.25-1.25V12.5z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M14.109 5.104a2.947 2.947 0 11.001 5.39m1.687 2.727c3.802.224 5.024 2.788 5.416 4.47.186.797-.47 1.458-1.289 1.458H17.59m-5.839-11.35a2.947 2.947 0 11-5.894 0 2.947 2.947 0 015.894 0zM8.75 13.205c4.234 0 5.554 2.726 5.964 4.486.186.797-.47 1.458-1.29 1.458H4.076c-.818 0-1.475-.662-1.29-1.458.411-1.76 1.73-4.486 5.964-4.486z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2a.75.75 0 01.75.75v1h6.5v-1a.75.75 0 011.5 0v1h1.75A2.25 2.25 0 0120.75 6v13a2.25 2.25 0 01-2.25 2.25h-13A2.25 2.25 0 013.25 19V6A2.25 2.25 0 015.5 3.75h1.75v-1A.75.75 0 018 2zm0 3.25H5.5a.75.75 0 00-.75.75v2.25h14.5V6a.75.75 0 00-.75-.75H8zm11.25 4.5H4.75V19c0 .414.336.75.75.75h13a.75.75 0 00.75-.75V9.75z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TableIcon(props: IconProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.25 5.5A2.25 2.25 0 015.5 3.25h13a2.25 2.25 0 012.25 2.25v13a2.25 2.25 0 01-2.25 2.25h-13a2.25 2.25 0 01-2.25-2.25v-13zm2.25-.75a.75.75 0 00-.75.75v3.083h14.5V5.5a.75.75 0 00-.75-.75h-13zm13.75 5.333h-3.834v3.833h3.834v-3.833zm-5.334 0h-3.833v3.833h3.833v-3.833zm-5.333 0H4.75v3.833h3.833v-3.833zM4.75 18.5v-3.084h3.833v3.834H5.5a.75.75 0 01-.75-.75zm5.333.75v-3.834h3.833v3.834h-3.833zm5.333 0v-3.834h3.834V18.5a.75.75 0 01-.75.75h-3.084z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PieChartIcon(props: IconProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2a.75.75 0 00-.75.75V12c0 .414.336.75.75.75h9.25A.75.75 0 0022 12c0-5.523-4.477-10-10-10zm.75 9.25V3.533a8.492 8.492 0 015.26 2.457 8.492 8.492 0 012.457 5.26H12.75zM2 12c0-4.75 3.31-8.725 7.75-9.746v1.547A8.5 8.5 0 1020.199 14.25h1.547C20.726 18.69 16.749 22 12 22 6.477 22 2 17.523 2 12z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MenuTwoIcon(props: IconProps) {
  return (
    <svg
      width={16}
      height={12}
      viewBox="0 0 16 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <path
        d="M14.382 14.383l3.325 3.326m-1.249-8.334a7.082 7.082 0 01-7.083 7.081 7.082 7.082 0 110-14.163 7.082 7.082 0 017.083 7.082z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <path
        d="M9.861 1.876v1.25m0 0a5.625 5.625 0 015.625 5.625v6.041H4.236V8.751a5.625 5.625 0 015.625-5.625zm-1.25 14.166h2.5m-7.917-2.5h13.334"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserCircleIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M17.775 19.107v-.261a4.5 4.5 0 00-4.5-4.5h-2.55a4.5 4.5 0 00-4.5 4.5v.261M21.25 12a9.25 9.25 0 11-18.5 0 9.25 9.25 0 0118.5 0zm-6.483-2.732a2.768 2.768 0 11-5.536 0 2.768 2.768 0 015.536 0z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4.792 7.396L10 12.604l5.208-5.208"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
