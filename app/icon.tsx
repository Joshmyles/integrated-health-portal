import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(180deg, #d7d7d7 0%, #bcbcbc 100%)",
          border: "1px solid #7f7f7f",
          color: "#204a61",
          display: "flex",
          fontFamily: "Tahoma",
          fontSize: 18,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        H
      </div>
    ),
    size
  );
}
