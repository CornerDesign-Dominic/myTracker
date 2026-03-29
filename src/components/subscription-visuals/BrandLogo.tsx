import { StyleSheet, Text, View } from "react-native";

import type { BrandVisualKey } from "@/constants/subscriptionAssets";

type BrandLogoProps = {
  brand: BrandVisualKey;
  size: number;
};

const getScale = (size: number) => {
  const frame = size * 0.72;

  return {
    frame,
    borderRadius: Math.round(frame * 0.26),
    stroke: Math.max(1.6, frame * 0.07),
    text: Math.max(10, frame * 0.24),
    smallText: Math.max(8, frame * 0.17),
  };
};

export const BrandLogo = ({ brand, size }: BrandLogoProps) => {
  const scale = getScale(size);

  switch (brand) {
    case "netflix":
      return <NetflixLogo scale={scale} />;
    case "spotify":
      return <SpotifyLogo scale={scale} />;
    case "amazonPrime":
      return <AmazonPrimeLogo scale={scale} />;
    case "disneyPlus":
      return <DisneyPlusLogo scale={scale} />;
    case "youtubePremium":
      return <YouTubePremiumLogo scale={scale} />;
    case "appleMusic":
      return <AppleMusicLogo scale={scale} />;
    case "icloud":
      return <ICloudLogo scale={scale} />;
    case "adobeCreativeCloud":
      return <AdobeCreativeCloudLogo scale={scale} />;
    case "dropbox":
      return <DropboxLogo scale={scale} />;
    case "notion":
      return <NotionLogo scale={scale} />;
    case "canva":
      return <CanvaLogo scale={scale} />;
    case "chatgpt":
      return <ChatGptLogo scale={scale} />;
    case "microsoft365":
      return <Microsoft365Logo scale={scale} />;
    case "googleOne":
      return <GoogleOneLogo scale={scale} />;
    case "playstationPlus":
      return <PlayStationPlusLogo scale={scale} />;
    case "xboxGamePass":
      return <XboxGamePassLogo scale={scale} />;
  }
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
    <View style={styles.fillCenter}>
      <View
        style={[
          styles.netflixBar,
          {
            width: scale.frame * 0.14,
            height: scale.frame * 0.7,
            left: scale.frame * 0.24,
            backgroundColor: "#B1060F",
          },
        ]}
      />
      <View
        style={[
          styles.netflixBar,
          {
            width: scale.frame * 0.14,
            height: scale.frame * 0.7,
            right: scale.frame * 0.24,
            backgroundColor: "#E50914",
          },
        ]}
      />
      <View
        style={[
          styles.netflixDiagonal,
          {
            width: scale.frame * 0.14,
            height: scale.frame * 0.74,
            backgroundColor: "#FF2A2A",
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
          width: scale.frame * 0.74,
          height: scale.frame * 0.74,
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
              width: scale.frame * (0.44 + index * 0.09),
              height: scale.frame * (0.16 + index * 0.03),
              top: scale.frame * (0.22 + index * 0.11),
              borderTopWidth: Math.max(2, scale.frame * 0.055),
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
      <Text style={[styles.wordmark, { color: "#111827", fontSize: scale.text * 0.72 }]}>prime</Text>
      <View
        style={[
          styles.primeSmile,
          {
            width: scale.frame * 0.48,
            height: scale.frame * 0.18,
            borderBottomWidth: Math.max(2, scale.stroke * 0.9),
            bottom: scale.frame * 0.23,
          },
        ]}
      />
      <View
        style={[
          styles.primeArrow,
          {
            borderLeftWidth: scale.frame * 0.05,
            borderRightWidth: 0,
            borderTopWidth: scale.frame * 0.04,
            borderBottomWidth: scale.frame * 0.04,
            right: scale.frame * 0.18,
            bottom: scale.frame * 0.26,
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
            width: scale.frame * 0.78,
            height: scale.frame * 0.42,
            borderTopWidth: Math.max(2, scale.stroke * 0.6),
            top: scale.frame * 0.14,
          },
        ]}
      />
      <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.58, top: scale.frame * 0.08 }]}>
        Disney+
      </Text>
    </View>
  </LogoFrame>
);

const YouTubePremiumLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(255,0,0,0.1)">
    <View
      style={[
        styles.youtubePill,
        {
          width: scale.frame * 0.7,
          height: scale.frame * 0.46,
          borderRadius: scale.frame * 0.16,
        },
      ]}
    >
      <View
        style={[
          styles.youtubePlay,
          {
            borderLeftWidth: scale.frame * 0.18,
            borderTopWidth: scale.frame * 0.11,
            borderBottomWidth: scale.frame * 0.11,
          },
        ]}
      />
    </View>
  </LogoFrame>
);

const AppleMusicLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#F55D91">
    <View
      style={[
        styles.musicStem,
        {
          width: scale.frame * 0.09,
          height: scale.frame * 0.42,
          borderRadius: scale.frame * 0.06,
          left: scale.frame * 0.47,
          top: scale.frame * 0.2,
        },
      ]}
    />
    <View
      style={[
        styles.musicStem,
        {
          width: scale.frame * 0.09,
          height: scale.frame * 0.36,
          borderRadius: scale.frame * 0.06,
          left: scale.frame * 0.33,
          top: scale.frame * 0.28,
        },
      ]}
    />
    <View
      style={[
        styles.musicBeam,
        {
          width: scale.frame * 0.24,
          height: scale.frame * 0.08,
          borderRadius: scale.frame * 0.04,
          left: scale.frame * 0.33,
          top: scale.frame * 0.2,
        },
      ]}
    />
    <View
      style={[
        styles.musicNote,
        {
          width: scale.frame * 0.18,
          height: scale.frame * 0.18,
          borderRadius: scale.frame,
          left: scale.frame * 0.24,
          top: scale.frame * 0.5,
        },
      ]}
    />
    <View
      style={[
        styles.musicNote,
        {
          width: scale.frame * 0.18,
          height: scale.frame * 0.18,
          borderRadius: scale.frame,
          left: scale.frame * 0.44,
          top: scale.frame * 0.43,
        },
      ]}
    />
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
            width: scale.frame * 0.18,
            height: scale.frame * 0.18,
            left: scale.frame * diamond.left,
            top: scale.frame * diamond.top,
            transform: [{ rotate: diamond.rotate }],
          },
        ]}
      />
    ))}
  </LogoFrame>
);

const NotionLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="#111111">
    <Text style={[styles.wordmark, styles.heavyWordmark, { color: "#111111", fontSize: scale.text * 0.82 }]}>
      N
    </Text>
  </LogoFrame>
);

const CanvaLogo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#00C4CC">
    <Text style={[styles.wordmark, { color: "#FFFFFF", fontSize: scale.text * 0.88, fontStyle: "italic" }]}>
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
            width: scale.frame * 0.46,
            height: scale.frame * 0.18,
            borderRadius: scale.frame * 0.18,
            borderWidth: Math.max(2, scale.stroke * 0.8),
            transform: [{ rotate: `${rotation}deg` }],
          },
        ]}
      />
    ))}
    <View
      style={[
        styles.chatgptCenter,
        {
          width: scale.frame * 0.12,
          height: scale.frame * 0.12,
          borderRadius: scale.frame,
        },
      ]}
    />
  </LogoFrame>
);

const Microsoft365Logo = ({ scale }: { scale: ReturnType<typeof getScale> }) => (
  <LogoFrame scale={scale} backgroundColor="#FFFFFF" borderColor="rgba(15,23,42,0.08)">
    {[
      { backgroundColor: "#F25022", left: 0.2, top: 0.2 },
      { backgroundColor: "#7FBA00", left: 0.5, top: 0.2 },
      { backgroundColor: "#00A4EF", left: 0.2, top: 0.5 },
      { backgroundColor: "#FFB900", left: 0.5, top: 0.5 },
    ].map((tile, index) => (
      <View
        key={index}
        style={[
          styles.microsoftTile,
          {
            width: scale.frame * 0.22,
            height: scale.frame * 0.22,
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
    <Text style={[styles.googleOneText, { fontSize: scale.text * 0.95 }]}>
      <Text style={{ color: "#4285F4" }}>G</Text>
      <Text style={{ color: "#EA4335" }}>1</Text>
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
    fontWeight: "800",
    letterSpacing: -0.4,
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
  chatgptLoop: {
    position: "absolute",
    borderColor: "#FFFFFF",
  },
  chatgptCenter: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  microsoftTile: {
    position: "absolute",
    borderRadius: 3,
  },
  googleOneText: {
    fontWeight: "900",
    letterSpacing: -0.8,
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
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  xboxCircle: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  xboxStroke: {
    position: "absolute",
    backgroundColor: "#107C10",
  },
});
