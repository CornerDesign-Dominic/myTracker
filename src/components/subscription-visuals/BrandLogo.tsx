import { Image, StyleSheet, Text, View } from "react-native";

import type { BrandVisualKey } from "@/constants/subscriptionAssets";
import { brandImageAssets } from "@/components/subscription-visuals/brandImageAssets";

type BrandLogoProps = {
  brand: BrandVisualKey;
  size: number;
};

const brandFrameScale: Partial<Record<BrandVisualKey, number>> = {
  amazonPrime: 0.98,
  appleTvPlus: 0.96,
  canva: 0.96,
  dazn: 0.95,
  disneyPlus: 0.98,
  github: 0.95,
  googleOne: 0.94,
  linkedin: 0.95,
  microsoft365: 0.95,
  n26: 0.96,
  netflix: 0.98,
  notion: 0.95,
  paypal: 0.94,
  revolut: 0.95,
  slack: 0.95,
  spotify: 0.98,
  twitch: 0.95,
  youtube: 0.98,
  zoom: 0.96,
};

const getScale = (size: number, brand: BrandVisualKey) => {
  const frame = size * (brandFrameScale[brand] ?? 1);

  return {
    frame,
    borderRadius: Math.round(frame * 0.26),
    stroke: Math.max(1.8, frame * 0.068),
    text: Math.max(10, frame * 0.25),
    smallText: Math.max(8, frame * 0.18),
  };
};

export const BrandLogo = ({ brand, size }: BrandLogoProps) => {
  const scale = getScale(size, brand);
  const imageAsset = brandImageAssets[brand];

  if (imageAsset) {
    return <ImageAssetLogo asset={imageAsset} scale={scale} />;
  }

  switch (brand) {
    case "adobeCreativeCloud":
      return <AdobeCreativeCloudLogo scale={scale} />;
    case "amazonMusic":
      return <AmazonMusicLogo scale={scale} />;
    case "amazonPrime":
      return <AmazonPrimeLogo scale={scale} />;
    case "appleMusic":
      return <AppleMusicLogo scale={scale} />;
    case "appleFitnessPlus":
      return <AppleFitnessPlusLogo scale={scale} />;
    case "appleOne":
      return <AppleOneLogo scale={scale} />;
    case "appleTvPlus":
      return <AppleTvPlusLogo scale={scale} />;
    case "audible":
      return <AudibleLogo scale={scale} />;
    case "blinkist":
      return <BlinkistLogo scale={scale} />;
    case "canva":
      return <CanvaLogo scale={scale} />;
    case "chatgpt":
      return <ChatGptLogo scale={scale} />;
    case "claude":
      return <ClaudeLogo scale={scale} />;
    case "crunchyroll":
      return <CrunchyrollLogo scale={scale} />;
    case "cursor":
      return <CursorLogo scale={scale} />;
    case "dazn":
      return <DaznLogo scale={scale} />;
    case "deezer":
      return <DeezerLogo scale={scale} />;
    case "disneyPlus":
      return <DisneyPlusLogo scale={scale} />;
    case "dropbox":
      return <DropboxLogo scale={scale} />;
    case "duolingo":
      return <DuolingoLogo scale={scale} />;
    case "ebayPlus":
      return <EbayPlusLogo scale={scale} />;
    case "evernote":
      return <EvernoteLogo scale={scale} />;
    case "expressvpn":
      return <ExpressVpnLogo scale={scale} />;
    case "figma":
      return <FigmaLogo scale={scale} />;
    case "freeletics":
      return <FreeleticsLogo scale={scale} />;
    case "gemini":
      return <GeminiLogo scale={scale} />;
    case "googleDrive":
      return <GoogleDriveLogo scale={scale} />;
    case "github":
      return <GitHubLogo scale={scale} />;
    case "googleOne":
      return <GoogleOneLogo scale={scale} />;
    case "hulu":
      return <HuluLogo scale={scale} />;
    case "icloud":
      return <ICloudLogo scale={scale} />;
    case "linkedin":
      return <LinkedInLogo scale={scale} />;
    case "max":
      return <MaxLogo scale={scale} />;
    case "masterclass":
      return <MasterclassLogo scale={scale} />;
    case "microsoft365":
      return <Microsoft365Logo scale={scale} />;
    case "midjourney":
      return <MidjourneyLogo scale={scale} />;
    case "n26":
      return <N26Logo scale={scale} />;
    case "netflix":
      return <NetflixLogo scale={scale} />;
    case "nintendoSwitchOnline":
      return <NintendoSwitchOnlineLogo scale={scale} />;
    case "nordvpn":
      return <NordVpnLogo scale={scale} />;
    case "spotify":
      return <SpotifyLogo scale={scale} />;
    case "notion":
      return <NotionLogo scale={scale} />;
    case "oneDrive":
      return <OneDriveLogo scale={scale} />;
    case "ottoUp":
      return <OttoUpLogo scale={scale} />;
    case "paramountPlus":
      return <ParamountPlusLogo scale={scale} />;
    case "patreon":
      return <PatreonLogo scale={scale} />;
    case "paypal":
      return <PaypalLogo scale={scale} />;
    case "peacock":
      return <PeacockLogo scale={scale} />;
    case "perplexity":
      return <PerplexityLogo scale={scale} />;
    case "playstationPlus":
      return <PlayStationPlusLogo scale={scale} />;
    case "proton":
      return <ProtonLogo scale={scale} />;
    case "revolut":
      return <RevolutLogo scale={scale} />;
    case "skillshare":
      return <SkillshareLogo scale={scale} />;
    case "sky":
      return <SkyLogo scale={scale} />;
    case "slack":
      return <SlackLogo scale={scale} />;
    case "soundcloud":
      return <SoundcloudLogo scale={scale} />;
    case "tiktok":
      return <TikTokLogo scale={scale} />;
    case "twitch":
      return <TwitchLogo scale={scale} />;
    case "udemy":
      return <UdemyLogo scale={scale} />;
    case "urbanSportsClub":
      return <UrbanSportsClubLogo scale={scale} />;
    case "xboxGamePass":
      return <XboxGamePassLogo scale={scale} />;
    case "youtube":
      return <YouTubeLogo scale={scale} />;
    case "zalandoPlus":
      return <ZalandoPlusLogo scale={scale} />;
    case "zoom":
      return <ZoomLogo scale={scale} />;
  }
};

