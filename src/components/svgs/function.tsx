import * as React from "react";

const Function = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(function Function(
  props: Omit<React.SVGProps<SVGSVGElement>, "ref">,
  ref: React.ForwardedRef<SVGSVGElement>,
) {
  return (
    <svg
      ref={ref}
      fill="#e3e3e3"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M240-160v-80l260-240-260-240v-80h480v120H431l215 200-215 200h289v120H240Z" />
    </svg>
  );
});

export default Function;
