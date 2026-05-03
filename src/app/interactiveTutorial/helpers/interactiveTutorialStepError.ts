import type { InteractiveTutorialStep, InteractiveTutorialStepId } from "../interactiveTutorialTypes";

function targetCopyForStep(stepId: InteractiveTutorialStepId) {
  if (stepId === "tasks-tab" || stepId === "task-timeline" || stepId === "task-queue" || stepId === "task-milestones") {
    return "Use the highlighted control to continue.";
  }
  return "Use the highlighted control to continue.";
}

export function getInteractiveTutorialStepError(
  step: InteractiveTutorialStep,
  context: {
    tutorialSeasonId: string | null;
    tutorialProjectId: string | null;
    tutorialSeasonName: string | null;
    tutorialProjectName: string | null;
  },
) {
  switch (step.id) {
    case "season":
      if (!context.tutorialSeasonId) {
        return "Default Season is unavailable. End tutorial and reload the page.";
      }
      return `Select ${context.tutorialSeasonName ?? "Default Season"} to complete this step.`;
    case "project-robot":
    case "project-outreach":
      if (!context.tutorialProjectId) {
        return "Tutorial project is unavailable. End tutorial and reload the page.";
      }
      return `Select ${context.tutorialProjectName ?? "the tutorial project"} to continue.`;
    case "timeline-week-view":
      return "Switch the timeline interval to Week.";
    case "timeline-shift-period":
      return "Use next or previous period to move the timeline.";
    case "timeline-open-task":
      return "Click a timeline task bar or label to open task details.";
    case "timeline-edit-task":
      return "Click Edit task from the timeline task details popup.";
    case "create-task":
      return "Create and save one new task to continue.";
    case "queue-filter":
      return "Apply at least one Kanban filter to continue.";
    case "queue-edit-task":
      return "Open any Kanban task row in edit mode to continue.";
    case "create-milestone":
      return "Create and save one milestone to continue.";
    case "milestone-search":
      return "Type in the milestone search input to continue.";
    case "milestone-edit":
      return "Open a milestone row in edit mode to continue.";
    case "create-worklog":
      return "Create and save one new work log to continue.";
    case "create-material":
      return "Create and save one material to continue.";
    case "material-filter":
      return "Apply a material filter to continue.";
    case "material-edit":
      return "Open a material row in edit mode to continue.";
    case "create-part":
      return "Create and save one new part definition to continue.";
    case "part-search":
      return "Type in the parts search input to continue.";
    case "create-purchase":
      return "Create and save one purchase request to continue.";
    case "purchase-sort":
      return "Use the Purchases status control to continue.";
    case "create-subsystem":
      return "Create and save one new subsystem to continue.";
    case "edit-subsystem":
      return "Open subsystem edit mode to continue.";
    case "create-mechanism":
      return "Create and save one new mechanism to continue.";
    case "edit-mechanism":
      return "Open mechanism edit mode to continue.";
    case "add-part-to-mechanism":
      return "Add a part instance to the mechanism to continue.";
    case "create-student":
      return "Create and save one student to continue.";
    case "create-cnc-job":
      return "Create and save one CNC job to continue.";
    case "inspect-cnc-job":
      return "Open a CNC job in edit mode to continue.";
    case "create-print-job":
      return "Create and save one 3D print job to continue.";
    case "complete-print-job":
      return "Mark one 3D print job complete to continue.";
    case "manufacturing-search":
      return "Type in the manufacturing search input to continue.";
    case "create-fabrication-job":
      return "Create and save one fabrication job to continue.";
    case "inspect-fabrication-job":
      return "Open a fabrication job in edit mode to continue.";
    case "workflow-edit":
      return "Open workflow edit mode to continue.";
    case "create-document":
      return "Create and save one document to continue.";
    default:
      return targetCopyForStep(step.id);
  }
}
