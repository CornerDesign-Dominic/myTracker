import type { ImageSourcePropType } from "react-native";

import type { BrandVisualKey } from "@/constants/subscriptionAssets";

export type BrandImageAsset = {
  backgroundColor?: string;
  borderColor?: string;
  scale?: number;
  source: ImageSourcePropType;
};

const subtleBorder = "rgba(15,23,42,0.08)";

export const brandImageAssets: Partial<Record<BrandVisualKey, BrandImageAsset>> = {
  appleMusic: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.82,
    source: require("../../../assets/brands/applemusic.png"),
  },
  appleTvPlus: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/appletvplus.png"),
  },
  claude: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/claude.png"),
  },
  dazn: {
    backgroundColor: "#111111",
    scale: 0.82,
    source: require("../../../assets/brands/dazn.png"),
  },
  deezer: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/deezer.png"),
  },
  dropbox: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.82,
    source: require("../../../assets/brands/dropbox.png"),
  },
  ebayPlus: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/ebayplus.png"),
  },
  evernote: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.82,
    source: require("../../../assets/brands/evernote.png"),
  },
  figma: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/figma.png"),
  },
  github: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.82,
    source: require("../../../assets/brands/github.png"),
  },
  googleDrive: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/googledrive.png"),
  },
  icloud: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.8,
    source: require("../../../assets/brands/icloud.png"),
  },
  n26: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.82,
    source: require("../../../assets/brands/n26.png"),
  },
  netflix: {
    backgroundColor: "#120709",
    scale: 0.78,
    source: require("../../../assets/brands/netflix.png"),
  },
  notion: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.82,
    source: require("../../../assets/brands/notion.png"),
  },
  ottoUp: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/ottoup.png"),
  },
  paramountPlus: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.86,
    source: require("../../../assets/brands/paramountplus.png"),
  },
  patreon: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/patreon.png"),
  },
  paypal: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/paypal.png"),
  },
  perplexity: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/perplexity.png"),
  },
  playstationPlus: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.82,
    source: require("../../../assets/brands/playstationplus.png"),
  },
  revolut: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.82,
    source: require("../../../assets/brands/revolut.png"),
  },
  skillshare: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/skillshare.png"),
  },
  sky: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/sky.png"),
  },
  soundcloud: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/soundcloud.png"),
  },
  spotify: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.86,
    source: require("../../../assets/brands/spotify.png"),
  },
  twitch: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/twitch.png"),
  },
  udemy: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/udemy.png"),
  },
  youtube: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.86,
    source: require("../../../assets/brands/youtube.png"),
  },
  zalandoPlus: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.84,
    source: require("../../../assets/brands/zalandoplus.png"),
  },
  zoom: {
    backgroundColor: "#FFFFFF",
    borderColor: subtleBorder,
    scale: 0.86,
    source: require("../../../assets/brands/zoom.png"),
  },
};