const ImageAssetLogo = ({
  asset,
  scale,
}: {
  asset: NonNullable<(typeof brandImageAssets)[BrandVisualKey]>;
  scale: ReturnType<typeof getScale>;
}) => {
  const iconSize = scale.frame * (asset.scale ?? 0.8);

  return (
    <LogoFrame
      scale={scale}
      backgroundColor={asset.backgroundColor ?? "transparent"}
      borderColor={asset.borderColor}
    >
      <Image
        source={asset.source}
        resizeMode="contain"
        style={{
          width: iconSize,
          height: iconSize,
        }}
      />
    </LogoFrame>
  );
};

const LogoFrame = ({
  scale,
  backgroundColor,
  children,
  borderColor,
}: {
  scale: ReturnType<typeof getScale>;
  backgroundColor: string;
  children: React.ReactNode;
  borderColor?: string;
}) => (
  <View
    style={[
      styles.frame,
      {
        width: scale.frame,
        height: scale.frame,
        borderRadius: scale.borderRadius,
        backgroundColor,
        borderColor: borderColor ?? "transparent",
      },
    ]}
  >
    {children}
  </View>
);

const NetflixLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#120709">
    <View style={[styles.fillCenter, { transform: [{ scale: 1.08 }] }]}>
      <View
        style={[
          styles.netflixBar,
          {
            width: scale.frame * 0.16,
            height: scale.frame * 0.78,
            left: scale.frame * 0.2,
            backgroundColor: "#B1060F",
          },
        ]}
      />
      <View
        style={[
          styles.netflixBar,
          {
            width: scale.frame * 0.16,
            height: scale.frame * 0.78,
            right: scale.frame * 0.2,
            backgroundColor: "#E50914",
          },
        ]}
      />
      <View
        style={[
          styles.netflixDiagonal,
          {
            width: scale.frame * 0.16,
            height: scale.frame * 0.82,
            backgroundColor: "#D7141A",
            transform: [{ skewX: "-18deg" }],
          },
        ]}
      />
    </View>
  </LogoFrame>
);

const SpotifyLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#1ED760">
    <View
      style={[
        styles.spotifyDisk,
        {
          width: scale.frame * 0.8,
          height: scale.frame * 0.8,
          borderRadius: scale.frame,
        },
      ]}
    >
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[
            styles.spotifyArc,
            {
              width: scale.frame * (0.48 + index * 0.1),
              height: scale.frame * (0.16 + index * 0.03),
              top: scale.frame * (0.2 + index * 0.105),
              borderTopWidth: Math.max(2, scale.frame * 0.06),
            },
          ]}
        />
      ))}
    </View>
  </LogoFrame>
);

const AmazonPrimeLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(19,73,125,0.12)">
    <View style={styles.fillCenter}>
      <Text style={[styles.wordmark, { color: "#111827", fontSize: scale.text * 0.78, top: scale.frame * 0.04 }]}>
        prime
      </Text>
      <View
        style={[
          styles.primeSmile,
          {
            width: scale.frame * 0.54,
            height: scale.frame * 0.18,
            borderBottomWidth: Math.max(2, scale.stroke),
            bottom: scale.frame * 0.2,
          },
        ]}
      />
      <View
        style={[
          styles.primeArrow,
          {
            borderLeftWidth: scale.frame * 0.06,
            borderRightWidth: 0,
            borderTopWidth: scale.frame * 0.045,
            borderBottomWidth: scale.frame * 0.045,
            right: scale.frame * 0.16,
            bottom: scale.frame * 0.22,
          },
        ]}
      />
    </View>
  </LogoFrame>
);

const DisneyPlusLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#0C1E63">
    <View style={styles.fillCenter}>
      <View
        style={[
          styles.disneyArc,
          {
            width: scale.frame * 0.82,
            height: scale.frame * 0.4,
            borderTopWidth: Math.max(2, scale.stroke * 0.72),
            top: scale.frame * 0.12,
          },
        ]}
      />
      <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.62, top: scale.frame * 0.12 }]}>
        Disney+
      </Text>
    </View>
  </LogoFrame>
);

const YouTubeLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(255,0,0,0.1)">
    <View
      style={[
        styles.youtubePill,
        {
          width: scale.frame * 0.78,
          height: scale.frame * 0.52,
          borderRadius: scale.frame * 0.18,
        },
      ]}
    >
      <View
        style={[
          styles.youtubePlay,
          {
            borderLeftWidth: scale.frame * 0.2,
            borderTopWidth: scale.frame * 0.12,
            borderBottomWidth: scale.frame * 0.12,
          },
        ]}
      />
    </View>
  </LogoFrame>
);

const AmazonMusicLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#0F1115">
    <View style={styles.fillCenter}>
      <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.56, top: scale.frame * 0.26 }]}>
        music
      </Text>
      <View
        style={[
          styles.primeSmile,
          {
            width: scale.frame * 0.48,
            height: scale.frame * 0.18,
            borderBottomWidth: Math.max(2, scale.stroke * 0.9),
            borderColor: "#00A8E1",
            bottom: scale.frame * 0.2,
          },
        ]}
      />
    </View>
  </LogoFrame>
);

const AppleMusicLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FA2D75">
    <View
      style={[
        styles.musicStem,
        {
          width: scale.frame * 0.1,
          height: scale.frame * 0.46,
          borderRadius: scale.frame * 0.06,
          left: scale.frame * 0.49,
          top: scale.frame * 0.18,
        },
      ]}
    />
    <View
      style={[
        styles.musicStem,
        {
          width: scale.frame * 0.1,
          height: scale.frame * 0.4,
          borderRadius: scale.frame * 0.06,
          left: scale.frame * 0.31,
          top: scale.frame * 0.25,
        },
      ]}
    />
    <View
      style={[
        styles.musicBeam,
        {
          width: scale.frame * 0.3,
          height: scale.frame * 0.09,
          borderRadius: scale.frame * 0.04,
          left: scale.frame * 0.31,
          top: scale.frame * 0.18,
        },
      ]}
    />
    <View
      style={[
        styles.musicNote,
        {
          width: scale.frame * 0.2,
          height: scale.frame * 0.2,
          borderRadius: scale.frame,
          left: scale.frame * 0.2,
          top: scale.frame * 0.5,
        },
      ]}
    />
    <View
      style={[
        styles.musicNote,
        {
          width: scale.frame * 0.2,
          height: scale.frame * 0.2,
          borderRadius: scale.frame,
          left: scale.frame * 0.44,
          top: scale.frame * 0.41,
        },
      ]}
    />
  </LogoFrame>
);

const AppleFitnessPlusLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#B94CFF">
    <View
      style={[
        styles.appleRing,
        {
          width: scale.frame * 0.58,
          height: scale.frame * 0.58,
          borderRadius: scale.frame,
          borderWidth: Math.max(2, scale.stroke * 0.9),
        },
      ]}
    />
    <View
      style={[
        styles.plusVertical,
        {
          width: scale.frame * 0.1,
          height: scale.frame * 0.34,
          borderRadius: scale.frame * 0.05,
        },
      ]}
    />
    <View
      style={[
        styles.plusHorizontal,
        {
          width: scale.frame * 0.34,
          height: scale.frame * 0.1,
          borderRadius: scale.frame * 0.05,
        },
      ]}
    />
  </LogoFrame>
);

const AppleOneLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#111111">
    <View
      style={[
        styles.appleBody,
        {
          width: scale.frame * 0.34,
          height: scale.frame * 0.38,
          borderRadius: scale.frame * 0.16,
          top: scale.frame * 0.24,
        },
      ]}
    />
    <View
      style={[
        styles.appleLeaf,
        {
          width: scale.frame * 0.12,
          height: scale.frame * 0.08,
          borderRadius: scale.frame * 0.04,
          left: scale.frame * 0.54,
          top: scale.frame * 0.18,
        },
      ]}
    />
    <View
      style={[
        styles.appleBite,
        {
          width: scale.frame * 0.1,
          height: scale.frame * 0.1,
          borderRadius: scale.frame,
          left: scale.frame * 0.56,
          top: scale.frame * 0.34,
        },
      ]}
    />
    <View
      style={[
        styles.appleRing,
        {
          width: scale.frame * 0.72,
          height: scale.frame * 0.72,
          borderRadius: scale.frame,
          borderWidth: Math.max(2, scale.stroke * 0.78),
        },
      ]}
    />
  </LogoFrame>
);

const AppleTvPlusLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#111111">
    <Text style={[styles.submark, { color: "rgba(255,255,255,0.86)", fontSize: scale.smallText * 0.92, top: scale.frame * 0.18 }]}>
      Apple
    </Text>
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.72, top: scale.frame * 0.34 }]}>tv+</Text>
  </LogoFrame>
);

const AudibleLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#F7991C">
    <View style={styles.fillCenter}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[
            styles.audibleArc,
            {
              width: scale.frame * (0.24 + index * 0.14),
              height: scale.frame * (0.14 + index * 0.08),
              borderTopWidth: Math.max(2, scale.stroke * 0.7),
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.audibleBase,
          {
            width: scale.frame * 0.18,
            height: scale.frame * 0.08,
            borderRadius: scale.frame * 0.04,
            top: scale.frame * 0.6,
          },
        ]}
      />
    </View>
  </LogoFrame>
);

const BlinkistLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#2C66F5">
    {[0, 1, 2, 3].map((index) => (
      <View
        key={index}
        style={[
          styles.blinkistRay,
          {
            width: scale.frame * 0.12,
            height: scale.frame * (0.18 + index * 0.06),
            left: scale.frame * (0.2 + index * 0.13),
            top: scale.frame * (0.52 - index * 0.04),
          },
        ]}
      />
    ))}
  </LogoFrame>
);

const CrunchyrollLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#F47521">
    <View
      style={[
        styles.crunchyCircle,
        {
          width: scale.frame * 0.56,
          height: scale.frame * 0.56,
          borderRadius: scale.frame,
        },
      ]}
    />
    <View
      style={[
        styles.crunchyCutout,
        {
          width: scale.frame * 0.22,
          height: scale.frame * 0.22,
          borderRadius: scale.frame,
          left: scale.frame * 0.44,
          top: scale.frame * 0.34,
        },
      ]}
    />
    <View
      style={[
        styles.crunchySmile,
        {
          width: scale.frame * 0.32,
          height: scale.frame * 0.14,
          borderBottomWidth: Math.max(2, scale.stroke * 0.75),
          left: scale.frame * 0.24,
          top: scale.frame * 0.44,
        },
      ]}
    />
  </LogoFrame>
);

const CursorLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#111111">
    <View
      style={[
        styles.cursorDiamond,
        {
          width: scale.frame * 0.26,
          height: scale.frame * 0.26,
          left: scale.frame * 0.24,
          top: scale.frame * 0.24,
        },
      ]}
    />
    <View
      style={[
        styles.cursorDiamond,
        {
          width: scale.frame * 0.22,
          height: scale.frame * 0.22,
          left: scale.frame * 0.48,
          top: scale.frame * 0.46,
        },
      ]}
    />
  </LogoFrame>
);

const DaznLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#111111">
    <View
      style={[
        styles.daznFrame,
        {
          width: scale.frame * 0.72,
          height: scale.frame * 0.72,
          borderWidth: Math.max(2, scale.stroke * 0.8),
          borderRadius: scale.frame * 0.04,
        },
      ]}
    >
      <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.5, letterSpacing: -0.7 }]}>DAZN</Text>
    </View>
  </LogoFrame>
);

const DeezerLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#121212">
    {[0.14, 0.24, 0.34, 0.46, 0.58].map((left, index) => (
      <View
        key={left}
        style={[
          styles.deezerBar,
          {
            left: scale.frame * left,
            width: scale.frame * 0.08,
            height: scale.frame * (0.16 + index * 0.08),
            top: scale.frame * (0.56 - index * 0.03),
            backgroundColor: ["#8B5CF6", "#6366F1", "#3B82F6", "#22C55E", "#EF4444"][index],
          },
        ]}
      />
    ))}
  </LogoFrame>
);

const ICloudLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#59AFFF">
    <View
      style={[
        styles.cloudBase,
        {
          width: scale.frame * 0.56,
          height: scale.frame * 0.22,
          borderRadius: scale.frame * 0.18,
          top: scale.frame * 0.5,
        },
      ]}
    />
    <View
      style={[
        styles.cloudPuff,
        {
          width: scale.frame * 0.22,
          height: scale.frame * 0.22,
          borderRadius: scale.frame,
          left: scale.frame * 0.22,
          top: scale.frame * 0.36,
        },
      ]}
    />
    <View
      style={[
        styles.cloudPuff,
        {
          width: scale.frame * 0.28,
          height: scale.frame * 0.28,
          borderRadius: scale.frame,
          left: scale.frame * 0.37,
          top: scale.frame * 0.28,
        },
      ]}
    />
    <View
      style={[
        styles.cloudPuff,
        {
          width: scale.frame * 0.2,
          height: scale.frame * 0.2,
          borderRadius: scale.frame,
          left: scale.frame * 0.56,
          top: scale.frame * 0.4,
        },
      ]}
    />
  </LogoFrame>
);

const LinkedInLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#0A66C2">
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.8 }]}>in</Text>
  </LogoFrame>
);

const AdobeCreativeCloudLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#EB1000">
    <View
      style={[
        styles.ccRing,
        {
          width: scale.frame * 0.34,
          height: scale.frame * 0.34,
          borderRadius: scale.frame,
          borderWidth: scale.stroke,
          left: scale.frame * 0.18,
          top: scale.frame * 0.33,
        },
      ]}
    />
    <View
      style={[
        styles.ccRing,
        {
          width: scale.frame * 0.34,
          height: scale.frame * 0.34,
          borderRadius: scale.frame,
          borderWidth: scale.stroke,
          left: scale.frame * 0.42,
          top: scale.frame * 0.33,
        },
      ]}
    />
    <View
      style={[
        styles.ccBridge,
        {
          width: scale.frame * 0.22,
          height: scale.frame * 0.14,
          borderTopWidth: scale.stroke,
          borderLeftWidth: scale.stroke,
          borderTopLeftRadius: scale.frame * 0.12,
          left: scale.frame * 0.3,
          top: scale.frame * 0.28,
        },
      ]}
    />
  </LogoFrame>
);

const DropboxLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#0061FF">
    {[
      { left: 0.2, top: 0.23, rotate: "-12deg" },
      { left: 0.46, top: 0.23, rotate: "12deg" },
      { left: 0.2, top: 0.48, rotate: "12deg" },
      { left: 0.46, top: 0.48, rotate: "-12deg" },
    ].map((diamond, index) => (
      <View
        key={index}
        style={[
          styles.dropboxDiamond,
          {
            width: scale.frame * 0.2,
            height: scale.frame * 0.2,
            left: scale.frame * (diamond.left - 0.015),
            top: scale.frame * (diamond.top - 0.015),
            transform: [{ rotate: diamond.rotate }],
          },
        ]}
      />
    ))}
    <View
      style={[
        styles.dropboxDiamond,
        {
          width: scale.frame * 0.18,
          height: scale.frame * 0.18,
          left: scale.frame * 0.41,
          top: scale.frame * 0.65,
          transform: [{ rotate: "45deg" }],
        },
      ]}
    />
  </LogoFrame>
);

const DuolingoLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#58CC02">
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.74 }]}>D</Text>
  </LogoFrame>
);

const EbayPlusLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(15,23,42,0.08)">
    <Text style={[styles.wordmark, { color: "#E53238", fontSize: scale.text * 0.58 }]}>eBay+</Text>
  </LogoFrame>
);

const EvernoteLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#00A82D">
    <View
      style={[
        styles.evernoteHead,
        {
          width: scale.frame * 0.5,
          height: scale.frame * 0.42,
          borderRadius: scale.frame * 0.12,
          left: scale.frame * 0.22,
          top: scale.frame * 0.24,
        },
      ]}
    />
    <View
      style={[
        styles.evernoteFold,
        {
          width: scale.frame * 0.18,
          height: scale.frame * 0.14,
          borderRadius: scale.frame * 0.04,
          left: scale.frame * 0.48,
          top: scale.frame * 0.44,
        },
      ]}
    />
  </LogoFrame>
);

const ExpressVpnLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#DA3940">
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.66 }]}>EV</Text>
  </LogoFrame>
);

const FigmaLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(15,23,42,0.08)">
    <View style={styles.fillCenter}>
      {[
        { backgroundColor: "#F24E1E", left: 0.32, top: 0.18, borderRadius: 999 },
        { backgroundColor: "#A259FF", left: 0.32, top: 0.34, borderRadius: 999 },
        { backgroundColor: "#1ABCFE", left: 0.32, top: 0.5, borderRadius: 999 },
        { backgroundColor: "#0ACF83", left: 0.5, top: 0.18, borderRadius: 999 },
        { backgroundColor: "#FF7262", left: 0.5, top: 0.34, borderRadius: 999 },
      ].map((dot, index) => (
        <View
          key={index}
          style={[
            styles.figmaDot,
            {
              width: scale.frame * 0.18,
              height: scale.frame * 0.18,
              left: scale.frame * dot.left,
              top: scale.frame * dot.top,
              backgroundColor: dot.backgroundColor,
              borderRadius: scale.frame * 0.09,
            },
          ]}
        />
      ))}
    </View>
  </LogoFrame>
);

const GeminiLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#0F172A">
    <View
      style={[
        styles.geminiDiamond,
        {
          width: scale.frame * 0.18,
          height: scale.frame * 0.18,
          left: scale.frame * 0.41,
          top: scale.frame * 0.16,
        },
      ]}
    />
    <View
      style={[
        styles.geminiDiamond,
        {
          width: scale.frame * 0.14,
          height: scale.frame * 0.14,
          left: scale.frame * 0.24,
          top: scale.frame * 0.36,
        },
      ]}
    />
    <View
      style={[
        styles.geminiDiamond,
        {
          width: scale.frame * 0.14,
          height: scale.frame * 0.14,
          left: scale.frame * 0.58,
          top: scale.frame * 0.42,
        },
      ]}
    />
  </LogoFrame>
);

const FreeleticsLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#111111">
    <View
      style={[
        styles.freeleticsChevron,
        {
          borderLeftWidth: scale.frame * 0.16,
          borderRightWidth: scale.frame * 0.16,
          borderBottomWidth: scale.frame * 0.28,
          left: scale.frame * 0.18,
          top: scale.frame * 0.26,
        },
      ]}
    />
    <View
      style={[
        styles.freeleticsChevron,
        {
          borderLeftWidth: scale.frame * 0.12,
          borderRightWidth: scale.frame * 0.12,
          borderBottomWidth: scale.frame * 0.2,
          left: scale.frame * 0.42,
          top: scale.frame * 0.38,
        },
      ]}
    />
  </LogoFrame>
);

const GoogleDriveLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(15,23,42,0.08)">
    <View
      style={[
        styles.driveSide,
        {
          left: scale.frame * 0.29,
          top: scale.frame * 0.22,
          borderLeftWidth: scale.frame * 0.1,
          borderRightWidth: scale.frame * 0.1,
          borderBottomWidth: scale.frame * 0.18,
          borderBottomColor: "#34A853",
        },
      ]}
    />
    <View
      style={[
        styles.driveSide,
        {
          left: scale.frame * 0.23,
          top: scale.frame * 0.36,
          borderTopWidth: scale.frame * 0.09,
          borderBottomWidth: scale.frame * 0.09,
          borderRightWidth: scale.frame * 0.18,
          borderRightColor: "#4285F4",
        },
      ]}
    />
    <View
      style={[
        styles.driveSide,
        {
          left: scale.frame * 0.47,
          top: scale.frame * 0.36,
          borderTopWidth: scale.frame * 0.09,
          borderBottomWidth: scale.frame * 0.09,
          borderLeftWidth: scale.frame * 0.18,
          borderLeftColor: "#FBBC05",
        },
      ]}
    />
  </LogoFrame>
);

const GitHubLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#111827">
    <View
      style={[
        styles.gitHubHead,
        {
          width: scale.frame * 0.46,
          height: scale.frame * 0.4,
          borderRadius: scale.frame * 0.18,
          left: scale.frame * 0.27,
          top: scale.frame * 0.34,
        },
      ]}
    />
    <View
      style={[
        styles.gitHubEar,
        {
          left: scale.frame * 0.29,
          top: scale.frame * 0.24,
          borderLeftWidth: scale.frame * 0.08,
          borderRightWidth: scale.frame * 0.08,
          borderBottomWidth: scale.frame * 0.12,
        },
      ]}
    />
    <View
      style={[
        styles.gitHubEar,
        {
          left: scale.frame * 0.55,
          top: scale.frame * 0.24,
          borderLeftWidth: scale.frame * 0.08,
          borderRightWidth: scale.frame * 0.08,
          borderBottomWidth: scale.frame * 0.12,
        },
      ]}
    />
  </LogoFrame>
);

const HuluLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#081410">
    <Text style={[styles.wordmark, { color: "#1CE783", fontSize: scale.text * 0.54 }]}>hulu</Text>
  </LogoFrame>
);

const MaxLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#0A33FF">
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.6 }]}>max</Text>
  </LogoFrame>
);

const MasterclassLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#111111">
    <View
      style={[
        styles.masterclassArc,
        {
          width: scale.frame * 0.62,
          height: scale.frame * 0.62,
          borderRadius: scale.frame,
          borderWidth: Math.max(2, scale.stroke * 0.9),
          top: scale.frame * 0.2,
        },
      ]}
    />
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.46, letterSpacing: 0.8, top: scale.frame * 0.5 }]}>
      MASTERCLASS
    </Text>
  </LogoFrame>
);

const MidjourneyLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#111827">
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.58 }]}>MJ</Text>
  </LogoFrame>
);

const N26Logo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#2FE0C5">
    <View
      style={[
        styles.n26Stroke,
        {
          width: scale.frame * 0.1,
          height: scale.frame * 0.38,
          left: scale.frame * 0.24,
          top: scale.frame * 0.3,
        },
      ]}
    />
    <View
      style={[
        styles.n26Diagonal,
        {
          width: scale.frame * 0.12,
          height: scale.frame * 0.42,
          left: scale.frame * 0.36,
          top: scale.frame * 0.24,
        },
      ]}
    />
    <View
      style={[
        styles.n26Stroke,
        {
          width: scale.frame * 0.1,
          height: scale.frame * 0.38,
          left: scale.frame * 0.5,
          top: scale.frame * 0.3,
        },
      ]}
    />
    <View
      style={[
        styles.n26Loop,
        {
          width: scale.frame * 0.2,
          height: scale.frame * 0.2,
          borderRadius: scale.frame,
          left: scale.frame * 0.54,
          top: scale.frame * 0.42,
          borderWidth: Math.max(2, scale.stroke * 0.88),
        },
      ]}
    />
  </LogoFrame>
);

const NordVpnLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#4687FF">
    <View
      style={[
        styles.nordMountainLeft,
        {
          borderLeftWidth: scale.frame * 0.16,
          borderRightWidth: scale.frame * 0.16,
          borderBottomWidth: scale.frame * 0.26,
          left: scale.frame * 0.2,
          top: scale.frame * 0.34,
        },
      ]}
    />
    <View
      style={[
        styles.nordMountainRight,
        {
          borderLeftWidth: scale.frame * 0.2,
          borderRightWidth: scale.frame * 0.2,
          borderBottomWidth: scale.frame * 0.34,
          left: scale.frame * 0.36,
          top: scale.frame * 0.24,
        },
      ]}
    />
  </LogoFrame>
);

const NotionLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="#111111">
    <Text style={[styles.wordmark, styles.heavyWordmark, { color: "#111111", fontSize: scale.text * 0.92 }]}>
      N
    </Text>
  </LogoFrame>
);

const NintendoSwitchOnlineLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#E60012">
    <View
      style={[
        styles.switchPill,
        {
          width: scale.frame * 0.22,
          height: scale.frame * 0.46,
          borderRadius: scale.frame * 0.12,
          left: scale.frame * 0.26,
          top: scale.frame * 0.2,
          borderWidth: Math.max(2, scale.stroke * 0.7),
        },
      ]}
    />
    <View
      style={[
        styles.switchPill,
        {
          width: scale.frame * 0.22,
          height: scale.frame * 0.46,
          borderRadius: scale.frame * 0.12,
          left: scale.frame * 0.52,
          top: scale.frame * 0.2,
          borderWidth: Math.max(2, scale.stroke * 0.7),
        },
      ]}
    />
    <View
      style={[
        styles.switchDot,
        {
          width: scale.frame * 0.07,
          height: scale.frame * 0.07,
          borderRadius: scale.frame,
          left: scale.frame * 0.34,
          top: scale.frame * 0.36,
        },
      ]}
    />
    <View
      style={[
        styles.switchDot,
        {
          width: scale.frame * 0.1,
          height: scale.frame * 0.1,
          borderRadius: scale.frame,
          left: scale.frame * 0.58,
          top: scale.frame * 0.42,
        },
      ]}
    />
  </LogoFrame>
);

const OneDriveLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#0A6CFF">
    <View
      style={[
        styles.cloudBase,
        {
          width: scale.frame * 0.56,
          height: scale.frame * 0.2,
          borderRadius: scale.frame * 0.18,
          top: scale.frame * 0.52,
        },
      ]}
    />
    <View
      style={[
        styles.cloudPuff,
        {
          width: scale.frame * 0.2,
          height: scale.frame * 0.2,
          borderRadius: scale.frame,
          left: scale.frame * 0.24,
          top: scale.frame * 0.38,
        },
      ]}
    />
    <View
      style={[
        styles.cloudPuff,
        {
          width: scale.frame * 0.3,
          height: scale.frame * 0.3,
          borderRadius: scale.frame,
          left: scale.frame * 0.38,
          top: scale.frame * 0.28,
        },
      ]}
    />
  </LogoFrame>
);

const OttoUpLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#E20613">
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.5 }]}>OTTO</Text>
    <Text style={[styles.submark, { color: "#FFFFFF", fontSize: scale.smallText, bottom: scale.frame * 0.16 }]}>
      Up
    </Text>
  </LogoFrame>
);

const ParamountPlusLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#0057FF">
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.58 }]}>P+</Text>
  </LogoFrame>
);

const PatreonLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(15,23,42,0.08)">
    <View
      style={[
        styles.patreonDot,
        {
          width: scale.frame * 0.3,
          height: scale.frame * 0.3,
          borderRadius: scale.frame,
          left: scale.frame * 0.5,
          top: scale.frame * 0.2,
        },
      ]}
    />
    <View
      style={[
        styles.patreonBar,
        {
          width: scale.frame * 0.16,
          height: scale.frame * 0.54,
          borderRadius: scale.frame * 0.07,
          left: scale.frame * 0.22,
          top: scale.frame * 0.18,
        },
      ]}
    />
  </LogoFrame>
);

const PeacockLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(15,23,42,0.08)">
    <Text style={[styles.wordmark, { color: "#111827", fontSize: scale.text * 0.54, top: scale.frame * 0.28 }]}>
      peacock
    </Text>
    {["#F5C518", "#F7A21B", "#FF6B00", "#E91E63", "#7C4DFF", "#2196F3"].map((color, index) => (
      <View
        key={color}
        style={[
          styles.peacockDot,
          {
            width: scale.frame * 0.07,
            height: scale.frame * 0.07,
            borderRadius: scale.frame,
            backgroundColor: color,
            left: scale.frame * (0.2 + index * 0.09),
            top: scale.frame * 0.68,
          },
        ]}
      />
    ))}
  </LogoFrame>
);

const PerplexityLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#0B1019">
    <Text style={[styles.wordmark, { color: "#7CE4D8", fontSize: scale.text * 0.68 }]}>P</Text>
  </LogoFrame>
);

const PaypalLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(15,23,42,0.08)">
    <Text
      style={[
        styles.wordmark,
        { color: "#003087", fontSize: scale.text * 0.78, left: scale.frame * 0.28, right: undefined, textAlign: "left" },
      ]}
    >
      P
    </Text>
    <Text
      style={[
        styles.wordmark,
        {
          color: "#009CDE",
          fontSize: scale.text * 0.78,
          left: scale.frame * 0.4,
          top: scale.frame * 0.1,
          right: undefined,
          textAlign: "left",
        },
      ]}
    >
      P
    </Text>
  </LogoFrame>
);

const CanvaLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#00C4CC">
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.96, fontStyle: "italic" }]}>
      C
    </Text>
  </LogoFrame>
);

const ChatGptLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#0F172A">
    {[0, 60, 120].map((rotation) => (
      <View
        key={rotation}
        style={[
          styles.chatgptLoop,
          {
            width: scale.frame * 0.54,
            height: scale.frame * 0.22,
            borderRadius: scale.frame * 0.22,
            borderWidth: Math.max(2, scale.stroke * 0.82),
            transform: [{ rotate: `${rotation}deg` }],
          },
        ]}
      />
    ))}
    <View
      style={[
        styles.chatgptCenter,
        {
          width: scale.frame * 0.14,
          height: scale.frame * 0.14,
          borderRadius: scale.frame,
        },
      ]}
    />
  </LogoFrame>
);

const Microsoft365Logo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(15,23,42,0.08)">
    {[
      { backgroundColor: "#F25022", left: 0.17, top: 0.17 },
      { backgroundColor: "#7FBA00", left: 0.53, top: 0.17 },
      { backgroundColor: "#00A4EF", left: 0.17, top: 0.53 },
      { backgroundColor: "#FFB900", left: 0.53, top: 0.53 },
    ].map((tile, index) => (
      <View
        key={index}
        style={[
          styles.microsoftTile,
          {
            width: scale.frame * 0.24,
            height: scale.frame * 0.24,
            left: scale.frame * tile.left,
            top: scale.frame * tile.top,
            backgroundColor: tile.backgroundColor,
          },
        ]}
      />
    ))}
  </LogoFrame>
);

const GoogleOneLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(15,23,42,0.08)">
    <Text style={[styles.googleOneText, { fontSize: scale.text * 1.04 }]}>
      <Text style={{ color: "#4285F4" }}>G</Text>
      <Text style={{ color: "#DB4437" }}>o</Text>
      <Text style={{ color: "#F4B400" }}>1</Text>
    </Text>
  </LogoFrame>
);

const PlayStationPlusLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#F6C945">
    <View
      style={[
        styles.plusVertical,
        {
          width: scale.frame * 0.16,
          height: scale.frame * 0.48,
          borderRadius: scale.frame * 0.08,
        },
      ]}
    />
    <View
      style={[
        styles.plusHorizontal,
        {
          width: scale.frame * 0.48,
          height: scale.frame * 0.16,
          borderRadius: scale.frame * 0.08,
        },
      ]}
    />
    <Text style={[styles.submark, { color: "#8A6400", fontSize: scale.smallText, bottom: scale.frame * 0.12 }]}>
      PS+
    </Text>
  </LogoFrame>
);

const ProtonLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#6D4AFF">
    <View
      style={[
        styles.protonTriangle,
        {
          borderLeftWidth: scale.frame * 0.16,
          borderRightWidth: scale.frame * 0.16,
          borderBottomWidth: scale.frame * 0.28,
          left: scale.frame * 0.16,
          top: scale.frame * 0.36,
        },
      ]}
    />
    <View
      style={[
        styles.protonTriangle,
        {
          borderLeftWidth: scale.frame * 0.12,
          borderRightWidth: scale.frame * 0.12,
          borderBottomWidth: scale.frame * 0.2,
          left: scale.frame * 0.42,
          top: scale.frame * 0.24,
        },
      ]}
    />
  </LogoFrame>
);

const RevolutLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#111111">
    <View
      style={[
        styles.revolutStem,
        {
          width: scale.frame * 0.12,
          height: scale.frame * 0.46,
          borderRadius: scale.frame * 0.06,
          left: scale.frame * 0.24,
          top: scale.frame * 0.24,
        },
      ]}
    />
    <View
      style={[
        styles.revolutBowl,
        {
          width: scale.frame * 0.34,
          height: scale.frame * 0.18,
          borderRadius: scale.frame * 0.12,
          left: scale.frame * 0.3,
          top: scale.frame * 0.24,
        },
      ]}
    />
    <View
      style={[
        styles.revolutCut,
        {
          width: scale.frame * 0.28,
          height: scale.frame * 0.09,
          right: scale.frame * 0.18,
          top: scale.frame * 0.38,
        },
      ]}
    />
  </LogoFrame>
);

const SkillshareLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#111111">
    <Text style={[styles.wordmark, { color: "#00FF84", fontSize: scale.text * 0.52 }]}>SK</Text>
  </LogoFrame>
);

const SkyLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#0A0F4F">
    <View
      style={[
        styles.skyGlow,
        {
          width: scale.frame * 0.86,
          height: scale.frame * 0.56,
          borderRadius: scale.frame * 0.28,
        },
      ]}
    />
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.64, fontStyle: "italic", top: scale.frame * 0.29 }]}>
      sky
    </Text>
  </LogoFrame>
);

const ClaudeLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#F7E1C3">
    <Text style={[styles.wordmark, { color: "#8A4D1A", fontSize: scale.text * 0.66 }]}>Cl</Text>
  </LogoFrame>
);

const SlackLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(15,23,42,0.08)">
    {[
      { color: "#36C5F0", left: 0.3, top: 0.17, width: 0.14, height: 0.34 },
      { color: "#2EB67D", left: 0.5, top: 0.17, width: 0.14, height: 0.34 },
      { color: "#E01E5A", left: 0.17, top: 0.5, width: 0.34, height: 0.14 },
      { color: "#ECB22E", left: 0.49, top: 0.5, width: 0.34, height: 0.14 },
    ].map((part, index) => (
      <View
        key={index}
        style={[
          styles.slackBar,
          {
            left: scale.frame * part.left,
            top: scale.frame * part.top,
            width: scale.frame * part.width,
            height: scale.frame * part.height,
            borderRadius: scale.frame * 0.11,
            backgroundColor: part.color,
          },
        ]}
      />
    ))}
  </LogoFrame>
);

const SoundcloudLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FF6A00">
    <View
      style={[
        styles.cloudBase,
        {
          width: scale.frame * 0.44,
          height: scale.frame * 0.18,
          borderRadius: scale.frame * 0.16,
          left: scale.frame * 0.3,
          top: scale.frame * 0.48,
        },
      ]}
    />
    {[0, 1, 2, 3].map((index) => (
      <View
        key={index}
        style={[
          styles.soundcloudBar,
          {
            width: scale.frame * 0.06,
            height: scale.frame * (0.14 + index * 0.05),
            left: scale.frame * (0.18 + index * 0.07),
            top: scale.frame * (0.48 - index * 0.03),
          },
        ]}
      />
    ))}
    <View
      style={[
        styles.cloudPuff,
        {
          width: scale.frame * 0.22,
          height: scale.frame * 0.22,
          borderRadius: scale.frame,
          left: scale.frame * 0.48,
          top: scale.frame * 0.34,
        },
      ]}
    />
  </LogoFrame>
);

const TikTokLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#0A0A0A">
    <View
      style={[
        styles.tiktokStem,
        {
          width: scale.frame * 0.1,
          height: scale.frame * 0.34,
          borderRadius: scale.frame * 0.05,
          left: scale.frame * 0.48,
          top: scale.frame * 0.2,
          backgroundColor: "#25F4EE",
        },
      ]}
    />
    <View
      style={[
        styles.tiktokStem,
        {
          width: scale.frame * 0.1,
          height: scale.frame * 0.34,
          borderRadius: scale.frame * 0.05,
          left: scale.frame * 0.52,
          top: scale.frame * 0.18,
          backgroundColor: "#FE2C55",
        },
      ]}
    />
    <View
      style={[
        styles.tiktokBeam,
        {
          width: scale.frame * 0.22,
          height: scale.frame * 0.08,
          borderRadius: scale.frame * 0.04,
          left: scale.frame * 0.42,
          top: scale.frame * 0.2,
          backgroundColor: "#FFFFFF",
        },
      ]}
    />
    <View
      style={[
        styles.tiktokNote,
        {
          width: scale.frame * 0.18,
          height: scale.frame * 0.18,
          borderRadius: scale.frame,
          left: scale.frame * 0.28,
          top: scale.frame * 0.48,
          backgroundColor: "#25F4EE",
        },
      ]}
    />
    <View
      style={[
        styles.tiktokNote,
        {
          width: scale.frame * 0.18,
          height: scale.frame * 0.18,
          borderRadius: scale.frame,
          left: scale.frame * 0.32,
          top: scale.frame * 0.46,
          backgroundColor: "#FE2C55",
        },
      ]}
    />
  </LogoFrame>
);

const TwitchLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#9146FF">
    <View
      style={[
        styles.twitchBubble,
        {
          width: scale.frame * 0.54,
          height: scale.frame * 0.42,
          left: scale.frame * 0.23,
          top: scale.frame * 0.22,
        },
      ]}
    />
    <View
      style={[
        styles.twitchCut,
        {
          width: scale.frame * 0.08,
          height: scale.frame * 0.18,
          left: scale.frame * 0.38,
          top: scale.frame * 0.32,
        },
      ]}
    />
    <View
      style={[
        styles.twitchCut,
        {
          width: scale.frame * 0.08,
          height: scale.frame * 0.18,
          left: scale.frame * 0.52,
          top: scale.frame * 0.32,
        },
      ]}
    />
  </LogoFrame>
);

const UdemyLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#A435F0">
    <View
      style={[
        styles.udemyChevron,
        {
          borderLeftWidth: scale.frame * 0.18,
          borderRightWidth: scale.frame * 0.18,
          borderBottomWidth: scale.frame * 0.26,
          left: scale.frame * 0.22,
          top: scale.frame * 0.24,
        },
      ]}
    />
    <View
      style={[
        styles.udemyStem,
        {
          width: scale.frame * 0.12,
          height: scale.frame * 0.28,
          borderRadius: scale.frame * 0.06,
          left: scale.frame * 0.44,
          top: scale.frame * 0.46,
        },
      ]}
    />
  </LogoFrame>
);

const UrbanSportsClubLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#003B95">
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.46 }]}>USC</Text>
  </LogoFrame>
);

const ZoomLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#2D8CFF">
    <View
      style={[
        styles.zoomCamera,
        {
          width: scale.frame * 0.5,
          height: scale.frame * 0.34,
          borderRadius: scale.frame * 0.09,
          left: scale.frame * 0.16,
          top: scale.frame * 0.33,
        },
      ]}
    />
    <View
      style={[
        styles.zoomLens,
        {
          borderLeftWidth: scale.frame * 0.16,
          borderTopWidth: scale.frame * 0.1,
          borderBottomWidth: scale.frame * 0.1,
          left: scale.frame * 0.56,
          top: scale.frame * 0.4,
        },
      ]}
    />
  </LogoFrame>
);

const ZalandoPlusLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(15,23,42,0.08)">
    <Text style={[styles.wordmark, { color: "#FF6900", fontSize: scale.text * 0.44 }]}>zalando+</Text>
  </LogoFrame>
);

const XboxGamePassLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#107C10">
    <View
      style={[
        styles.xboxCircle,
        {
          width: scale.frame * 0.62,
          height: scale.frame * 0.62,
          borderRadius: scale.frame,
        },
      ]}
    />
    <View
      style={[
        styles.xboxStroke,
        {
          width: scale.frame * 0.46,
          height: scale.frame * 0.1,
          borderRadius: scale.frame * 0.05,
          transform: [{ rotate: "42deg" }],
        },
      ]}
    />
    <View
      style={[
        styles.xboxStroke,
        {
          width: scale.frame * 0.46,
          height: scale.frame * 0.1,
          borderRadius: scale.frame * 0.05,
          transform: [{ rotate: "-42deg" }],
        },
      ]}
    />
  </LogoFrame>
);

const styles = StyleSheet.create({
  frame: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  fillCenter: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    position: "absolute",
    left: 0,
    right: 0,
    fontWeight: "800",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  heavyWordmark: {
    includeFontPadding: false,
  },
  netflixBar: {
    position: "absolute",
    borderRadius: 2,
    top: "15%",
  },
  netflixDiagonal: {
    position: "absolute",
    borderRadius: 2,
    top: "13%",
  },
  spotifyDisk: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1ED760",
  },
  spotifyArc: {
    position: "absolute",
    borderColor: "#0A0A0A",
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  primeSmile: {
    position: "absolute",
    borderColor: "#00A8E1",
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },
  primeArrow: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftColor: "#00A8E1",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  disneyArc: {
    position: "absolute",
    borderColor: "#58B1FF",
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  youtubePill: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF0033",
  },
  youtubePlay: {
    width: 0,
    height: 0,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#FFFFFF",
    marginLeft: 3,
  },
  musicStem: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  musicBeam: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  musicNote: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  cloudBase: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  cloudPuff: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  ccRing: {
    position: "absolute",
    borderColor: "#FFFFFF",
  },
  ccBridge: {
    position: "absolute",
    borderColor: "#FFFFFF",
  },
  dropboxDiamond: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  figmaDot: {
    position: "absolute",
  },
  audibleArc: {
    position: "absolute",
    borderColor: "#FFFFFF",
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  audibleBase: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  appleBody: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  appleLeaf: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "-28deg" }],
  },
  appleBite: {
    position: "absolute",
    backgroundColor: "#111111",
  },
  appleRing: {
    position: "absolute",
    borderColor: "rgba(255,255,255,0.92)",
  },
  blinkistRay: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
  },
  crunchyCircle: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  crunchyCutout: {
    position: "absolute",
    backgroundColor: "#F47521",
  },
  crunchySmile: {
    position: "absolute",
    borderColor: "#F47521",
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },
  cursorDiamond: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  daznFrame: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#FFFFFF",
  },
  deezerBar: {
    position: "absolute",
    borderRadius: 2,
  },
  driveSide: {
    position: "absolute",
    width: 0,
    height: 0,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  evernoteHead: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  evernoteFold: {
    position: "absolute",
    backgroundColor: "#00A82D",
    transform: [{ rotate: "8deg" }],
  },
  freeleticsChevron: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#F97316",
  },
  gitHubHead: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  gitHubEar: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
  },
  chatgptLoop: {
    position: "absolute",
    borderColor: "#FFFFFF",
  },
  chatgptCenter: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  geminiDiamond: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  masterclassArc: {
    position: "absolute",
    borderColor: "#FFFFFF",
    borderTopColor: "transparent",
  },
  microsoftTile: {
    position: "absolute",
    borderRadius: 3,
  },
  n26Diagonal: {
    position: "absolute",
    backgroundColor: "#111111",
    transform: [{ rotate: "-28deg" }],
  },
  n26Loop: {
    position: "absolute",
    borderColor: "#111111",
  },
  n26Stroke: {
    position: "absolute",
    backgroundColor: "#111111",
    borderRadius: 999,
  },
  nordMountainLeft: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
  },
  nordMountainRight: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#DDEBFF",
  },
  protonTriangle: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
  },
  googleOneText: {
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  patreonDot: {
    position: "absolute",
    backgroundColor: "#FF424D",
  },
  patreonBar: {
    position: "absolute",
    backgroundColor: "#111111",
  },
  peacockDot: {
    position: "absolute",
  },
  plusVertical: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  plusHorizontal: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  submark: {
    position: "absolute",
    left: 0,
    right: 0,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  revolutCut: {
    position: "absolute",
    backgroundColor: "#111111",
    transform: [{ rotate: "-20deg" }],
  },
  revolutBowl: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  revolutStem: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  skyGlow: {
    position: "absolute",
    backgroundColor: "#E91E63",
    opacity: 0.52,
  },
  slackBar: {
    position: "absolute",
  },
  soundcloudBar: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  switchPill: {
    position: "absolute",
    borderColor: "#FFFFFF",
  },
  switchDot: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  udemyChevron: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
  },
  udemyStem: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  tiktokStem: {
    position: "absolute",
  },
  tiktokBeam: {
    position: "absolute",
  },
  tiktokNote: {
    position: "absolute",
  },
  twitchBubble: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  twitchCut: {
    position: "absolute",
    backgroundColor: "#9146FF",
  },
  xboxCircle: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  xboxStroke: {
    position: "absolute",
    backgroundColor: "#107C10",
  },
  zoomCamera: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  zoomLens: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftColor: "#FFFFFF",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
});
