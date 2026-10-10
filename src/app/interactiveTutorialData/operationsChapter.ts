import type {
  InteractiveTutorialChapter,
  InteractiveTutorialStep,
} from "@/app/interactiveTutorial/interactiveTutorialTypes";

const operationsSteps = [
  {
    id: "directory-view",
    title: "Open People",
    instruction: "Choose People to manage demo people.",
    selector: '[data-tutorial-target="sidebar-view-team-people"]',
  },
  {
    id: "create-student",
    title: "Add a student",
    instruction: "Open Add person in the top bar, choose Add student, and save the new student.",
    selector: '[data-tutorial-target="create-person-button"]',
  },
  {
    id: "inventory-materials",
    title: "Open Materials",
    instruction: "Choose Materials in the sidebar.",
    selector: '[data-tutorial-target="sidebar-view-resources-materials"]',
  },
  {
    id: "create-material",
    title: "Add material",
    instruction: "Use Add and save one material.",
    selector: '[data-tutorial-target="create-material-button"]',
  },
  {
    id: "material-filter",
    title: "Filter materials",
    instruction: "Apply at least one material filter.",
    selector: '.materials-toolbar',
  },
  {
    id: "material-edit",
    title: "Edit a material",
    instruction: "Click any material row to open edit mode.",
    selector: '[data-tutorial-target="edit-material-row"]',
  },
  {
    id: "inventory-parts",
    title: "Open Parts",
    instruction: "Choose Parts in the sidebar.",
    selector: '[data-tutorial-target="sidebar-view-resources-parts"]',
  },
  {
    id: "create-part",
    title: "Add part definition",
    instruction: "Use Add and save one part definition.",
    selector: '[data-tutorial-target="create-part-button"]',
  },
  {
    id: "part-search",
    title: "Search parts",
    instruction: "Type in the parts search box.",
    selector: '[data-tutorial-target="parts-search-input"]',
  },
  {
    id: "inventory-purchases",
    title: "Open Purchases",
    instruction: "Choose Purchases in the sidebar.",
    selector: '[data-tutorial-target="sidebar-view-resources-purchases"]',
  },
  {
    id: "create-purchase",
    title: "Add purchase request",
    instruction: "Use Add and save one purchase request.",
    selector: '[data-tutorial-target="create-purchase-button"]',
  },
  {
    id: "purchase-sort",
    title: "Sort or filter purchases",
    instruction: "Use the Purchases status control.",
    selector: '.purchase-toolbar',
  },
  {
    id: "subsystems-view",
    title: "Open Structure",
    instruction: "Choose Structure in the sidebar.",
    selector: '[data-tutorial-target="sidebar-view-resources-structure"]',
  },
  {
    id: "create-subsystem",
    title: "Create a subsystem",
    instruction: "Use Add subsystem and save it.",
    selector: '[aria-label="Add subsystem"]',
  },
  {
    id: "edit-subsystem",
    title: "Edit a subsystem",
    instruction: "Select a subsystem on the map, then choose Edit subsystem in its detail panel.",
    selector: '[aria-label="Edit subsystem"]',
  },
  {
    id: "create-mechanism",
    title: "Add a mechanism",
    instruction: "Use Add mechanism and save it.",
    selector: '[aria-label="Add mechanism"]',
  },
  {
    id: "edit-mechanism",
    title: "Edit a mechanism",
    instruction: "Click a mechanism edit icon.",
    selector: '[data-tutorial-target="edit-mechanism-button"]',
  },
  {
    id: "add-part-to-mechanism",
    title: "Add a part to a mechanism",
    instruction: "Use the Add part button on a mechanism and save it.",
    selector: '[data-tutorial-target="add-part-to-mechanism-button"]',
  },
] satisfies InteractiveTutorialStep[];

export const operationsChapter = {
  id: "operations",
  title: "Chapter 2: Build Operations",
  summary: "Roster, Inventory, Subsystems, and Kanban end-to-end.",
  preferredProjectType: "robot",
  steps: operationsSteps,
} satisfies InteractiveTutorialChapter;
