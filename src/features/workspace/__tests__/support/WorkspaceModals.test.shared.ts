import * as React from "react";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

export function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    projects: [
      {
        id: "project-1",
        seasonId: "season-1",
        name: "Robot",
        projectType: "robot",
        description: "",
        status: "active",
      },
      {
        id: "project-2",
        seasonId: "season-1",
        name: "Media",
        projectType: "other",
        description: "",
        status: "active",
      },
    ],
    members: [
      {
        id: "student-1",
        name: "Student",
        email: "student@meco.test",
        role: "student",
        elevated: false,
        seasonId: "season-1",
      },
      {
        id: "student-2",
        name: "Taylor",
        email: "taylor@meco.test",
        role: "student",
        elevated: false,
        seasonId: "season-1",
      },
      {
        id: "mentor-1",
        name: "Mentor",
        email: "mentor@meco.test",
        role: "mentor",
        elevated: true,
        seasonId: "season-1",
      },
    ],
    subsystems: [
      {
        id: "subsystem-1",
        projectId: "project-1",
        name: "Drive",
        description: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
      {
        id: "subsystem-2",
        projectId: "project-2",
        name: "Content",
        description: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
    ],
    disciplines: [
      {
        id: "design",
        code: "design",
        name: "Design",
      },
      {
        id: "manufacturing",
        code: "manufacturing",
        name: "Manufacturing",
      },
      {
        id: "photography",
        code: "photography",
        name: "Photography",
      },
      {
        id: "social_media",
        code: "social_media",
        name: "Social Media",
      },
    ],
  };
}
