const MOBILE_RELEASES_URL =
  "https://github.com/MECO-Robotics/meco-mission-control-mobile/releases";
const MOBILE_USER_AGENT_PATTERN =
  /android|iphone|ipod|mobile|windows phone|blackberry|opera mini/i;

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    mobile?: boolean;
  };
};

export { MOBILE_RELEASES_URL };

export function detectMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const nav = navigator as NavigatorWithUserAgentData;
  const userAgent = nav.userAgent?.toLowerCase() ?? "";

  if (nav.userAgentData?.mobile) {
    return true;
  }

  if (MOBILE_USER_AGENT_PATTERN.test(userAgent)) {
    return true;
  }

  return /ipad/i.test(userAgent) || (userAgent.includes("macintosh") && nav.maxTouchPoints > 1);
}
