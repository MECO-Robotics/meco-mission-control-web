import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { TaskManufacturingDetailsFields } from "../sections/TaskManufacturingDetailsFields";

it("exposes process catalog management only for Robot manufacturing work", () => {
  const bootstrap = createBootstrap();
  bootstrap.workTypes.push({ id: "robot:manufacturing", projectType: "robot", code: "manufacturing", name: "Manufacturing", isActive: true });
  const task = { ...bootstrap.tasks[0], workTypeId: "robot:manufacturing" };
  const markup = renderToStaticMarkup(React.createElement(TaskManufacturingDetailsFields, {
    activeTask: task,
    bootstrap,
    canEdit: true,
  }));
  expect(markup).toContain("Manufacturing technical requirements");
  expect(markup).toContain("Manage Robot manufacturing processes");
  expect(markup).toContain("New process name");
  expect(markup).toContain("Only mentors can add or archive process types.");

  const nonRobotBootstrap = createBootstrap();
  nonRobotBootstrap.projects[0].projectType = "training";
  nonRobotBootstrap.workTypes.push({ id: "training:manufacturing", projectType: "training", code: "manufacturing", name: "Manufacturing", isActive: true });
  const nonRobotMarkup = renderToStaticMarkup(React.createElement(TaskManufacturingDetailsFields, {
    activeTask: { ...nonRobotBootstrap.tasks[0], workTypeId: "training:manufacturing" },
    bootstrap: nonRobotBootstrap,
    canEdit: true,
  }));
  expect(nonRobotMarkup).toBe("");
});
