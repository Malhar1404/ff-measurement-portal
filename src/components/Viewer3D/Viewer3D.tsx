import { observer } from "mobx-react-lite";

import { SkirtControls } from "../UI/SkirtControls";
import { Camera } from "./Camera/Camera.";
import { Canvas3D } from "./Canvas3D/Canvas3D";
import { Env } from "./Env/Env";
import { GlbViewer, LANDMARK_THEME } from "./GlbViewer/GlbViewer";
import { Light } from "./Light/Light";

type Viewer3DProps = {
  showOriginalLandmarks?: boolean;
};

export const Viewer3D = observer(
  ({ showOriginalLandmarks = false }: Viewer3DProps) => {
    return (
      <div
        style={{
          height: "100%",
          position: "relative",
          width: "100%",
          backgroundColor: "#030508",
        }}
      >
        <Canvas3D>
          <Camera />
          <Light />
          <Env />
          <GlbViewer showOriginalLandmarks={showOriginalLandmarks} />
          {/* <PostProcessing /> */}
        </Canvas3D>

        {!showOriginalLandmarks && (
          <div
            style={{
              left: "12px",
              position: "absolute",
              top: "12px",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              background: "rgba(3, 5, 8, 0.78)",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: "10px",
              padding: "8px",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.35)",
            }}
          >
            {Object.entries(LANDMARK_THEME).map(([name, theme]) => (
              <div
                key={name}
                style={{
                  alignItems: "center",
                  color: "#e5eefb",
                  display: "flex",
                  fontSize: "11px",
                  gap: "8px",
                  textTransform: "capitalize",
                }}
              >
                <span
                  style={{
                    background: theme.base,
                    border: `1px solid ${theme.accent}`,
                    borderRadius: "999px",
                    boxShadow: `0 0 0 1px ${theme.accent} inset`,
                    display: "inline-block",
                    height: "10px",
                    width: "10px",
                  }}
                />
                <span>
                  {name.replace(/_landmark$/i, "").replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);
