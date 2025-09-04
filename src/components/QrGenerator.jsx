"use client";
import React from "react";
import { QRCode } from "react-qrcode-logo";

export default function QrGenerator({ value = "no-data", size = 200 }) {
  return (
    <div className="flex justify-center items-center p-4">
      <QRCode value={value} size={size} />
    </div>
  );
}
