import { createDefaultEsmPreset } from "ts-jest";

/** @type {import("jest").Config} */
export default {
  testEnvironment: "node",
  roots: ["./tests"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/commands/", // ignore all command files
  ],
  transform: {
    ...createDefaultEsmPreset().transform,
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
};
